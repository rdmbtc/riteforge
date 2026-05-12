import { useContractWrite, useContractRead, useWaitForTransactionReceipt } from 'wagmi'
import { TOKEN_LOCKER_ABI, CONTRACT_ADDRESSES } from './abis'
import { parseUnits } from 'viem'
import { useState } from 'react'

export interface LockParams {
  token: `0x${string}`
  amount: string
  unlockTime: Date
  beneficiary: `0x${string}`
}

export interface LockInfo {
  token: `0x${string}`
  beneficiary: `0x${string}`
  amount: bigint
  lockedAmount: bigint
  unlockTime: bigint
  createdAt: bigint
  isClaimed: boolean
}

export function useLocker() {
  const [error, setError] = useState<string | null>(null)

  // Write: Lock tokens
  const { write, data: writeData, isPending: isLocking } = useContractWrite({
    address: CONTRACT_ADDRESSES.TOKEN_LOCKER,
    abi: TOKEN_LOCKER_ABI,
    functionName: 'lockTokens',
  })

  // Write: Unlock tokens
  const { write: unlockTokens, data: unlockData, isPending: isUnlocking } = useContractWrite({
    address: CONTRACT_ADDRESSES.TOKEN_LOCKER,
    abi: TOKEN_LOCKER_ABI,
    functionName: 'unlockTokens',
  })

  // Wait for lock transaction
  const { isLoading: isWaitingLock } = useWaitForTransactionReceipt({
    hash: writeData,
  })

  // Wait for unlock transaction
  const { isLoading: isWaitingUnlock } = useWaitForTransactionReceipt({
    hash: unlockData,
  })

  const lock = async (params: LockParams) => {
    try {
      setError(null)
      write({
        args: [
          params.token,
          parseUnits(params.amount, 18),
          BigInt(Math.floor(params.unlockTime.getTime() / 1000)),
          params.beneficiary,
        ],
      })
    } catch (err: any) {
      setError(err.message || 'Failed to lock tokens')
      console.error('Lock tokens error:', err)
    }
  }

  const unlock = async (lockId: number) => {
    try {
      setError(null)
      unlockTokens({
        args: [BigInt(lockId)],
      })
    } catch (err: any) {
      setError(err.message || 'Failed to unlock tokens')
      console.error('Unlock tokens error:', err)
    }
  }

  return {
    lock,
    unlock,
    isLocking: isLocking || isWaitingLock,
    isUnlocking: isUnlocking || isWaitingUnlock,
    error,
    lastLockTx: writeData || null,
    lastUnlockTx: unlockData || null,
  }
}

export function useLockInfo(lockId: number) {
  const { data, isLoading, error } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_LOCKER,
    abi: TOKEN_LOCKER_ABI,
    functionName: 'getLockInfo',
    args: [BigInt(lockId)],
    enabled: lockId >= 0,
  })

  return {
    lockInfo: data as LockInfo | undefined,
    isLoading,
    error,
  }
}

export function useUserLocks(userAddress: `0x${string}` | undefined) {
  const { data: lockIds, isLoading } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_LOCKER,
    abi: TOKEN_LOCKER_ABI,
    functionName: 'getUserLocks',
    args: userAddress ? [userAddress] : undefined,
    enabled: !!userAddress,
  })

  return {
    lockIds: lockIds as bigint[] || [],
    isLoading,
  }
}

export function useClaimableAmount(lockId: number) {
  const { data, isLoading } = useContractRead({
    address: CONTRACT_ADDRESSES.TOKEN_LOCKER,
    abi: TOKEN_LOCKER_ABI,
    functionName: 'getClaimableAmount',
    args: [BigInt(lockId)],
    enabled: lockId >= 0,
  })

  return {
    claimableAmount: data as bigint | undefined,
    isLoading,
  }
}