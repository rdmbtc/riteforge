import { useContractWrite, useContractRead, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { ERC20_ABI, TOKEN_FACTORY_ABI, CONTRACT_ADDRESSES } from './abis'
import { parseUnits, formatUnits } from 'viem'
import { useState } from 'react'

export interface CreateTokenParams {
  name: string
  symbol: string
  decimals: number
  initialSupply: string
}

export interface TokenInfo {
  address: string
  name: string
  symbol: string
  decimals: number
  totalSupply: bigint
  totalSupplyFormatted: string
}

export function useTokenFactory() {
  const { address } = useAccount()
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Read deployed tokens count
  const { data: tokenCount } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'getDeployedTokenCount',
    args: [],
  })

  // Read user's deployed tokens
  const { data: userTokens } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'getDeployedTokens',
    args: address ? [address] : undefined,
    enabled: !!address,
  })

  // Write: Create token
  const { write, data: writeData, isPending: isWriting } = useContractWrite({
    address: CONTRACT_ADDRESSES.TOKEN_FACTORY,
    abi: TOKEN_FACTORY_ABI,
    functionName: 'createToken',
  })

  // Wait for transaction
  const { isLoading: isWaiting, isSuccess } = useWaitForTransactionReceipt({
    hash: writeData,
  })

  // Create token function
  const createToken = async (params: CreateTokenParams) => {
    try {
      setError(null)
      setTxHash(null)

      const supply = parseUnits(params.initialSupply || '0', params.decimals)

      write({
        args: [params.name, params.symbol, params.decimals, supply],
        value: BigInt('42500000000000000'), // 0.0425 RITUAL in wei
      })
    } catch (err: any) {
      setError(err.message || 'Failed to create token')
      console.error('Create token error:', err)
    }
  }

  return {
    createToken,
    isCreating: isWriting || isWaiting,
    isSuccess,
    txHash: writeData || txHash,
    error,
    tokenCount: tokenCount ? Number(tokenCount) : 0,
    userTokens: (userTokens as `0x${string}`[]) || [],
  }
}

export function useToken(tokenAddress: `0x${string}` | undefined) {
  const [error, setError] = useState<string | null>(null)

  const { data: name } = useContractRead({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'name',
    args: undefined,
    enabled: !!tokenAddress,
  })

  const { data: symbol } = useContractRead({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'symbol',
    enabled: !!tokenAddress,
  })

  const { data: decimals } = useContractRead({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
    enabled: !!tokenAddress,
  })

  const { data: totalSupply } = useContractRead({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'totalSupply',
    enabled: !!tokenAddress,
  })

  return {
    name: name as string | undefined,
    symbol: symbol as string | undefined,
    decimals: decimals ? Number(decimals) : 18,
    totalSupply: totalSupply as bigint | undefined,
    totalSupplyFormatted: totalSupply ? formatUnits(totalSupply, decimals ? Number(decimals) : 18) : '0',
    error,
  }
}

export function useTokenBalance(tokenAddress: `0x${string}` | undefined, account?: `0x${string}`) {
  const { data: balance } = useContractRead({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    enabled: !!tokenAddress && !!account,
  })

  return {
    balance: balance as bigint | undefined,
    formatted: balance ? formatUnits(balance as bigint, 18) : '0',
  }
}