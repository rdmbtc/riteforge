"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Plus,
  Settings,
  Rocket,
  Send,
  Lock,
  Image as ImageIcon,
  Clock,
  Calendar,
  Shuffle,
  BarChart,
  Clipboard,
  Fuel,
  Droplet,
  ChevronDown,
  ChevronLeft,
  X,
  Zap,
  Bot,
  Trash2,
  Menu,
  ArrowLeft,
  BookOpen
} from "lucide-react"

interface ChatHistory {
  id: string
  title: string
  timestamp: Date
  preview: string
  type: "create" | "analyze" | "registry"
}

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  chatHistory?: ChatHistory[]
  currentChatId?: string | null
  onChatSelect?: (id: string) => void
  onChatDelete?: (id: string) => void
  onNewChat?: () => void
}

const menuItems = [
  {
    title: "Create Token",
    icon: Plus,
    submenu: [
      { title: "Create Core Token", path: "/create-core", icon: Zap },
      { title: "Create Advanced Token", path: "/create-advanced", icon: Bot },
      { title: "Create Asset Token", path: "/create-asset", icon: Clipboard },
    ]
  },
  { title: "Manage Token", icon: Settings, path: "/manage" },
  { title: "Create Token Sale", icon: Rocket, path: "/launchpad" },
  { title: "Airdrop Tokens", icon: Send, path: "/airdrop" },
  { title: "Create Token Locker", icon: Lock, path: "/locker" },
  { title: "Create NFT", icon: ImageIcon, path: "/nft" },
  { title: "Create Payment Stream", icon: Clock, path: "/streams" },
  { title: "Create Token Vesting", icon: Calendar, path: "/vesting" },
  { title: "Create DvP", icon: Shuffle, path: "/dvp" },
  { title: "Track Token Portfolio", icon: BarChart, path: "/portfolio" },
  { title: "Create Chain Record", icon: Clipboard, path: "/record" },
  { title: "Gas Price", icon: Fuel, path: "/gas" },
  { title: "Testnet Faucets", icon: Droplet, path: "/faucet" },
  { title: "Documentation", icon: BookOpen, path: "/docs" },
]

export function Sidebar({ 
  isOpen, 
  setIsOpen, 
  chatHistory = [], 
  currentChatId, 
  onChatSelect, 
  onChatDelete,
  onNewChat 
}: SidebarProps) {
  const pathname = usePathname()
  const [createTokenOpen, setCreateTokenOpen] = useState(true)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] lg:hidden"
          />
          
          {/* Sidebar */}
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed lg:sticky inset-y-0 left-0 top-0 z-[60] w-64 h-screen bg-black border-r border-white/10 flex flex-col overflow-hidden pt-24"
          >
            {/* Sidebar Header */}
            <div className="px-4 mb-8">
              <h1 className="font-mono text-xl font-bold text-white tracking-tight uppercase">RITEFORGE</h1>
              <p className="font-mono text-xs text-white/40 mt-2">TOKEN INFRASTRUCTURE</p>
            </div>

            {/* Menu Items */}
            <div className="flex-grow flex flex-col gap-1 overflow-y-auto px-4">
              {menuItems.map((item, index) => {
                const Icon = item.icon
                const isActive = item.path === pathname
                
                if (item.submenu) {
                  const isSubActive = item.submenu.some(sub => sub.path === pathname)
                  return (
                    <div key={index} className="flex flex-col gap-1">
                      <button
                        onClick={() => setCreateTokenOpen(!createTokenOpen)}
                        className={`p-4 font-mono text-xs uppercase flex items-center justify-between transition-colors ${
                          isSubActive
                            ? "bg-white text-black"
                            : "text-white/50 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${createTokenOpen ? "transform rotate-180" : ""}`} />
                      </button>

                      <AnimatePresence>
                        {createTokenOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden flex flex-col gap-1 ml-4"
                          >
                            {item.submenu.map((subitem, subindex) => {
                              const SubIcon = subitem.icon
                              const isSubActive = subitem.path === pathname
                              return (
                                <Link
                                  key={subindex}
                                  href={subitem.path}
                                  className={`p-2 font-mono text-xs uppercase flex items-center gap-3 transition-colors ${
                                    isSubActive
                                      ? "bg-white text-black"
                                      : "text-white/40 hover:bg-white/5 hover:text-white"
                                  }`}
                                >
                                  <SubIcon className="h-4 w-4" />
                                  <span>{subitem.title}</span>
                                </Link>
                              )
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                }

                return (
                  <Link
                    key={index}
                    href={item.path}
                    className={`p-4 font-mono text-xs uppercase flex items-center gap-3 transition-colors ${
                      isActive
                        ? "bg-white text-black"
                        : "text-white/50 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Link>
                )
              })}

              {/* Recent Chats Section */}
              {chatHistory.length > 0 && (
                <div className="pt-4 mt-4 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <p className="font-mono text-xs tracking-[0.1em] text-white/40 uppercase">
                      Recent Chats
                    </p>
                    {onNewChat && (
                      <button
                        onClick={onNewChat}
                        className="text-white/40 hover:text-white transition-colors"
                        title="New Chat"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    {chatHistory.map((chat) => (
                      <div
                        key={chat.id}
                        className={`group relative p-2 cursor-pointer transition-colors ${
                          currentChatId === chat.id
                            ? "bg-black text-white"
                            : "text-gray-500 hover:bg-[#e2e2e2] hover:text-black"
                        }`}
                        onClick={() => onChatSelect?.(chat.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-mono uppercase line-clamp-1 flex-1">
                            {chat.title}
                          </h4>
                          {onChatDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onChatDelete(chat.id)
                              }}
                              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-white/10 mt-auto">
              <Link href="/main" className="w-full border border-white/20 bg-white/5 text-white font-mono text-xs py-3 uppercase hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2">
                <Rocket className="h-4 w-4" /> INITIALIZE_AGENT
              </Link>
              <div className="mt-4 flex flex-col gap-1">
                <Link href="/landing" className="text-white/50 p-2 hover:bg-white/5 font-mono text-xs uppercase flex items-center gap-3">
                  <ChevronLeft className="h-4 w-4" /> HOME
                </Link>
                <a className="text-white/50 p-2 hover:bg-white/5 font-mono text-xs uppercase flex items-center gap-3" href="#">
                  <Settings className="h-4 w-4" /> SETTINGS
                </a>
                <a className="text-white/50 p-2 hover:bg-white/5 font-mono text-xs uppercase flex items-center gap-3" href="#">
                  <Clipboard className="h-4 w-4" /> DOCUMENTATION
                </a>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
