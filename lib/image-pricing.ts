/**
 * Image Generation Pricing & Access Control
 */

// Whitelist addresses with unlimited free generations
const UNLIMITED_ADDRESSES = [
  '0xD138925168aD03fEe0Cca73cD949F1077C82c093', // Creator/Admin
  // Add more addresses here as needed
].map(addr => addr.toLowerCase())

// Payment configuration
export const PAYMENT_CONFIG = {
  recipientAddress: '0xD138925168aD03fEe0Cca73cD949F1077C82c093',
  pricePerImage: '0.01', // RITUAL
  chainId: 1979,
  freeGenerationsPerWallet: 1, // Regular users get 1 free
}

/**
 * Check if address has unlimited generations
 */
export function hasUnlimitedAccess(address?: string): boolean {
  if (!address) return false
  return UNLIMITED_ADDRESSES.includes(address.toLowerCase())
}

/**
 * Check if user needs to pay for generation
 */
export async function needsPayment(
  address?: string,
  generationCount: number = 0
): Promise<{ needsPayment: boolean; reason: string }> {
  // No wallet connected
  if (!address) {
    return {
      needsPayment: false,
      reason: 'No wallet connected - using fallback'
    }
  }

  // Whitelist check
  if (hasUnlimitedAccess(address)) {
    return {
      needsPayment: false,
      reason: 'Unlimited access granted'
    }
  }

  // First generation is free for everyone
  if (generationCount === 0) {
    return {
      needsPayment: false,
      reason: 'First generation free'
    }
  }

  // Subsequent generations require payment
  return {
    needsPayment: true,
    reason: `Payment required: ${PAYMENT_CONFIG.pricePerImage} RITUAL`
  }
}

/**
 * Get user's generation count from localStorage
 */
export function getGenerationCount(address: string): number {
  if (typeof window === 'undefined') return 0
  
  const key = `image_gen_count_${address.toLowerCase()}`
  const count = localStorage.getItem(key)
  return count ? parseInt(count, 10) : 0
}

/**
 * Increment user's generation count
 */
export function incrementGenerationCount(address: string): number {
  if (typeof window === 'undefined') return 0
  
  const key = `image_gen_count_${address.toLowerCase()}`
  const currentCount = getGenerationCount(address)
  const newCount = currentCount + 1
  localStorage.setItem(key, newCount.toString())
  return newCount
}

/**
 * Reset generation count (admin only)
 */
export function resetGenerationCount(address: string): void {
  if (typeof window === 'undefined') return
  
  const key = `image_gen_count_${address.toLowerCase()}`
  localStorage.removeItem(key)
}

/**
 * Get pricing info for display
 */
export function getPricingInfo(address?: string, generationCount: number = 0) {
  if (!address) {
    return {
      isUnlimited: false,
      isFree: true,
      price: '0',
      message: 'Connect wallet to generate images'
    }
  }

  const isUnlimited = hasUnlimitedAccess(address)
  
  if (isUnlimited) {
    return {
      isUnlimited: true,
      isFree: true,
      price: '0',
      message: '✨ Unlimited generations enabled'
    }
  }

  const isFree = generationCount === 0
  
  if (isFree) {
    return {
      isUnlimited: false,
      isFree: true,
      price: '0',
      message: '🎉 First generation FREE!'
    }
  }

  return {
    isUnlimited: false,
    isFree: false,
    price: PAYMENT_CONFIG.pricePerImage,
    message: `${PAYMENT_CONFIG.pricePerImage} RITUAL per image`
  }
}
