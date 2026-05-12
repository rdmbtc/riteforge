// Transaction history helper
import { saveTransaction, getTransactionHistory } from './supabase'

export async function recordTransaction(params: {
  userAddress: string
  type: 'token_create' | 'stream_create' | 'lock_create' | 'vesting_create' | 'nft_deploy' | 'launchpad_create' | 'airdrop' | 'dvp_swap' | 'record'
  title: string
  description?: string
  amount?: string
  recipient?: string
  tokenAddress?: string
  txHash?: string
}) {
  try {
    await saveTransaction({
      user_address: params.userAddress,
      type: params.type,
      title: params.title,
      description: params.description,
      amount: params.amount,
      recipient: params.recipient,
      token_address: params.tokenAddress,
      tx_hash: params.txHash || 'pending',
      status: 'pending',
    })
  } catch (e) {
    console.error('Failed to save tx history:', e)
  }
}

export { getTransactionHistory }
