"use client"

import { useState, useEffect } from "react"
import { useAccount, useBalance } from "wagmi"
import { Sidebar } from "@/components/sidebar"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Zap, Coins, ArrowUpRight, RefreshCw, ExternalLink, Copy, Share2, Trophy } from "lucide-react"
import { useUserTokens, useTokenInfo, useTokenBalance } from "@/lib/contracts"
import { getTransactionHistory } from "@/lib/supabase"
import { formatUnits } from "viem"
import { TokenCard } from "@/components/token-card"
import { AnimatePresence, motion } from "framer-motion"

interface TokenBalance {
  address: string
  name: string
  symbol: string
  balance: string
  decimals: number
  txHash?: string
}

function TokenRow({ token }: { token: TokenBalance }) {
  return (
    <TableRow className="border-white/10 hover:bg-white/5">
      <TableCell className="font-medium text-white flex items-center gap-2">
        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
          <Coins className="h-4 w-4 text-blue-400" />
        </div>
        <div>
          <p>{token.name}</p>
          <p className="text-xs text-white/40 font-mono">{token.symbol}</p>
        </div>
      </TableCell>
      <TableCell className="text-white font-mono">{token.balance}</TableCell>
      <TableCell className="text-white font-mono">$0.00</TableCell>
      <TableCell>
        <Badge variant="default" className="font-mono bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20">
          <ArrowUpRight className="h-3 w-3 mr-1" />
          0.0%
        </Badge>
      </TableCell>
    </TableRow>
  )
}

export default function PortfolioPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [txHistory, setTxHistory] = useState<any[]>([])
  const [selectedToken, setSelectedToken] = useState<{name: string; symbol: string; address: string} | null>(null)

  const { address, isConnected } = useAccount()
  const { data: ritualBalance } = useBalance({ address })
  const { tokens: userTokenAddresses } = useUserTokens()

  useEffect(() => {
    if (address) {
      loadTxHistory()
    }
  }, [address])

  const loadTxHistory = async () => {
    setIsLoading(true)
    const history = await getTransactionHistory(address, 20)
    setTxHistory(history)
    setIsLoading(false)
  }

  const totalValue = ritualBalance ? parseFloat(formatUnits(ritualBalance.value, ritualBalance.decimals)) : 0

  // Filter for token creations only
  const tokenCreations = txHistory.filter((tx: any) => tx.type === 'token_create')
  const createdTokens = tokenCreations.map((tx: any) => ({
    address: tx.token_address,
    name: tx.description?.split('Token: ')[1]?.split(' (')[0] || tx.title,
    symbol: tx.title?.replace('Create ', '') || 'UNKNOWN',
    txHash: tx.tx_hash,
  }))

  return (
    <div className="min-h-screen bg-black flex overflow-hidden relative">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white/50 hover:text-white transition-colors lg:hidden"
              >
                <Zap className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-medium text-white tracking-[-0.025em]">Token Portfolio</h1>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={loadTxHistory} className="text-white/50 hover:text-white">
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <ConnectButton />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h2 className="text-2xl font-medium text-white tracking-[-0.025em] mb-1">Your Portfolio</h2>
              <p className="text-sm text-white/50">Track your tokens and NFTs on Ritual Chain.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-white/10 bg-card">
                <CardHeader className="pb-2">
                  <CardDescription className="text-white/50">Total Value</CardDescription>
                  <CardTitle className="text-white text-2xl font-bold">${totalValue.toFixed(2)}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-white/10 bg-card">
                <CardHeader className="pb-2">
                  <CardDescription className="text-white/50">Tokens Created</CardDescription>
                  <CardTitle className="text-white text-2xl font-bold">{userTokenAddresses.length + createdTokens.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-white/10 bg-card">
                <CardHeader className="pb-2">
                  <CardDescription className="text-white/50">NFTs</CardDescription>
                  <CardTitle className="text-white text-2xl font-bold">0</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card className="border-white/10 bg-card">
              <CardHeader>
                <CardTitle className="text-white text-base">Assets</CardTitle>
              </CardHeader>
              <CardContent>
                {!isConnected ? (
                  <div className="text-center py-8 text-white/50">
                    Connect your wallet to view your portfolio
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="border-white/10">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-white/50">Asset</TableHead>
                        <TableHead className="text-white/50">Balance</TableHead>
                        <TableHead className="text-white/50">Value</TableHead>
                        <TableHead className="text-white/50">Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Native RITUAL */}
                      {ritualBalance && (
                        <TableRow className="border-white/10 hover:bg-white/5">
                          <TableCell className="font-medium text-white flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                              <Coins className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p>Ritual</p>
                              <p className="text-xs text-white/40 font-mono">RITUAL</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-white font-mono">
                            {formatUnits(ritualBalance.value, ritualBalance.decimals)}
                          </TableCell>
                          <TableCell className="text-white font-mono">$0.00</TableCell>
                          <TableCell>
                            <Badge variant="default" className="font-mono bg-emerald-500/20 text-emerald-400">
                              <ArrowUpRight className="h-3 w-3 mr-1" />
                              0.0%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )}
                      {/* On-chain tokens */}
                      {userTokenAddresses.map((tokenAddress: `0x${string}`) => (
                        <TokenWithBalance key={tokenAddress} address={address} tokenAddress={tokenAddress} />
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Transaction History Card */}
            {txHistory.length > 0 && (
              <Card className="border-white/10 bg-card">
                <CardHeader>
                  <CardTitle className="text-white text-base">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {txHistory.slice(0, 10).map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${tx.status === 'confirmed' ? 'bg-green-500' : tx.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                          <div>
                            <p className="text-white text-sm font-medium">{tx.title}</p>
                            {tx.tx_hash && (
                              <p className="text-white/40 text-xs font-mono">
                                {tx.tx_hash.slice(0, 10)}...{tx.tx_hash.slice(-8)}
                                <button onClick={() => navigator.clipboard.writeText(tx.tx_hash)} className="ml-1 hover:text-white">
                                  <Copy className="h-3 w-3 inline" />
                                </button>
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant={tx.status === 'confirmed' ? 'default' : 'secondary'} className={tx.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                          {tx.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TokenWithBalance({ address, tokenAddress }: { address: `0x${string}`; tokenAddress: `0x${string}` }) {
  const { name, symbol } = useTokenInfo(tokenAddress)
  const { balance, formatted } = useTokenBalance(tokenAddress, address)

  if (!balance) return null

  return (
    <>
      <TableRow className="border-white/10 hover:bg-white/5">
        <TableCell className="font-medium text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
            <Coins className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <p>{name || "Unknown Token"}</p>
            <p className="text-xs text-white/40 font-mono">{symbol || tokenAddress.slice(0, 8)}...</p>
          </div>
        </TableCell>
        <TableCell className="text-white font-mono">{formatted}</TableCell>
        <TableCell className="text-white font-mono">$0.00</TableCell>
        <TableCell className="flex items-center gap-2">
          <Badge variant="default" className="font-mono bg-emerald-500/20 text-emerald-400">
            <ArrowUpRight className="h-3 w-3 mr-1" />
            0.0%
          </Badge>
          <button
            onClick={() => setSelectedToken({ name: name || "Token", symbol: symbol || "TKN", address: tokenAddress })}
            className="p-2 text-white/50 hover:text-white transition-colors"
            title="Share Token"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </TableCell>
      </TableRow>

      <AnimatePresence>
        {selectedToken && selectedToken.address === tokenAddress && (
          <TableRow>
            <TableCell colSpan={4} className="p-4 bg-black/50">
              <div className="flex justify-center">
                <TokenCard
                  tokenName={selectedToken.name}
                  symbol={selectedToken.symbol}
                  supply={formatted}
                  decimals="18"
                  tokenAddress={selectedToken.address}
                  creatorAddress={address}
                />
              </div>
            </TableCell>
          </TableRow>
        )}
      </AnimatePresence>
    </>
  )
}
