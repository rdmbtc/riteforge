"use client"

import { useRef, useState } from "react"
import { toPng } from "html-to-image"
import { Download, Share2, Check, Loader2, Trophy, Star, Zap, Shield, Crown, Medal, Hexagon } from "lucide-react"
import { motion } from "framer-motion"

export type AchievementType =
  | "first_token"
  | "token_commander"
  | "token_army"
  | "defi_master"
  | "early_adopter"
  | "share_king"

interface AchievementCardProps {
  achievement: AchievementType
  tokenCount?: number
  username?: string
  date?: string
}

const achievementConfig = {
  first_token: {
    title: "First Token Created",
    description: "Created your first token on Ritual Network",
    icon: Trophy,
    gradient: "from-yellow-600 via-amber-700 to-orange-800",
    borderColor: "border-yellow-500/30",
    glowColor: "bg-yellow-500/20",
    textColor: "text-yellow-400",
  },
  token_commander: {
    title: "Token Commander",
    description: "Created 5 tokens on RiteForge",
    icon: Shield,
    gradient: "from-blue-600 via-blue-700 to-cyan-800",
    borderColor: "border-blue-500/30",
    glowColor: "bg-blue-500/20",
    textColor: "text-blue-400",
  },
  token_army: {
    title: "Token Army",
    description: "Created 10 tokens on RiteForge",
    icon: Crown,
    gradient: "from-purple-600 via-violet-700 to-purple-900",
    borderColor: "border-purple-500/30",
    glowColor: "bg-purple-500/20",
    textColor: "text-purple-400",
  },
  defi_master: {
    title: "DeFi Master",
    description: "Created 25 tokens on RiteForge",
    icon: Star,
    gradient: "from-emerald-600 via-emerald-700 to-teal-800",
    borderColor: "border-emerald-500/30",
    glowColor: "bg-emerald-500/20",
    textColor: "text-emerald-400",
  },
  early_adopter: {
    title: "Early Adopter",
    description: "One of the first 100 RiteForge users",
    icon: Zap,
    gradient: "from-rose-600 via-rose-700 to-red-800",
    borderColor: "border-rose-500/30",
    glowColor: "bg-rose-500/20",
    textColor: "text-rose-400",
  },
  share_king: {
    title: "Share King",
    description: "Shared 10 tokens to X/Twitter",
    icon: Medal,
    gradient: "from-amber-500 via-yellow-600 to-amber-700",
    borderColor: "border-amber-500/30",
    glowColor: "bg-amber-500/20",
    textColor: "text-amber-400",
  },
}

export function AchievementCard({ achievement, tokenCount = 1, username, date }: AchievementCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [captured, setCaptured] = useState(false)

  const config = achievementConfig[achievement]
  const IconComponent = config.icon

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
      link.download = `${achievement}-achievement.png`
      link.href = dataUrl
      link.click()
      setCaptured(true)
    } catch (err) {
      console.error("Failed to capture", err)
    }
    setIsCapturing(false)
  }

  const shareToX = async () => {
    setIsSharing(true)
    try {
      const text = encodeURIComponent(
        `🏆 Just unlocked "${config.title}" on @RitualNet!\n\n` +
        `${config.description}\n\n` +
        `Built with @RiteForge\n` +
        `🔗 riteforge.fun`
      )
      window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank")
    } catch (err) {
      console.error("Failed to share", err)
    }
    setIsSharing(false)
  }

  return (
    <div className="space-y-4">
      {/* Premium Card */}
      <div className="flex justify-center">
        <div
          ref={cardRef}
          className="w-[400px] aspect-square rounded-2xl overflow-hidden relative"
        >
          {/* Multi-layer Background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`} />
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5" />

          {/* Grid Pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)`,
              backgroundSize: "25px 25px",
            }}
          />

          {/* Glow Effects */}
          <div className={`absolute inset-0 ${config.glowColor} blur-3xl opacity-40`} />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

          {/* Border */}
          <div className="absolute inset-0 border-2 border-white/20 rounded-2xl" />
          <div className="absolute inset-[1px] border border-white/10 rounded-2xl" />

          {/* Content */}
          <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">

            {/* Icon with Glow */}
            <div className="relative mb-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${config.gradient} p-[2px] shadow-2xl`}>
                  <div className="w-full h-full rounded-2xl bg-black/60 backdrop-blur-xl flex items-center justify-center">
                    <IconComponent className={`w-10 h-10 ${config.textColor}`} />
                  </div>
                </div>
              </motion.div>
              {/* Glow behind icon */}
              <div className={`absolute inset-0 w-20 h-20 rounded-2xl ${config.glowColor} blur-2xl`} />
            </div>

            {/* Badge */}
            <div className="mb-4 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
              <p className="text-white/70 text-xs font-mono uppercase tracking-widest">Achievement Unlocked</p>
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">{config.title}</h2>
            <p className="text-white/60 text-sm mb-6 max-w-[280px]">{config.description}</p>

            {/* Stats */}
            {tokenCount > 0 && (
              <div className="flex items-center gap-4 text-sm font-mono">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border ${config.borderColor}`}>
                  <span className={config.textColor}>×</span>
                  <span className="text-white/80">{tokenCount}</span>
                </div>
                {username && <span className="text-white/40">|</span>}
                {username && <span className="text-white/60 text-sm">{username.slice(0, 6)}...{username.slice(-4)}</span>}
              </div>
            )}

            {/* Branding */}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center">
                <Hexagon className="w-3 h-3 text-white/60" />
              </div>
              <p className="text-white/30 text-xs font-mono">RITEFORGE</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <motion.button
          onClick={captureCard}
          disabled={isCapturing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50"
        >
          {isCapturing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : captured ? (
            <Check className="h-5 w-5" />
          ) : (
            <Download className="h-5 w-5" />
          )}
          {captured ? "Saved!" : "Download"}
        </motion.button>

        <motion.button
          onClick={shareToX}
          disabled={isSharing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white font-bold rounded-lg border border-white/20 hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          {isSharing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Share2 className="h-5 w-5" />
          )}
          Share to X
        </motion.button>
      </div>
    </div>
  )
}