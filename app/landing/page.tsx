"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  BookOpen,
  Github,
  Twitter,
  ChevronRight,
  Shield,
  Key,
  FileCode,
  ExternalLink,
} from "lucide-react"
import { Marquee } from "@/components/styled-marquee"
import { AmbientOrbs } from "@/components/styled-ambient-orbs"

// Pre-generated particle positions to avoid hydration mismatch
const PARTICLES = [
  { x: 10, y: 20, d: 8, delay: 0 },
  { x: 25, y: 45, d: 12, delay: 1 },
  { x: 40, y: 15, d: 10, delay: 2 },
  { x: 55, y: 70, d: 9, delay: 0.5 },
  { x: 70, y: 35, d: 11, delay: 1.5 },
  { x: 85, y: 60, d: 8, delay: 2.5 },
  { x: 15, y: 80, d: 10, delay: 3 },
  { x: 30, y: 55, d: 7, delay: 0.8 },
  { x: 50, y: 25, d: 9, delay: 1.2 },
  { x: 65, y: 85, d: 11, delay: 2.2 },
  { x: 80, y: 40, d: 8, delay: 3.2 },
  { x: 5, y: 50, d: 10, delay: 0.3 },
  { x: 35, y: 90, d: 12, delay: 1.8 },
  { x: 60, y: 10, d: 9, delay: 2.8 },
  { x: 90, y: 75, d: 8, delay: 0.6 },
  { x: 20, y: 65, d: 10, delay: 1.6 },
  { x: 45, y: 30, d: 11, delay: 2.6 },
  { x: 75, y: 95, d: 7, delay: 3.5 },
]

// Simple SVG icons matching brutalist design
const Icons = {
  Token: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M6 12h12" />
    </svg>
  ),
  Sale: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  Lock: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Vesting: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14l2 2 4-4" />
    </svg>
  ),
  Airdrop: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  NFT: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  Stream: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  DvP: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  ),
  Gas: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Faucet: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  ),
  Portfolio: () => (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Layers: () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
}

export default function Landing() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX - window.innerWidth / 2) / 50)
      mouseY.set((e.clientY - window.innerHeight / 2) / 50)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + Math.random() * 15 + 5
      })
    }, 100)

    const loadingTimer = setTimeout(() => {
      setIsLoading(false)
    }, 3500)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(loadingTimer)
    }
  }, [])

  const enterSite = () => {
    router.push('/main')
  }

  const protocols = [
    { icon: Icons.Token, title: 'TOKEN FACTORY', desc: 'Create ERC20 tokens with custom parameters', path: '/create-core' },
    { icon: Icons.Sale, title: 'TOKEN SALE', desc: 'Launch token sales with customizable pricing', path: '/launchpad' },
    { icon: Icons.Lock, title: 'TOKEN LOCKER', desc: 'Lock liquidity and team tokens securely', path: '/locker' },
    { icon: Icons.Vesting, title: 'VESTING', desc: 'Schedule vesting with linear and cliff patterns', path: '/vesting' },
    { icon: Icons.Airdrop, title: 'AIRDROP', desc: 'Distribute tokens to multiple recipients', path: '/airdrop' },
    { icon: Icons.NFT, title: 'NFT MINTING', desc: 'Create and manage NFT collections', path: '/nft' },
    { icon: Icons.Stream, title: 'PAYMENT STREAMS', desc: 'Stream payments continuously on-chain', path: '/streams' },
    { icon: Icons.DvP, title: 'DvP', desc: 'Peer-to-peer asset exchange with settlement', path: '/dvp' },
  ]

  const tools = [
    { icon: Icons.Gas, title: 'Gas Tracker', desc: 'Monitor gas prices' },
    { icon: Icons.Faucet, title: 'Faucets', desc: 'Access testnet tokens' },
    { icon: Icons.Portfolio, title: 'Portfolio', desc: 'Track holdings' },
  ]

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden relative">

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* OPTION 1: Dark overlay on image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
          style={{ backgroundImage: `url('/bg.png')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black" />

        {/* Ambient orbs overlay */}
        <AmbientOrbs />

        {/* OPTION 2: CSS gradient mesh (disabled) */}
        {/* <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse at 20% 80%, rgba(30,30,30,0.4) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(40,40,40,0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(20,20,20,0.5) 0%, transparent 70%),
            linear-gradient(180deg, #0a0a0a 0%, #111111 50%, #0a0a0a 100%)
          `
        }} /> */}

        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
        }} />

        {/* Geometric lines */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <defs>
            <pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Grid Floor */}
        <motion.div
          className="absolute bottom-0 left-1/2 w-[200%] h-[60%] -translate-x-1/2 opacity-20"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
            transform: 'perspective(500px) rotateX(60deg)',
          }}
          animate={{ backgroundPosition: ['0 0', '80px 80px'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />

        {/* 3D Wireframe Cube - subtle */}
        <motion.div
          className="absolute top-1/4 right-[15%] w-48 h-48 opacity-25"
          style={{ x: springX, y: springY }}
          animate={{ rotateX: [0, 360], rotateY: [0, 360] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        >
          <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
            <div className="absolute inset-0 border border-white/40" style={{ transform: 'translateZ(48px)' }} />
            <div className="absolute inset-0 border border-white/40" style={{ transform: 'translateZ(-48px)' }} />
            <div className="absolute inset-0 border border-white/40" style={{ transform: 'rotateY(90deg) translateZ(48px)' }} />
            <div className="absolute inset-0 border border-white/40" style={{ transform: 'rotateY(-90deg) translateZ(48px)' }} />
            <div className="absolute inset-0 border border-white/40" style={{ transform: 'rotateX(90deg) translateZ(48px)' }} />
            <div className="absolute inset-0 border border-white/40" style={{ transform: 'rotateX(-90deg) translateZ(48px)' }} />
          </div>
        </motion.div>

        {/* Second smaller cube - different axis */}
        <motion.div
          className="absolute bottom-1/3 left-[10%] w-32 h-32 opacity-15"
          style={{ x: springX, y: springY }}
          animate={{ rotateX: [0, -360], rotateY: [-360, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        >
          <div className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
            <div className="absolute inset-0 border border-white/30" style={{ transform: 'translateZ(32px)' }} />
            <div className="absolute inset-0 border border-white/30" style={{ transform: 'translateZ(-32px)' }} />
            <div className="absolute inset-0 border border-white/30" style={{ transform: 'rotateY(90deg) translateZ(32px)' }} />
            <div className="absolute inset-0 border border-white/30" style={{ transform: 'rotateY(-90deg) translateZ(32px)' }} />
            <div className="absolute inset-0 border border-white/30" style={{ transform: 'rotateX(90deg) translateZ(32px)' }} />
            <div className="absolute inset-0 border border-white/30" style={{ transform: 'rotateX(-90deg) translateZ(32px)' }} />
          </div>
        </motion.div>

        {/* Particles - only render after mount to avoid hydration mismatch */}
        {mounted && (
          <div className="absolute inset-0">
            {PARTICLES.map((p, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{ left: `${p.x}%`, top: `${p.y}%`, boxShadow: '0 0 10px rgba(255,255,255,0.5)' }}
                animate={{
                  y: [0, -150, 0],
                  x: [0, (Math.sin(i) * 30), 0],
                  scale: [1, 2, 1],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{ duration: p.d, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
              />
            ))}
          </div>
        )}

        {/* Glowing Orb - subtle */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(60,60,60,0.15) 0%, transparent 70%)', transform: 'translate(-50%, -50%)', x: springX, y: springY }}
          animate={{ scale: [1, 1.1, 0.95, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Mouse Glow */}
        <motion.div className="absolute pointer-events-none w-[400px] h-[400px]" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%)', x: springX, y: springY }} />
      </div>

      {/* Loading Screen */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeInOut' }}
          >
            <motion.div
              className="text-4xl sm:text-5xl md:text-7xl lg:text-[8rem] font-bold tracking-tighter leading-none mb-4 text-white"
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              RITEFORGE
            </motion.div>
            <motion.div className="text-sm text-white/50 tracking-[0.3em] mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
              TOKEN INFRASTRUCTURE
            </motion.div>
            <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full bg-white" style={{ width: `${Math.min(loadingProgress, 100)}%` }} initial={{ width: 0 }} />
            </div>
            <motion.div className="mt-4 text-sm text-white/50">
              LOADING... {Math.round(Math.min(loadingProgress, 100))}%
            </motion.div>
            {loadingProgress >= 100 && (
              <motion.button
                className="mt-8 px-8 py-3 border border-white text-white text-sm tracking-wider hover:bg-white hover:text-black transition-all duration-300"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={enterSite}
              >
                ENTER RITEFORGE
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence>
        {!isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
            {/* Header */}
            <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-16 border-b border-white/10 bg-black/80 backdrop-blur-xl">
              <motion.div className="text-xl font-bold tracking-tight text-white" whileHover={{ scale: 1.02 }}>
                RITEFORGE
              </motion.div>
              <nav className="hidden md:flex items-center gap-8">
                {[
                  { icon: BookOpen, label: 'Docs' },
                  { icon: Github, label: 'GitHub' },
                  { icon: Twitter, label: 'Twitter' },
                ].map(({ icon: Icon, label }) => (
                  <motion.a key={label} href="#" className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors" whileHover={{ y: -2 }}>
                    <Icon className="w-4 h-4" />
                    {label}
                  </motion.a>
                ))}
              </nav>
              <motion.button
                onClick={enterSite}
                className="hidden md:flex items-center gap-2 px-5 py-2 border border-white text-white text-sm hover:bg-white hover:text-black transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Open App <ChevronRight className="w-4 h-4" />
              </motion.button>
              <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? '×' : '☰'}
              </button>
            </header>

            {/* Mobile Menu */}
            <AnimatePresence>
              {menuOpen && (
                <motion.nav className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {['Docs', 'GitHub', 'Twitter'].map((item, i) => (
                    <motion.a key={item} href="#" className="text-2xl font-medium text-white" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>{item}</motion.a>
                  ))}
                </motion.nav>
              )}
            </AnimatePresence>

            <main className="flex-grow pt-24 pb-20 px-6 md:px-12 relative z-10">

              {/* Hero */}
              <section className="max-w-5xl mx-auto text-center mb-24">
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Icons.Layers />
                  <span className="text-xs tracking-widest text-white/70">RITUAL CHAIN NATIVE</span>
                </motion.div>

                <motion.h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-white"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  style={{ textShadow: '0 0 80px rgba(255,255,255,0.2)' }}
                >
                  RITEFORGE
                </motion.h1>

                <motion.p className="text-lg md:text-xl text-white/60 mb-4 max-w-2xl mx-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                  Token Infrastructure for Ritual Chain
                </motion.p>

                <motion.p className="text-base text-white/40 max-w-xl mx-auto mb-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                  Create tokens, launch sales, lock liquidity, schedule vesting — all powered by Ritual Chain
                </motion.p>

                <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                  <motion.button
                    onClick={enterSite}
                    className="group px-8 py-4 bg-white text-black font-semibold flex items-center justify-center gap-2 hover:bg-white/90 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Open App
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                  <motion.button
                    className="px-8 py-4 border border-white/30 text-white flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                    whileHover={{ scale: 1.02 }}
                  >
                    <BookOpen className="w-4 h-4" />
                    Read Docs
                  </motion.button>
                </motion.div>
              </section>

              {/* Protocols Grid */}
              <section className="max-w-6xl mx-auto mb-24">
                <motion.h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                  PROTOCOLS
                </motion.h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {protocols.map(({ icon: Icon, title, desc, path }, index) => (
                    <motion.a
                      key={title}
                      href={path}
                      className="group relative p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all"
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -4, borderColor: 'rgba(255,255,255,0.3)' }}
                    >
                      <div className="mb-4 text-white/70 group-hover:text-white transition-colors">
                        <Icon />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                      <p className="text-sm text-white/50 mb-4">{desc}</p>
                      <div className="flex items-center gap-1 text-sm text-white/30 group-hover:text-white transition-colors">
                        Launch <ChevronRight className="w-4 h-4" />
                      </div>
                    </motion.a>
                  ))}
                </div>
              </section>

              {/* Tools Section */}
              <section className="max-w-4xl mx-auto mb-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tools.map(({ icon: Icon, title, desc }, index) => (
                    <motion.div
                      key={title}
                      className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      viewport={{ once: true }}
                      whileHover={{ y: -2 }}
                    >
                      <Icon />
                      <h3 className="text-lg font-semibold text-white mt-4 mb-1">{title}</h3>
                      <p className="text-sm text-white/50">{desc}</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Marquee */}
              <section className="py-16">
                <Marquee />
              </section>

              {/* Features */}
              <section className="max-w-5xl mx-auto mb-24">
                <div className="grid md:grid-cols-2 gap-8">
                  <motion.div className="p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent" initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                    <h3 className="text-2xl font-bold text-white mb-6">WHY RITEFORGE?</h3>
                    <ul className="space-y-4">
                      {[
                        { icon: Shield, title: 'Fully On-Chain', desc: 'All data stored on Ritual Chain blockchain' },
                        { icon: Key, title: 'Non-Custodial', desc: 'You control your keys — we never hold funds' },
                        { icon: FileCode, title: 'Open Source', desc: 'Smart contracts publicly verifiable' },
                      ].map(({ icon: Icon, title, desc }) => (
                        <li key={title} className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-white/10">
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-white font-medium">{title}</div>
                            <div className="text-sm text-white/50">{desc}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  <motion.div className="p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                    <h3 className="text-2xl font-bold text-white mb-6">SUPPORTED NETWORKS</h3>
                    <div className="space-y-4">
                      {[
                        { name: 'Ritual Chain', status: 'Mainnet', color: 'bg-green-500' },
                        { name: 'Ritual Testnet', status: 'Testnet', color: 'bg-yellow-500' },
                      ].map(({ name, status, color }) => (
                        <div key={name} className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${color}`} />
                            <span className="text-white font-medium">{name}</span>
                          </div>
                          <span className="text-xs text-white/50 px-2 py-1 rounded bg-white/10">{status}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8">
                      <h4 className="text-lg font-medium text-white mb-4">QUICK LINKS</h4>
                      <div className="flex flex-wrap gap-3">
                        {['Documentation', 'GitHub', 'Twitter'].map((link) => (
                          <a key={link} href="#" className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/30 rounded-lg transition-colors">
                            {link} <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </section>

              {/* CTA */}
              <motion.section className="text-center" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <motion.button
                  onClick={enterSite}
                  className="px-12 py-5 border-2 border-white text-white text-lg font-semibold hover:bg-white hover:text-black transition-all duration-300"
                  whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(255,255,255,0.2)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  Start Building on RiteForge →
                </motion.button>
              </motion.section>
            </main>

            {/* Footer */}
            <footer className="w-full px-6 md:px-12 py-8 border-t border-white/10 bg-black/80">
              <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-lg font-bold text-white">RITEFORGE</div>
                <div className="flex items-center gap-6">
                  <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Docs</a>
                  <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">GitHub</a>
                  <a href="#" className="text-sm text-white/50 hover:text-white transition-colors">Twitter</a>
                </div>
                <div className="text-xs text-white/30">© 2026 RiteForge</div>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
