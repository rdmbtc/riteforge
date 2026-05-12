"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Download, Share2, Copy, Check, Loader2 } from "lucide-react"
import { toPng } from "html-to-image"
import toast from "react-hot-toast"
import { Cpu } from "lucide-react"

interface ContractCardModalProps {
  isOpen: boolean
  onClose: () => void
  contractName: string
  contractAddress?: string
  chainId?: number
}

const designs = [
  { id: "classic", name: "Classic", preview: "Gold premium" },
  { id: "glass", name: "Glass", preview: "Frosted glass" },
  { id: "marble", name: "Marble", preview: "Elegant marble" },
  { id: "vibrant", name: "Vibrant", preview: "Bold gradients" },
  { id: "neon", name: "Neon", preview: "Futuristic glow" },
  { id: "cyber", name: "Cyber", preview: "Matrix style" },
  { id: "hologram", name: "Hologram", preview: "3D holographic" },
  { id: "obsidian", name: "Obsidian", preview: "Dark luxury" },
  { id: "prism", name: "Prism", preview: "Rainbow light" },
  { id: "aurora", name: "Aurora", preview: "Northern lights" },
]

const styleClasses: Record<string, string> = {
  classic: "bg-[#0d0d0d] border border-white/5 text-[#d4af37] shadow-[0_40px_80px_rgba(0,0,0,0.8)]",
  glass: "bg-white/5 backdrop-blur-2xl border-2 border-white/10 text-white shadow-[0_0_50px_rgba(255,255,255,0.05)] ring-1 ring-white/20",
  marble: "bg-[#050505] border border-white/5 text-white shadow-2xl",
  vibrant: "bg-gradient-to-br from-[#d902ee] via-[#5c16eb] to-[#0412ee] border border-white/10 text-white shadow-[0_0_60px_rgba(92,22,235,0.3)]",
  neon: "bg-[#0a0a12] border-2 border-neon-cyan/50 text-white shadow-[0_0_40px_rgba(0,255,204,0.15)] ring-1 ring-neon-cyan/20",
  cyber: "bg-[#0a0a0a] border border-green-500/50 text-green-400 shadow-[0_0_30px_rgba(0,255,0,0.2)]",
  hologram: "bg-gradient-to-br from-[#001a2e] via-[#003355] to-[#0066aa] border border-cyan-400/50 text-cyan-100 shadow-[0_0_50px_rgba(0,191,255,0.3)]",
  obsidian: "bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-gray-600/30 text-gray-200 shadow-[0_20px_60px_rgba(0,0,0,0.9)]",
  prism: "bg-gradient-to-br from-[#ff0000] via-[#ff00ff] via-[#0000ff] to-[#00ffff] border border-white/20 text-white shadow-[0_0_60px_rgba(255,107,107,0.4)]",
  aurora: "bg-gradient-to-r from-[#003300] via-[#006633] to-[#009966] border border-green-400/40 text-green-100 shadow-[0_0_40px_rgba(0,255,163,0.3)]",
}

const titleStyles: Record<string, string> = {
  classic: "bg-gradient-to-b from-[#f8e3a1] via-[#d4af37] to-[#8a6d3b] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(212,175,55,0.3)] font-display uppercase tracking-tight",
  glass: "bg-gradient-to-br from-white via-white/80 to-white/40 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(255,255,255,0.4)] font-display",
  marble: "text-white font-display font-medium tracking-tight",
  vibrant: "text-white font-display bold",
  neon: "bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent font-display drop-shadow-[0_0_15px_rgba(0,255,204,0.4)]",
  cyber: "text-green-400 font-mono font-bold tracking-widest drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]",
  hologram: "bg-gradient-to-b from-cyan-200 via-cyan-100 to-transparent bg-clip-text text-transparent font-display bold tracking-wider",
  obsidian: "bg-gradient-to-b from-gray-200 via-gray-400 to-gray-600 bg-clip-text text-transparent font-display uppercase",
  prism: "bg-gradient-to-r from-yellow-200 via-pink-200 to-cyan-200 bg-clip-text text-transparent font-display font-black tracking-tight",
  aurora: "bg-gradient-to-r from-green-200 via-emerald-300 to-teal-300 bg-clip-text text-transparent font-display uppercase font-bold",
}

export function ContractCardModal({
  isOpen,
  onClose,
  contractName,
  contractAddress,
  chainId = 1979,
}: ContractCardModalProps) {
  const [selectedDesign, setSelectedDesign] = useState("glass")
  const [isCapturing, setIsCapturing] = useState(false)
  const [captured, setCaptured] = useState(false)
  const [copied, setCopied] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const truncatedAddress = contractAddress ? `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}` : "0x0000"

  const handleCopyAddress = () => {
    if (contractAddress) {
      navigator.clipboard.writeText(contractAddress)
      setCopied(true)
      toast.success("Address copied!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareTwitter = () => {
    const tweetText = [
      `Just deployed ${contractName} on Ritual Chain! 🚀`,
      "",
      "Built with @RiteForge",
      "",
      contractAddress ? `Contract: ${contractAddress}` : "",
      "",
      "#RitualChain #Web3 #SmartContracts",
    ].filter(Boolean).join("\n")

    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`,
      "_blank"
    )
  }

  const captureCard = async () => {
    if (!cardRef.current) return
    setIsCapturing(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      })
      const link = document.createElement("a")
      link.download = `${contractName}-contract-card.png`
      link.href = dataUrl
      link.click()
      setCaptured(true)
      toast.success("Card saved!")
    } catch (err) {
      console.error("Failed to capture", err)
      toast.error("Failed to save card")
    }
    setIsCapturing(false)
  }

  const renderCard = () => {
    const styleClass = styleClasses[selectedDesign] || styleClasses.glass
    const titleStyle = titleStyles[selectedDesign] || titleStyles.glass

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        whileHover={{ y: -8, scale: 1.02 }}
        className={`relative w-full max-w-[500px] aspect-[1.58/1] rounded-[24px] overflow-hidden p-8 flex flex-col justify-between transition-all duration-700 ${styleClass}`}
      >
        {/* Visual Enhancers */}
        {selectedDesign === "glass" && (
          <div className="absolute inset-0 z-0 opacity-100 pointer-events-none border-[3px] border-transparent bg-gradient-to-tr from-cyan-500/20 via-pink-500/20 to-yellow-500/20 mix-blend-screen animate-prism" />
        )}
        {selectedDesign === "neon" && (
          <div className="absolute inset-0 z-0 animate-aurora mix-blend-overlay opacity-40 bg-gradient-to-br from-green-500 via-blue-600 to-purple-600" />
        )}
        {selectedDesign === "cyber" && (
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="absolute h-[1px] bg-green-500 w-full" style={{ top: `${i * 5}%`, opacity: Math.random() * 0.5 + 0.5 }} />
            ))}
            {[...Array(10)].map((_, i) => (
              <div key={`v${i}`} className="absolute w-[1px] bg-green-500 h-full" style={{ left: `${i * 10}%`, opacity: Math.random() * 0.3 + 0.2 }} />
            ))}
          </div>
        )}
        {selectedDesign === "hologram" && (
          <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <div key={i} className="absolute h-[2px] bg-cyan-300 w-full" style={{ top: `${i * 2}%`, opacity: 0.5 }} />
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent animate-pulse" />
          </div>
        )}
        {selectedDesign === "obsidian" && (
          <div className="absolute inset-0 z-0 opacity-30 pointer-events-none bg-gradient-to-br from-white/10 via-transparent to-transparent" />
        )}
        {selectedDesign === "prism" && (
          <div className="absolute inset-0 z-0 animate-prism opacity-50 pointer-events-none" style={{ background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)' }} />
        )}
        {selectedDesign === "aurora" && (
          <div className="absolute inset-0 z-0 animate-aurora opacity-40 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(0,255,163,0.3) 0%, rgba(0,100,50,0.2) 50%, rgba(0,50,100,0.3) 100%)' }} />
        )}

        {/* Background image */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url(/image.webp)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: selectedDesign === "glass" ? 0.4 : 0.3
          }}
        />

        {/* Gloss Texture */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08] pointer-events-none z-10" />

        {/* Header */}
        <div className="flex justify-between items-start relative z-20">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border backdrop-blur-md transition-shadow duration-500 ${
              selectedDesign === "classic" ? 'bg-[#d4af37]/10 border-[#d4af37]/30' : 'bg-white/10 border-white/20'
            }`}>
              <Cpu className={`w-6 h-6 ${
                selectedDesign === "classic" ? 'text-[#d4af37]' :
                selectedDesign === "cyber" ? 'text-green-400' :
                selectedDesign === "hologram" ? 'text-cyan-300' :
                selectedDesign === "obsidian" ? 'text-gray-400' :
                selectedDesign === "prism" ? 'text-white' :
                selectedDesign === "aurora" ? 'text-green-300' :
                'text-white'
              }`} />
            </div>
            <div>
              <h3 className={`text-xs font-bold tracking-[0.2em] uppercase ${
                selectedDesign === "classic" ? 'text-[#d4af37]' : 'text-white/90'
              }`}>RiteForge</h3>
              <p className="text-[9px] text-white/40 uppercase tracking-[0.3em] -mt-0.5">Powered by Ritual</p>
            </div>
          </div>
          <div className={`backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/10 shadow-sm transition-all duration-500 ${
            selectedDesign === "glass" ? 'bg-white/10' : 'bg-black/20'
          }`}>
            <span className="text-xs font-mono font-bold text-white tracking-widest">Contract</span>
          </div>
        </div>

        {/* Centerpiece - Contract Name Only */}
        <div className="flex flex-col items-center justify-center relative z-20 pointer-events-none">
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${
              selectedDesign === "classic" ? 'bg-[#d4af37]' : selectedDesign === "neon" ? 'bg-neon-cyan' : 'bg-white'
            }`} />
            <span className="text-[9px] text-white/50 tracking-[0.4em] font-mono uppercase">Contract Deployed</span>
          </div>
          <h2 className={`text-4xl md:text-5xl font-black text-center select-none ${titleStyle}`}>
            {contractName}
          </h2>
        </div>

        {/* Footer Details */}
        <div className="flex justify-between items-end relative z-20">
          <div className="flex gap-10">
            <div className="flex flex-col">
              <span className="text-[8px] uppercase tracking-[0.3em] text-white/30 mb-1.5 font-mono">Chain</span>
              <span className="text-sm font-mono text-white/90 font-medium">{chainId}</span>
            </div>
            <div className="flex flex-col border-l border-white/5 pl-10">
              <span className="text-[8px] uppercase tracking-[0.3em] text-white/30 mb-1.5 font-mono">Network</span>
              <span className="text-sm font-mono text-white/90 font-medium">Ritual</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[8px] uppercase tracking-[0.3em] text-white/30 mb-1.5 font-mono">Address</span>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono text-white/70">{truncatedAddress}</span>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-500 ${
              selectedDesign === "neon" || selectedDesign === "vibrant" || selectedDesign === "marble"
              ? 'bg-neon-cyan/10 border-neon-cyan/40 text-neon-cyan shadow-[0_0_10px_rgba(0,255,204,0.1)]'
              : 'bg-white/5 border-white/10 text-white/70'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                selectedDesign === "neon" || selectedDesign === "vibrant" || selectedDesign === "marble" ? 'bg-neon-cyan' : 'bg-white/40'
              }`} />
              <span className="text-[9px] font-bold tracking-[0.3em] uppercase">Ritual</span>
            </div>
          </div>
        </div>

        {/* Dynamic Glare Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none z-30" />
      </motion.div>
    )
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-[#0c0c0b] border border-[#474747] rounded-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#1f2228]">
            <div>
              <h2 className="text-lg font-semibold text-white tracking-[-0.025em]">
                Contract Card
              </h2>
              <p className="text-sm text-[#7d8187]">
                Choose a design style for your contract
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-[#7d8187] hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Design Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">Design Style</label>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {designs.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDesign(d.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedDesign === d.id
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Preview */}
            <div className="w-full overflow-x-auto">
              <div ref={cardRef} className="w-[320px] sm:w-[500px] h-[200px] sm:h-[320px] mx-auto relative overflow-hidden rounded-2xl sm:rounded-3xl bg-[#0a0a0f] flex items-center justify-center">
                {renderCard()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-3">
              <motion.button
                onClick={captureCard}
                disabled={isCapturing}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', color: 'white' }}
              >
                {isCapturing ? <Loader2 className="h-4 w-4 animate-spin" /> : captured ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                {captured ? "Saved!" : "PNG"}
              </motion.button>

              <motion.button
                onClick={handleShareTwitter}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl border border-white/20 bg-black/50 text-white transition-all"
              >
                <Share2 className="h-4 w-4" />
                Share
              </motion.button>

              <motion.button
                onClick={handleCopyAddress}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl border border-white/20 bg-black/50 text-white transition-all"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Address"}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}