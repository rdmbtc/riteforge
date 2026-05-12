/**
 * AI Image Generation API
 * Generates images for token cards, security reports, and NFTs
 */

const AI_IMAGE_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'https://api.freetheai.xyz/v1'
const AI_IMAGE_MODEL = process.env.NEXT_PUBLIC_AI_IMAGE_MODEL || 'vhr/gpt_image_2'
const AI_IMAGE_API_KEY = process.env.NEXT_PUBLIC_AI_IMAGE_API_KEY

// Brand kit - consistent across all images
const BRAND_STYLE = `Dark crypto aesthetic, deep black background #0c0c0b, neon green (#00ff88) and purple-blue gradient accents, glowing geometric shapes, holographic texture, web3 cyberpunk style, clean minimalist composition, digital art, no text, centered subject, subtle grid lines in background, electric glow effect, high contrast`

export type ImageType = 'token' | 'nft' | 'dao' | 'security' | 'staking' | 'defi'

/**
 * Generate subject prompt based on contract type and name
 */
function getSubjectPrompt(type: ImageType, tokenName?: string): string {
  const subjects: Record<ImageType, string> = {
    token: 'glowing coin with lightning bolt symbol',
    nft: 'abstract digital creature, geometric form',
    dao: 'geometric shield or crystal structure',
    security: 'glowing shield with circuit board pattern',
    staking: 'glowing crystal tower with energy streams',
    defi: 'interconnected geometric nodes with flowing energy'
  }

  let subject = subjects[type] || subjects.token

  // Customize based on token name if provided
  if (tokenName) {
    const name = tokenName.toLowerCase()
    if (name.includes('moon')) subject = 'glowing moon with crypto symbols'
    else if (name.includes('sun')) subject = 'radiant sun with geometric rays'
    else if (name.includes('star')) subject = 'glowing star constellation'
    else if (name.includes('dragon')) subject = 'geometric dragon made of light'
    else if (name.includes('phoenix')) subject = 'abstract phoenix rising, geometric form'
    else if (name.includes('wolf')) subject = 'geometric wolf head with glowing eyes'
    else if (name.includes('lion')) subject = 'geometric lion with energy mane'
  }

  return subject
}

/**
 * Generate AI image for token/contract
 */
export async function generateContractImage(
  type: ImageType,
  tokenName?: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    if (!AI_IMAGE_API_KEY) {
      console.warn('AI Image API key not configured')
      return { success: false, error: 'API key not configured' }
    }

    const subject = getSubjectPrompt(type, tokenName)
    const fullPrompt = `${BRAND_STYLE}, ${subject}`

    console.log('🎨 Generating image with prompt:', fullPrompt)

    const response = await fetch(`${AI_IMAGE_API_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_IMAGE_API_KEY}`
      },
      body: JSON.stringify({
        model: AI_IMAGE_MODEL,
        prompt: fullPrompt,
        n: 1,
        size: '512x512', // Good balance between quality and cost
        response_format: 'url'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Image generation failed:', errorText)
      return { 
        success: false, 
        error: `API error: ${response.status} ${errorText}` 
      }
    }

    const data = await response.json()
    
    if (data.data && data.data[0] && data.data[0].url) {
      console.log('✅ Image generated successfully')
      return { 
        success: true, 
        imageUrl: data.data[0].url 
      }
    }

    return { 
      success: false, 
      error: 'No image URL in response' 
    }
  } catch (error) {
    console.error('Error generating image:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Generate token card image (for social sharing)
 */
export async function generateTokenCard(
  tokenName: string,
  tokenSymbol: string,
  contractAddress?: string,
  customPrompt?: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    if (!AI_IMAGE_API_KEY) {
      console.warn('AI Image API key not configured')
      return { success: false, error: 'API key not configured' }
    }

    // Use custom prompt if provided, otherwise use default with token name
    const finalPrompt = customPrompt || `${BRAND_STYLE}, ${getSubjectPrompt('token', tokenName)}`

    console.log('🎨 Generating token card with prompt:', finalPrompt)

    const response = await fetch(`${AI_IMAGE_API_URL}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_IMAGE_API_KEY}`
      },
      body: JSON.stringify({
        model: AI_IMAGE_MODEL,
        prompt: finalPrompt,
        n: 1,
        size: '512x512',
        response_format: 'url'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Image generation failed:', errorText)
      return { 
        success: false, 
        error: `API error: ${response.status} ${errorText}` 
      }
    }

    const data = await response.json()
    
    if (data.data && data.data[0] && data.data[0].url) {
      console.log('✅ Token card generated successfully')
      return { 
        success: true, 
        imageUrl: data.data[0].url 
      }
    }

    return { 
      success: false, 
      error: 'No image URL in response' 
    }
  } catch (error) {
    console.error('Error generating token card:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Generate security report cover
 */
export async function generateSecurityReportCover(
  contractName: string,
  score: number
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  return generateContractImage('security', contractName)
}
