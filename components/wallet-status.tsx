"use client"

import { useAccount, useConnect, useDisconnect } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useState } from "react"

export function WalletStatus() {
  return (
    <ConnectButton
      chainStatus="icon"
      accountStatus="address"
      showRecentTransactions={true}
    />
  )
}

export function useWallet() {
  const { address, isConnected, isConnecting } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  return {
    address,
    isConnected,
    isConnecting: isConnecting || isPending,
    connect,
    connectors,
    disconnect,
  }
}