import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface ChatHistoryDB {
  id: string
  user_address?: string
  title: string
  preview: string
  type: 'create' | 'analyze' | 'registry'
  contract_input?: string
  analyzer_input?: string
  generated_template?: string
  contract_summary?: string
  contract_explanation?: string
  analysis_result?: any
  created_at: string
  updated_at: string
}

export interface ContractDB {
  id: string
  user_address?: string
  name: string
  description: string
  code: string
  summary?: string
  explanation?: string
  deployed_address?: string
  chain_id: number
  created_at: string
  updated_at: string
}

// Chat History Functions
export async function saveChatHistory(chat: {
  id: string
  user_address?: string
  title: string
  preview: string
  type: 'create' | 'analyze' | 'registry'
  contract_input?: string
  analyzer_input?: string
  generated_template?: string
  contract_summary?: string
  contract_explanation?: string
  analysis_result?: any
}) {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .upsert({
        id: chat.id,
        user_address: chat.user_address,
        title: chat.title,
        preview: chat.preview,
        type: chat.type,
        contract_input: chat.contract_input,
        analyzer_input: chat.analyzer_input,
        generated_template: chat.generated_template,
        contract_summary: chat.contract_summary,
        contract_explanation: chat.contract_explanation,
        analysis_result: chat.analysis_result,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving chat history:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    return data
  } catch (err) {
    console.error('Supabase save chat error:', err)
    throw err
  }
}

export async function getChatHistory(userAddress?: string) {
  let query = supabase
    .from('chat_history')
    .select('*')
    .order('created_at', { ascending: false })

  if (userAddress) {
    query = query.eq('user_address', userAddress)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching chat history:', error)
    throw error
  }

  return data
}

export async function deleteChatHistory(id: string) {
  const { error } = await supabase
    .from('chat_history')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting chat history:', error)
    throw error
  }
}

// Contract Functions
export async function saveContract(contract: {
  id?: string
  user_address?: string
  name: string
  description: string
  code: string
  summary?: string
  explanation?: string
  deployed_address?: string
  chain_id?: number
}) {
  try {
    const contractId = contract.id || crypto.randomUUID()

    const { data, error } = await supabase
      .from('contracts')
      .upsert({
        id: contractId,
        user_address: contract.user_address,
        name: contract.name,
        description: contract.description,
        code: contract.code,
        summary: contract.summary,
        explanation: contract.explanation,
        deployed_address: contract.deployed_address,
        chain_id: contract.chain_id || 1979,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving contract:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    return data
  } catch (err) {
    console.error('Supabase save contract error:', err)
    throw err
  }
}

export async function getContracts(userAddress?: string) {
  let query = supabase
    .from('contracts')
    .select('*')
    .order('created_at', { ascending: false })

  if (userAddress) {
    query = query.eq('user_address', userAddress)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching contracts:', error)
    throw error
  }

  return data
}

export async function updateContractDeployment(id: string, deployedAddress: string) {
  const { data, error } = await supabase
    .from('contracts')
    .update({
      deployed_address: deployedAddress,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating contract deployment:', error)
    throw error
  }

  return data
}

// Transaction History Functions
export interface TxHistoryEntry {
  id?: string
  user_address: string
  type: 'token_create' | 'stream_create' | 'lock_create' | 'vesting_create' | 'nft_deploy' | 'launchpad_create' | 'airdrop' | 'dvp_swap' | 'record'
  type_id?: string
  token_address?: string
  title: string
  description?: string
  amount?: string
  recipient?: string
  tx_hash: string
  status?: 'pending' | 'confirmed' | 'failed'
  chain_id?: number
}

export async function saveTransaction(tx: TxHistoryEntry) {
  try {
    const { data, error } = await supabase
      .from('transaction_history')
      .insert({
        id: tx.id || crypto.randomUUID(),
        user_address: tx.user_address,
        type: tx.type,
        type_id: tx.type_id || null,
        token_address: tx.token_address || null,
        title: tx.title,
        description: tx.description || null,
        amount: tx.amount || null,
        recipient: tx.recipient || null,
        tx_hash: tx.tx_hash,
        status: tx.status || 'pending',
        chain_id: tx.chain_id || 1979,
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving transaction:', error)
      // Don't throw - tx history is not critical
    }

    return data
  } catch (err) {
    console.error('Supabase save tx error:', err)
    // Don't throw - tx history is not critical
  }
}

export async function updateTransactionStatus(id: string, status: 'confirmed' | 'failed', txHash?: string) {
  try {
    const { data, error } = await supabase
      .from('transaction_history')
      .update({
        status,
        tx_hash: txHash || undefined,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating transaction status:', error)
    }

    return data
  } catch (err) {
    console.error('Supabase update tx status error:', err)
  }
}

export async function updateTransactionTokenAddress(id: string, tokenAddress: string) {
  try {
    const { data, error } = await supabase
      .from('transaction_history')
      .update({
        token_address: tokenAddress,
      })
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error updating token address:', error)
    }
    return data
  } catch (err) {
    console.error('Supabase update token address error:', err)
  }
}

export async function getTransactionHistory(userAddress: string, limit?: number) {
  try {
    let query = supabase
      .from('transaction_history')
      .select('*')
      .eq('user_address', userAddress)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching transaction history:', error)
      return []
    }

    return data
  } catch (err) {
    console.error('Supabase get tx history error:', err)
    return []
  }
}

export async function getUserTokensByAddress(userAddress: string) {
  try {
    const { data, error } = await supabase
      .from('transaction_history')
      .select('*')
      .eq('user_address', userAddress)
      .eq('type', 'token_create')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user tokens:', error)
      return []
    }

    return data
  } catch (err) {
    console.error('Supabase get user tokens error:', err)
    return []
  }
}
