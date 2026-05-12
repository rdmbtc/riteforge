import { NextRequest, NextResponse } from 'next/server'

/**
 * Server-side compilation is not supported on Vercel serverless functions.
 * This endpoint is disabled. Use client-side compilation with solc-js instead.
 * 
 * For contracts with external dependencies (like OpenZeppelin), users should:
 * 1. Use Remix IDE (https://remix.ethereum.org)
 * 2. Deploy locally with Hardhat
 * 3. Simplify the contract to remove external dependencies
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      success: false,
      error: 'Server-side compilation is not available on Vercel. The app now uses client-side compilation. Please refresh the page and try again.'
    },
    { status: 503 }
  )
}
