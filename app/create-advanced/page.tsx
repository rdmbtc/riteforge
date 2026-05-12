"use client"

import { useState, useEffect } from "react"
import { useAccount, useWaitForTransactionReceipt } from "wagmi"
import { Sidebar } from "@/components/sidebar"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Bot, Zap, Loader2, Code, CheckCircle, ExternalLink, Copy, AlertCircle } from "lucide-react"
import { useMasterToken } from "@/lib/contracts"
import { toast } from "sonner"

export default function CreateAdvancedPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tokenName, setTokenName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [supply, setSupply] = useState("")
  const [decimals, setDecimals] = useState("18")
  const [enableMint, setEnableMint] = useState(true)
  const [enableBurn, setEnableBurn] = useState(true)
  const [enablePause, setEnablePause] = useState(true)
  const [enableFee, setEnableFee] = useState(false)
  const [transferFee, setTransferFee] = useState("0")
  const [txHash, setTxHash] = useState<string | null>(null)

  const { isConnected } = useAccount()
  const { createToken, isCreating, txHash: pendingTxHash, error } = useMasterToken()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  })

  useEffect(() => {
    if (isConfirmed && pendingTxHash) {
      setTxHash(pendingTxHash)
      toast.success("Advanced token created!")
    }
  }, [isConfirmed, pendingTxHash])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const handleCreate = async () => {
    if (!isConnected) {
      toast.error("Connect wallet first")
      return
    }
    if (!tokenName || !symbol || !supply) {
      toast.error("Fill all required fields")
      return
    }

    setTxHash(null)
    const success = await createToken({
      name: tokenName,
      symbol: symbol.toUpperCase(),
      decimals: parseInt(decimals) || 18,
      initialSupply: supply,
      features: {
        mintable: enableMint,
        burnable: enableBurn,
        pausable: enablePause,
        fee: enableFee ? parseInt(transferFee) : 0,
      },
    })

    if (success) {
      toast.loading("Confirming transaction...")
    }
  }

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr)
    toast.success("Copied!")
  }

  const explorerUrl = `https://explorer.ritualfoundation.org/tx/`

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
              <h1 className="text-xl font-medium text-white tracking-[-0.025em]">Create Advanced Token</h1>
            </div>
            <ConnectButton />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="border-white/10 bg-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  Advanced Token Options
                </CardTitle>
                <CardDescription className="text-white/50">
                  Configure minting, burning, pause, and fee options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Token Name</label>
                    <input type="text" value={tokenName} onChange={e => setTokenName(e.target.value)} placeholder="My Advanced Token"
                      className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Symbol</label>
                    <input type="text" value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="ADVMTK"
                      className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none uppercase" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Initial Supply</label>
                    <input type="number" value={supply} onChange={e => setSupply(e.target.value)} placeholder="1000000"
                      className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Decimals</label>
                    <input type="number" value={decimals} onChange={e => setDecimals(e.target.value)} placeholder="18"
                      className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider">Features</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-white">Mintable</span>
                    <input type="checkbox" checked={enableMint} onChange={e => setEnableMint(e.target.checked)} className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">Burnable</span>
                    <input type="checkbox" checked={enableBurn} onChange={e => setEnableBurn(e.target.checked)} className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">Pausable</span>
                    <input type="checkbox" checked={enablePause} onChange={e => setEnablePause(e.target.checked)} className="w-5 h-5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">Transfer Fee</span>
                    <input type="checkbox" checked={enableFee} onChange={e => setEnableFee(e.target.checked)} className="w-5 h-5" />
                  </div>
                  {enableFee && (
                    <div>
                      <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Fee % (0-100)</label>
                      <input type="number" value={transferFee} onChange={e => setTransferFee(e.target.value)} placeholder="0"
                        className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                    </div>
                  )}
                </div>

                <motion.button
                  onClick={handleCreate}
                  disabled={isCreating || isConfirming || !isConnected}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-6 px-6 py-4 bg-white text-black font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCreating || isConfirming ? (
                    <><Loader2 className="h-5 w-5 animate-spin" />{isConfirming ? "Confirming..." : "Creating..."}</>
                  ) : (
                    <><Code className="h-5 w-5" />Create Advanced Token</>
                  )}
                </motion.button>
              </CardContent>
            </Card>

            {/* Transaction Result */}
            {(isConfirming || txHash) && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-white/10 bg-card">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      {isConfirming ? <><Loader2 className="h-5 w-5 animate-spin" />Transaction Pending</> : <><CheckCircle className="h-5 w-5 text-green-500" />Token Created!</>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {txHash && (
                      <div className="p-4 bg-black/50 rounded-lg border border-white/10">
                        <p className="text-xs text-white/50 uppercase mb-1">Transaction Hash</p>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-mono text-sm break-all">{txHash}</p>
                          <button onClick={() => copyAddress(txHash)} className="text-white/50 hover:text-white"><Copy className="h-4 w-4" /></button>
                          <a href={`${explorerUrl}${txHash}`} target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white"><ExternalLink className="h-4 w-4" /></a>
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-white/50">
                      {isConfirming ? "Waiting for confirmation on Ritual Chain..." : "Token deployed! Check your portfolio."}
                    </p>
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
          </div>
        </div>
      </div>
    </div>
  )
}
