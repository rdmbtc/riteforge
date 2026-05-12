"use client"

import { useState, useEffect } from "react"
import { useAccount, useWaitForTransactionReceipt } from "wagmi"
import { Sidebar } from "@/components/sidebar"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"
import { Zap, Send, Loader2, CheckCircle, ExternalLink, Copy, AlertCircle, History } from "lucide-react"
import { useBatchAirdrop } from "@/lib/contracts"
import { saveTransaction, getTransactionHistory } from "@/lib/supabase"
import { toast } from "sonner"

interface Recipient {
  address: string
  amount: string
}

export default function AirdropPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tokenAddress, setTokenAddress] = useState("")
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [rawInput, setRawInput] = useState("")
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txHistory, setTxHistory] = useState<any[]>([])

  const { isConnected, address } = useAccount()
  const { batchTransfer, isAirdropping, txHash: pendingTxHash, error } = useBatchAirdrop()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: pendingTxHash,
  })

  useEffect(() => {
    if (address) loadHistory()
  }, [address])

  useEffect(() => {
    if (isConfirmed) {
      setTxHash(pendingTxHash)
      toast.success(`Airdrop complete! Sent to ${recipients.length} recipients.`)
      loadHistory()
    }
  }, [isConfirmed, pendingTxHash, recipients.length])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const loadHistory = async () => {
    if (!address) return
    const history = await getTransactionHistory(address, 10)
    setTxHistory(history)
  }

  const parseRecipients = (input: string): Recipient[] => {
    const lines = input.trim().split("\n").filter(line => line.trim())
    const parsed: Recipient[] = []
    for (const line of lines) {
      const parts = line.split(/[,\s]+/).filter(p => p.trim())
      if (parts.length >= 2) {
        const addr = parts[0].trim()
        const amount = parts[1].trim()
        if (addr.startsWith("0x") && addr.length === 42 && !isNaN(parseFloat(amount))) {
          parsed.push({ address: addr, amount })
        }
      }
    }
    return parsed
  }

  const handleInputChange = (value: string) => {
    setRawInput(value)
    setRecipients(parseRecipients(value))
  }

  const totalAmount = recipients.reduce((sum, r) => sum + parseFloat(r.amount || "0"), 0)

  const handleAirdrop = async () => {
    if (!isConnected || !address) {
      toast.error("Connect wallet first")
      return
    }
    if (!tokenAddress || recipients.length === 0) {
      toast.error("Add token address and recipients")
      return
    }

    setTxHash(null)

    await saveTransaction({
      user_address: address,
      type: 'airdrop',
      title: `Airdrop ${tokenAddress.slice(0, 8)}...`,
      description: `${recipients.length} recipients, ${totalAmount} tokens`,
      amount: totalAmount.toString(),
      tx_hash: pendingTxHash || '',
      status: 'pending',
    })
    loadHistory()

    const addresses = recipients.map(r => r.address as `0x${string}`)
    const amounts = recipients.map(r => r.amount)

    const success = await batchTransfer({
      token: tokenAddress as `0x${string}`,
      recipients: addresses,
      amounts,
    })

    if (success) {
      toast.loading("Confirming airdrop...")
    }
  }

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr)
    toast.success("Copied!")
  }

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
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/50 hover:text-white transition-colors lg:hidden">
                <Zap className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-medium text-white tracking-[-0.025em]">Airdrop Tokens</h1>
            </div>
            <ConnectButton />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card className="border-white/10 bg-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Batch Token Airdrop
                </CardTitle>
                <CardDescription className="text-white/50">
                  Send tokens to multiple recipients in a single transaction.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Token Contract Address</label>
                  <input type="text" value={tokenAddress} onChange={e => setTokenAddress(e.target.value)}
                    placeholder="0x... (token to distribute)"
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white placeholder:text-white/30 focus:border-white/40 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-wider mb-1 block">Recipients (address, amount per line)</label>
                  <Textarea value={rawInput} onChange={e => handleInputChange(e.target.value)}
                    placeholder="0x1234567890abcdef1234567890abcdef12345678 100&#10;0xabcdef1234567890abcdef1234567890abcdef1234 200&#10;0x567890abcdef1234567890abcdef1234567890abcd 300"
                    className="h-40 font-mono text-sm bg-black border-white/20 text-white placeholder:text-white/30" />
                </div>

                <div className="p-4 bg-black/50 rounded-lg border border-white/10">
                  <div className="flex justify-between mb-2">
                    <span className="text-white/50">Recipients</span>
                    <span className="text-white font-medium">{recipients.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Total Tokens</span>
                    <span className="text-white font-medium">{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <motion.button
                  onClick={handleAirdrop}
                  disabled={isAirdropping || isConfirming || !isConnected || recipients.length === 0}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-4 bg-white text-black font-bold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isAirdropping || isConfirming ? (
                    <><Loader2 className="h-5 w-5 animate-spin" />{isConfirming ? "Confirming..." : "Processing..."}</>
                  ) : (
                    <><Send className="h-5 w-5" />Send Airdrop</>
                  )}
                </motion.button>
              </CardContent>
            </Card>

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
                        <p className="text-xs text-white/50 uppercase mb-1">Transaction</p>
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
