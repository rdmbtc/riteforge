"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import { Sidebar } from "@/components/sidebar"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Droplet, Loader2, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react"
import { toast } from "sonner"

// Faucet API endpoint - in production this would be configured via env
const FAUCET_API_URL = process.env.NEXT_PUBLIC_FAUCET_API_URL || "https://faucet.ritualfoundation.org/api/claim"

export default function FaucetPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isRequesting, setIsRequesting] = useState(false)
  const [lastRequestTime, setLastRequestTime] = useState<Date | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Wagmi hooks
  const { address, isConnected } = useAccount()

  const handleRequestTokens = async () => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsRequesting(true)
    setSuccess(null)

    try {
      // Call faucet API
      const response = await fetch(FAUCET_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: address,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to claim tokens")
      }

      const data = await response.json()
      setSuccess(data.txHash || "Tokens claimed successfully!")
      setLastRequestTime(new Date())
      toast.success("Tokens claimed successfully!")

      // Open explorer link if txHash available
      if (data.txHash) {
        window.open(`https://explorer.ritualfoundation.org/tx/${data.txHash}`, "_blank")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to claim tokens")
    } finally {
      setIsRequesting(false)
    }
  }

  // Check if 24 hours have passed since last request
  const canRequest = lastRequestTime
    ? (Date.now() - lastRequestTime.getTime()) > 24 * 60 * 60 * 1000
    : true

  return (
    <div className="min-h-screen bg-black flex overflow-hidden relative">
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white/50 hover:text-white transition-colors lg:hidden"
              >
                <Zap className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-medium text-white tracking-[-0.025em]">Testnet Faucets</h1>
            </div>

            <div className="flex items-center gap-3">
              <ConnectButton />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Title & Desc */}
            <div>
              <h2 className="text-2xl font-medium text-white tracking-[-0.025em] mb-1">Ritual Testnet Faucet</h2>
              <p className="text-sm text-white/50">Request test tokens to use on the Ritual Testnet.</p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/50 p-4 flex gap-3 items-start rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-emerald-400 font-mono font-bold">
                    {success}
                  </p>
                  <a
                    href={`https://explorer.ritualfoundation.org/tx/${success}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-300 font-mono flex items-center gap-1 mt-1 hover:underline"
                  >
                    View on Explorer <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Form */}
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base">Request Tokens</CardTitle>
                <CardDescription className="text-white/50">Click the button below to receive test RITUAL tokens.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-white/50">Your Address</label>
                  <Input
                    placeholder="0x..."
                    className="bg-black border-white/10 text-white placeholder:text-white/30"
                    value={address || ""}
                    disabled
                  />
                  <p className="text-xs text-white/50">
                    {isConnected ? "Connected wallet address" : "Connect wallet to auto-fill"}
                  </p>
                </div>

                <Button
                  onClick={handleRequestTokens}
                  disabled={!isConnected || isRequesting || !canRequest}
                  className="w-full bg-white hover:bg-white/90 text-black"
                >
                  {isRequesting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <Droplet className="h-4 w-4 mr-2" />
                      Request RITUAL Tokens
                    </>
                  )}
                </Button>

                {!canRequest && (
                  <p className="text-xs text-white/50 text-center">
                    You can request tokens again in 24 hours.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm">Rules</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-white/50 space-y-2">
                <p className="flex items-center gap-2">
                  <span>💧</span>
                  You can request tokens once every 24 hours.
                </p>
                <p className="flex items-center gap-2">
                  <span>💧</span>
                  These tokens have no real value and are for testing purposes only.
                </p>
                <p className="flex items-center gap-2">
                  <span>💧</span>
                  Test tokens are available on Ritual Testnet (Chain ID: 1979).
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}