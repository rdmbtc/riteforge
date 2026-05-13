"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { useWaitForTransactionReceipt } from "wagmi"
import { Sidebar } from "@/components/sidebar"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Zap, Loader2, Coins, CheckCircle, ExternalLink, Copy, AlertCircle, Clock, History, Share2 } from "lucide-react"
import { useMasterToken } from "@/lib/contracts"
import { saveTransaction, updateTransactionStatus, getTransactionHistory, updateTransactionTokenAddress } from "@/lib/supabase"
import { toast } from "sonner"
import { TokenCard, CardDesignSelector } from "@/components/card-selector"

export default function CreateCorePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tokenName, setTokenName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [supply, setSupply] = useState("")
  const [decimals, setDecimals] = useState("18")

  const [advancedName, setAdvancedName] = useState("")
  const [advancedSymbol, setAdvancedSymbol] = useState("")
  const [advancedSupply, setAdvancedSupply] = useState("")
  const [advancedDecimals, setAdvancedDecimals] = useState("18")

  const [localCreatedTokenAddress, setLocalCreatedTokenAddress] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [txHistory, setTxHistory] = useState<any[]>([])
  const [showCard, setShowCard] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [selectedDesign, setSelectedDesign] = useState("glass")

  const { isConnected, address } = useAccount()
  const { createToken, isCreating, txHash: pendingTxHash, createdTokenAddress, error } = useMasterToken()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  })

  // Update transaction with token address when confirmed
  useEffect(() => {
    if (createdTokenAddress && pendingId) {
      updateTransactionTokenAddress(pendingId, createdTokenAddress)
    }
  }, [createdTokenAddress, pendingId])

  useEffect(() => {
    if (address) {
      loadHistory()
    }
  }, [address])

  useEffect(() => {
    if (isConfirmed && pendingTxHash && address) {
      setTxHash(pendingTxHash)
      if (createdTokenAddress) {
        setLocalCreatedTokenAddress(createdTokenAddress)
      }
      toast.success(`${symbol || "Token"} created successfully!`)
      loadHistory()
      setShowCard(true)
    }
  }, [isConfirmed, pendingTxHash, address, createdTokenAddress])

  useEffect(() => {
    if (error) {
      toast.error(error)
    }
  }, [error])

  const loadHistory = async () => {
    if (!address) return
    const history = await getTransactionHistory(address, 10)
    setTxHistory(history)
  }

  const handleCreateToken = async (e: React.MouseEvent, type: "core" | "advanced") => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!isConnected || !address) {
      toast.error("Connect wallet first")
      return
    }

    let name = tokenName
    let sym = symbol
    let sup = supply
    let dec = parseInt(decimals) || 18

    if (type === "advanced") {
      name = advancedName
      sym = advancedSymbol
      sup = advancedSupply
      dec = parseInt(advancedDecimals) || 18
    }

    if (!name || !sym || !sup) {
      toast.error("Fill all required fields")
      return
    }

    setLocalCreatedTokenAddress(null)

    // Save pending tx to history
    const newPendingId = crypto.randomUUID()
    setPendingId(newPendingId)
    await saveTransaction({
      id: newPendingId,
      user_address: address,
      type: 'token_create',
      title: `Create ${sym.toUpperCase()}`,
      description: `Token: ${name} (${sym.toUpperCase()})`,
      amount: sup,
      tx_hash: pendingTxHash || '',
      status: 'pending',
    })
    loadHistory()

    const success = await createToken({
      name,
      symbol: sym.toUpperCase(),
      decimals: dec,
      initialSupply: sup,
    })

    if (success) {
      toast.loading("Waiting for confirmation...")
    }
  }

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr)
    toast.success("Copied!")
  }

  const explorerUrl = `https://explorer.ritualfoundation.org/tx/`

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

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
              <h1 className="text-xl font-medium text-white tracking-[-0.025em]">Create Token</h1>
            </div>
            <ConnectButton />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <Tabs defaultValue="core" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/5">
                <TabsTrigger value="core" className="data-[state=active]:bg-white data-[state=active]:text-black">Core Token</TabsTrigger>
                <TabsTrigger value="advanced" className="data-[state=active]:bg-white data-[state=active]:text-black">Advanced Token</TabsTrigger>
              </TabsList>

              {/* Core Token */}
              <TabsContent value="core" className="mt-6">
                <Card className="border-white/10 bg-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Coins className="h-5 w-5" />
                      Basic ERC-20 Token
                    </CardTitle>
                    <CardDescription className="text-white/50">
                      Simple token with standard ERC-20 functionality
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Token Name</label>
                        <input
                          type="text"
                          value={tokenName}
                          onChange={e => setTokenName(e.target.value)}
                          placeholder="My Token"
                          className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Symbol</label>
                        <input
                          type="text"
                          value={symbol}
                          onChange={e => setSymbol(e.target.value)}
                          placeholder="MTK"
                          className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none uppercase"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Initial Supply</label>
                        <input
                          type="number"
                          value={supply}
                          onChange={e => setSupply(e.target.value)}
                          placeholder="1000000"
                          className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Decimals</label>
                        <input
                          type="number"
                          value={decimals}
                          onChange={e => setDecimals(e.target.value)}
                          placeholder="18"
                          className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none"
                        />
                      </div>
                    </div>

                    <motion.button
                      onClick={() => setShowDemo(true)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full px-6 py-3 bg-white/10 text-white font-medium rounded-lg border border-white/20 hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                    >
                      Preview Share Card
                    </motion.button>

                    <div className="mt-4">
                      <p className="text-xs text-white/50 uppercase tracking-wider mb-2">Card Design</p>
                      <CardDesignSelector selected={selectedDesign} onSelect={setSelectedDesign} />
                    </div>

                    <motion.button
                      type="button"
                      onClick={(e) => handleCreateToken(e, "core")}
                      disabled={isCreating || isConfirming || !isConnected}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mt-4 px-6 py-4 bg-white text-black font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isCreating || isConfirming ? (
                        <><Loader2 className="h-5 w-5 animate-spin" />{isConfirming ? "Confirming..." : "Creating..."}</>
                      ) : (
                        <><Coins className="h-5 w-5" />Create Token</>
                      )}
                    </motion.button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Advanced Token */}
              <TabsContent value="advanced" className="mt-6">
                <Card className="border-white/10 bg-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Coins className="h-5 w-5" />
                      Advanced ERC-20 Token
                    </CardTitle>
                    <CardDescription className="text-white/50">
                      Token with mintable, burnable, and pausable options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Token Name</label>
                        <input
                          type="text"
                          value={advancedName}
                          onChange={e => setAdvancedName(e.target.value)}
                          placeholder="My Advanced Token"
                          className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Symbol</label>
                        <input
                          type="text"
                          value={advancedSymbol}
                          onChange={e => setAdvancedSymbol(e.target.value)}
                          placeholder="ADVMTK"
                          className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none uppercase"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Initial Supply</label>
                        <input
                          type="number"
                          value={advancedSupply}
                          onChange={e => setAdvancedSupply(e.target.value)}
                          placeholder="1000000"
                          className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Decimals</label>
                        <input
                          type="number"
                          value={advancedDecimals}
                          onChange={e => setAdvancedDecimals(e.target.value)}
                          placeholder="18"
                          className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none"
                        />
                      </div>
                    </div>

                    <motion.button
                      type="button"
                      onClick={(e) => handleCreateToken(e, "advanced")}
                      disabled={isCreating || isConfirming || !isConnected}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mt-4 px-6 py-4 bg-white text-black font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isCreating || isConfirming ? (
                        <><Loader2 className="h-5 w-5 animate-spin" />{isConfirming ? "Confirming..." : "Creating..."}</>
                      ) : (
                        <><Coins className="h-5 w-5" />Create Advanced Token</>
                      )}
                    </motion.button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Transaction Result */}
            {(isConfirming || txHash) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-white/10 bg-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      {isConfirming ? (
                        <><Loader2 className="h-5 w-5 animate-spin" />Transaction Pending</>
                      ) : (
                        <><CheckCircle className="h-5 w-5 text-green-500" />Token Created!</>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {txHash && (
                      <>
                        <div className="p-4 bg-black/50 rounded-lg border border-white/10">
                          <p className="text-xs text-white/50 uppercase mb-1">Transaction Hash</p>
                          <div className="flex items-center gap-2">
                            <p className="text-white font-mono text-sm break-all">{txHash}</p>
                            <button onClick={() => copyAddress(txHash)} className="text-white/50 hover:text-white">
                              <Copy className="h-4 w-4" />
                            </button>
                            <a href={`${explorerUrl}${txHash}`} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                        {createdTokenAddress && (
                          <div className="p-4 bg-black/50 rounded-lg border border-green-500/20">
                            <p className="text-xs text-green-400 uppercase mb-1">Token Address</p>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-mono text-sm break-all">{createdTokenAddress}</p>
                              <button onClick={() => copyAddress(createdTokenAddress)} className="text-white/50 hover:text-white">
                                <Copy className="h-4 w-4" />
                              </button>
                              <a href={`https://explorer.ritualfoundation.org/address/${createdTokenAddress}`} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </div>
                          </div>
                        )}
                        <p className="text-sm text-white/50">
                          {isConfirming ? "Waiting for transaction confirmation on Ritual Chain..." : "Token deployed! Check your portfolio to view your tokens."}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Share Card Section */}
            {showCard && !isConfirming && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white mb-2">Share Your Token</h3>
                  <p className="text-sm text-white/50">Show off your new token to the world</p>
                </div>
                <TokenCard
                  tokenName={tokenName || advancedName || "Token"}
                  symbol={symbol || advancedSymbol || "TKN"}
                  supply={supply || advancedSupply || "1000"}
                  decimals={decimals || advancedDecimals || "18"}
                  tokenAddress={localCreatedTokenAddress || "0xDemo0000000000000000000000000000000001"}
                  creatorAddress={address || "0xCreator0000000000000000000000000000001"}
                  design={selectedDesign as any}
                />
              </motion.div>
            )}

            {/* Demo Card Section - Always visible for testing */}
            {showDemo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white mb-2">Demo Preview</h3>
                  <p className="text-sm text-white/50">This is how your card will look after creating a token</p>
                </div>
                <TokenCard
                  tokenName={tokenName || "YourTokenName"}
                  symbol={symbol || "YTN"}
                  supply={supply || "1000000"}
                  decimals={decimals || "18"}
                  tokenAddress="0xDemo0000000000000000000000000000000001"
                  creatorAddress={address || "0xCreator0000000000000000000000000000001"}
                  design={selectedDesign as any}
                />
                <div className="text-center">
                  <button
                    onClick={() => setShowDemo(false)}
                    className="text-white/50 text-sm hover:text-white"
                  >
                    Close Preview
                  </button>
                </div>
              </motion.div>
            )}

            {error && (
              <Card className="border-red-500/30 bg-red-500/10">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Transaction History */}
            {txHistory.length > 0 && (
              <Card className="border-white/10 bg-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <History className="h-5 w-5" />Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {txHistory.slice(0, 5).map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${tx.status === 'confirmed' ? 'bg-green-500' : tx.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                          <div>
                            <p className="text-white text-sm font-medium">{tx.title}</p>
                            <p className="text-white/50 text-xs">{formatTime(tx.created_at)}</p>
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
