"use client"

import { useRef, useState, useEffect } from "react"
import { toPng } from "html-to-image"
import { Download, Share2, Check, Loader2, Film } from "lucide-react"
import { motion } from "framer-motion"
import { Cpu, Coins, ShieldCheck, Fingerprint } from "lucide-react"

interface TokenCardProps {
  tokenName: string
  symbol: string
  supply: string
  decimals: string
  tokenAddress: string
  creatorAddress: string
  design?: "gradient" | "minimal" | "neon" | "glass" | "cosmic" | "classic" | "marble" | "vibrant"
}

type CardDesign = {
  id: string
  name: string
  preview: string
}

const designs: CardDesign[] = [
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

const accentColors: Record<string, string> = {
  classic: "#d4af37",
  glass: "#00ffcc",
  marble: "#e2e8f0",
  vibrant: "#ff2d78",
  neon: "#00ffcc",
  gradient: "#8b5cf6",
  minimal: "#6366f1",
  cosmic: "#8b5cf6",
  cyber: "#00ff00",
  hologram: "#00bfff",
  obsidian: "#c0c0c0",
  prism: "#ff6b6b",
  aurora: "#00ffa3",
}

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

export function TokenCard({
  tokenName,
  symbol,
  supply,
  decimals,
  tokenAddress,
  creatorAddress,
  design = "glass",
}: TokenCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isCapturingGif, setIsCapturingGif] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [captured, setCaptured] = useState(false)
  const [capturedGif, setCapturedGif] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const truncatedAddress = tokenAddress ? `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}` : "0x0000"

  const captureCard = async () => {
    if (!cardRef.current) return
    setIsCapturing(true)
    const el = cardRef.current
    el.setAttribute('data-capturing', 'true')
    void el.offsetHeight
    await new Promise(resolve => requestAnimationFrame(resolve))
    try {
      const dataUrl = await toPng(el, {
        quality: 1,
        pixelRatio: 2,
        cacheBust: true,
      })
      const link = document.createElement("a")
      link.download = `${symbol || tokenName}-token-card.png`
      link.href = dataUrl
      link.click()
      setCaptured(true)
    } catch (err) {
      console.error("Failed to capture", err)
    }
    el.removeAttribute('data-capturing')
    setIsCapturing(false)
  }

  const shareToX = async () => {
    setIsSharing(true)
    try {
      const text = encodeURIComponent(
        `🎉 Just created ${tokenName} (${symbol}) on @RitualNet with @RiteForge!\n\n` +
        `Supply: ${Number(supply).toLocaleString()}\n` +
        `Address: ${truncatedAddress}\n\n` +
        `🔗 riteforge.fun`
      )
      window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank")
    } catch (err) {
      console.error("Failed to share", err)
    }
    setIsSharing(false)
  }

  const renderCard = () => {
    const accent = accentColors[design] || "#00ffcc"
    const styleClass = styleClasses[design] || styleClasses.glass
    const titleStyle = titleStyles[design] || titleStyles.glass

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        whileHover={{ y: -8, scale: 1.02 }}
        className={`relative w-full max-w-[500px] aspect-[1.58/1] rounded-[24px] overflow-hidden p-8 flex flex-col justify-between transition-all duration-700 ${styleClass}`}
        style={{ aspectRatio: undefined }}
      >
        {/* Visual Enhancers for glass */}
        {design === "glass" && (
          <div className="absolute inset-0 z-0 opacity-100 pointer-events-none border-[3px] border-transparent bg-gradient-to-tr from-cyan-500/20 via-pink-500/20 to-yellow-500/20 mix-blend-screen animate-prism" />
        )}

        {/* Aurora for neon */}
        {design === "neon" && (
          <div className="absolute inset-0 z-0 animate-aurora mix-blend-overlay opacity-40 bg-gradient-to-br from-green-500 via-blue-600 to-purple-600" />
        )}

        {/* Cyber matrix effect */}
        {design === "cyber" && (
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="absolute h-[1px] bg-green-500 w-full" style={{ top: `${i * 5}%`, opacity: Math.random() * 0.5 + 0.5 }} />
            ))}
            {[...Array(10)].map((_, i) => (
              <div key={`v${i}`} className="absolute w-[1px] bg-green-500 h-full" style={{ left: `${i * 10}%`, opacity: Math.random() * 0.3 + 0.2 }} />
            ))}
          </div>
        )}

        {/* Hologram scan lines */}
        {design === "hologram" && (
          <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <div key={i} className="absolute h-[2px] bg-cyan-300 w-full" style={{ top: `${i * 2}%`, opacity: 0.5 }} />
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent animate-pulse" />
          </div>
        )}

        {/* Obsidian shine */}
        {design === "obsidian" && (
          <div className="absolute inset-0 z-0 opacity-30 pointer-events-none bg-gradient-to-br from-white/10 via-transparent to-transparent" />
        )}

        {/* Prism rainbow shimmer */}
        {design === "prism" && (
          <div className="absolute inset-0 z-0 animate-prism opacity-50 pointer-events-none" style={{ background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.2) 50%, transparent 70%)' }} />
        )}

        {/* Aurora northern lights */}
        {design === "aurora" && (
          <div className="absolute inset-0 z-0 animate-aurora opacity-40 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(0,255,163,0.3) 0%, rgba(0,100,50,0.2) 50%, rgba(0,50,100,0.3) 100%)' }} />
        )}

        {/* Background image */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            backgroundImage: `url(/image.webp)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: design === "glass" ? 0.4 : 0.3
          }}
        />

        {/* Gloss Texture */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.08] pointer-events-none z-10" />

        {/* Header */}
        <div className="flex justify-between items-start relative z-20">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border backdrop-blur-md transition-shadow duration-500 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] ${
              design === "classic" ? 'bg-[#d4af37]/10 border-[#d4af37]/30' : 'bg-white/10 border-white/20'
            }`}>
              <Cpu className={`w-6 h-6 ${
                design === "classic" ? 'text-[#d4af37]' :
                design === "cyber" ? 'text-green-400' :
                design === "hologram" ? 'text-cyan-300' :
                design === "obsidian" ? 'text-gray-400' :
                design === "prism" ? 'text-white' :
                design === "aurora" ? 'text-green-300' :
                'text-white'
              }`} />
            </div>
            <div>
              <h3 className={`text-xs font-bold tracking-[0.2em] uppercase ${
                design === "classic" ? 'text-[#d4af37]' : 'text-white/90'
              }`}>RiteForge</h3>
              <p className="text-[9px] text-white/40 uppercase tracking-[0.3em] -mt-0.5">Powered by Ritual</p>
            </div>
          </div>
          <div className={`backdrop-blur-md px-4 py-1.5 rounded-xl border border-white/10 shadow-sm transition-all duration-500 group-hover:scale-110 ${
            design === "glass" ? 'bg-white/10' : 'bg-black/20'
          }`}>
            <span className="text-xs font-mono font-bold text-white tracking-widest">{symbol}</span>
          </div>
        </div>

        {/* Centerpiece */}
        <div className="flex flex-col items-center justify-center relative z-20 pointer-events-none">
          <div className="flex items-center gap-2.5 mb-3">
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_10px_currentColor] ${
              design === "classic" ? 'bg-[#d4af37]' : design === "neon" ? 'bg-neon-cyan' : 'bg-white'
            }`} />
            <span className="text-[9px] text-white/50 tracking-[0.4em] font-mono uppercase">Token Created</span>
          </div>
          <h2 className={`text-4xl md:text-5xl font-black text-center select-none ${titleStyle}`}>
            {tokenName}
          </h2>
        </div>

        {/* Footer Details */}
        <div className="flex justify-between items-end relative z-20">
          <div className="flex gap-10">
            <div className="flex flex-col">
              <span className="text-[8px] uppercase tracking-[0.3em] text-white/30 mb-1.5 font-mono">Total Supply</span>
              <span className="text-sm font-mono text-white/90 font-medium">{Number(supply).toLocaleString()}</span>
            </div>
            <div className="flex flex-col border-l border-white/5 pl-10">
              <span className="text-[8px] uppercase tracking-[0.3em] text-white/30 mb-1.5 font-mono">Decimals</span>
              <span className="text-sm font-mono text-white/90 font-medium">{decimals || "18"}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[8px] uppercase tracking-[0.3em] text-white/30 mb-1.5 font-mono">Address</span>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono text-white/70">{truncatedAddress}</span>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-500 group-hover:shadow-[0_0_15px_rgba(0,255,204,0.3)] ${
              design === "neon" || design === "vibrant" || design === "marble"
              ? 'bg-neon-cyan/10 border-neon-cyan/40 text-neon-cyan shadow-[0_0_10px_rgba(0,255,204,0.1)]'
              : 'bg-white/5 border-white/10 text-white/70'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                design === "neon" || design === "vibrant" || design === "marble" ? 'bg-neon-cyan' : 'bg-white/40'
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

  return (
    <div className="space-y-4">
      <style>{`
        [data-capturing="true"], [data-capturing="true"] * {
          animation: none !important;
          transition: none !important;
          transform: none !important;
        }
      `}</style>
      <div className="flex justify-center w-full">
        <div ref={cardRef} className="w-full max-w-[500px] shrink-0">
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
          onClick={shareToX}
          disabled={isSharing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl border border-white/20 bg-black/50 text-white transition-all disabled:opacity-50"
        >
          {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
          Share
        </motion.button>
      </div>
    </div>
  )
}

// Card Selector Component
export function CardDesignSelector({ selected, onSelect }: { selected: string; onSelect: (design: string) => void }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {designs.map((d) => (
        <button
          key={d.id}
          onClick={() => onSelect(d.id)}
          className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selected === d.id
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          {d.name}
        </button>
      ))}
    </div>
  )
}

export { designs }