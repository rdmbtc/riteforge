"use client"

import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { Sidebar } from "@/components/sidebar"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Gauge, Clock, RefreshCw } from "lucide-react"
import { usePublicClient } from "wagmi"
import { formatUnits } from "viem"

interface GasData {
  slow: { price: string; time: string }
  standard: { price: string; time: string }
  fast: { price: string; time: string }
}

export default function GasPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [gasData, setGasData] = useState<GasData>({
    slow: { price: "0.5", time: "~1 min" },
    standard: { price: "1.0", time: "~30 sec" },
    fast: { price: "1.5", time: "~15 sec" },
  })

  // Wagmi hooks
  const { isConnected } = useAccount()
  const publicClient = usePublicClient()

  const fetchGasPrice = async () => {
    setIsLoading(true)
    try {
      if (publicClient) {
        const gasPrice = await publicClient.getGasPrice()
        const gasPriceGwei = parseFloat(formatUnits(gasPrice, 9))

        // Simulate different tiers
        setGasData({
          slow: { price: (gasPriceGwei * 0.5).toFixed(2), time: "~1 min" },
          standard: { price: gasPriceGwei.toFixed(2), time: "~30 sec" },
          fast: { price: (gasPriceGwei * 1.5).toFixed(2), time: "~15 sec" },
        })
      }
    } catch (err) {
      console.error("Failed to fetch gas price:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGasPrice()
    // Refresh every 30 seconds
    const interval = setInterval(fetchGasPrice, 30000)
    return () => clearInterval(interval)
  }, [publicClient])

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
              <h1 className="text-xl font-medium text-white tracking-[-0.025em]">Gas Price</h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchGasPrice}
                className={`p-2 text-white/50 hover:text-white transition-colors ${isLoading ? "animate-spin" : ""}`}
                disabled={isLoading}
              >
                <RefreshCw className="h-5 w-5" />
              </button>
              <ConnectButton />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Title & Desc */}
            <div>
              <h2 className="text-2xl font-medium text-white tracking-[-0.025em] mb-1">Ritual Chain Gas Price</h2>
              <p className="text-sm text-white/50">Monitor the current gas prices and network congestion.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-card border-white/10">
                <CardHeader className="pb-2">
                  <CardDescription className="text-white/50">Fast</CardDescription>
                  <CardTitle className="text-emerald-400 text-2xl font-bold font-mono">{gasData.fast.price} Gwei</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-white/50 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {gasData.fast.time}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-white/10">
                <CardHeader className="pb-2">
                  <CardDescription className="text-white/50">Standard</CardDescription>
                  <CardTitle className="text-white text-2xl font-bold font-mono">{gasData.standard.price} Gwei</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-white/50 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {gasData.standard.time}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-white/10">
                <CardHeader className="pb-2">
                  <CardDescription className="text-white/50">Safe Low</CardDescription>
                  <CardTitle className="text-amber-400 text-2xl font-bold font-mono">{gasData.slow.price} Gwei</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-white/50 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {gasData.slow.time}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gauge or Chart Mock */}
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-black" /> Network Status
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center h-48">
                <div className="text-center">
                  <p className="text-emerald-400 text-sm mb-2">Network is operating normally</p>
                  <div className="flex gap-2 justify-center">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card className="bg-card border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-sm">Gas Tip</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-white/50 space-y-2">
                <p>💡 Ritual Chain has very low gas fees compared to other EVM chains.</p>
                <p>💡 For simple token transfers, you can expect costs under 0.001 RITUAL.</p>
                <p>💡 Complex smart contract interactions may cost slightly more but remain affordable.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}