import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { defineChain } from 'viem'
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  injectedWallet,
  okxWallet,
  trustWallet,
} from '@rainbow-me/rainbowkit/wallets'

// Define Ritual Testnet
export const ritualTestnet = defineChain({
  id: 1979,
  name: 'Ritual Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ritual',
    symbol: 'RITUAL',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RITUAL_RPC_URL || 'https://rpc.ritualfoundation.org'],
      webSocket: [process.env.NEXT_PUBLIC_RITUAL_WS_URL || 'wss://rpc.ritualfoundation.org/ws'],
    },
    public: {
      http: ['https://rpc.ritualfoundation.org'],
      webSocket: ['wss://rpc.ritualfoundation.org/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Ritual Explorer',
      url: 'https://explorer.ritualfoundation.org',
    },
  },
  contracts: {
    multicall3: {
      address: '0x5577Ea679673Ec7508E9524100a188E7600202a3',
      blockCreated: 0,
    },
  },
  testnet: true,
})

export const config = getDefaultConfig({
  appName: 'RiteForge - AI Smart Contract Generator',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [ritualTestnet],
  wallets: [
    {
      groupName: 'Popular',
      wallets: [
        metaMaskWallet,
        walletConnectWallet,
        coinbaseWallet,
        okxWallet,
        trustWallet,
        injectedWallet,
      ],
    },
  ],
  transports: {
    [ritualTestnet.id]: http(process.env.NEXT_PUBLIC_RITUAL_RPC_URL || 'https://rpc.ritualfoundation.org', {
      batch: {
        wait: 100,
      },
      retryCount: 5,
      timeout: 30_000,
    }),
  },
  ssr: true,
})
