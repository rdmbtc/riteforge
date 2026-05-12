/**
 * Simple deployment solution that works without external compilation
 * Uses pre-compiled artifacts from the templates
 */

import { type WalletClient } from 'wagmi'
import { parseAbi } from 'viem'

// Factory contract ABI
const FACTORY_ABI = parseAbi([
  'function deployContract(bytes memory bytecode) public returns (address)',
  'event ContractDeployed(address indexed deployer, address indexed contractAddress, bytes32 salt, uint256 timestamp)',
])

const FACTORY_ADDRESS = '0xA70f6320271881E79998b3b2CC72FE872A781f89'

export interface DeployResult {
  success: boolean
  contractAddress?: string
  transactionHash?: string
  error?: string
}

/**
 * Deploy a contract using pre-compiled bytecode
 * This works for all template contracts
 */
export async function deployWithBytecode(
  walletClient: WalletClient,
  bytecode: string
): Promise<DeployResult> {
  try {
    if (!walletClient.account) {
      return { success: false, error: 'No wallet connected' }
    }

    // Ensure bytecode has 0x prefix
    const formattedBytecode = bytecode.startsWith('0x') ? bytecode : `0x${bytecode}`

    // Deploy via factory
    const hash = await walletClient.writeContract({
      address: FACTORY_ADDRESS,
      abi: FACTORY_ABI,
      functionName: 'deployContract',
      args: [formattedBytecode as `0x${string}`],
      account: walletClient.account,
    })

    // Wait for transaction
    const { createPublicClient, http } = await import('viem')
    const publicClient = createPublicClient({
      chain: {
        id: 1979,
        name: 'Ritual',
        nativeCurrency: { name: 'Ritual', symbol: 'RITUAL', decimals: 18 },
        rpcUrls: {
          default: { http: ['https://rpc.ritualfoundation.org'] },
        },
      },
      transport: http('https://rpc.ritualfoundation.org'),
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status === 'success') {
      // Extract contract address from logs
      const deployedEvent = receipt.logs.find(log => 
        log.topics.length >= 3 && 
        log.address.toLowerCase() === FACTORY_ADDRESS.toLowerCase()
      )

      const contractAddress = deployedEvent?.topics[2] 
        ? `0x${deployedEvent.topics[2].slice(-40)}` 
        : undefined

      return {
        success: true,
        contractAddress,
        transactionHash: hash
      }
    }

    return { success: false, error: 'Transaction failed' }
  } catch (error: any) {
    console.error('Deployment error:', error)
    return {
      success: false,
      error: error?.message || 'Deployment failed'
    }
  }
}

/**
 * Get bytecode from pre-compiled artifacts
 */
export async function getBytecodeFromArtifact(contractName: string): Promise<string | null> {
  try {
    const response = await fetch(`/artifacts/contracts/${contractName}.sol/${contractName}.json`)
    if (!response.ok) return null
    
    const artifact = await response.json()
    return artifact.bytecode
  } catch (error) {
    console.error('Failed to load artifact:', error)
    return null
  }
}

/**
 * Deploy a template contract by name
 */
export async function deployTemplate(
  walletClient: WalletClient,
  contractName: string
): Promise<DeployResult> {
  const bytecode = await getBytecodeFromArtifact(contractName)
  
  if (!bytecode) {
    return {
      success: false,
      error: 'Contract not found in pre-compiled artifacts. Please compile locally first.'
    }
  }

  return deployWithBytecode(walletClient, bytecode)
}
