import { useContractWrite, useContractRead, useWaitForTransactionReceipt } from 'wagmi'
import { ERC721_ABI, NFT_COLLECTION_ABI, CONTRACT_ADDRESSES } from './abis'
import { useState } from 'react'

export interface DeployCollectionParams {
  name: string
  symbol: string
  baseURI: string
  maxSupply?: number
}

export function useNFT() {
  const [error, setError] = useState<string | null>(null)
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null)

  // Read: Total supply
  const { data: totalSupply, refetch: refetchSupply } = useContractRead({
    address: CONTRACT_ADDRESSES.NFT_COLLECTION,
    abi: NFT_COLLECTION_ABI,
    functionName: 'totalSupply',
    args: undefined,
  })

  // Write: Deploy collection (via factory if needed)
  const { write, data: writeData, isPending: isDeploying } = useContractWrite({
    address: CONTRACT_ADDRESSES.NFT_COLLECTION,
    abi: NFT_COLLECTION_ABI,
    functionName: 'constructor',
  })

  // Write: Mint NFT
  const { write: mint, data: mintData, isPending: isMinting } = useContractWrite({
    address: CONTRACT_ADDRESSES.NFT_COLLECTION,
    abi: NFT_COLLECTION_ABI,
    functionName: 'mint',
  })

  // Write: Mint batch
  const { write: mintBatch, data: mintBatchData, isPending: isMintBatch } = useContractWrite({
    address: CONTRACT_ADDRESSES.NFT_COLLECTION,
    abi: NFT_COLLECTION_ABI,
    functionName: 'mintBatch',
  })

  // Wait for deploy transaction
  const { isLoading: isWaitingDeploy } = useWaitForTransactionReceipt({
    hash: writeData,
  })

  // Wait for mint transaction
  const { isLoading: isWaitingMint } = useWaitForTransactionReceipt({
    hash: mintData,
  })

  const deployCollection = async (params: DeployCollectionParams) => {
    try {
      setError(null)
      // For deployment, we need to use the factory contract
      // This would deploy a new RiteForgeNFT contract
      // For now, we'll use the existing collection contract
      write({
        args: [params.name, params.symbol, params.baseURI],
      })
    } catch (err: any) {
      setError(err.message || 'Failed to deploy collection')
      console.error('Deploy collection error:', err)
    }
  }

  const mintNFT = async (to: `0x${string}`) => {
    try {
      setError(null)
      mint({
        args: [to],
      })
    } catch (err: any) {
      setError(err.message || 'Failed to mint NFT')
      console.error('Mint NFT error:', err)
    }
  }

  const mintNFTBatch = async (to: `0x${string}`, amount: number) => {
    try {
      setError(null)
      mintBatch({
        args: [to, BigInt(amount)],
      })
    } catch (err: any) {
      setError(err.message || 'Failed to mint batch')
      console.error('Mint batch error:', err)
    }
  }

  return {
    deployCollection,
    mintNFT,
    mintNFTBatch,
    isDeploying: isDeploying || isWaitingDeploy,
    isMinting: isMinting || isWaitingMint,
    isMintBatch: isMintBatch,
    error,
    deployedAddress,
    totalSupply: totalSupply ? Number(totalSupply) : 0,
    lastDeployTx: writeData || null,
    lastMintTx: mintData || null,
    refetchSupply,
  }
}

export function useNFTMetadata(collectionAddress: `0x${string}` | undefined) {
  const { data: name } = useContractRead({
    address: collectionAddress,
    abi: ERC721_ABI,
    functionName: 'name',
    enabled: !!collectionAddress,
  })

  const { data: symbol } = useContractRead({
    address: collectionAddress,
    abi: ERC721_ABI,
    functionName: 'symbol',
    enabled: !!collectionAddress,
  })

  return {
    name: name as string | undefined,
    symbol: symbol as string | undefined,
  }
}

export function useNFTBalance(collectionAddress: `0x${string}` | undefined, owner: `0x${string}` | undefined) {
  const { data: balance, refetch } = useContractRead({
    address: collectionAddress,
    abi: ERC721_ABI,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    enabled: !!collectionAddress && !!owner,
  })

  return {
    balance: balance ? Number(balance) : 0,
    refetch,
  }
}