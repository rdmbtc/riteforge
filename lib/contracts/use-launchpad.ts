import { useContractWrite, useContractRead, useWaitForTransactionReceipt } from 'wagmi'
import { TOKEN_LAUNCHPAD_ABI, CONTRACT_ADDRESSES } from './abis'
import { parseUnits } from 'viem'
import { useState } from 'react'

export interface CreateSaleParams {
  token: `0x${string}`
  price: string
  totalTokens: string
  softCap: string
  hardCap: string
  minContribution: string
  maxContribution: string
  startTime: Date
  endTime: Date
}

export interface SaleInfo {
  creator: `0x${string}`
  token: `0x${string}`
  price: bigint
  totalTokens: bigint
  soldTokens: bigint
  softCap: bigint
  hardCap: bigint
  minContribution: bigint
  maxContribution: bigint
  startTime: bigint
  endTime: bigint
  raised: bigint
  status: number
}

export function useLaunchpad() {
  const [error, setError] = useState<string | null>(null)

  // Read total sales count
  const { data: totalSales } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_LAUNCHPAD,
    abi: TOKEN_LAUNCHPAD_ABI,
    functionName: 'getTotalSales',
    args: [],
  })

  // Write: Create sale
  const { write, data: writeData, isPending: isCreating } = useContractWrite({
    address: CONTRACT_ADDRESSES.TOKEN_LAUNCHPAD,
    abi: TOKEN_LAUNCHPAD_ABI,
    functionName: 'createSale',
  })

  // Write: Buy tokens
  const { write: buyTokens, data: buyData, isPending: isBuying } = useContractWrite({
    address: CONTRACT_ADDRESSES.TOKEN_LAUNCHPAD,
    abi: TOKEN_LAUNCHPAD_ABI,
    functionName: 'buyTokens',
  })

  // Write: Claim tokens
  const { write: claimTokens, data: claimData, isPending: isClaiming } = useContractWrite({
    address: CONTRACT_ADDRESSES.TOKEN_LAUNCHPAD,
    abi: TOKEN_LAUNCHPAD_ABI,
    functionName: 'claimTokens',
  })

  // Wait for create sale transaction
  const { isLoading: isWaitingCreate } = useWaitForTransactionReceipt({
    hash: writeData,
  })

  // Wait for buy transaction
  const { isLoading: isWaitingBuy } = useWaitForTransactionReceipt({
    hash: buyData,
  })

  // Wait for claim transaction
  const { isLoading: isWaitingClaim } = useWaitForTransactionReceipt({
    hash: claimData,
  })

  const createSale = async (params: CreateSaleParams) => {
    try {
      setError(null)

      write({
        args: [
          params.token,
          parseUnits(params.price, 18),
          parseUnits(params.totalTokens, 18),
          parseUnits(params.softCap, 18),
          parseUnits(params.hardCap, 18),
          parseUnits(params.minContribution, 18),
          parseUnits(params.maxContribution, 18),
          BigInt(Math.floor(params.startTime.getTime() / 1000)),
          BigInt(Math.floor(params.endTime.getTime() / 1000)),
        ],
      })
    } catch (err: any) {
      setError(err.message || 'Failed to create sale')
      console.error('Create sale error:', err)
    }
  }

  const buy = async (saleId: number, amount: string) => {
    try {
      setError(null)
      buyTokens({
        args: [BigInt(saleId)],
        value: parseUnits(amount, 18),
      })
    } catch (err: any) {
      setError(err.message || 'Failed to buy tokens')
      console.error('Buy tokens error:', err)
    }
  }

  const claim = async (saleId: number) => {
    try {
      setError(null)
      claimTokens({
        args: [BigInt(saleId)],
      })
    } catch (err: any) {
      setError(err.message || 'Failed to claim tokens')
      console.error('Claim tokens error:', err)
    }
  }

  return {
    createSale,
    buy,
    claim,
    isCreating: isCreating || isWaitingCreate,
    isBuying: isBuying || isWaitingBuy,
    isClaiming: isClaiming || isWaitingClaim,
    error,
    totalSales: totalSales ? Number(totalSales) : 0,
    lastCreatedSale: writeData || null,
    lastBuyTx: buyData || null,
    lastClaimTx: claimData || null,
  }
}

export function useSaleInfo(saleId: number) {
  const { data, isLoading, error } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_LAUNCHPAD,
    abi: TOKEN_LAUNCHPAD_ABI,
    functionName: 'getSaleInfo',
    args: [BigInt(saleId)],
    enabled: saleId >= 0,
  })

  return {
    saleInfo: data as SaleInfo | undefined,
    isLoading,
    error,
  }
}