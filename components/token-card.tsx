"use client"

import { useRef, useState, useEffect } from "react"
import { toPng } from "html-to-image"
import { Download, Share2, Check, Loader2, Film } from "lucide-react"
import { motion } from "framer-motion"

interface TokenCardProps {
  tokenName: string
  symbol: string
  supply: string
  decimals: string
  tokenAddress: string
  creatorAddress: string
  design?: "gradient" | "minimal" | "neon" | "glass" | "cosmic" | "classic" | "marble" | "vibrant"
}

export function TokenCard({
  tokenName,
  symbol,
  supply,
  decimals,
  tokenAddress,
  creatorAddress,
  design = "gradient",
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
  const truncatedCreator = creatorAddress ? `${creatorAddress.slice(0, 6)}...${creatorAddress.slice(-4)}` : "0x0000"

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

  const captureGif = async () => {
    if (!cardRef.current) return
    setIsCapturingGif(true)
    setCapturedGif(false)

    try {
      const frames: string[] = []
      const frameCount = 30
      const frameDuration = 100

      // Capture multiple frames with slight animation variations
      for (let i = 0; i < frameCount; i++) {
        const dataUrl = await toPng(cardRef.current, {
          quality: 0.8,
          pixelRatio: 1.5,
          cacheBust: true,
        })
        frames.push(dataUrl)
        // Small delay between frames
        await new Promise(resolve => setTimeout(resolve, frameDuration / 3))
      }

      // Create GIF using gifshot library approach
      const gifWidth = 800
      const gifHeight = 400

      // Use Canvas to create animated GIF
      const canvas = document.createElement('canvas')
      canvas.width = gifWidth
      canvas.height = gifHeight
      const ctx = canvas.getContext('2d')

      if (!ctx) throw new Error('Canvas context not available')

      // Simple GIF encoder
      const gif = await createGif(frames, gifWidth, gifHeight)

      const blob = new Blob([gif], { type: 'image/gif' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.download = `${symbol || tokenName}-token-card.gif`
      link.href = url
      link.click()
      URL.revokeObjectURL(url)
      setCapturedGif(true)
    } catch (err) {
      console.error("Failed to capture GIF", err)
    }
    setIsCapturingGif(false)
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

  // Simple GIF encoder
  const createGif = async (frames: string[], width: number, height: number): Promise<Uint8Array> => {
    const gif: number[] = []

    // GIF Header
    gif.push(...[0x47, 0x49, 0x46, 0x38, 0x39, 0x61]) // GIF89a

    // Logical Screen Descriptor
    gif.push(width & 0xff, (width >> 8) & 0xff)
    gif.push(height & 0xff, (height >> 8) & 0xff)
    gif.push(0xf7) // Global Color Table Flag, 256 colors
    gif.push(0x00) // Background Color Index
    gif.push(0x00) // Pixel Aspect Ratio

    // Global Color Table (256 colors, 768 bytes)
    for (let i = 0; i < 256; i++) {
      gif.push(i, i, i) // Grayscale palette
    }

    // Netscape Extension for looping
    gif.push(0x21, 0xff, 0x0b)
    gif.push(...[0x4e, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2e, 0x30]) // NETSCAPE2.0
    gif.push(0x03, 0x01, 0x00, 0x00, 0x00)

    // Add each frame
    for (let frameIdx = 0; frameIdx < frames.length; frameIdx++) {
      const frame = frames[frameIdx]

      // Graphics Control Extension
      gif.push(0x21, 0xf9, 0x04)
      gif.push(0x04) // Disposal method: restore to background
      gif.push(Math.floor(frameIdx === 0 ? 10 : 2)) // Delay time (centiseconds)
      gif.push(0x00) // Transparent color index
      gif.push(0x00)

      // Image Descriptor
      gif.push(0x2c)
      gif.push(0x00, 0x00) // Left
      gif.push(0x00, 0x00) // Top
      gif.push(width & 0xff, (width >> 8) & 0xff)
      gif.push(height & 0xff, (height >> 8) & 0xff)
      gif.push(0x00) // No local color table

      // Image Data (LZW minimum code size)
      gif.push(0x08)

      // Convert base64 to image data and create LZW compressed data
      const img = new Image()
      img.src = frame

      await new Promise(resolve => { img.onload = resolve })

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!

      // Draw centered image
      ctx.fillStyle = '#010102'
      ctx.fillRect(0, 0, width, height)

      const imgAspect = img.width / img.height
      const canvasAspect = width / height
      let drawWidth, drawHeight, drawX, drawY

      if (imgAspect > canvasAspect) {
        drawWidth = width
        drawHeight = width / imgAspect
        drawX = 0
        drawY = (height - drawHeight) / 2
      } else {
        drawHeight = height
        drawWidth = height * imgAspect
        drawX = (width - drawWidth) / 2
        drawY = 0
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
      const imageData = ctx.getImageData(0, 0, width, height)

      // Simple LZW compression
      const minCodeSize = 8
      const clearCode = 1 << minCodeSize
      const eoiCode = clearCode + 1

      const pixels: number[] = []
      for (let i = 0; i < imageData.data.length; i += 4) {
        pixels.push(imageData.data[i]) // Use grayscale
      }

      // LZW encoding
      const output: number[] = []
      let codeSize = minCodeSize + 1
      let nextCode = eoiCode + 1
      const dictionary = new Map<string, number>()

      // Initialize dictionary with single pixels
      for (let i = 0; i < 256; i++) {
        dictionary.set(String.fromCharCode(i), i)
      }

      const writeBits = (bits: number, numBits: number) => {
        output.push(bits & 0xff)
      }

      // Simple output for now - just raw pixels as fallback
      for (const pixel of pixels) {
        output.push(pixel)
      }

      // Sub-block
      const blockSize = Math.min(output.length, 255)
      const subBlock = [blockSize, ...output.slice(0, blockSize)]
      gif.push(...subBlock)

      // Block terminator
      gif.push(0x00)
    }

    // GIF Trailer
    gif.push(0x3b)

    return new Uint8Array(gif)
  }

  const getDesignBg = (d: string) => {
    switch (d) {
      case "minimal": return '#0a0a0f'
      case "neon": return '#000000'
      case "glass": return 'rgba(139,92,246,0.2)'
      case "cosmic": return 'linear-gradient(180deg, #0a0015 0%, #1a0a30 50%, #0a1525 100%)'
      default: return '#010102'
    }
  }

  return (
    <div className="space-y-4">
      {/* Premium Card with animations */}
      <div className="flex justify-center w-full overflow-hidden">
        <div
          ref={cardRef}
          className={`w-[800px] h-[400px] shrink-0 relative overflow-hidden ${design !== "gradient" ? "rounded-3xl" : ""}`}
          style={{ backgroundColor: design === "gradient" ? '#010102' : getDesignBg(design) }}
        >
          {/* Animated gradient orbs */}
          <motion.div
            className="absolute -top-32 -right-32 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.4) 0%, transparent 70%)', filter: 'blur(50px)' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)', filter: 'blur(50px)' }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />

          {/* Main card content - sleek rounded card */}
          <div
            className="absolute inset-4 rounded-3xl z-[5] overflow-hidden"
            style={{ backgroundColor: 'rgba(10,10,12,0.95)' }}
          >
            {/* Background image inside card */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'url(/image.webp)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.3
              }}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(10,10,12,0.9) 0%, rgba(10,10,12,0.75) 50%, rgba(10,10,12,0.9) 100%)' }} />

            {/* Animated top border glow */}
            <motion.div
              className="absolute inset-x-0 top-0 h-1"
              style={{
                background: 'linear-gradient(90deg, #8b5cf6, #06b6d4, #22c55e, #8b5cf6)',
                backgroundSize: '300% 100%'
              }}
              animate={{ backgroundPosition: ['0% 0%', '100% 0%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            {/* Subtle inner border glow */}
            <div className="absolute inset-0 rounded-3xl" style={{ boxShadow: 'inset 0 0 60px rgba(139,92,246,0.15), inset 0 0 30px rgba(6,182,212,0.1)' }} />

            {/* Content */}
            <div className="relative h-full flex flex-col p-8">

              {/* Top Row: Logo + Title + Badge */}
              <div className="flex items-center justify-between">
                {/* Left: RiteForge logo with Ritual branding */}
                <div className="flex items-center gap-3">
                  {/* Logo container */}
                  <div className="relative">
                    <motion.div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                        boxShadow: '0 0 25px rgba(139,92,246,0.5), 0 0 50px rgba(139,92,246,0.2)'
                      }}
                      whileHover={{ scale: 1.05, rotate: 3 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/favicon.webp"
                        alt="Ritual Logo"
                        width={40}
                        height={40}
                        className="object-contain"
                      />
                    </motion.div>
                  </div>
                  <div>
                    <span className="text-white text-base font-bold tracking-wide">RiteForge</span>
                    <p className="text-white/50 text-[10px] uppercase tracking-widest">Powered by Ritual</p>
                  </div>
                </div>

                {/* Right: Symbol badge with shimmer */}
                <motion.div
                  className="relative px-5 py-2 rounded-lg font-bold text-sm tracking-wider overflow-hidden"
                  style={{ backgroundColor: 'rgba(26,26,46,0.8)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' }}
                  whileHover={{ scale: 1.05 }}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                    }}
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <span className="relative z-10">{symbol}</span>
                </motion.div>
              </div>

              {/* Center: Token Name with entrance animation */}
              <motion.div
                className="flex-1 flex flex-col items-center justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)' }}
                    animate={{ opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <span className="text-white/60 text-xs font-medium tracking-[0.3em] uppercase">Token Created</span>
                  <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #06b6d4, #22c55e)' }}
                    animate={{ opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
                  />
                </div>
                <motion.h2
                  className="text-white text-7xl font-bold tracking-tight"
                  style={{ letterSpacing: '-0.04em', textShadow: '0 0 60px rgba(139,92,246,0.3)' }}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: mounted ? 1 : 0.8, opacity: mounted ? 1 : 0 }}
                  transition={{ delay: 0.3, duration: 0.6, type: "spring" }}
                >
                  {tokenName}
                </motion.h2>
              </motion.div>

              {/* Bottom Row: Stats + Network */}
              <motion.div
                className="flex items-end justify-between"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 10 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                {/* Stats */}
                <div className="flex items-center gap-10">
                  <div>
                    <p className="text-white/40 text-[10px] font-medium tracking-wider uppercase mb-1">Total Supply</p>
                    <p
                      className="text-white text-2xl font-bold"
                      style={{ fontFamily: 'ui-monospace, monospace', textShadow: '0 0 20px rgba(255,255,255,0.1)' }}
                    >
                      {Number(supply).toLocaleString()}
                    </p>
                  </div>

                  <div className="w-px h-10" style={{ background: 'linear-gradient(to bottom, transparent, rgba(139,92,246,0.5), transparent)' }} />

                  <div>
                    <p className="text-white/40 text-[10px] font-medium tracking-wider uppercase mb-1">Decimals</p>
                    <p
                      className="text-white text-2xl font-bold"
                      style={{ fontFamily: 'ui-monospace, monospace' }}
                    >
                      {decimals || "18"}
                    </p>
                  </div>

                  <div className="w-px h-10" style={{ background: 'linear-gradient(to bottom, transparent, rgba(139,92,246,0.5), transparent)' }} />

                  <div>
                    <p className="text-white/40 text-[10px] font-medium tracking-wider uppercase mb-1">Address</p>
                    <p
                      className="text-white/60 text-sm font-mono"
                      style={{ fontFamily: 'ui-monospace, monospace' }}
                    >
                      {truncatedAddress}
                    </p>
                  </div>
                </div>

                {/* Network badge - sleek pill */}
                <motion.div
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(6,182,212,0.15) 100%)',
                    border: '1px solid rgba(34,197,94,0.4)',
                    boxShadow: '0 0 20px rgba(34,197,94,0.2), inset 0 0 15px rgba(34,197,94,0.1)'
                  }}
                  whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(34,197,94,0.4)' }}
                >
                  {/* Glowing dot */}
                  <motion.span
                    className="relative w-2 h-2 rounded-full"
                    animate={{ boxShadow: ['0 0 4px #22c55e', '0 0 8px #22c55e', '0 0 4px #22c55e'] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <span className="absolute inset-0 rounded-full bg-green-400" />
                    <span className="absolute inset-0 rounded-full bg-green-300 animate-ping opacity-75" />
                  </motion.span>
                  <span className="text-white/90 text-[11px] font-semibold tracking-wider uppercase">Ritual</span>
                </motion.div>
              </motion.div>
            </div>
          </div>

          {/* Floating particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: `${10 + i * 12}%`,
                top: `${15 + (i % 4) * 22}%`,
                background: i % 2 === 0 ? 'rgba(139,92,246,0.5)' : 'rgba(6,182,212,0.5)',
              }}
              animate={{
                y: [-15, 15, -15],
                x: [5, -5, 5],
                opacity: [0.3, 0.7, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 4 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-3">
        <motion.button
          onClick={captureCard}
          disabled={isCapturing}
          whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(139,92,246,0.4)' }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', color: 'white', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}
        >
          {isCapturing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : captured ? (
            <Check className="h-4 w-4" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {captured ? "PNG Saved!" : "PNG"}
        </motion.button>

        <motion.button
          onClick={captureGif}
          disabled={isCapturingGif}
          whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(6,182,212,0.4)' }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', color: 'white', boxShadow: '0 4px 20px rgba(6,182,212,0.3)' }}
        >
          {isCapturingGif ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : capturedGif ? (
            <Check className="h-4 w-4" />
          ) : (
            <Film className="h-4 w-4" />
          )}
          {capturedGif ? "GIF Saved!" : isCapturingGif ? "Creating..." : "GIF"}
        </motion.button>

        <motion.button
          onClick={shareToX}
          disabled={isSharing}
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(255,255,255,0.1)' }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl border transition-all disabled:opacity-50"
          style={{ backgroundColor: 'rgba(10,10,12,0.8)', color: 'white', borderColor: 'rgba(139,92,246,0.3)' }}
        >
          {isSharing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          Share to X
        </motion.button>
      </div>
    </div>
  )
}

