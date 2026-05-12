// Ritual LLM Precompile Integration
// Uses LLM precompile (0x0802) for on-chain AI inference

import { 
  PRECOMPILES, 
  TEE_SERVICE_REGISTRY_ADDRESS, 
  RITUAL_WALLET_ADDRESS,
  Capability,
  RECOMMENDED_MODELS,
  DEFAULT_TTL,
  RITUAL_CHAIN_ID,
  RITUAL_RPC_URL
} from './ritual-config';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMAnalysisRequest {
  contractCode: string;
  analysisType: 'security' | 'gas' | 'best-practices' | 'full';
  walletClient: any; // viem WalletClient
}

export interface LLMAnalysisResult {
  success: boolean;
  txHash?: string;
  analysis?: {
    summary: string;
    risks: Array<{ level: string; message: string }>;
    gasOptimizations: string[];
    bestPractices: string[];
    score: number;
  };
  error?: string;
  isOnChain: boolean; // True if verified by TEE
  attestation?: string; // TEE attestation proof
}

// TEE Service Registry ABI (minimal)
const TEE_REGISTRY_ABI = [
  {
    inputs: [
      { name: 'capability', type: 'uint8' },
      { name: 'checkValidity', type: 'bool' },
    ],
    name: 'getServicesByCapability',
    outputs: [{
      type: 'tuple[]',
      components: [
        { 
          name: 'node', 
          type: 'tuple', 
          components: [
            { name: 'paymentAddress', type: 'address' },
            { name: 'teeAddress', type: 'address' },
            { name: 'teeType', type: 'uint8' },
            { name: 'publicKey', type: 'bytes' },
            { name: 'endpoint', type: 'string' },
            { name: 'certPubKeyHash', type: 'bytes32' },
            { name: 'capability', type: 'uint8' },
          ]
        },
        { name: 'isValid', type: 'bool' },
        { name: 'workloadId', type: 'bytes32' },
      ],
    }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Ritual Wallet ABI (minimal)
const RITUAL_WALLET_ABI = [
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'lockDuration', type: 'uint256' }],
    name: 'deposit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;

/**
 * Get available LLM executors from TEE Service Registry
 */
export async function getLLMExecutors(publicClient: any) {
  try {
    const services = await publicClient.readContract({
      address: TEE_SERVICE_REGISTRY_ADDRESS,
      abi: TEE_REGISTRY_ABI,
      functionName: 'getServicesByCapability',
      args: [Capability.LLM, true],
    });

    if (!services || services.length === 0) {
      throw new Error('No LLM executors available');
    }

    return services.map((service: any) => ({
      executorAddress: service.node.teeAddress,
      publicKey: service.node.publicKey,
      isValid: service.isValid,
      workloadId: service.workloadId,
    }));
  } catch (error) {
    console.error('Failed to get LLM executors:', error);
    throw error;
  }
}

/**
 * Check and ensure RitualWallet has sufficient balance
 */
export async function ensureRitualWalletBalance(
  publicClient: any,
  walletClient: any,
  userAddress: string,
  minBalance: bigint = BigInt('1000000000000000') // 0.001 RITUAL (much lower)
) {
  const balance = await publicClient.readContract({
    address: RITUAL_WALLET_ADDRESS,
    abi: RITUAL_WALLET_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
  });

  if (balance < minBalance) {
    // Deposit only 0.005 RITUAL with 1000 block lock (much cheaper)
    const hash = await walletClient.writeContract({
      address: RITUAL_WALLET_ADDRESS,
      abi: RITUAL_WALLET_ABI,
      functionName: 'deposit',
      args: [1000n], // Reduced from 5000 blocks
      value: BigInt('5000000000000000'), // 0.005 RITUAL (10x cheaper)
    });

    await publicClient.waitForTransactionReceipt({ hash });
    return { deposited: true, hash };
  }

  return { deposited: false, balance };
}

/**
 * Encode LLM precompile request (30-field ABI)
 */
function encodeLLMRequest(
  executorAddress: string,
  messages: LLMMessage[],
  ttl: bigint = DEFAULT_TTL.REASONING_MODEL
): `0x${string}` {
  const { encodeAbiParameters, parseAbiParameters } = require('viem');
  
  const messagesJson = JSON.stringify(messages);
  
  // 30-field LLM precompile ABI
  const encoded = encodeAbiParameters(
    parseAbiParameters([
      'address, bytes[], uint256, bytes[], bytes,',
      'string, string, int256, string, bool, int256, string, string,',
      'uint256, bool, int256, string, bytes, int256, string, string, bool,',
      'int256, bytes, bytes, int256, int256, string, bool,',
      '(string,string,string)',
    ].join('')),
    [
      executorAddress,        // executor
      [],                     // encryptedSecrets
      ttl,                    // ttl (300 blocks for reasoning)
      [],                     // secretSignatures
      '0x',                   // userPublicKey
      messagesJson,           // messagesJson
      RECOMMENDED_MODELS.LLM_REASONING, // model
      0n,                     // frequencyPenalty
      '',                     // logitBiasJson
      false,                  // logprobs
      4096n,                  // maxCompletionTokens (>=4096 for reasoning)
      '',                     // responseFormat
      '',                     // stop
      1n,                     // n
      true,                   // stream (false for on-chain)
      0n,                     // topLogprobs
      'medium',               // jailbreakDetection
      '0x',                   // jailbreakPublicKey
      -1n,                    // presencePenalty
      'auto',                 // seed
      '',                     // serviceTier
      false,                  // store
      700n,                   // temperature (0.7 × 1000)
      '0x',                   // toolChoice
      '0x',                   // tools
      -1n,                    // topP
      1000n,                  // topK
      '',                     // user
      false,                  // piiEnabled
      ['', '', ''],           // convoHistory (empty for one-shot)
    ],
  );

  return encoded as `0x${string}`;
}

/**
 * Create analysis prompt based on contract code and analysis type
 */
function createAnalysisPrompt(contractCode: string, analysisType: string): LLMMessage[] {
  const systemPrompt = `You are an expert Solidity security auditor and gas optimization specialist. 
Analyze smart contracts for vulnerabilities, gas inefficiencies, and best practices.
Return your analysis in JSON format with this structure:
{
  "summary": "Brief overview of the contract",
  "risks": [{"level": "critical|high|medium|low", "message": "Description"}],
  "gasOptimizations": ["Optimization suggestion 1", "..."],
  "bestPractices": ["Best practice recommendation 1", "..."],
  "score": 0-100
}`;

  let userPrompt = '';
  
  switch (analysisType) {
    case 'security':
      userPrompt = `Analyze this Solidity contract for security vulnerabilities, focusing on reentrancy, access control, integer overflow, and common attack vectors:\n\n${contractCode}`;
      break;
    case 'gas':
      userPrompt = `Analyze this Solidity contract for gas optimization opportunities:\n\n${contractCode}`;
      break;
    case 'best-practices':
      userPrompt = `Review this Solidity contract for best practices and code quality:\n\n${contractCode}`;
      break;
    case 'full':
    default:
      userPrompt = `Perform a comprehensive analysis of this Solidity contract covering security, gas optimization, and best practices:\n\n${contractCode}`;
  }

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

/**
 * Analyze contract using on-chain LLM precompile
 * This is the main function for on-chain contract analysis
 */
export async function analyzeContractOnChain(
  request: LLMAnalysisRequest
): Promise<LLMAnalysisResult> {
  try {
    const { contractCode, analysisType, walletClient } = request;
    
    // For now, the on-chain LLM precompile has complex requirements
    // that need proper async payload handling. Until we have the full
    // implementation, we'll use off-chain analysis with a note.
    
    console.log('⚠️ On-chain TEE analysis requires complex async payload handling');
    console.log('📡 Falling back to off-chain AI analysis...');
    
    // Use off-chain analysis but mark it clearly
    const result = await analyzeContractOffChain(contractCode, analysisType);
    
    return {
      ...result,
      isOnChain: false,
      error: result.error || 'On-chain TEE analysis is in development. Using off-chain AI for now.',
    };

  } catch (error: any) {
    console.error('On-chain analysis failed:', error);
    
    // Always fallback to off-chain
    const fallbackResult = await analyzeContractOffChain(
      request.contractCode,
      request.analysisType
    );
    
    return {
      ...fallbackResult,
      isOnChain: false,
      error: `On-chain failed: ${error.message}. Used off-chain fallback.`,
    };
  }
}

/**
 * Parse analysis result from transaction receipt
 * TODO: Implement proper spcCalls parsing
 */
async function parseAnalysisFromReceipt(receipt: any) {
  // This is a placeholder. Real implementation needs to:
  // 1. Extract spcCalls from receipt
  // 2. Decode the LLM response envelope
  // 3. Parse the JSON result
  
  // For now, return mock data
  return {
    summary: 'Contract analysis completed on-chain',
    risks: [
      { level: 'medium', message: 'Consider adding reentrancy guards' },
    ],
    gasOptimizations: [
      'Use immutable for constants',
      'Cache array length in loops',
    ],
    bestPractices: [
      'Add NatSpec documentation',
      'Emit events for state changes',
    ],
    score: 75,
  };
}

/**
 * Fallback: Analyze using off-chain AI API
 * Used when on-chain analysis is not available or fails
 */
export async function analyzeContractOffChain(
  contractCode: string,
  analysisType: string
): Promise<LLMAnalysisResult> {
  try {
    // Use existing AI API
    const { analyzeContract } = await import('./ai-api');
    const result = await analyzeContract(contractCode);

    return {
      success: true,
      analysis: {
        summary: result.explanation,
        risks: result.risks,
        gasOptimizations: [],
        bestPractices: [],
        score: result.score,
      },
      isOnChain: false,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      isOnChain: false,
    };
  }
}
