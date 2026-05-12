import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { MASTER_ABI, MASTER_ADDRESS, ERC20_ABI } from './abis'
import { parseUnits, formatUnits, decodeEventLog } from 'viem'
import { useState, useEffect } from 'react'

export function useMasterToken() {
  const { address } = useAccount()
  const [error, setError] = useState<string | null>(null)
  const [createdTokenAddress, setCreatedTokenAddress] = useState<string | null>(null)

  const { writeContract, data: writeData, isPending: isWriting, error: writeError } = useWriteContract({
    mutation: { scopeKey: 'createToken' }
  })

  const { isLoading: isWaiting, receipt } = useWaitForTransactionReceipt({ hash: writeData })

  // Extract token address from TokenCreated event
  useEffect(() => {
    if (receipt) {
      try {
        const logs = receipt.logs
        for (const log of logs) {
          if (log.address.toLowerCase() === MASTER_ADDRESS.toLowerCase()) {
            try {
              const decoded = decodeEventLog({
                abi: MASTER_ABI,
                data: log.data,
                topics: log.topics,
                eventName: 'TokenCreated',
              })
              if (decoded && decoded.args && decoded.args.token) {
                setCreatedTokenAddress(decoded.args.token as string)
                return
              }
            } catch {
              // Event parsing failed, continue to next log
            }
          }
        }
      } catch {
        // Receipt parsing failed
      }
    }
  }, [receipt])

  const createToken = async (params: { name: string; symbol: string; decimals: number; initialSupply: string }) => {
    try {
      setError(null)
      setCreatedTokenAddress(null)
      const supply = parseUnits(params.initialSupply || '0', params.decimals)
      writeContract({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'createToken',
        args: [params.name, params.symbol.toUpperCase(), params.decimals, supply],
      })
      return true
    } catch (err: any) {
      setError(err.message || 'Failed to create token')
      return false
    }
  }

  return {
    createToken,
    isCreating: isWriting || isWaiting,
    isSuccess: !!writeData,
    txHash: writeData,
    createdTokenAddress,
    error: error || (writeError ? writeError.message : null),
  }
}

export function useUserTokens() {
  const { address } = useAccount()
  const { data, isLoading } = useReadContract({
    address: MASTER_ADDRESS,
    abi: MASTER_ABI,
    functionName: 'getUserTokens',
    args: address ? [address] : undefined,
  })
  return { tokens: (data as `0x${string}`[]) || [], isLoading }
}

// ============ LAUNCHPAD FUNCTIONS ============

export function useLaunchpad() {
  const [error, setError] = useState<string | null>(null)

  const { writeContract, data: writeData, isPending: isCreating } = useWriteContract({
    mutation: { scopeKey: 'createSale' }
  })

  const { writeContract: buyTokens, data: buyData, isPending: isBuying } = useWriteContract({
    mutation: { scopeKey: 'buyTokens' }
  })

  const { writeContract: claimTokens, data: claimData, isPending: isClaiming } = useWriteContract({
    mutation: { scopeKey: 'claimTokens' }
  })

  const { isLoading: isWaitingCreate } = useWaitForTransactionReceipt({ hash: writeData })
  const { isLoading: isWaitingBuy } = useWaitForTransactionReceipt({ hash: buyData })
  const { isLoading: isWaitingClaim } = useWaitForTransactionReceipt({ hash: claimData })

  const createSale = async (params: {
    token: `0x${string}`
    price: string
    totalTokens: string
    softCap: string
    hardCap: string
    minContribution: string
    maxContribution: string
    startTime: Date
    endTime: Date
  }) => {
    try {
      setError(null)
      writeContract({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'createSale',
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
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  const buy = async (saleId: number, amount: string) => {
    try {
      setError(null)
      buyTokens({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'buyTokens',
        args: [BigInt(saleId)],
        value: parseUnits(amount, 18)
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  const claim = async (saleId: number) => {
    try {
      setError(null)
      claimTokens({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'claimTokens',
        args: [BigInt(saleId)],
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
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
  }
}

export function useSaleInfo(saleId: number) {
  const { data, isLoading } = useReadContract({
    address: MASTER_ADDRESS,
    abi: MASTER_ABI,
    functionName: 'getSaleInfo',
    args: [BigInt(saleId)],
  })
  return { saleInfo: data, isLoading }
}

// ============ LOCKER FUNCTIONS ============

export function useLocker() {
  const [error, setError] = useState<string | null>(null)

  const { writeContract, data: writeData, isPending: isLocking } = useWriteContract({
    mutation: { scopeKey: 'lockTokens' }
  })

  const { writeContract: unlockTokens, data: unlockData, isPending: isUnlocking } = useWriteContract({
    mutation: { scopeKey: 'unlockTokens' }
  })

  const { isLoading: isWaitingLock } = useWaitForTransactionReceipt({ hash: writeData })
  const { isLoading: isWaitingUnlock } = useWaitForTransactionReceipt({ hash: unlockData })

  const lock = async (params: { token: `0x${string}`; amount: string; unlockTime: Date; beneficiary: `0x${string}` }) => {
    try {
      setError(null)
      writeContract({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'lockTokens',
        args: [
          params.token,
          parseUnits(params.amount, 18),
          BigInt(Math.floor(params.unlockTime.getTime() / 1000)),
          params.beneficiary,
        ],
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  const unlock = async (lockId: number) => {
    try {
      setError(null)
      unlockTokens({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'unlockTokens',
        args: [BigInt(lockId)],
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  return { lock, unlock, isLocking: isLocking || isWaitingLock, isUnlocking: isUnlocking || isWaitingUnlock, error }
}

export function useUserLockCount(user?: `0x${string}`) {
  const { data } = useReadContract({
    address: MASTER_ADDRESS,
    abi: MASTER_ABI,
    functionName: 'getUserLockCount',
    args: user ? [user] : undefined,
  })
  return { count: data ? Number(data) : 0 }
}

// ============ VESTING FUNCTIONS ============

export function useVesting() {
  const [error, setError] = useState<string | null>(null)

  const { writeContract, data: writeData, isPending: isCreating } = useWriteContract({
    mutation: { scopeKey: 'createVesting' }
  })

  const { writeContract: release, data: releaseData, isPending: isReleasing } = useWriteContract({
    mutation: { scopeKey: 'release' }
  })

  const { isLoading: isWaitingCreate } = useWaitForTransactionReceipt({ hash: writeData })
  const { isLoading: isWaitingRelease } = useWaitForTransactionReceipt({ hash: releaseData })

  const createVesting = async (params: {
    token: `0x${string}`
    beneficiary: `0x${string}`
    totalAmount: string
    startTime: Date
    cliffDurationMonths: number
    vestingDurationMonths: number
  }) => {
    try {
      setError(null)
      writeContract({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'createVesting',
        args: [
          params.token,
          params.beneficiary,
          parseUnits(params.totalAmount, 18),
          BigInt(Math.floor(params.startTime.getTime() / 1000)),
          BigInt(params.cliffDurationMonths * 30 * 24 * 60 * 60),
          BigInt(params.vestingDurationMonths * 30 * 24 * 60 * 60),
        ],
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  const releaseTokens = async (scheduleId: number) => {
    try {
      setError(null)
      release({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'release',
        args: [BigInt(scheduleId)],
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  return { createVesting, releaseTokens, isCreating: isCreating || isWaitingCreate, isReleasing: isReleasing || isWaitingRelease, error }
}

export function useClaimableVestingAmount(scheduleId: number) {
  const { data } = useReadContract({
    address: MASTER_ADDRESS,
    abi: MASTER_ABI,
    functionName: 'getClaimableAmount',
    args: [BigInt(scheduleId)],
  })
  return { claimableAmount: data as bigint | undefined }
}

// ============ NFT FUNCTIONS ============

export function useNFT() {
  const [error, setError] = useState<string | null>(null)

  const { writeContract, data: deployData, isPending: isDeploying } = useWriteContract({
    mutation: { scopeKey: 'deployNFT' }
  })

  const { writeContract: mint, data: mintData, isPending: isMinting } = useWriteContract({
    mutation: { scopeKey: 'mintNFT' }
  })

  const { isLoading: isWaitingDeploy } = useWaitForTransactionReceipt({ hash: deployData })
  const { isLoading: isWaitingMint } = useWaitForTransactionReceipt({ hash: mintData })

  const deployCollection = async (params: { name: string; symbol: string; baseURI: string; maxSupply?: number }) => {
    try {
      setError(null)
      writeContract({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'deployNFTCollection',
        args: [params.name, params.symbol.toUpperCase(), params.baseURI, params.maxSupply || 10000],
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  const mintNFT = async (collection: `0x${string}`, to: `0x${string}`) => {
    try {
      setError(null)
      mint({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'mintNFT',
        args: [collection, to],
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  return {
    deployCollection,
    mintNFT,
    isDeploying: isDeploying || isWaitingDeploy,
    isMinting: isMinting || isWaitingMint,
    error,
  }
}

// ============ UTILITY ============

export function useTokenInfo(tokenAddress?: `0x${string}`) {
  const { data: name } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'name',
  })
  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'symbol',
  })
  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })
  return { name: name as string | undefined, symbol: symbol as string | undefined, decimals: decimals as number | undefined }
}

export function useTokenBalance(tokenAddress?: `0x${string}`, account?: `0x${string}`) {
  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
  })
  const { decimals } = useTokenInfo(tokenAddress)
  return { balance: balance as bigint | undefined, formatted: balance ? formatUnits(balance as bigint, decimals || 18) : '0' }
}

// ============ STREAMING FUNCTIONS ============

export function useStreaming() {
  const [error, setError] = useState<string | null>(null)

  const { writeContract, data: writeData, isPending: isCreating } = useWriteContract({
    mutation: { scopeKey: 'createStream' }
  })

  const { writeContract: withdraw, data: withdrawData, isPending: isWithdrawing } = useWriteContract({
    mutation: { scopeKey: 'withdrawStream' }
  })

  const { writeContract: cancel, data: cancelData, isPending: isCancelling } = useWriteContract({
    mutation: { scopeKey: 'cancelStream' }
  })

  const { isLoading: isWaitingCreate } = useWaitForTransactionReceipt({ hash: writeData })
  const { isLoading: isWaitingWithdraw } = useWaitForTransactionReceipt({ hash: withdrawData })
  const { isLoading: isWaitingCancel } = useWaitForTransactionReceipt({ hash: cancelData })

  const createStream = async (params: {
    recipient: `0x${string}`
    token: `0x${string}`
    totalAmount: string
    startTime: Date
    stopTime: Date
  }) => {
    try {
      setError(null)
      writeContract({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'createStream',
        args: [
          params.recipient,
          params.token,
          parseUnits(params.totalAmount, 18),
          BigInt(Math.floor(params.startTime.getTime() / 1000)),
          BigInt(Math.floor(params.stopTime.getTime() / 1000)),
        ],
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  const withdrawFromStream = async (streamId: number, amount: string) => {
    try {
      setError(null)
      withdraw({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'withdrawFromStream',
        args: [BigInt(streamId), parseUnits(amount, 18)],
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  const cancelStream = async (streamId: number) => {
    try {
      setError(null)
      cancel({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'cancelStream',
        args: [BigInt(streamId)],
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  return {
    createStream,
    withdrawFromStream,
    cancelStream,
    isCreating: isCreating || isWaitingCreate,
    isWithdrawing: isWithdrawing || isWaitingWithdraw,
    isCancelling: isCancelling || isWaitingCancel,
    error,
  }
}

export function useStreamInfo(streamId: number) {
  const { data, isLoading } = useReadContract({
    address: MASTER_ADDRESS,
    abi: MASTER_ABI,
    functionName: 'getStreamInfo',
    args: [BigInt(streamId)],
  })
  return { streamInfo: data, isLoading }
}

export function useWithdrawableAmount(streamId: number) {
  const { data } = useReadContract({
    address: MASTER_ADDRESS,
    abi: MASTER_ABI,
    functionName: 'getWithdrawableAmount',
    args: [BigInt(streamId)],
  })
  return { withdrawable: data as bigint | undefined, formatted: data ? formatUnits(data as bigint, 18) : '0' }
}

// ============ CHAIN RECORD FUNCTIONS ============

export function useChainRecord() {
  const [error, setError] = useState<string | null>(null)

  const { writeContract, data: writeData, isPending: isRecording } = useWriteContract({
    mutation: { scopeKey: 'createRecord' }
  })

  const { isLoading: isWaiting } = useWaitForTransactionReceipt({ hash: writeData })

  const createRecord = async (params: { dataHash: `0x${string}`; description: string }) => {
    try {
      setError(null)
      const hash = params.dataHash.startsWith('0x') ? params.dataHash.slice(2) : params.dataHash
      const bytes32Hash = `0x${hash.padStart(64, '0')}` as `0x${string}`
      writeContract({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'createRecord',
        args: [bytes32Hash, params.description],
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  return {
    createRecord,
    isRecording: isRecording || isWaiting,
    txHash: writeData,
    error,
  }
}

export function useRecordInfo(recordId: number) {
  const { data, isLoading } = useReadContract({
    address: MASTER_ADDRESS,
    abi: MASTER_ABI,
    functionName: 'getRecord',
    args: [BigInt(recordId)],
  })
  return { record: data, isLoading }
}

// ============ DVP SWAP FUNCTIONS ============

export function useDvpSwap() {
  const [error, setError] = useState<string | null>(null)

  const { writeContract, data: writeData, isPending: isCreating } = useWriteContract({
    mutation: { scopeKey: 'createSwap' }
  })

  const { writeContract: complete, data: completeData, isPending: isCompleting } = useWriteContract({
    mutation: { scopeKey: 'completeSwap' }
  })

  const { writeContract: cancel, data: cancelData, isPending: isCancelling } = useWriteContract({
    mutation: { scopeKey: 'cancelSwap' }
  })

  const { isLoading: isWaitingCreate } = useWaitForTransactionReceipt({ hash: writeData })
  const { isLoading: isWaitingComplete } = useWaitForTransactionReceipt({ hash: completeData })
  const { isLoading: isWaitingCancel } = useWaitForTransactionReceipt({ hash: cancelData })

  const createSwap = async (params: {
    partyB: `0x${string}`
    tokenA: `0x${string}`
    amountA: string
    tokenB: `0x${string}`
    amountB: string
  }) => {
    try {
      setError(null)
      writeContract({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'createSwap',
        args: [
          params.partyB,
          params.tokenA,
          parseUnits(params.amountA, 18),
          params.tokenB,
          parseUnits(params.amountB, 18),
        ],
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  const completeSwap = async (swapId: number) => {
    try {
      setError(null)
      complete({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'completeSwap',
        args: [BigInt(swapId)],
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  const cancelSwap = async (swapId: number) => {
    try {
      setError(null)
      cancel({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'cancelSwap',
        args: [BigInt(swapId)],
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  return {
    createSwap,
    completeSwap,
    cancelSwap,
    isCreating: isCreating || isWaitingCreate,
    isCompleting: isCompleting || isWaitingComplete,
    isCancelling: isCancelling || isWaitingCancel,
    error,
  }
}

export function useSwapInfo(swapId: number) {
  const { data, isLoading } = useReadContract({
    address: MASTER_ADDRESS,
    abi: MASTER_ABI,
    functionName: 'getSwapInfo',
    args: [BigInt(swapId)],
  })
  return { swapInfo: data, isLoading }
}

// ============ BATCH AIRDROP FUNCTIONS ============

export function useBatchAirdrop() {
  const [error, setError] = useState<string | null>(null)

  const { writeContract, data: writeData, isPending: isAirdropping } = useWriteContract({
    mutation: { scopeKey: 'batchTransfer' }
  })

  const { isLoading: isWaiting } = useWaitForTransactionReceipt({ hash: writeData })

  const batchTransfer = async (params: {
    token: `0x${string}`
    recipients: `0x${string}`[]
    amounts: string[]
  }) => {
    try {
      setError(null)
      const parsedAmounts = params.amounts.map(a => parseUnits(a, 18))
      writeContract({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'batchTransfer',
        args: [params.token, params.recipients, parsedAmounts],
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  return {
    batchTransfer,
    isAirdropping: isAirdropping || isWaiting,
    txHash: writeData,
    error,
  }
}

// ============ TOKEN ADMIN (MINT/BURN) FUNCTIONS ============

export function useTokenAdmin() {
  const [error, setError] = useState<string | null>(null)

  const { writeContract, data: writeData, isPending: isProcessing } = useWriteContract({
    mutation: { scopeKey: 'tokenAdmin' }
  })

  const { isLoading: isWaiting } = useWaitForTransactionReceipt({ hash: writeData })

  const mintTokens = async (params: {
    token: `0x${string}`
    to: `0x${string}`
    amount: string
  }) => {
    try {
      setError(null)
      writeContract({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'mintTokens',
        args: [params.token, params.to, parseUnits(params.amount, 18)],
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  const burnTokens = async (params: {
    token: `0x${string}`
    amount: string
  }) => {
    try {
      setError(null)
      writeContract({
        address: MASTER_ADDRESS,
        abi: MASTER_ABI,
        functionName: 'burnTokens',
        args: [params.token, parseUnits(params.amount, 18)],
      })
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }

  return {
    mintTokens,
    burnTokens,
    isProcessing: isProcessing || isWaiting,
    txHash: writeData,
    error,
  }
}
