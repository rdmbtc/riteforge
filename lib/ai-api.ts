// AI API Integration for RiteForge
// Uses /api/ai-proxy to bypass CORS (server-side)

const AI_MODELS = [
  'minimax-m2.5-free',
  'bbg/deepseek-ai/DeepSeek-V4-Pro',
  'glm/glm-5.1',
];

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatCompletionRequest {
  model?: string
  messages: Message[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: Message
    finish_reason: string
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

async function callWithFallback(
  messages: Message[],
  options?: Partial<ChatCompletionRequest>
): Promise<ChatCompletionResponse> {
  const modelsToTry = options?.model
    ? [options.model, ...AI_MODELS.filter(m => m !== options.model)]
    : AI_MODELS;

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      const response = await fetch('/api/ai-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          model,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.max_tokens || 2000,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }

      const errorText = await response.text();
      lastError = new Error(`API ${response.status}: ${errorText}`);
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw new Error(`All AI models failed. Last error: ${lastError?.message}`);
}

export async function chatCompletion(
  messages: Message[],
  options?: Partial<ChatCompletionRequest>
): Promise<ChatCompletionResponse> {
  return callWithFallback(messages, options);
}

export async function generateSmartContract(prompt: string): Promise<{
  code: string
  summary: string
  explanation: string
}> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are RiteForge AI, an expert Solidity smart contract developer created by Dr RDM (@rdmnad, @rdmbtc on X, @therdm on GitHub, Discord).

FOCUS: You specialize in creating smart contracts for Ritual Testnet.

RITUAL TESTNET DETAILS:
- Chain ID: 1979
- Currency: RITUAL (18 decimals, testnet)
- Block Time: ~350ms
- TX Types: EIP-1559 + 0x10, 0x11, 0x12, 0x77
- RPC: https://rpc.ritualfoundation.org
- Explorer: https://explorer.ritualfoundation.org
- Faucet: https://faucet.ritualfoundation.org
- Docs: https://docs.ritualfoundation.org

RESPONSE FORMAT:
Return ONLY valid JSON - no markdown, no code blocks, no explanations:
{"code":"// SPDX-License-Identifier: MIT\npragma solidity ^0.8.19;\ncontract Example { ... }","summary":"Brief summary","explanation":"Key features formatted:\n• Feature 1: description\n• Feature 2: description\n• Feature 3: description"}

CONTRACT REQUIREMENTS:
- Always include SPDX license identifier
- Use pragma solidity ^0.8.19 or higher
- Keep code concise and clean - no excessive comments
- Follow security best practices
- Optimize for gas efficiency
- Include error handling
- Add events for important state changes
- Consider Ritual Testnet specifics

SECURITY FOCUS:
- Reentrancy protection where needed
- Access control (Ownable, roles)
- Input validation
- Safe math operations
- Proper error messages`
    },
    {
      role: 'user',
      content: `Create a Solidity smart contract for Ritual Testnet: ${prompt}`
    }
  ]

  const response = await chatCompletion(messages, { max_tokens: 3000 })
  const content = response.choices[0].message.content

  try {
    // Try to parse JSON response
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0]
      return JSON.parse(jsonStr)
    }
    return JSON.parse(content)
  } catch (error) {
    // Fallback: extract code and create summary
    const codeMatch = content.match(/```solidity\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/)
    const code = codeMatch ? codeMatch[1] : content

    return {
      code,
      summary: "Smart contract generated for Ritual Testnet",
      explanation: "Review the code above. This contract is designed for Ritual Testnet (Chain ID: 1979)."
    }
  }
}

export async function chatWithAI(
  userMessage: string,
  conversationHistory: Message[] = []
): Promise<string> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are RiteForge AI Assistant, created by Dr RDM (@rdmnad, @rdmbtc on X, @therdm on GitHub, Discord).

ABOUT RITEFORGE:
RiteForge helps users create and analyze smart contracts for Ritual Testnet using natural language.

RITUAL TESTNET:
- Autonomous Intelligence platform
- Website: https://ritual.net
- Chain ID: 1979
- Currency: RITUAL (18 decimals, testnet)
- Block Time: ~350ms
- RPC: https://rpc.ritualfoundation.org
- Explorer: https://explorer.ritualfoundation.org
- Faucet: https://faucet.ritualfoundation.org
- Docs: https://docs.ritualfoundation.org

YOUR ROLE:
- Answer questions about smart contracts
- Explain Solidity concepts
- Help with Ritual Testnet specifics
- Provide guidance on contract deployment
- Be helpful, concise, and technical when needed

STYLE:
- Be friendly but professional
- Use clear, simple language
- Provide examples when helpful
- Focus on Ritual Testnet context`
    },
    ...conversationHistory,
    {
      role: 'user',
      content: userMessage
    }
  ]

  const response = await chatCompletion(messages, { max_tokens: 1000 })
  return response.choices[0].message.content
}

export async function analyzeContract(code: string): Promise<{
  explanation: string
  risks: { level: string; message: string }[]
  permissions: string[]
  score: number
}> {
  const messages: Message[] = [
    {
      role: 'system',
      content: `You are an elite smart contract security auditor specializing in detecting rugpulls, honeypots, and hidden privileges.

CRITICAL SECURITY CHECKS:

🚨 RUGPULL INDICATORS:
- Unlimited minting functions (mint without cap)
- Owner can change token supply arbitrarily
- Liquidity withdrawal functions (removeLiquidity, withdrawETH)
- Ownership transfer without timelock
- Pausable functions that lock user funds
- Hidden backdoors in proxy contracts
- Blacklist/whitelist manipulation
- Tax rate changes without limits

🍯 HONEYPOT PATTERNS:
- Transfer restrictions (can buy but can't sell)
- Hidden fees that drain balance
- Approval traps (approve then steal)
- Revert on sell but not on buy
- Time-based locks that never expire
- Fake liquidity locks
- Modifiers that block transfers
- Balance manipulation tricks

🔐 HIDDEN PRIVILEGES:
- onlyOwner functions that can rug
- Admin keys with excessive power
- Upgradeable proxies without governance
- Emergency withdrawal functions
- Fee recipient changes
- Contract pause/unpause
- Blacklist/ban user functions
- Token burning from user wallets

ANALYSIS REQUIREMENTS:
Return JSON with:
{
  "explanation": "What the contract does and main concerns",
  "risks": [
    {"level": "critical|high|medium|low", "message": "Specific vulnerability with code reference"}
  ],
  "permissions": ["Exact permissions and what they can do"],
  "score": 0-100 (0=scam, 100=safe)
}

SCORING GUIDE:
- 0-20: Definite scam/rugpull
- 21-40: High risk, multiple red flags
- 41-60: Medium risk, some concerns
- 61-80: Low risk, minor issues
- 81-100: Safe, well-designed

Be EXTREMELY critical. If you find rugpull indicators, score below 30.`
    },
    {
      role: 'user',
      content: `Analyze this contract for rugpulls, honeypots, and hidden privileges:\n\n${code}`
    }
  ]

  const response = await chatCompletion(messages, { max_tokens: 2500 })
  const content = response.choices[0].message.content

  // Try to parse JSON from the response
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0]
      return JSON.parse(jsonStr)
    }
    return JSON.parse(content)
  } catch (error) {
    // Fallback if JSON parsing fails
    return {
      explanation: content,
      risks: [{ level: "medium", message: "Unable to parse detailed analysis" }],
      permissions: ["Review required"],
      score: 50
    }
  }
}

export async function getAvailableModels(): Promise<any> {
  const response = await fetch(`${API_URL}/models`, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`)
  }

  return response.json()
}