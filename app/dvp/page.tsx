"use client"

import { useState, useEffect } from "react"
import { useAccount, useWaitForTransactionReceipt } from "wagmi"
import { Sidebar } from "@/components/sidebar"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Zap, Shuffle, Loader2, CheckCircle, ExternalLink, Copy, AlertCircle, History } from "lucide-react"
import { useDvpSwap } from "@/lib/contracts"
import { saveTransaction, getTransactionHistory } from "@/lib/supabase"
import { toast } from "sonner"

export default function DvpPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tokenYouGive, setTokenYouGive] = useState("")
  const [amountYouGive, setAmountYouGive] = useState("")
  const [tokenYouReceive, setTokenYouReceive] = useState("")
  const [amountYouReceive, setAmountYouReceive] = useState("")
  const [counterparty, setCounterparty] = useState("")
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txHistory, setTxHistory] = useState<any[]>([])

  const { isConnected, address } = useAccount()
  const { createSwap, isCreating, txHash: pendingTxHash, error } = useDvpSwap()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  })

  useEffect(() => {
    if (isConfirmed && pendingTxHash) {
      setTxHash(pendingTxHash)
      toast.success("DvP swap created! Share swap ID with counterparty.")
      setTokenYouGive("")
      setAmountYouGive("")
      setTokenYouReceive("")
      setAmountYouReceive("")
      setCounterparty("")
    }
  }, [isConfirmed, pendingTxHash])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  useEffect(() => {
    if (address) loadHistory()
  }, [address])

  const loadHistory = async () => {
    if (!address) return
    const history = await getTransactionHistory(address, 10)
    setTxHistory(history)
  }

  const handleCreateSwap = async () => {
    if (!isConnected) {
      toast.error("Connect wallet first")
      return
    }
    if (!tokenYouGive || !amountYouGive || !tokenYouReceive || !amountYouReceive || !counterparty) {
      toast.error("Fill all required fields")
      return
    }

    setTxHash(null)

    await saveTransaction({
      user_address: address,
      type: 'dvp_swap',
      title: `Swap ${amountYouGive} for ${amountYouReceive}`,
      description: `With ${counterparty.slice(0, 10)}...`,
      amount: amountYouGive,
      tx_hash: pendingTxHash || '',
      status: 'pending',
    })
    loadHistory()

    const success = await createSwap({
      partyB: counterparty as `0x${string}`,
      tokenA: tokenYouGive as `0x${string}`,
      amountA: amountYouGive,
      tokenB: tokenYouReceive as `0x${string}`,
      amountB: amountYouReceive,
    })

    if (success) {
      toast.loading("Creating DvP swap...")
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
              <h1 className="text-xl font-medium text-white tracking-[-0.025em]">Delivery vs Payment (DvP)</h1>
            </div>
            <ConnectButton />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="border-white/10 bg-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shuffle className="h-5 w-5" />
                  Create Atomic Swap
                </CardTitle>
                <CardDescription className="text-white/50">
                  Exchange tokens with another party. Both must confirm for atomic settlement.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-white/70 uppercase">You Give</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Token Address</label>
                      <input type="text" value={tokenYouGive} onChange={e => setTokenYouGive(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Amount</label>
                      <input type="number" value={amountYouGive} onChange={e => setAmountYouGive(e.target.value)}
                        placeholder="100"
                        className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-center py-2">
                  <Shuffle className="h-6 w-6 text-white/30" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-white/70 uppercase">You Receive</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Token Address</label>
                      <input type="text" value={tokenYouReceive} onChange={e => setTokenYouReceive(e.target.value)}
                        placeholder="0x..."
                        className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Amount</label>
                      <input type="number" value={amountYouReceive} onChange={e => setAmountYouReceive(e.target.value)}
                        placeholder="100"
                        className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Counterparty Address</label>
                  <input type="text" value={counterparty} onChange={e => setCounterparty(e.target.value)}
                    placeholder="0x... (who you swap with)"
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                </div>

                <motion.button
                  onClick={handleCreateSwap}
                  disabled={isCreating || isConfirming || !isConnected}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-4 bg-white text-black font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreating || isConfirming ? (
                    <><Loader2 className="h-5 w-5 animate-spin" />{isConfirming ? "Confirming..." : "Creating..."}</>
                  ) : (
                    <><Shuffle className="h-5 w-5" />Create Swap</>
                  )}
                </motion.button>
              </CardContent>
            </Card>

            {(isConfirming || txHash) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-white/10 bg-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      {isConfirming ? <><Loader2 className="h-5 w-5 animate-spin" />Pending</> : <><CheckCircle className="h-5 w-5 text-green-500" />Swap Created!</>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {txHash && (
                      <div className="p-4 bg-black/50 rounded-lg border border-white/10">
                        <p className="text-xs text-white/50 uppercase mb-2">Transaction Hash</p>
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
                    <History className="h-5 w-5" />Recent Swaps
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

            <Card className="border-blue-500/30 bg-blue-500/10">
              <CardContent className="p-4">
                <div className="flex items-start gap-2 text-blue-400">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">How DvP Works:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-300/70">
                      <li>You create swap and deposit your tokens</li>
                      <li>Share the swap ID with your counterparty</li>
                      <li>Counterparty confirms to complete atomic exchange</li>
                      <li>Both parties receive tokens simultaneously</li>
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
