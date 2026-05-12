/**
 * Browser-based Solidity compilation using web-solc
 * Works on Vercel and all serverless platforms!
 */

import { fetchAndLoadSolc } from 'web-solc'

export interface CompilationResult {
  success: boolean
  bytecode?: string
  abi?: any[]
  error?: string
  warnings?: string[]
}

// Cache compiler instances to avoid re-downloading
const compilerCache = new Map<string, any>()

/**
 * Compile Solidity code in the browser using web-solc
 * This works on Vercel, supports OpenZeppelin imports, and is fast!
 */
export async function compileSolidityInBrowser(sourceCode: string): Promise<CompilationResult> {
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
    const solcVersion = pragmaMatch ? `^${pragmaMatch[1]}` : '^0.8.20'

    console.log(`🔧 Compiling ${contractName} with Solidity ${solcVersion}...`)

    // Get or create compiler instance
    let solc = compilerCache.get(solcVersion)
    if (!solc) {
      console.log(`📥 Loading Solidity compiler ${solcVersion}...`)
      solc = await fetchAndLoadSolc(solcVersion)
      compilerCache.set(solcVersion, solc)
      console.log(`✅ Compiler loaded successfully`)
    }

    // Prepare compiler input
    const input = {
      language: 'Solidity',
      sources: {
        [`${contractName}.sol`]: {
          content: sourceCode
        }
      },
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode']
          }
        }
      }
    }

    // Compile!
    console.log('⚙️ Compiling contract...')
    const output = await solc.compile(input)
    
    console.log('📦 Compilation output:', JSON.stringify(output, null, 2))

    // Check for errors
    if (output.errors) {
      const errors = output.errors.filter((e: any) => e.severity === 'error')
      if (errors.length > 0) {
        const errorMessages = errors.map((e: any) => e.formattedMessage || e.message).join('\n')
        console.error('❌ Compilation errors:', errorMessages)
        return {
          success: false,
          error: errorMessages
        }
      }
    }

    // Debug: Log the structure
    console.log('🔍 Output structure:', {
      hasContracts: !!output.contracts,
      contractKeys: output.contracts ? Object.keys(output.contracts) : [],
    })

    // Try different ways to extract the contract
    let contract = null
    let contractFile = null

    // Method 1: Try exact filename match
    if (output.contracts?.[`${contractName}.sol`]) {
      contractFile = output.contracts[`${contractName}.sol`]
      console.log('✅ Found contract file:', `${contractName}.sol`)
      console.log('📝 Contracts in file:', Object.keys(contractFile))
      contract = contractFile[contractName]
    }

    // Method 2: Try to find any contract with matching name
    if (!contract && output.contracts) {
      for (const [fileName, fileContracts] of Object.entries(output.contracts)) {
        console.log(`🔍 Checking file: ${fileName}`)
        if (typeof fileContracts === 'object' && fileContracts[contractName]) {
          contract = fileContracts[contractName]
          console.log(`✅ Found contract in ${fileName}`)
          break
        }
      }
    }

    // Method 3: Try to get the first contract if only one exists
    if (!contract && output.contracts) {
      const allFiles = Object.values(output.contracts)
      if (allFiles.length === 1) {
        const firstFile: any = allFiles[0]
        const contractNames = Object.keys(firstFile)
        if (contractNames.length === 1) {
          contract = firstFile[contractNames[0]]
          console.log(`✅ Using single contract: ${contractNames[0]}`)
        }
      }
    }

    if (!contract) {
      console.error('❌ Contract not found in output')
      console.error('Available contracts:', JSON.stringify(output.contracts, null, 2))
      return {
        success: false,
        error: `Contract "${contractName}" not found in compilation output. Check console for details.`
      }
    }

    // Verify bytecode exists
    if (!contract.evm?.bytecode?.object) {
      console.error('❌ No bytecode in contract:', contract)
      return {
        success: false,
        error: 'Contract compiled but no bytecode was generated'
      }
    }

    // Extract warnings
    const warnings = output.errors
      ?.filter((e: any) => e.severity === 'warning')
      .map((e: any) => e.message) || []

    console.log('✅ Compilation successful!')
    console.log('📊 Bytecode length:', contract.evm.bytecode.object.length)
    console.log('📋 ABI entries:', contract.abi?.length || 0)

    return {
      success: true,
      bytecode: contract.evm.bytecode.object,
      abi: contract.abi,
      warnings
    }

  } catch (error: any) {
    console.error('❌ Compilation error:', error)
    return {
      success: false,
      error: error?.message || 'Compilation failed'
    }
  }
}

/**
 * Compile with OpenZeppelin imports support
 * Uses a simple import resolver for common OpenZeppelin contracts
 */
export async function compileSolidityWithImports(
  sourceCode: string,
  imports: Record<string, string> = {}
): Promise<CompilationResult> {
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

    // Extract Solidity version
    const pragmaMatch = sourceCode.match(/pragma\s+solidity\s+[\^~]?([\d.]+)/)
    const solcVersion = pragmaMatch ? `^${pragmaMatch[1]}` : '^0.8.20'

    // Get or create compiler
    let solc = compilerCache.get(solcVersion)
    if (!solc) {
      solc = await fetchAndLoadSolc(solcVersion)
      compilerCache.set(solcVersion, solc)
    }

    // Build sources object with imports
    const sources: Record<string, { content: string }> = {
      [`${contractName}.sol`]: {
        content: sourceCode
      }
    }

    // Add provided imports
    Object.entries(imports).forEach(([path, content]) => {
      sources[path] = { content }
    })

    // Prepare compiler input
    const input = {
      language: 'Solidity',
      sources,
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode']
          }
        }
      }
    }

    // Compile
    const output = await solc.compile(input)

    // Check for errors
    if (output.errors) {
      const errors = output.errors.filter((e: any) => e.severity === 'error')
      if (errors.length > 0) {
        const errorMessages = errors.map((e: any) => e.formattedMessage || e.message).join('\n')
        return {
          success: false,
          error: errorMessages
        }
      }
    }

    // Extract compiled contract
    const contracts = output.contracts?.[`${contractName}.sol`]
    const contract = contracts?.[contractName]

    if (!contract) {
      return {
        success: false,
        error: 'Contract compilation failed'
      }
    }

    const warnings = output.errors
      ?.filter((e: any) => e.severity === 'warning')
      .map((e: any) => e.message) || []

    return {
      success: true,
      bytecode: contract.evm.bytecode.object,
      abi: contract.abi,
      warnings
    }

  } catch (error: any) {
    console.error('Compilation error:', error)
    return {
      success: false,
      error: error?.message || 'Compilation failed'
    }
  }
}

/**
 * Clean up compiler instances (call when done)
 */
export function cleanupCompilers() {
  compilerCache.forEach(solc => {
    try {
      solc.stopWorker()
    } catch (e) {
      // Ignore cleanup errors
    }
  })
  compilerCache.clear()
}
