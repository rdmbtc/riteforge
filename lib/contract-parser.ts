/**
 * Parse contract code to extract token name and symbol
 */

export interface TokenInfo {
  name: string
  symbol: string
  type: 'token' | 'nft' | 'dao' | 'defi' | 'staking' | 'security'
}

/**
 * Extract token name from contract code
 */
export function extractTokenName(contractCode: string, userInput: string): string {
  // Try to find name in contract
  const nameMatch = contractCode.match(/string\s+public\s+name\s*=\s*["']([^"']+)["']/i)
  if (nameMatch) return nameMatch[1]

  // Try to find in constructor
  const constructorMatch = contractCode.match(/constructor\([^)]*\)\s*{[^}]*name\s*=\s*["']([^"']+)["']/i)
  if (constructorMatch) return constructorMatch[1]

  // Try to extract from user input
  const inputMatch = userInput.match(/(?:called|named)\s+([A-Z][a-zA-Z0-9]+)/i)
  if (inputMatch) return inputMatch[1]

  // Try to find contract name
  const contractMatch = contractCode.match(/contract\s+([A-Z][a-zA-Z0-9]+)/i)
  if (contractMatch) return contractMatch[1]

  return 'Token'
}

/**
 * Extract token symbol from contract code
 */
export function extractTokenSymbol(contractCode: string, userInput: string): string {
  // Try to find symbol in contract
  const symbolMatch = contractCode.match(/string\s+public\s+symbol\s*=\s*["']([^"']+)["']/i)
  if (symbolMatch) return symbolMatch[1]

  // Try to find in constructor
  const constructorMatch = contractCode.match(/constructor\([^)]*\)\s*{[^}]*symbol\s*=\s*["']([^"']+)["']/i)
  if (constructorMatch) return constructorMatch[1]

  // Try to extract from user input (look for uppercase words)
  const inputMatch = userInput.match(/\b([A-Z]{2,6})\b/)
  if (inputMatch) return inputMatch[1]

  // Generate from name
  const name = extractTokenName(contractCode, userInput)
  return name.substring(0, 4).toUpperCase()
}

/**
 * Detect contract type from code and input
 */
export function detectContractType(contractCode: string, userInput: string): TokenInfo['type'] {
  const code = contractCode.toLowerCase()
  const input = userInput.toLowerCase()

  // Check for NFT
  if (code.includes('erc721') || code.includes('erc1155') || 
      input.includes('nft') || input.includes('collectible')) {
    return 'nft'
  }

  // Check for DAO
  if (code.includes('governance') || code.includes('voting') || 
      input.includes('dao') || input.includes('governance')) {
    return 'dao'
  }

  // Check for Staking
  if (code.includes('staking') || code.includes('stake') || 
      input.includes('staking') || input.includes('stake')) {
    return 'staking'
  }

  // Check for DeFi
  if (code.includes('swap') || code.includes('liquidity') || code.includes('pool') ||
      input.includes('defi') || input.includes('swap') || input.includes('dex')) {
    return 'defi'
  }

  // Check for Security/Audit
  if (code.includes('security') || code.includes('audit') ||
      input.includes('security') || input.includes('firewall')) {
    return 'security'
  }

  // Default to token
  return 'token'
}

/**
 * Extract all token info from contract
 */
export function extractTokenInfo(contractCode: string, userInput: string): TokenInfo {
  return {
    name: extractTokenName(contractCode, userInput),
    symbol: extractTokenSymbol(contractCode, userInput),
    type: detectContractType(contractCode, userInput)
  }
}
