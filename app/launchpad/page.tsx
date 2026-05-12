"use client"

import { useState, useEffect } from "react"
import { useAccount, useWaitForTransactionReceipt } from "wagmi"
import { Sidebar } from "@/components/sidebar"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Zap, Rocket, Loader2, CheckCircle, ExternalLink, Copy, AlertCircle, TrendingUp, History } from "lucide-react"
import { useLaunchpad } from "@/lib/contracts"
import { saveTransaction, getTransactionHistory } from "@/lib/supabase"
import { toast } from "sonner"

export default function LaunchpadPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tokenAddress, setTokenAddress] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [totalTokens, setTotalTokens] = useState("")
  const [softCap, setSoftCap] = useState("")
  const [hardCap, setHardCap] = useState("")
  const [minContribution, setMinContribution] = useState("10")
  const [maxContribution, setMaxContribution] = useState("1000")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txHistory, setTxHistory] = useState<any[]>([])

  const { isConnected, address } = useAccount()
  const { createSale, isCreating, txHash: pendingTxHash, error } = useLaunchpad()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  })

  useEffect(() => {
    if (isConfirmed && pendingTxHash) {
      setTxHash(pendingTxHash)
      toast.success("Token sale created!")
    }
  }, [isConfirmed, pendingTxHash])

  useEffect(() => {
    if (address) loadHistory()
  }, [address])

  const loadHistory = async () => {
    if (!address) return
    const history = await getTransactionHistory(address, 10)
    setTxHistory(history)
  }

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const handleCreateSale = async () => {
    if (!isConnected) {
      toast.error("Connect wallet first")
      return
    }
    if (!tokenAddress || !salePrice || !totalTokens || !softCap || !hardCap || !startTime || !endTime) {
      toast.error("Fill all required fields")
      return
    }

    setTxHash(null)

    await saveTransaction({
      user_address: address,
      type: 'launchpad_create',
      title: `Sale ${totalTokens} tokens`,
      description: `Hard cap: ${hardCap} RITUAL`,
      amount: totalTokens,
      tx_hash: pendingTxHash || '',
      status: 'pending',
    })
    loadHistory()

    const success = await createSale({
      token: tokenAddress as `0x${string}`,
      price: salePrice,
      totalTokens,
      softCap,
      hardCap,
      minContribution: minContribution || "10",
      maxContribution: maxContribution || "1000",
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    })

    if (success) {
      toast.loading("Creating sale...")
    }
  }

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr)
    toast.success("Copied!")
  }

  return (
    <div className="min-h-screen bg-black flex overflow-hidden relative">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/50 hover:text-white transition-colors lg:hidden">
                <Zap className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-medium text-white tracking-[-0.025em]">Create Token Sale</h1>
            </div>
            <ConnectButton />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="border-white/10 bg-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Launchpad Sale
                </CardTitle>
                <CardDescription className="text-white/50">
                  Create a token sale for your community. Set pricing, caps, and timing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Token Contract</label>
                  <input type="text" value={tokenAddress} onChange={e => setTokenAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Sale Price (RITUAL)</label>
                    <input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)}
                      placeholder="0.01"
                      className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Tokens for Sale</label>
                    <input type="number" value={totalTokens} onChange={e => setTotalTokens(e.target.value)}
                      placeholder="1000000"
                      className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Soft Cap (RITUAL)</label>
                    <input type="number" value={softCap} onChange={e => setSoftCap(e.target.value)}
                      placeholder="100"
                      className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Hard Cap (RITUAL)</label>
                    <input type="number" value={hardCap} onChange={e => setHardCap(e.target.value)}
                      placeholder="1000"
                      className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Min Contribution</label>
                    <input type="number" value={minContribution} onChange={e => setMinContribution(e.target.value)}
                      placeholder="10"
                      className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Max Contribution</label>
                    <input type="number" value={maxContribution} onChange={e => setMaxContribution(e.target.value)}
                      placeholder="1000"
                      className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Start Time</label>
                    <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)}
                      className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:border-white/40 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">End Time</label>
                    <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)}
                      className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:border-white/40 outline-none" />
                  </div>
                </div>

                <div className="p-4 bg-black/50 rounded-lg border border-white/10">
                  <div className="flex justify-between mb-2">
                    <span className="text-white/50">Platform Fee</span>
                    <Badge variant="secondary" className="bg-white/10 text-white/70">1%</Badge>
                  </div>
                </div>

                <motion.button
                  onClick={handleCreateSale}
                  disabled={isCreating || isConfirming || !isConnected}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-4 bg-white text-black font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreating || isConfirming ? (
                    <><Loader2 className="h-5 w-5 animate-spin" />{isConfirming ? "Confirming..." : "Creating..."}</>
                  ) : (
                    <><Rocket className="h-5 w-5" />Create Sale</>
                  )}
                </motion.button>
              </CardContent>
            </Card>

            {(isConfirming || txHash) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-white/10 bg-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      {isConfirming ? <><Loader2 className="h-5 w-5 animate-spin" />Pending</> : <><CheckCircle className="h-5 w-5 text-green-500" />Sale Created!</>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {txHash && (
                      <div className="p-4 bg-black/50 rounded-lg border border-white/10">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-mono text-sm break-all">{txHash}</p>
                          <button onClick={() => copyAddress(txHash)} className="text-white/50 hover:text-white"><Copy className="h-4 w-4" /></button>
                          <a href={`https://explorer.ritualfoundation.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white"><ExternalLink className="h-4 w-4" /></a>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
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

            {txHistory.length > 0 && (
              <Card className="border-white/10 bg-card">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <History className="h-5 w-5" />Recent Sales
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
                            <p className="text-white/50 text-xs">{new Date(tx.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className="text-xs text-white/50">{tx.status}</span>
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
