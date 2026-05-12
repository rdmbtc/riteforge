"use client"

import { useState, useEffect } from "react"
import { useAccount, useWaitForTransactionReceipt } from "wagmi"
import { Sidebar } from "@/components/sidebar"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Zap, Calendar, Loader2, CheckCircle, ExternalLink, Copy, AlertCircle, History } from "lucide-react"
import { useVesting } from "@/lib/contracts"
import { saveTransaction, getTransactionHistory } from "@/lib/supabase"
import { toast } from "sonner"

export default function VestingPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tokenAddress, setTokenAddress] = useState("")
  const [beneficiary, setBeneficiary] = useState("")
  const [totalAmount, setTotalAmount] = useState("")
  const [cliffMonths, setCliffMonths] = useState("1")
  const [vestingMonths, setVestingMonths] = useState("12")
  const [startDate, setStartDate] = useState("")
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txHistory, setTxHistory] = useState<any[]>([])

  const { isConnected, address } = useAccount()
  const { createVesting, isCreating, txHash: pendingTxHash, error } = useVesting()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  })

  useEffect(() => {
    if (isConfirmed && pendingTxHash) {
      setTxHash(pendingTxHash)
      toast.success("Vesting schedule created!")
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

  useEffect(() => {
    if (address) setBeneficiary(address)
  }, [address])

  const handleCreateVesting = async () => {
    if (!isConnected) {
      toast.error("Connect wallet first")
      return
    }
    if (!tokenAddress || !beneficiary || !totalAmount || !cliffMonths || !vestingMonths || !startDate) {
      toast.error("Fill all required fields")
      return
    }

    setTxHash(null)

    await saveTransaction({
      user_address: address,
      type: 'vesting_create',
      title: `Vesting for ${beneficiary.slice(0, 8)}...`,
      description: `${totalAmount} tokens vesting`,
      amount: totalAmount,
      tx_hash: pendingTxHash || '',
      status: 'pending',
    })
    loadHistory()

    const success = await createVesting({
      token: tokenAddress as `0x${string}`,
      beneficiary: beneficiary as `0x${string}`,
      totalAmount,
      startTime: new Date(startDate),
      cliffDurationMonths: parseInt(cliffMonths),
      vestingDurationMonths: parseInt(vestingMonths),
    })

    if (success) {
      toast.loading("Creating vesting...")
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
              <h1 className="text-xl font-medium text-white tracking-[-0.025em]">Token Vesting</h1>
            </div>
            <ConnectButton />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="border-white/10 bg-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Create Vesting Schedule
                </CardTitle>
                <CardDescription className="text-white/50">
                  Lock tokens for a beneficiary with gradual release over time.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Token Address</label>
                  <input type="text" value={tokenAddress} onChange={e => setTokenAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Beneficiary</label>
                  <input type="text" value={beneficiary} onChange={e => setBeneficiary(e.target.value)}
                    placeholder="0x... (your address)"
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Total Amount</label>
                  <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)}
                    placeholder="10000"
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Start Date</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:border-white/40 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Cliff (months)</label>
                    <input type="number" value={cliffMonths} onChange={e => setCliffMonths(e.target.value)}
                      placeholder="1"
                      className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Vesting (months)</label>
                    <input type="number" value={vestingMonths} onChange={e => setVestingMonths(e.target.value)}
                      placeholder="12"
                      className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                  </div>
                </div>

                <motion.button
                  onClick={handleCreateVesting}
                  disabled={isCreating || isConfirming || !isConnected}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-4 bg-white text-black font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreating || isConfirming ? (
                    <><Loader2 className="h-5 w-5 animate-spin" />{isConfirming ? "Confirming..." : "Creating..."}</>
                  ) : (
                    <><Calendar className="h-5 w-5" />Create Vesting</>
                  )}
                </motion.button>
              </CardContent>
            </Card>

            {(isConfirming || txHash) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-white/10 bg-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      {isConfirming ? <><Loader2 className="h-5 w-5 animate-spin" />Pending</> : <><CheckCircle className="h-5 w-5 text-green-500" />Vesting Created!</>}
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
                    <History className="h-5 w-5" />Recent Vesting
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
