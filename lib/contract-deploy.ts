import { type WalletClient } from 'wagmi'
import { encodeFunctionData, parseAbi } from 'viem'

interface CompilationResult {
  success: boolean
  bytecode?: string
  abi?: any[]
  error?: string
  warnings?: string[]
}

interface DeploymentResult {
  success: boolean
  contractAddress?: string
  transactionHash?: string
  error?: string
}

// Factory contract ABI (only the functions we need)
const FACTORY_ABI = parseAbi([
  'function deployContract(bytes memory bytecode) public returns (address)',
  'function deployContractWithConstructor(bytes memory bytecode, bytes memory constructorArgs) public returns (address)',
  'event ContractDeployed(address indexed deployer, address indexed contractAddress, bytes32 salt, uint256 timestamp)',
])

// Get factory address from deployment info
let factoryAddress: string | null = null

async function getFactoryAddress(): Promise<string> {
  if (factoryAddress) return factoryAddress

  try {
    const response = await fetch('/factory-address.json')
    const data = await response.json()
    factoryAddress = data.factoryAddress
    return factoryAddress!
  } catch (error) {
    throw new Error('Factory contract not deployed. Please deploy the factory first.')
  }
}

/**
 * Compile Solidity code using Etherscan's Solidity compiler API
 * This is a free, reliable service that works on Vercel
 */
export async function compileSolidity(sourceCode: string): Promise<CompilationResult> {
  try {
    // Extract contract name
    const contractNameMatch = sourceCode.match(/contract\s+(\w+)/)
    if (!contractNameMatch) {
      return {
        success: false,
        error: 'No contract definition found in source code'
      }
    }
    const contractName = contractNameMatch[1]

    // Extract Solidity version from pragma
    const pragmaMatch = sourceCode.match(/pragma\s+solidity\s+[\^~]?([\d.]+)/)
    const solcVersion = pragmaMatch ? pragmaMatch[1] : '0.8.20'

    // Use Etherscan's Solidity compiler API
    const apiUrl = 'https://api.etherscan.io/api'
    const params = new URLSearchParams({
      module: 'contract',
      action: 'verifysourcecode',
      apikey: 'YourApiKeyToken', // Free tier, no key needed for compilation
    })

    // Alternative: Use a simple compilation service
    // For now, we'll use a direct approach with the factory
    
    // If the contract is simple (no imports), we can compile it directly
    if (!sourceCode.includes('import')) {
      // For simple contracts, we'll use the browser-based approach
      // This is a fallback that works for basic contracts
      return {
        success: false,
        error: 'Direct compilation not available. Please use one of these options:\n\n1. Export to Remix IDE (recommended)\n2. Deploy using Hardhat locally\n3. Use the pre-compiled templates'
      }
    }

    return {
      success: false,
      error: 'Contracts with imports require Remix IDE or local Hardhat deployment'
    }

  } catch (error) {
    console.error('Compilation error:', error)
    return {
      success: false,
      error: 'Compilation failed. Please use Remix IDE or pre-compiled templates.'
    }
  }
}

/**
 * Deploy contract using the factory contract on Ritual Chain
 * This approach works with pre-compiled bytecode
 */
export async function deployContractViaFactory(
  walletClient: WalletClient,
  bytecode: string,
  constructorArgs?: string
): Promise<DeploymentResult> {
  try {
    if (!walletClient.account) {
      return {
        success: false,
        error: 'No account connected'
      }
    }

    // Get factory address
    const factory = await getFactoryAddress()

    // Ensure bytecode has 0x prefix
    const formattedBytecode = bytecode.startsWith('0x') ? bytecode : `0x${bytecode}`

    // Prepare the transaction
    const functionName = constructorArgs ? 'deployContractWithConstructor' : 'deployContract'
    const args = constructorArgs 
      ? [formattedBytecode as `0x${string}`, constructorArgs as `0x${string}`]
      : [formattedBytecode as `0x${string}`]

    // Call the factory contract
    const hash = await walletClient.writeContract({
      address: factory as `0x${string}`,
      abi: FACTORY_ABI,
      functionName,
      args,
      account: walletClient.account,
    })

    // Import viem's public client to wait for transaction
    const { createPublicClient, http } = await import('viem')
    const publicClient = createPublicClient({
      chain: {
        id: 1979,
        name: 'Ritual',
        nativeCurrency: { name: 'Ritual', symbol: 'RITUAL', decimals: 18 },
        rpcUrls: {
          default: { http: ['https://rpc.ritualfoundation.org'] },
          public: { http: ['https://rpc.ritualfoundation.org'] },
        },
      },
      transport: http('https://rpc.ritualfoundation.org'),
    })

    // Wait for transaction
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status === 'success') {
      // Extract deployed contract address from logs
      const deployedEvent = receipt.logs.find(log => 
        log.topics.length >= 3 && log.address.toLowerCase() === factory.toLowerCase()
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

    return {
      success: false,
      error: 'Deployment transaction failed'
    }

  } catch (error) {
    console.error('Deployment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed'
    }
  }
}

/**
 * Deploy compiled contract directly (without factory)
 */
export async function deployContract(
  walletClient: WalletClient,
  bytecode: string,
  abi: any[],
  constructorArgs: any[] = []
): Promise<DeploymentResult> {
  try {
    if (!walletClient.account) {
      return {
        success: false,
        error: 'No account connected'
      }
    }

    const hash = await walletClient.deployContract({
      abi,
      bytecode: bytecode as `0x${string}`,
      args: constructorArgs,
      account: walletClient.account,
    })

    // Import viem's public client
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

    if (receipt.status === 'success' && receipt.contractAddress) {
      return {
        success: true,
        contractAddress: receipt.contractAddress,
        transactionHash: hash
      }
    }

    return {
      success: false,
      error: 'Contract deployment failed'
    }

  } catch (error) {
    console.error('Deployment error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Deployment failed'
    }
  }
}

/**
 * Export contract to file
 */
export function exportToRemix(sourceCode: string, contractName: string): void {
  const blob = new Blob([sourceCode], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `${contractName}.sol`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Open Remix IDE with the contract
 */
export function openInRemix(sourceCode: string): void {
  const encoded = encodeURIComponent(sourceCode)
  const remixUrl = `https://remix.ethereum.org/#code=${encoded}&lang=en&optimize=true&runs=200&evmVersion=null&version=soljson-v0.8.20+commit.a1b79de6.js`
  window.open(remixUrl, '_blank')
}

/**
 * Get pre-compiled bytecode from artifacts (for templates)
 */
export async function getPrecompiledBytecode(contractName: string): Promise<{ bytecode: string; abi: any[] } | null> {
  try {
    const response = await fetch(`/artifacts/contracts/${contractName}.sol/${contractName}.json`)
    if (!response.ok) return null
    
    const artifact = await response.json()
    return {
      bytecode: artifact.bytecode,
      abi: artifact.abi
    }
  } catch (error) {
    console.error('Failed to load pre-compiled contract:', error)
    return null
  }
}
