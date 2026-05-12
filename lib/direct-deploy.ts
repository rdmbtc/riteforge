/**
 * Direct contract deployment (without factory)
 * Much cheaper gas costs - deploys directly from user's wallet
 */

import { type WalletClient } from 'wagmi'
import { createPublicClient, http } from 'viem'

export interface DeployResult {
  success: boolean
  contractAddress?: string
  transactionHash?: string
  gasUsed?: bigint
  gasCost?: string
  error?: string
}

/**
 * Deploy contract directly (no factory)
 * This is MUCH cheaper than using factory contract
 */
export async function deployContractDirect(
  walletClient: WalletClient,
  bytecode: string
): Promise<DeployResult> {
  try {
    if (!walletClient.account) {
      return { success: false, error: 'No wallet connected' }
    }

    // Ensure bytecode has 0x prefix
    const formattedBytecode = bytecode.startsWith('0x') ? bytecode : `0x${bytecode}`

    console.log('🚀 Deploying contract directly (no factory)...')
    console.log('📊 Bytecode size:', formattedBytecode.length / 2, 'bytes')

    // Deploy directly - send transaction with bytecode as data
    const hash = await walletClient.sendTransaction({
      account: walletClient.account,
      to: null, // null = contract creation
      data: formattedBytecode as `0x${string}`,
    })

    console.log('📝 Transaction hash:', hash)

    // Wait for transaction
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

    if (receipt.status === 'success' && receipt.contractAddress) {
      const gasUsed = receipt.gasUsed
      const effectiveGasPrice = receipt.effectiveGasPrice || 0n
      const gasCostWei = gasUsed * effectiveGasPrice
      const gasCostRitual = (Number(gasCostWei) / 1e18).toFixed(6)

      console.log('✅ Contract deployed!')
      console.log('📍 Address:', receipt.contractAddress)
      console.log('⛽ Gas used:', gasUsed.toString())
      console.log('💰 Cost:', gasCostRitual, 'RITUAL')

      return {
        success: true,
        contractAddress: receipt.contractAddress,
        transactionHash: hash,
        gasUsed,
        gasCost: gasCostRitual
      }
    }

    return { success: false, error: 'Transaction failed' }
  } catch (error: any) {
    console.error('❌ Deployment error:', error)
    return {
      success: false,
      error: error?.message || 'Deployment failed'
    }
  }
}

/**
 * Estimate gas cost before deployment
 */
export async function estimateDeploymentCost(
  walletClient: WalletClient,
  bytecode: string
): Promise<{ gasEstimate: bigint; costEstimate: string; error?: string }> {
  try {
    if (!walletClient.account) {
      return { 
        gasEstimate: 0n, 
        costEstimate: '0',
        error: 'No wallet connected' 
      }
    }

    const formattedBytecode = bytecode.startsWith('0x') ? bytecode : `0x${bytecode}`

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

    // Estimate gas
    const gasEstimate = await publicClient.estimateGas({
      account: walletClient.account,
      to: null,
      data: formattedBytecode as `0x${string}`,
    })

    // Get current gas price
    const gasPrice = await publicClient.getGasPrice()

    // Calculate cost
    const costWei = gasEstimate * gasPrice
    const costRitual = (Number(costWei) / 1e18).toFixed(6)

    console.log('📊 Deployment estimate:')
    console.log('⛽ Gas:', gasEstimate.toString())
    console.log('💰 Cost:', costRitual, 'RITUAL')

    return {
      gasEstimate,
      costEstimate: costRitual
    }
  } catch (error: any) {
    console.error('Estimation error:', error)
    return {
      gasEstimate: 0n,
      costEstimate: '0',
      error: error?.message || 'Estimation failed'
    }
  }
}

/**
 * Compare factory vs direct deployment costs
 */
export async function compareDeploymentMethods(
  walletClient: WalletClient,
  bytecode: string
): Promise<{
  direct: { gas: bigint; cost: string }
  factory: { gas: bigint; cost: string }
  savings: string
}> {
  const directEstimate = await estimateDeploymentCost(walletClient, bytecode)
  
  // Factory deployment is typically 20-30% more expensive
  const factoryGas = (directEstimate.gasEstimate * 130n) / 100n
  const factoryCost = (parseFloat(directEstimate.costEstimate) * 1.3).toFixed(6)

  const savings = ((parseFloat(factoryCost) - parseFloat(directEstimate.costEstimate)) / parseFloat(factoryCost) * 100).toFixed(1)

  return {
    direct: {
      gas: directEstimate.gasEstimate,
      cost: directEstimate.costEstimate
    },
    factory: {
      gas: factoryGas,
      cost: factoryCost
    },
    savings: `${savings}%`
  }
}
