"use client"

import { useState, useEffect } from "react"
import { useAccount, useWaitForTransactionReceipt } from "wagmi"
import { Sidebar } from "@/components/sidebar"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { Zap, Shield, Lock, Loader2, CheckCircle, ExternalLink, Copy, AlertCircle, Coins, History } from "lucide-react"
import { useTokenAdmin } from "@/lib/contracts"
import { saveTransaction, getTransactionHistory } from "@/lib/supabase"
import { toast } from "sonner"

export default function ManagePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedToken, setSelectedToken] = useState("")
  const [mintRecipient, setMintRecipient] = useState("")
  const [mintAmount, setMintAmount] = useState("")
  const [burnAmount, setBurnAmount] = useState("")
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txHistory, setTxHistory] = useState<any[]>([])

  const { isConnected, address } = useAccount()
  const { mintTokens, burnTokens, isProcessing, txHash: pendingTxHash, error } = useTokenAdmin()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  })

  useEffect(() => {
    if (isConfirmed && pendingTxHash) {
      setTxHash(pendingTxHash)
      toast.success("Transaction successful!")
    }
  }, [isConfirmed, pendingTxHash])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  useEffect(() => {
    if (address) setMintRecipient(address)
  }, [address])

  useEffect(() => {
    if (address) loadHistory()
  }, [address])

  const loadHistory = async () => {
    if (!address) return
    const history = await getTransactionHistory(address, 10)
    setTxHistory(history)
  }

  const handleMint = async () => {
    if (!isConnected) {
      toast.error("Connect wallet first")
      return
    }
    if (!selectedToken || !mintRecipient || !mintAmount) {
      toast.error("Fill all required fields")
      return
    }

    setTxHash(null)

    await saveTransaction({
      user_address: address,
      type: 'airdrop',
      title: `Mint ${mintAmount} tokens`,
      description: `To: ${mintRecipient.slice(0, 10)}...`,
      amount: mintAmount,
      tx_hash: pendingTxHash || '',
      status: 'pending',
    })
    loadHistory()

    const success = await mintTokens({
      token: selectedToken as `0x${string}`,
      to: mintRecipient as `0x${string}`,
      amount: mintAmount,
    })

    if (success) {
      toast.loading("Minting tokens...")
    }
  }

  const handleBurn = async () => {
    if (!isConnected) {
      toast.error("Connect wallet first")
      return
    }
    if (!selectedToken || !burnAmount) {
      toast.error("Fill all required fields")
      return
    }

    setTxHash(null)

    await saveTransaction({
      user_address: address,
      type: 'airdrop',
      title: `Burn ${burnAmount} tokens`,
      description: `From: ${selectedToken.slice(0, 10)}...`,
      amount: burnAmount,
      tx_hash: pendingTxHash || '',
      status: 'pending',
    })
    loadHistory()

    const success = await burnTokens({
      token: selectedToken as `0x${string}`,
      amount: burnAmount,
    })

    if (success) {
      toast.loading("Burning tokens...")
    }
  }

  const handleMultisend = async () => {
    if (!isConnected) {
      toast.error("Connect wallet first")
      return
    }
    toast.loading("Use Airdrop page for batch transfers")
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
              <h1 className="text-xl font-medium text-white tracking-[-0.025em]">Manage Token</h1>
            </div>
            <ConnectButton />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Token Address</label>
              <input type="text" value={selectedToken} onChange={e => setSelectedToken(e.target.value)}
                placeholder="0x... (token you created)"
                className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
            </div>

            <Card className="border-white/10 bg-card">
              <CardContent className="p-4">
                <div className="flex items-start gap-2 text-white/50">
                  <AlertCircle className="h-5 w-5 mt-0.5" />
                  <p className="text-sm">Only tokens you created via RiteForge can be managed here. Minting/burning requires owner privileges.</p>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="mint" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-white/5">
                <TabsTrigger value="mint" className="data-[state=active]:bg-white data-[state=active]:text-black">Mint</TabsTrigger>
                <TabsTrigger value="burn" className="data-[state=active]:bg-white data-[state=active]:text-black">Burn</TabsTrigger>
                <TabsTrigger value="multisend" className="data-[state=active]:bg-white data-[state=active]:text-black">Multisend</TabsTrigger>
              </TabsList>

              <TabsContent value="mint" className="mt-6">
                <Card className="border-white/10 bg-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2"><Coins className="h-5 w-5" />Mint Tokens</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-xs text-white/50 uppercase mb-1 block">Recipient</label>
                      <input type="text" value={mintRecipient} onChange={e => setMintRecipient(e.target.value)}
                        placeholder="0x... (your address)"
                        className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-white/50 uppercase mb-1 block">Amount</label>
                      <input type="number" value={mintAmount} onChange={e => setMintAmount(e.target.value)}
                        placeholder="1000"
                        className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                    </div>
                    <motion.button onClick={handleMint}
                      disabled={isProcessing || isConfirming || !isConnected || !selectedToken || !mintAmount}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full px-6 py-4 bg-white text-black font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                      {isProcessing || isConfirming ? (
                        <><Loader2 className="h-5 w-5 animate-spin" />{isConfirming ? "Confirming..." : "Minting..."}</>
                      ) : (
                        <><Coins className="h-5 w-5" />Mint Tokens</>
                      )}
                    </motion.button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="burn" className="mt-6">
                <Card className="border-white/10 bg-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2"><Shield className="h-5 w-5" />Burn Tokens</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-xs text-white/50 uppercase mb-1 block">Amount to Burn</label>
                      <input type="number" value={burnAmount} onChange={e => setBurnAmount(e.target.value)}
                        placeholder="100"
                        className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                    </div>
                    <motion.button onClick={handleBurn}
                      disabled={isProcessing || isConfirming || !isConnected || !selectedToken || !burnAmount}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full px-6 py-4 bg-white text-black font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                      {isProcessing || isConfirming ? (
                        <><Loader2 className="h-5 w-5 animate-spin" />{isConfirming ? "Confirming..." : "Burning..."}</>
                      ) : (
                        <><Shield className="h-5 w-5" />Burn Tokens</>
                      )}
                    </motion.button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="multisend" className="mt-6">
                <Card className="border-white/10 bg-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2"><Coins className="h-5 w-5" />Batch Transfer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-white/50">Use the Airdrop page for batch transfers to multiple recipients.</p>
                    <motion.button onClick={() => window.location.href = '/airdrop'}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="w-full px-6 py-4 bg-white text-black font-bold rounded-lg flex items-center justify-center gap-2">
                      <Coins className="h-5 w-5" />Go to Airdrop
                    </motion.button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {(isConfirming || txHash) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-white/10 bg-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      {isConfirming ? <><Loader2 className="h-5 w-5 animate-spin" />Pending</> : <><CheckCircle className="h-5 w-5 text-green-500" />Success!</>}
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
                    <History className="h-5 w-5" />Recent Mint/Burn
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
