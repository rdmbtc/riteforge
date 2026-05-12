import { useContractWrite, useContractRead, useWaitForTransactionReceipt } from 'wagmi'
import { TOKEN_VESTING_ABI, CONTRACT_ADDRESSES } from './abis'
import { parseUnits } from 'viem'
import { useState } from 'react'

export interface CreateVestingParams {
  token: `0x${string}`
  beneficiary: `0x${string}`
  totalAmount: string
  startTime: Date
  cliffDurationMonths: number
  vestingDurationMonths: number
}

export interface VestingInfo {
  token: `0x${string}`
  beneficiary: `0x${string}`
  totalAmount: bigint
  released: bigint
  startTime: bigint
  cliffDuration: bigint
  vestingDuration: bigint
  isRevoked: boolean
}

export function useVesting() {
  const [error, setError] = useState<string | null>(null)

  // Write: Create vesting
  const { write, data: writeData, isPending: isCreating } = useContractWrite({
    address: CONTRACT_ADDRESSES.TOKEN_VESTING,
    abi: TOKEN_VESTING_ABI,
    functionName: 'createVesting',
  })

  // Write: Release tokens
  const { write: release, data: releaseData, isPending: isReleasing } = useContractWrite({
    address: CONTRACT_ADDRESSES.TOKEN_VESTING,
    abi: TOKEN_VESTING_ABI,
    functionName: 'release',
  })

  // Wait for create transaction
  const { isLoading: isWaitingCreate } = useWaitForTransactionReceipt({
    hash: writeData,
  })

  // Wait for release transaction
  const { isLoading: isWaitingRelease } = useWaitForTransactionReceipt({
    hash: releaseData,
  })

  const createVesting = async (params: CreateVestingParams) => {
    try {
      setError(null)

      const cliffDuration = BigInt(params.cliffDurationMonths) * BigInt(30 * 24 * 60 * 60) // Convert months to seconds
      const vestingDuration = BigInt(params.vestingDurationMonths) * BigInt(30 * 24 * 60 * 60)

      write({
        args: [
          params.token,
          params.beneficiary,
          parseUnits(params.totalAmount, 18),
          BigInt(Math.floor(params.startTime.getTime() / 1000)),
          cliffDuration,
          vestingDuration,
        ],
      })
    } catch (err: any) {
      setError(err.message || 'Failed to create vesting')
      console.error('Create vesting error:', err)
    }
  }

  const releaseTokens = async (scheduleId: number) => {
    try {
      setError(null)
      release({
        args: [BigInt(scheduleId)],
      })
    } catch (err: any) {
      setError(err.message || 'Failed to release tokens')
      console.error('Release tokens error:', err)
    }
  }

  return {
    createVesting,
    releaseTokens,
    isCreating: isCreating || isWaitingCreate,
    isReleasing: isReleasing || isWaitingRelease,
    error,
    lastCreateTx: writeData || null,
    lastReleaseTx: releaseData || null,
  }
}

export function useVestingInfo(scheduleId: number) {
  const { data, isLoading, error } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_VESTING,
    abi: TOKEN_VESTING_ABI,
    functionName: 'getVestingInfo',
    args: [BigInt(scheduleId)],
    enabled: scheduleId >= 0,
  })

  return {
    vestingInfo: data as VestingInfo | undefined,
    isLoading,
    error,
  }
}

export function useUserVestings(userAddress: `0x${string}` | undefined) {
  const { data: vestingIds, isLoading } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_VESTING,
    abi: TOKEN_VESTING_ABI,
    functionName: 'getUserVestings',
    args: userAddress ? [userAddress] : undefined,
    enabled: !!userAddress,
  })

  return {
    vestingIds: vestingIds as bigint[] || [],
    isLoading,
  }
}

export function useClaimableVestingAmount(scheduleId: number) {
  const { data, isLoading } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_VESTING,
    abi: TOKEN_VESTING_ABI,
    functionName: 'getClaimableAmount',
    args: [BigInt(scheduleId)],
    enabled: scheduleId >= 0,
  })

  return {
    claimableAmount: data as bigint | undefined,
    isLoading,
  }
}