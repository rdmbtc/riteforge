"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWalletClient } from 'wagmi'
import toast, { Toaster } from 'react-hot-toast'
import { GenerateButton } from "@/components/styled-generate-button"
import { AmbientOrbs } from "@/components/styled-ambient-orbs"
import {
  Trash2,
  Loader2,
  Rocket,
  Bot,
  Settings,
  Menu,
  Sparkles,
  Shield,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  CheckCircle,
  Send,
  Copy,
  Check,
  X,
  Plus,
  Clock,
  Zap,
  Users,
  Code,
  FileCode,
  Crown,
  Twitter,
  ChevronRight,
  ExternalLink,
  Key,
  BookOpen
} from "lucide-react"
import { generateSmartContract, analyzeContract } from "@/lib/ai-api"
import { saveChatHistory, getChatHistory, deleteChatHistory as deleteFromDB, saveContract } from "@/lib/supabase"
import { exportToRemix, openInRemix } from "@/lib/contract-deploy"
import { DeploymentModal } from "@/components/deployment-modal"
import { ContractCardModal } from "@/components/token-card-modal"
import { contractTemplates, type ContractTemplate } from "@/lib/contract-templates"
import { extractTokenInfo } from "@/lib/contract-parser"
import { OnChainAnalyzer } from "@/components/on-chain-analyzer"
import { useStreamingGeneration } from '@/lib/ai-streaming'
import { StreamingCodeEditor } from '@/components/streaming-code-editor'
import { LiveChat } from '@/components/live-chat'
import { Sidebar } from "@/components/sidebar"

interface Prompt {
  id: string
  title: string
  description: string
  voteCount: number
  tags: ("Safe" | "Useful" | "Popular" | "Creative")[]
  author: string
}

interface ChatHistory {
  id: string
  title: string
  timestamp: Date
  preview: string
  type: "create" | "analyze" | "registry"
  data: {
    contractInput?: string
    analyzerInput?: string
    generatedTemplate?: string | null
    contractSummary?: string | null
    contractExplanation?: string | null
    analysisResult?: {
      explanation: string
      risks: { level: string; message: string }[]
      permissions: string[]
      score: number
    } | null
  }
}

const mockPrompts: Prompt[] = [
  {
    id: "1",
    title: "Simple Token Transfer",
    description: "Transfer ERC-20 tokens to a specified address with gas optimization",
    voteCount: 342,
    tags: ["Safe", "Popular"],
    author: "0x7a3b...4f2d"
  },
  {
    id: "2",
    title: "NFT Minting Contract",
    description: "Create an NFT with metadata and royalty configuration",
    voteCount: 287,
    tags: ["Useful", "Creative"],
    author: "0x2c1e...8a9f"
  },
  {
    id: "3",
    title: "Staking Rewards Claim",
    description: "Claim accumulated staking rewards from a validator contract",
    voteCount: 256,
    tags: ["Safe", "Useful"],
    author: "0x9d4c...1b2e"
  },
  {
    id: "4",
    title: "DAO Proposal Submission",
    description: "Submit a governance proposal with voting parameters",
    voteCount: 198,
    tags: ["Creative", "Popular"],
    author: "0x5f8a...3c7d"
  },
  {
    id: "5",
    title: "Liquidity Pool Add",
    description: "Add liquidity to a DEX pool with slippage protection",
    voteCount: 176,
    tags: ["Safe", "Useful", "Popular"],
    author: "0x1b2c...9e4f"
  }
]

type ViewState = "home" | "create" | "analyze" | "registry" | "templates"

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
}

const formatTimestamp = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

export default function RiteForge() {
  const [prompts, setPrompts] = useState<Prompt[]>(mockPrompts)
  const [contractInput, setContractInput] = useState("")
  const [analyzerInput, setAnalyzerInput] = useState("")
  const [viewState, setViewState] = useState<ViewState>("home")
  const [analysisResult, setAnalysisResult] = useState<null | {
    explanation: string
    risks: { level: string; message: string }[]
    permissions: string[]
    score: number
  }>(null)
  const [generatedTemplate, setGeneratedTemplate] = useState<null | string>(null)
  const [contractSummary, setContractSummary] = useState<null | string>(null)
  const [contractExplanation, setContractExplanation] = useState<null | string>(null)
  const [copied, setCopied] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [particles, setParticles] = useState<Array<{
    x: number; y: number; opacity: number; scale: number;
    targetX1: number; targetY1: number; targetX2: number; targetY2: number; duration: number;
    size: number;
    offsetY1: number;
    offsetY2: number;
  }>>([])
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setParticles(Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      opacity: Math.random() * 0.5 + 0.3,
      scale: Math.random() * 0.5 + 0.5,
      targetX1: Math.random() * 100,
      targetY1: Math.random() * 100,
      targetX2: Math.random() * 100,
      targetY2: Math.random() * 100,
      duration: Math.random() * 15 + 8,
      size: Math.random() * 3 + 1,
      offsetY1: (Math.random() - 0.5) * 20,
      offsetY2: (Math.random() - 0.5) * 20,
    })))
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [showDeployModal, setShowDeployModal] = useState(false)
  const [showTokenCardModal, setShowTokenCardModal] = useState(false)
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'compiling' | 'deploying' | 'success' | 'error'>('idle')
  const [deploymentData, setDeploymentData] = useState<{
    contractAddress?: string
    transactionHash?: string
    error?: string
  }>({})
  
  // Templates state
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [searchQuery, setSearchQuery] = useState("")

  // Web3 hooks
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()

  // Streaming generation hook
  const streaming = useStreamingGeneration()

  // Live chat state
  const [showLiveChat, setShowLiveChat] = useState(false)

  // Load chat history from localStorage and Supabase on mount
  useEffect(() => {
    const loadHistory = async () => {
      // Always try localStorage first (instant)
      const savedHistory = localStorage.getItem('riteforge-chat-history')
      if (savedHistory) {
        try {
          const parsed = JSON.parse(savedHistory)
          const historyWithDates = parsed.map((chat: any) => ({
            ...chat,
            timestamp: new Date(chat.timestamp)
          }))
          setChatHistory(historyWithDates)
        } catch (error) {
          console.error('Failed to load from localStorage:', error)
        }
      }
      
      // Try to load from Supabase if wallet is connected (optional enhancement)
      if (address) {
        try {
          const dbHistory = await getChatHistory(address)
          if (dbHistory && dbHistory.length > 0) {
            const historyWithDates = dbHistory.map((chat: any) => ({
              id: chat.id,
              title: chat.title,
              timestamp: new Date(chat.created_at),
              preview: chat.preview,
              type: chat.type,
              data: {
                contractInput: chat.contract_input,
                analyzerInput: chat.analyzer_input,
                generatedTemplate: chat.generated_template,
                contractSummary: chat.contract_summary,
                contractExplanation: chat.contract_explanation,
                analysisResult: chat.analysis_result,
              }
            }))
            setChatHistory(historyWithDates)
            console.log('✅ Loaded chat history from database')
          }
        } catch (error) {
          console.warn('⚠️ Database load skipped, using localStorage:', error instanceof Error ? error.message : 'Unknown error')
        }
      }
    }
    
    loadHistory()
  }, [address])

  // Save chat history to localStorage and Supabase whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      // Save to localStorage
      localStorage.setItem('riteforge-chat-history', JSON.stringify(chatHistory))
      
      // Save to Supabase if user is connected and there's a current chat
      if (address && currentChatId) {
        const currentChat = chatHistory.find(c => c.id === currentChatId)
        if (currentChat && currentChat.data) {
          // Only save if there's actual data to save
          const hasData = currentChat.data.contractInput || 
                         currentChat.data.analyzerInput || 
                         currentChat.data.generatedTemplate ||
                         currentChat.data.analysisResult
          
          if (hasData) {
            saveChatHistory({
              id: currentChat.id,
              user_address: address,
              title: currentChat.title,
              preview: currentChat.preview,
              type: currentChat.type,
              contract_input: currentChat.data.contractInput || undefined,
              analyzer_input: currentChat.data.analyzerInput || undefined,
              generated_template: currentChat.data.generatedTemplate || undefined,
              contract_summary: contractSummary || undefined,
              contract_explanation: contractExplanation || undefined,
              analysis_result: currentChat.data.analysisResult || undefined,
            }).catch(err => {
              // Silently fail - localStorage is the fallback
              console.warn('Supabase save skipped:', err?.message || 'Unknown error')
            })
          }
        }
      }
    }
  }, [chatHistory, address, currentChatId, contractSummary, contractExplanation])

  const handleVote = (id: string, direction: "up" | "down") => {
    setPrompts(prev => 
      prev.map(p => 
        p.id === id 
          ? { ...p, voteCount: p.voteCount + (direction === "up" ? 1 : -1) }
          : p
      )
    )
  }

  const addToChatHistory = (
    title: string, 
    preview: string, 
    type: ChatHistory["type"],
    generatedData?: {
      generatedTemplate?: string
      contractSummary?: string
      contractExplanation?: string
      analysisResult?: {
        explanation: string
        risks: { level: string; message: string }[]
        permissions: string[]
        score: number
      }
    }
  ) => {
    const newChat: ChatHistory = {
      id: Date.now().toString(),
      title,
      timestamp: new Date(),
      preview,
      type,
      data: {
        contractInput: type === "create" ? contractInput : undefined,
        analyzerInput: type === "analyze" ? analyzerInput : undefined,
        generatedTemplate: type === "create" ? (generatedData?.generatedTemplate || generatedTemplate) : undefined,
        contractSummary: type === "create" ? (generatedData?.contractSummary || contractSummary) : undefined,
        contractExplanation: type === "create" ? (generatedData?.contractExplanation || contractExplanation) : undefined,
        analysisResult: type === "analyze" ? (generatedData?.analysisResult || analysisResult) : undefined
      }
    }
    setChatHistory(prev => [newChat, ...prev])
    setCurrentChatId(newChat.id)
  }

  const updateCurrentChat = () => {
    if (!currentChatId) return
    
    setChatHistory(prev => prev.map(chat => {
      if (chat.id === currentChatId) {
        return {
          ...chat,
          data: {
            contractInput: contractInput || undefined,
            analyzerInput: analyzerInput || undefined,
            generatedTemplate: generatedTemplate || undefined,
            contractSummary: contractSummary || undefined,
            contractExplanation: contractExplanation || undefined,
            analysisResult: analysisResult || undefined
          }
        }
      }
      return chat
    }))
  }

  const deleteChatHistory = async (id: string) => {
    // Delete from local state first (immediate feedback)
    setChatHistory(prev => prev.filter(chat => chat.id !== id))
    
    if (currentChatId === id) {
      setCurrentChatId(null)
      startNewChat()
    }
    
    // Try to delete from Supabase (optional)
    if (address) {
      deleteFromDB(id).catch(err => {
        console.warn('⚠️ Database delete skipped:', err?.message || 'Unknown error')
      })
    }
    
    toast.success('Chat deleted')
  }

  const loadChatHistory = (id: string) => {
    const chat = chatHistory.find(c => c.id === id)
    if (chat) {
      setCurrentChatId(id)
      
      // Load the saved data
      if (chat.data.contractInput) {
        setContractInput(chat.data.contractInput)
      }
      if (chat.data.analyzerInput) {
        setAnalyzerInput(chat.data.analyzerInput)
      }
      if (chat.data.generatedTemplate) {
        setGeneratedTemplate(chat.data.generatedTemplate)
      }
      if (chat.data.contractSummary) {
        setContractSummary(chat.data.contractSummary)
      }
      if (chat.data.contractExplanation) {
        setContractExplanation(chat.data.contractExplanation)
      }
      if (chat.data.analysisResult) {
        setAnalysisResult(chat.data.analysisResult)
      }
      
      // Set the appropriate view
      setViewState(chat.type === "registry" ? "registry" : chat.type)
      
      // Close sidebar on mobile
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }
  }

  const startNewChat = () => {
    setCurrentChatId(null)
    setContractInput("")
    setAnalyzerInput("")
    setGeneratedTemplate(null)
    setContractSummary(null)
    setContractExplanation(null)
    setAnalysisResult(null)
    setViewState("home")
  }

  const handleCreateContract = async () => {
    if (!contractInput.trim()) return
    setIsGenerating(true)
    setError(null)
    
    // Animated toast component
    const AnimatedToast = () => {
      const [step, setStep] = useState(0)
      const [dots, setDots] = useState("")
      const [progress, setProgress] = useState(0)

      useEffect(() => {
        const steps = [
          "Analyzing request",
          "Finding best model",
          "Generating contract",
          "Optimizing code",
          "Adding docs",
          "Finalizing"
        ]
        const stepInterval = setInterval(() => {
          setStep(s => s < steps.length - 1 ? s + 1 : s)
        }, 1200)
        const dotsInterval = setInterval(() => {
          setDots(d => d.length >= 3 ? "" : d + ".")
        }, 400)
        const progressInterval = setInterval(() => {
          setProgress(p => Math.min(p + Math.random() * 12, 95))
        }, 600)
        return () => {
          clearInterval(stepInterval)
          clearInterval(dotsInterval)
          clearInterval(progressInterval)
        }
      }, [])

      return (
        <div className="flex flex-col gap-2 w-64">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Bot className="h-4 w-4" />
            </motion.div>
            <span className="text-sm">
              {["Analyzing request", "Finding best model", "Generating contract", "Optimizing code", "Adding docs", "Finalizing"][step]}{dots}
            </span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="text-xs text-white/50">{Math.round(progress)}%</div>
        </div>
      )
    }

    // Show AI generation notification
    const toastId = toast.custom(
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="flex items-start gap-3 p-4 bg-black border border-white/20 rounded-xl shadow-2xl"
      >
        <div className="mt-1">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Bot className="h-5 w-5 text-white" />
          </motion.div>
        </div>
        <AnimatedToast />
      </motion.div>,
      { duration: 999999 }
    )
    
    try {
      // Use static generation (more reliable)
      const result = await generateSmartContract(contractInput)
      
      // Update state with generated contract
      setGeneratedTemplate(result.code)
      setContractSummary(result.summary)
      setContractExplanation(result.explanation)
      setIsGenerating(false)
      setViewState("create")
      
      // Success notification
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>Contract generated!</span>
        </div>,
        {
          id: toastId,
          style: {
            background: 'black',
            color: 'white',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            padding: '12px 16px',
          },
        }
      )
      
      // Save contract to Supabase (optional - won't break if it fails)
      if (address) {
        saveContract({
          user_address: address,
          name: contractInput.slice(0, 50),
          description: contractInput,
          code: result.code,
          summary: result.summary,
          explanation: result.explanation,
          chain_id: 1979,
        }).then(() => {
          console.log('✅ Contract saved to database')
        }).catch(err => {
          console.warn('⚠️ Database save skipped:', err?.message || 'Check SUPABASE_QUICKFIX.md')
        })
      }
      
      // Add to chat history after generation with the generated data
      setTimeout(() => {
        addToChatHistory(
          contractInput.slice(0, 30) + (contractInput.length > 30 ? "..." : ""),
          contractInput,
          "create",
          {
            generatedTemplate: result.code,
            contractSummary: result.summary,
            contractExplanation: result.explanation
          }
        )
      }, 100)
    } catch (err) {
      console.error('Error generating contract:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate contract'
      setError(errorMessage)
      setIsGenerating(false)
      
      // Error notification
      toast.error(
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>AI Error: Using fallback mode</span>
        </div>,
        {
          id: toastId,
          style: {
            background: 'black',
            color: '#ffffff',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            padding: '12px 16px',
          },
        }
      )
      
      // Fallback to mock template
      const fallbackTemplate = `// Generated Contract Template
// Intent: ${contractInput}

pragma solidity ^0.8.19;

contract GeneratedContract {
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    // Auto-generated function based on your intent
    function execute() external {
        require(msg.sender == owner, "Unauthorized");
        // Implementation based on: "${contractInput}"
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
}`
      setGeneratedTemplate(fallbackTemplate)
      setContractSummary("Smart contract generated for Ritual Testnet")
      setContractExplanation("Review the code above. This contract is designed for Ritual Testnet (Chain ID: 1979).")
      setViewState("create")
    }
  }

  const handleAnalyze = async () => {
    if (!analyzerInput.trim()) return
    setIsAnalyzing(true)
    setError(null)
    
    // Show AI analysis notification
    const toastId = toast.loading(
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 animate-pulse" />
        <span>AI is analyzing security...</span>
      </div>,
      {
        style: {
          background: 'black',
          color: '#ffffff',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: '12px',
          padding: '12px 16px',
        },
      }
    )
    
    try {
      // Call AI API to analyze contract
      const result = await analyzeContract(analyzerInput)
      
      setAnalysisResult(result)
      setIsAnalyzing(false)
      
      // Success notification
      toast.success(
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span>Security analysis complete!</span>
        </div>,
        {
          id: toastId,
          style: {
            background: 'black',
            color: '#ffffff',
            border: '1px solid #10b981',
            borderRadius: '12px',
            padding: '12px 16px',
          },
        }
      )
      
      // Add to chat history after analysis with the result data
      setTimeout(() => {
        addToChatHistory(
          "Security Analysis",
          analyzerInput.slice(0, 50) + (analyzerInput.length > 50 ? "..." : ""),
          "analyze",
          { analysisResult: result }
        )
      }, 100)
    } catch (err) {
      console.error('Error analyzing contract:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze contract'
      setError(errorMessage)
      setIsAnalyzing(false)
      
      // Error notification
      toast.error(
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>Analysis failed: Using fallback</span>
        </div>,
        {
          id: toastId,
          style: {
            background: 'black',
            color: '#ffffff',
            border: '1px solid #ef4444',
            borderRadius: '12px',
            padding: '12px 16px',
          },
        }
      )
      
      // Fallback to mock analysis
      const fallbackResult = {
        explanation: "This contract transfers tokens from your wallet to the specified address. It will execute a standard ERC-20 transfer with the amount you specified.",
        risks: [
          { level: "low", message: "Standard token transfer operation" },
          { level: "medium", message: "Ensure recipient address is correct - transfers are irreversible" }
        ],
        permissions: [
          "Token spending approval (if not already approved)",
          "Gas fee deduction from your wallet",
          "Transaction signing required"
        ],
        score: 85
      }
      setAnalysisResult(fallbackResult)
      
      // Add fallback result to chat history
      setTimeout(() => {
        addToChatHistory(
          "Security Analysis",
          analyzerInput.slice(0, 50) + (analyzerInput.length > 50 ? "..." : ""),
          "analyze",
          { analysisResult: fallbackResult }
        )
      }, 100)
    }
  }

  const handleCopy = () => {
    if (generatedTemplate) {
      navigator.clipboard.writeText(generatedTemplate)
      setCopied(true)
      toast.success('Code copied to clipboard!', {
        style: {
          background: 'black',
          color: '#ffffff',
          border: '1px solid #10b981',
          borderRadius: '12px',
          padding: '12px 16px',
        },
      })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleHomeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (contractInput.trim()) {
      handleCreateContract()
    }
  }

  const handleDeploy = async () => {
    if (!isConnected || !generatedTemplate) {
      toast.error('Please connect your wallet and generate a contract first')
      return
    }

    if (!walletClient) {
      toast.error('Wallet client not available')
      return
    }

    try {
      // Step 1: Compile first to get bytecode
      toast.loading('Compiling contract...', { id: 'deploy' })
      const { compileSolidityInBrowser } = await import('@/lib/browser-compile')
      const compilationResult = await compileSolidityInBrowser(generatedTemplate)

      if (!compilationResult.success || !compilationResult.bytecode) {
        toast.error('Compilation failed: ' + (compilationResult.error || 'Unknown error'), { id: 'deploy' })
        return
      }

      // Step 2: Estimate cost BEFORE deploying
      const { estimateDeploymentCost } = await import('@/lib/direct-deploy')
      const estimate = await estimateDeploymentCost(walletClient, compilationResult.bytecode)

      if (estimate.error) {
        toast.error('Failed to estimate cost: ' + estimate.error, { id: 'deploy' })
        return
      }

      // Show estimated cost
      toast.success(`Estimated cost: ${estimate.costEstimate} RITUAL`, { id: 'deploy' })

      // Deploy directly
      setShowDeployModal(true)
      setDeploymentStatus('deploying')
      setDeploymentData({})
      setIsDeploying(true)

      toast.loading('Deploying to Ritual Chain...', { id: 'deploy' })
      const { deployContractDirect } = await import('@/lib/direct-deploy')
      const result = await deployContractDirect(walletClient, compilationResult.bytecode)

      if (result.success) {
        setDeploymentStatus('success')
        setDeploymentData({
          contractAddress: result.contractAddress,
          transactionHash: result.transactionHash
        })
        toast.success(`Deployed! Actual cost: ${result.gasCost} RITUAL`, { id: 'deploy' })
      } else {
        setDeploymentStatus('error')
        setDeploymentData({ error: result.error || 'Deployment failed' })
        toast.error('Deployment failed: ' + result.error, { id: 'deploy' })
      }
    } catch (err: any) {
      console.error('Deployment error:', err)
      setDeploymentStatus('error')
      setDeploymentData({ error: err?.message || 'Deployment failed' })
      toast.error('Deployment failed', { id: 'deploy' })
    } finally {
      setIsDeploying(false)
    }
  }

  // Home view - xAI style centered prompt
  if (viewState === "home") {
    return (
      <>
        <Toaster position="top-right" />
        <div className="min-h-screen bg-black text-white flex overflow-hidden relative">
        <Sidebar 
          isOpen={sidebarOpen} 
          setIsOpen={setSidebarOpen} 
          chatHistory={chatHistory}
          currentChatId={currentChatId}
          onChatSelect={loadChatHistory}
          onChatDelete={deleteChatHistory}
          onNewChat={startNewChat}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Moving Grid */}
            <div className="absolute inset-0 opacity-[0.04]">
              <motion.div
                className="absolute inset-0"
                style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
                  backgroundSize: '60px 60px',
                }}
                animate={{
                  backgroundPosition: ['0 0', '60px 60px'],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </div>

            {/* Floating Particles - Organic Movement */}
            <div className="absolute inset-0 overflow-hidden">
              {particles.length > 0 && particles.map((p, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    width: p.size + 'px',
                    height: p.size + 'px',
                    backgroundColor: 'rgba(255,255,255,0.6)',
                    boxShadow: `0 0 ${p.size * 3}px rgba(255,255,255,0.25)`,
                  }}
                  animate={{
                    x: [
                      `${p.x}%`,
                      `${p.targetX1}%`,
                      `${p.targetX2}%`,
                      `${p.x}%`,
                    ],
                    y: [
                      `${p.y}%`,
                      `${p.targetY1 + p.offsetY1}%`,
                      `${p.targetY2 + p.offsetY2}%`,
                      `${p.y}%`,
                    ],
                    opacity: [0.15, p.opacity, p.opacity * 0.6, 0.15],
                    scale: [p.scale * 0.5, p.scale * 1.2, p.scale * 0.8, p.scale * 0.5],
                  }}
                  transition={{
                    duration: p.duration,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>

            {/* Mouse Cursor Glow Effect */}
            <motion.div
              className="absolute pointer-events-none"
              style={{
                width: 300,
                height: 300,
                background: 'radial-gradient(circle, rgba(0,0,0,0.03) 0%, transparent 70%)',
                left: mousePos.x,
                top: mousePos.y,
                x: '-50%',
                y: '-50%',
              }}
              animate={{
                x: mousePos.x - 150,
                y: mousePos.y - 150,
                scale: [1, 1.2, 0.9, 1],
              }}
              transition={{
                x: { type: 'spring', stiffness: 50, damping: 20 },
                y: { type: 'spring', stiffness: 50, damping: 20 },
                scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
            <motion.div
              className="absolute pointer-events-none"
              style={{
                width: 500,
                height: 500,
                background: 'radial-gradient(circle, rgba(0,0,0,0.015) 0%, transparent 60%)',
                left: mousePos.x,
                top: mousePos.y,
                x: '-50%',
                y: '-50%',
              }}
              animate={{
                x: mousePos.x - 250,
                y: mousePos.y - 250,
              }}
              transition={{
                x: { type: 'spring', stiffness: 30, damping: 25 },
                y: { type: 'spring', stiffness: 30, damping: 25 },
              }}
            />

            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.06]">
              {particles.length > 3 && Array.from({ length: 8 }, (_, i) => {
                const p1 = particles[i * 2] || particles[0]
                const p2 = particles[i * 2 + 1] || particles[1]
                return (
                  <motion.line
                    key={i}
                    x1={`${p1.x}%`}
                    y1={`${p1.y}%`}
                    x2={`${p2.x}%`}
                    y2={`${p2.y}%`}
                    stroke="white"
                    strokeWidth="0.5"
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: [0, 0.3, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                )
              })}
            </svg>

            {/* Large Morphing Blobs */}
            <motion.div
              className="absolute w-[600px] h-[600px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }}
              animate={{
                x: ['-10%', '10%', '-5%'],
                y: ['-10%', '5%', '-15%'],
                scale: [1, 1.3, 1.1, 1],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute w-[400px] h-[400px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(40,40,40,0.08) 0%, transparent 70%)',
                top: '30%',
                right: '-10%',
              }}
              animate={{
                x: ['0%', '-20%', '5%'],
                y: ['0%', '20%', '-10%'],
                scale: [1, 1.2, 0.9, 1],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute w-[500px] h-[500px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(30,30,30,0.1) 0%, transparent 70%)',
                bottom: '-20%',
                left: '20%',
              }}
              animate={{
                x: ['0%', '15%', '-10%'],
                y: ['0%', '-15%', '10%'],
                scale: [1.1, 0.9, 1.2, 1.1],
              }}
              transition={{
                duration: 35,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Horizontal Scan Lines */}
            <motion.div
              className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ top: ['-5%', '105%'] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ top: ['-10%', '110%'] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear', delay: 3 }}
            />

            {/* Vertical Scan */}
            <motion.div
              className="absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-white/15 to-transparent"
              animate={{ left: ['-5%', '105%'] }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            />

            {/* Noise Overlay */}
            <motion.div
              className="absolute inset-0 opacity-[0.015]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
              }}
              animate={{ opacity: [0.01, 0.02, 0.01] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />

            <AmbientOrbs />
          </div>

        {/* Brutalist Header (Main Menu) */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed top-0 left-0 right-0 z-30 bg-black border-b border-white/10"
        >
          <div className="w-full px-6 py-4 flex justify-between items-center">
            {/* Brand */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white hover:text-white/70 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="font-mono text-xl font-bold text-white tracking-tighter">
                RITEFORGE
              </div>
            </div>

            {/* Main Menu Links */}
            <nav className="hidden md:flex gap-8 items-center">
              <Link href="/create-core" className="font-mono text-xs text-white font-bold border-b border-white transition-colors px-2 py-1 uppercase">CREATE</Link>
              <Link href="/manage" className="font-mono text-xs text-white/50 hover:text-white hover:bg-white hover:text-black transition-colors px-2 py-1 uppercase">MANAGE</Link>
              <Link href="/launchpad" className="font-mono text-xs text-white/50 hover:text-white hover:bg-white hover:text-black transition-colors px-2 py-1 uppercase">LAUNCHPAD</Link>
              <Link href="/portfolio" className="font-mono text-xs text-white/50 hover:text-white hover:bg-white hover:text-black transition-colors px-2 py-1 uppercase">PORTFOLIO</Link>
              <button onClick={() => setShowLiveChat(!showLiveChat)} className="font-mono text-xs text-white/50 hover:text-white hover:bg-white hover:text-black transition-colors px-2 py-1 uppercase">AI CHAT</button>
            </nav>

            {/* Action Button */}
            <div className="flex items-center gap-4">
              <ConnectButton 
                showBalance={false}
                chainStatus="icon"
              />
            </div>
          </div>
        </motion.header>

        {/* Main Content - Centered Prompt */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 relative z-10 pt-32 sm:pt-28 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-3xl"
          >
            {/* Hero Section */}
            <div className="text-center mb-8 sm:mb-12">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/20 mb-4 sm:mb-6"
              >
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                <span className="text-xs sm:text-sm text-white/70 font-mono">Powered by Ritual Chain</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-3 sm:mb-4 tracking-[-0.03em] px-4"
              >
                Build Smart Contracts
                <br />
                <span className="text-white/70">
                  with AI
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-sm sm:text-base md:text-lg text-white/50 max-w-2xl mx-auto tracking-[-0.025em] px-4"
              >
                The only contract builder where AI inference happens on-chain, not off.
                <br className="hidden sm:block" />
                <span className="text-white/40 font-mono text-xs sm:text-sm block sm:inline mt-2 sm:mt-0">Chain ID: 1979 • TEE-Verified • On-Chain AI</span>
              </motion.p>
            </div>

            {/* Main Prompt Input */}
            <motion.form
              onSubmit={handleHomeSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="relative group"
            >
              <div className="relative">
                <textarea
                  value={contractInput}
                  onChange={(e) => setContractInput(e.target.value)}
                  placeholder="Create an ERC-20 token called MyToken with 1M supply and transfer cap per wallet"
                  className="w-full min-h-[120px] sm:min-h-[140px] px-4 sm:px-6 py-4 sm:py-5 bg-white/5 border border-white/20 text-white placeholder-white/30 resize-none focus:outline-none focus:border-white/40 transition-all text-sm sm:text-base tracking-[-0.025em]"
                  rows={4}
                />
                
                {/* Character count - only show when typing */}
                {contractInput.length > 0 && (
                  <div className="absolute bottom-3 sm:bottom-4 left-4 sm:left-6 text-xs text-white/50 font-mono">
                    {contractInput.length} characters
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center sm:justify-center gap-4 sm:gap-4 mt-4">
                <GenerateButton disabled={!contractInput.trim() || isGenerating} loading={isGenerating} />

                <motion.button
                  type="button"
                  onClick={() => {
                    setViewState("analyze")
                    setAnalyzerInput(contractInput)
                  }}
                  disabled={!contractInput.trim() || isGenerating}
                  className="px-6 py-3 bg-[#1f2228] border-2 border-white/20 text-white rounded-xl font-semibold hover:border-emerald-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  whileHover={{ scale: contractInput.trim() && !isGenerating ? 1.02 : 1 }}
                  whileTap={{ scale: contractInput.trim() && !isGenerating ? 0.98 : 1 }}
                >
                  <Shield className="h-5 w-5" />
                </motion.button>
              </div>
            </motion.form>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4"
            >
              <span className="text-xs sm:text-sm text-white/50 font-mono tracking-[0.05em] w-full sm:w-auto text-center sm:text-left mb-2 sm:mb-0">Quick start:</span>
              {[
                "ERC-20 Token",
                "NFT Collection",
                "Staking Contract",
                "DAO Governance"
              ].map((example, i) => (
                <motion.button
                  key={i}
                  onClick={() => setContractInput(`Create a ${example} contract`)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/20 text-white/70 rounded-none text-xs sm:text-sm hover:bg-white hover:text-black transition-all tracking-[-0.025em] font-mono uppercase"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {example}
                </motion.button>
              ))}
              <motion.button
                onClick={() => setViewState("templates")}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 border border-white/20 text-white/70 rounded-none text-xs sm:text-sm hover:bg-white hover:text-black transition-all tracking-[-0.025em] font-mono uppercase"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 inline mr-1" />
                <span className="hidden sm:inline">Browse 20+ Templates</span>
                <span className="sm:hidden">Templates</span>
              </motion.button>
            </motion.div>

            {/* Full Token Lifecycle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-12 sm:mt-16 px-4"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tighter font-mono uppercase">
                  Full Token Lifecycle
                </h2>
                <p className="text-sm sm:text-base text-white/50 tracking-[-0.025em] font-mono">
                  Everything you need to create, secure, and launch your token on Ritual.
                </p>
              </div>

              <div className="border-t border-white/20 max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/10">
                  {[
                    { title: "Create", desc: "Form or AI prompt", num: "01" },
                    { title: "Analyze", desc: "Security review", num: "02" },
                    { title: "Manage", desc: "Mint, burn, lock", num: "03" },
                    { title: "Launch", desc: "Create a sale", num: "04" },
                  ].map((step, i) => (
                    <div key={i} className="bg-white/5 p-6 hover:bg-white/10 transition-colors group cursor-pointer border border-transparent hover:border-white/20">
                      <div className="font-mono text-5xl font-bold mb-4 text-white/20 group-hover:text-white transition-colors">
                        {step.num}
                      </div>
                      <div className="border-t border-white/20 group-hover:border-white/40 mb-4 pt-4">
                        <h3 className="text-lg font-bold font-mono uppercase text-white">{step.title}</h3>
                        <p className="text-xs text-white/50 group-hover:text-white/70 font-mono mt-1">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* How It Works - Live Example */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-12 sm:mt-16 px-4"
            >
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tighter font-mono uppercase">
                  See It In Action
                </h2>
                <p className="text-sm sm:text-base text-white/50 tracking-[-0.025em] font-mono">
                  Real example: from natural language to production-ready code
                </p>
              </div>

              <div className="max-w-6xl mx-auto border border-white/20 bg-black/50">
                <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
                  {/* Input Example */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4 border-b border-white/20 pb-2">
                      <div className="w-8 h-8 bg-white/10 flex items-center justify-center">
                        <MessageCircle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-white font-mono uppercase">Your Request</span>
                    </div>
                    <div className="bg-white/5 border border-white/20 p-4">
                      <p className="text-xs sm:text-sm text-white/70 font-mono leading-relaxed">
                        "Create a staking contract where users can stake tokens, earn 10% APY rewards, and withdraw after 30 days"
                      </p>
                    </div>
                  </div>

                  {/* Output Example */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4 border-b border-white/20 pb-2">
                      <div className="w-8 h-8 bg-white/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-bold text-white font-mono uppercase">Claude's Analysis</span>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white/5 border border-white/20 p-3">
                        <p className="text-xs text-white/50 mb-2 font-mono uppercase">Generated Contract:</p>
                        <code className="text-[10px] sm:text-xs text-white font-mono font-bold">
                          StakingRewards.sol
                        </code>
                      </div>
                      <div className="bg-white/5 border border-white/20 p-3">
                        <p className="text-xs text-white/50 mb-2 font-mono uppercase">Security Risks Found:</p>
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-3 w-3 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <span className="text-[10px] sm:text-xs text-white/70 font-mono">Reentrancy protection needed</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-[10px] sm:text-xs text-white/70 font-mono">Time-lock implemented correctly</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/5 border border-white/20 p-3">
                        <p className="text-xs text-white/50 mb-2 font-mono uppercase">Recommendations:</p>
                        <p className="text-[10px] sm:text-xs text-white/70 leading-relaxed font-mono">
                          "Add ReentrancyGuard from OpenZeppelin. Consider using SafeMath for reward calculations."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Ritual Chain Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 px-4"
            >
              {[
                {
                  icon: <Bot className="h-4 w-4 sm:h-5 sm:w-5" />,
                  title: "On-Chain AI",
                  description: "LLM inference & agent execution",
                },
                {
                  icon: <Shield className="h-4 w-4 sm:h-5 sm:w-5" />,
                  title: "TEE-Verified",
                  description: "Secure enclave computation",
                },
                {
                  icon: <Zap className="h-4 w-4 sm:h-5 sm:w-5" />,
                  title: "Fast Blocks",
                  description: "~350ms block time",
                }
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  className="p-4 sm:p-6 bg-white/5 border border-white/10 hover:border-white/20"
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-white/10 text-white mb-2 sm:mb-3`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-white font-bold mb-1 tracking-[-0.025em] text-sm sm:text-base font-mono uppercase">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-white/50 font-mono">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="relative z-10 border-t border-white/10 bg-black"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-6">
            <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 text-center">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-4 sm:gap-6">
                  <a
                    href="https://docs.ritualfoundation.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors tracking-[-0.025em]"
                  >
                    Docs
                  </a>
                  <a
                    href="https://explorer.ritualfoundation.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors tracking-[-0.025em]"
                  >
                    Explorer
                  </a>
                  <a
                    href="https://faucet.ritualfoundation.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-white/50 hover:text-white transition-colors tracking-[-0.025em]"
                  >
                    Faucet
                  </a>
                </div>
                <div className="text-xs text-white/50 font-mono">
                  Created by{" "}
                  <a 
                    href="https://x.com/rdmnad" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    @rdmnad
                  </a>
                  {" "}•{" "}
                  <span className="text-emerald-400">@therdm</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <span className="text-xs text-white/50 font-mono">Ritual Chain • ID 1979</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs text-emerald-400 font-mono">Live</span>
                </div>
              </div>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
    </>
    )
  }

  // Create Contract View
  if (viewState === "create") {
    return (
      <>
        <Toaster position="top-right" />
        <div className="min-h-screen bg-black text-white flex overflow-hidden relative">
          <Sidebar 
            isOpen={sidebarOpen} 
            setIsOpen={setSidebarOpen} 
            chatHistory={chatHistory}
            currentChatId={currentChatId}
            onChatSelect={loadChatHistory}
            onChatDelete={deleteChatHistory}
            onNewChat={startNewChat}
          />

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white/50 hover:text-white transition-colors flex-shrink-0"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.button>
              
              <motion.button 
                onClick={() => { setViewState("home"); setGeneratedTemplate(null); setContractSummary(null); setContractExplanation(null); setContractInput(""); }}
                className="flex items-center gap-1.5 sm:gap-2.5 text-white hover:opacity-80 transition-opacity min-w-0"
                whileHover={{ x: -2 }}
              >
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="text-sm sm:text-base font-medium tracking-[-0.025em] truncate">RiteForge</span>
              </motion.button>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <Link href="/landing" className="text-white/50 hover:text-white transition-colors text-xs sm:text-sm flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" />
                Home
              </Link>
              <button
                onClick={() => setViewState("analyze")}
                className="text-white/50 hover:text-white transition-colors text-xs sm:text-sm"
              >
                Analyzer
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
          {/* New Prompt Input */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <form onSubmit={(e) => { e.preventDefault(); handleCreateContract(); }} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#2563eb]/20 via-transparent to-[#2563eb]/20 rounded-[28px] blur opacity-0 group-hover:opacity-100 transition-opacity" />
              <input
                type="text"
                value={contractInput}
                onChange={(e) => setContractInput(e.target.value)}
                placeholder="Describe another contract..."
                className="relative w-full rounded-[24px] border border-white/10 bg-white/5 pl-6 pr-16 py-5 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-all tracking-[-0.025em]"
              />
              <motion.button 
                type="submit"
                disabled={isGenerating}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0a0a0a] hover:bg-white/90 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isGenerating ? (
                  <motion.div
                    className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Generated Template */}
          <AnimatePresence>
            {generatedTemplate ? (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <motion.div 
                  className="flex items-center gap-3"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <motion.div 
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, delay: 0.3 }}
                  >
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  </motion.div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-medium tracking-[-0.025em]">Contract Generated for Ritual Testnet</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#2563eb]/10 border border-[#2563eb]/30 text-xs font-medium text-[#2563eb]">
                        <Bot className="h-3 w-3" />
                        AI Generated
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Contract Summary */}
                {contractSummary && (
                  <motion.div 
                    className="border border-[#2563eb]/30 bg-[#2563eb]/5 rounded-xl p-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-[#2563eb] flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-medium text-white tracking-[-0.025em] mb-2">Summary</h3>
                        <p className="text-sm text-white/50 leading-relaxed tracking-[-0.025em]">{contractSummary}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                <motion.div 
                  className="border border-[#1f2228] bg-black rounded-xl overflow-hidden"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="border-b border-[#1f2228] px-3 sm:px-5 py-2 sm:py-3 flex items-center justify-between bg-[#1f2228]/30">
                    <span className="font-mono text-[10px] sm:text-xs tracking-[0.1em] text-white/50 uppercase">Solidity</span>
                    <motion.button 
                      onClick={handleCopy}
                      className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-white/50 hover:text-white transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {copied ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" /> : <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                      {copied ? "Copied!" : "Copy"}
                    </motion.button>
                  </div>
                  <div className="overflow-x-auto max-w-full">
                    <pre className="p-3 sm:p-5 text-[10px] sm:text-xs md:text-sm font-mono text-white/50 leading-relaxed min-w-0">
                      <code className="block whitespace-pre-wrap break-all">{generatedTemplate}</code>
                    </pre>
                  </div>
                </motion.div>

                {/* Contract Explanation */}
                {contractExplanation && (
                  <motion.div 
                    className="border border-[#1f2228] bg-[#1f2228]/20 rounded-xl p-3 sm:p-5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <h3 className="text-xs sm:text-sm font-medium text-white tracking-[-0.025em] mb-2 sm:mb-3 flex items-center gap-2">
                      <Code className="h-3 w-3 sm:h-4 sm:w-4 text-[#2563eb]" />
                      How to Use
                    </h3>
                    <div className="text-xs sm:text-sm text-white/50 leading-relaxed tracking-[-0.025em] space-y-2">
                      {contractExplanation.split('\n').filter(line => line.trim()).map((line, i) => {
                        // Check if line starts with a number (like "1.", "2.", etc.)
                        const isNumberedItem = /^\d+\./.test(line.trim())
                        // Check if line starts with "-" or "*" (bullet point)
                        const isBulletItem = /^[-*]\s/.test(line.trim())
                        
                        // Parse markdown bold (**text**)
                        const parseMarkdown = (text: string) => {
                          const parts = text.split(/(\*\*.*?\*\*)/)
                          return parts.map((part, idx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return (
                                <strong key={idx} className="font-semibold text-white">
                                  {part.slice(2, -2)}
                                </strong>
                              )
                            }
                            return part
                          })
                        }
                        
                        if (isNumberedItem || isBulletItem) {
                          const cleanLine = line.replace(/^[-*\d+\.]\s*/, '')
                          return (
                            <div key={i} className="flex gap-2 pl-2">
                              <span className="text-[#2563eb] flex-shrink-0">•</span>
                              <span>{parseMarkdown(cleanLine)}</span>
                            </div>
                          )
                        } else {
                          return <p key={i}>{parseMarkdown(line)}</p>
                        }
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Ritual Testnet Info */}
                <motion.div 
                  className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <h3 className="text-sm font-medium text-white tracking-[-0.025em] mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-400" />
                    Ritual Testnet Deployment
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-mono text-xs text-emerald-400">Chain ID</span>
                      <p className="text-white/50 mt-1">1979</p>
                    </div>
                    <div>
                      <span className="font-mono text-xs text-emerald-400">Currency</span>
                      <p className="text-white/50 mt-1">RITUAL (18 decimals)</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-mono text-xs text-emerald-400">RPC</span>
                      <p className="text-white/50 mt-1 break-all">https://rpc.ritualfoundation.org</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-mono text-xs text-emerald-400">Explorer</span>
                      <p className="text-white/50 mt-1 break-all">https://explorer.ritualfoundation.org</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="font-mono text-xs text-emerald-400">Faucet</span>
                      <p className="text-white/50 mt-1 break-all">https://faucet.ritualfoundation.org</p>
                    </div>
                  </div>
                </motion.div>

                {/* On-Chain Contract Analysis */}
                <motion.div 
                  className="border border-[#1f2228] bg-[#1f2228]/20 rounded-xl p-5"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <h3 className="text-sm font-medium text-white tracking-[-0.025em] mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    On-Chain Contract Analysis
                    <span className="ml-auto text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/30">
                      Ritual Exclusive
                    </span>
                  </h3>
                  <OnChainAnalyzer contractCode={generatedTemplate || ''} />
                </motion.div>

                <motion.div 
                  className="flex flex-col sm:flex-row gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                >
                  <motion.button
                    onClick={() => { setAnalyzerInput(generatedTemplate || ''); setViewState("analyze"); }}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Shield className="h-4 w-4" />
                    Analyze Security
                  </motion.button>

                  <motion.button
                    onClick={() => setShowTokenCardModal(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Image
                  </motion.button>

                  <motion.button
                    onClick={handleDeploy}
                    disabled={!isConnected || isDeploying}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-black hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: isConnected && !isDeploying ? 1.02 : 1 }}
                    whileTap={{ scale: isConnected && !isDeploying ? 0.98 : 1 }}
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Rocket className="h-4 w-4" />
                        {isConnected ? 'Deploy Contract' : 'Connect Wallet First'}
                      </>
                    )}
                  </motion.button>
                </motion.div>

                {/* Live Chat Section */}
                <motion.div
                  className="border border-white/10 bg-white/5 rounded-xl overflow-hidden"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <button
                    onClick={() => setShowLiveChat(!showLiveChat)}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-semibold text-white">Continue Chatting</h3>
                        <p className="text-xs text-white/50">Ask questions, request changes, or generate new contracts</p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: showLiveChat ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ArrowRight className="h-5 w-5 text-white/50" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showLiveChat && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 500, opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-white/10 overflow-hidden"
                      >
                        <LiveChat
                          initialContext={generatedTemplate || undefined}
                          onCodeGenerated={(code, summary, explanation) => {
                            setGeneratedTemplate(code)
                            setContractSummary(summary)
                            setContractExplanation(explanation)
                            toast.success("Contract updated from chat!")
                          }}
                          onAnalysisComplete={(result) => {
                            setAnalysisResult(result)
                            toast.success("Analysis complete!")
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                className="text-center py-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
                  <Code className="h-8 w-8 text-white/50" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No Contract Generated Yet</h3>
                <p className="text-sm text-white/50 mb-6">Enter a description above to generate a smart contract</p>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-black px-4 sm:px-6 py-6">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="font-mono text-sm text-white/50">RITEFORGE</div>
            <div className="flex items-center gap-6">
              <Link href="/landing" className="text-xs text-white/50 hover:text-white transition-colors">Home</Link>
              <a href="https://docs.ritualfoundation.org" target="_blank" rel="noopener noreferrer" className="text-xs text-white/50 hover:text-white transition-colors">Docs</a>
              <a href="https://explorer.ritualfoundation.org" target="_blank" rel="noopener noreferrer" className="text-xs text-white/50 hover:text-white transition-colors">Explorer</a>
            </div>
            <div className="text-xs text-white/30">© 2026 RiteForge</div>
          </div>
        </footer>
          </div>

          {/* Deployment Modal */}
          <AnimatePresence>
            {showDeployModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
                onClick={() => !isDeploying && setShowDeployModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-2xl bg-black border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-h-[90vh] sm:max-h-[80vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-2xl font-bold text-white tracking-[-0.025em]">Deploy to Ritual Chain</h2>
                    <button
                      onClick={() => setShowDeployModal(false)}
                      disabled={isDeploying}
                      className="text-white/50 hover:text-white transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    {/* Deployment Status */}
                    {deploymentStatus !== 'idle' && (
                      <div className={`rounded-xl p-4 sm:p-5 border ${
                        deploymentStatus === 'compiling' ? 'bg-[#2563eb]/10 border-[#2563eb]/30' :
                        deploymentStatus === 'deploying' ? 'bg-amber-500/10 border-amber-500/30' :
                        deploymentStatus === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' :
                        'bg-red-500/10 border-red-500/30'
                      }`}>
                        <div className="flex items-start gap-2 sm:gap-3">
                          {deploymentStatus === 'compiling' && (
                            <>
                              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#2563eb] animate-spin mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">Compiling Contract...</h3>
                                <p className="text-xs sm:text-sm text-white/50">Using solc to compile your Solidity code</p>
                              </div>
                            </>
                          )}
                          {deploymentStatus === 'deploying' && (
                            <>
                              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 animate-spin mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">Deploying to Ritual Chain...</h3>
                                <p className="text-xs sm:text-sm text-white/50">Please confirm the transaction in your wallet</p>
                              </div>
                            </>
                          )}
                          {deploymentStatus === 'success' && deploymentData.contractAddress && (
                            <>
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Contract Deployed Successfully!</h3>
                                
                                <div className="space-y-2 sm:space-y-3">
                                  <div>
                                    <span className="text-xs text-white/50">Contract Address</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <code className="text-xs sm:text-sm text-white font-mono bg-black/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex-1 break-all">
                                        {deploymentData.contractAddress}
                                      </code>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(deploymentData.contractAddress!)
                                          toast.success('Address copied!')
                                        }}
                                        className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                                      >
                                        <Copy className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400" />
                                      </button>
                                    </div>
                                  </div>

                                  {deploymentData.transactionHash && (
                                    <div>
                                      <span className="text-xs text-white/50">Transaction Hash</span>
                                      <div className="flex items-center gap-2 mt-1">
                                        <code className="text-xs sm:text-sm text-white font-mono bg-black/50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex-1 break-all">
                                          {deploymentData.transactionHash}
                                        </code>
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(deploymentData.transactionHash!)
                                            toast.success('Hash copied!')
                                          }}
                                          className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                                        >
                                          <Copy className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-400" />
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  <a
                                    href={`https://explorer.ritualfoundation.org/address/${deploymentData.contractAddress}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-xs sm:text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                                  >
                                    View on Ritual Explorer
                                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </a>
                                </div>
                              </div>
                            </>
                          )}
                          {deploymentStatus === 'error' && (
                            <>
                              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-white font-semibold mb-1 text-sm sm:text-base">Deployment Failed</h3>
                                <p className="text-xs sm:text-sm text-red-400 font-mono bg-black/50 p-2 sm:p-3 rounded-lg mt-2 break-all">
                                  {deploymentData.error || 'Unknown error occurred'}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Alternative Options */}
                    {deploymentStatus === 'idle' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          <motion.button
                            onClick={() => {
                              if (generatedTemplate) {
                                openInRemix(generatedTemplate)
                                toast.success('Opening in Remix IDE...')
                              }
                            }}
                            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Rocket className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="hidden sm:inline">Open in Remix IDE</span>
                            <span className="sm:hidden">Remix IDE</span>
                          </motion.button>

                          <motion.button
                            onClick={() => {
                              if (generatedTemplate) {
                                const contractName = generatedTemplate.match(/contract\s+(\w+)/)?.[1] || 'Contract'
                                exportToRemix(generatedTemplate, contractName)
                                toast.success('Contract downloaded!')
                              }
                            }}
                            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-[#2563eb]/10 border border-[#2563eb]/30 text-[#2563eb] rounded-lg hover:bg-[#2563eb]/20 transition-colors text-sm"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span className="hidden sm:inline">Download .sol File</span>
                            <span className="sm:hidden">Download</span>
                          </motion.button>
                        </div>

                        <div className="bg-black border border-[#1f2228] rounded-xl p-4 sm:p-5">
                          <h3 className="text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">Alternative Deployment Methods</h3>
                          <div className="space-y-2 sm:space-y-3 text-xs text-white/50">
                            <div>
                              <span className="text-white font-medium text-[10px] sm:text-xs">Foundry:</span>
                              <div className="overflow-x-auto max-w-full">
                                <pre className="bg-black/50 border border-[#1f2228] rounded-lg p-2 mt-1 font-mono text-[10px] sm:text-xs min-w-0">
                                  <code className="block whitespace-pre-wrap break-all">forge create src/Contract.sol:Name --rpc-url https://rpc.ritualfoundation.org</code>
                                </pre>
                              </div>
                            </div>
                            <div>
                              <span className="text-white font-medium text-[10px] sm:text-xs">Hardhat:</span>
                              <div className="overflow-x-auto max-w-full">
                                <pre className="bg-black/50 border border-[#1f2228] rounded-lg p-2 mt-1 font-mono text-[10px] sm:text-xs min-w-0">
                                  <code className="block whitespace-pre-wrap break-all">npx hardhat run scripts/deploy.js --network ritual</code>
                                </pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Ritual Chain Info */}
                    <div className="bg-white/5 border border-white/20 rounded-xl p-4 sm:p-5">
                      <h3 className="text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">Ritual Chain</h3>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
                        <div>
                          <span className="text-white/50">Chain ID</span>
                          <p className="text-white font-mono mt-1">1979</p>
                        </div>
                        <div>
                          <span className="text-white/50">Currency</span>
                          <p className="text-white font-mono mt-1">RITUAL</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-white/50">RPC URL</span>
                          <p className="text-white font-mono mt-1 break-all text-[10px] sm:text-xs">https://rpc.ritualfoundation.org</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-white/50">Faucet</span>
                          <a 
                            href="https://faucet.ritualfoundation.org" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 font-mono mt-1 inline-flex items-center gap-1 text-xs"
                          >
                            Get testnet tokens
                            <ArrowRight className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                      {deploymentStatus === 'success' && (
                        <button
                          onClick={() => {
                            setShowDeployModal(false)
                            setDeploymentStatus('idle')
                            setDeploymentData({})
                          }}
                          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors text-sm"
                        >
                          Done
                        </button>
                      )}
                      {deploymentStatus === 'error' && (
                        <>
                          <button
                            onClick={() => {
                              setDeploymentStatus('idle')
                              setDeploymentData({})
                            }}
                            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white/5 border border-white/20 text-white rounded-lg font-medium hover:bg-white/10 transition-colors text-sm"
                          >
                            Try Again
                          </button>
                          <button
                            onClick={() => {
                              setShowDeployModal(false)
                              setDeploymentStatus('idle')
                              setDeploymentData({})
                            }}
                            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors text-sm"
                          >
                            Close
                          </button>
                        </>
                      )}
                      {deploymentStatus === 'idle' && (
                        <button
                          onClick={() => setShowDeployModal(false)}
                          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white text-black rounded-lg font-medium hover:bg-white/90 transition-colors text-sm"
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Contract Card Modal */}
          <ContractCardModal
            isOpen={showTokenCardModal}
            onClose={() => setShowTokenCardModal(false)}
            contractName={generatedTemplate ? extractTokenInfo(generatedTemplate, contractInput).name : 'Contract'}
            contractAddress={deploymentData.contractAddress}
            chainId={1979}
          />
        </div>
      </>
    )
  }

  // Firewall Analyzer View
  if (viewState === "analyze") {
    return (
      <>
        <Toaster position="top-right" />
        <motion.div
        className="min-h-screen bg-black text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
          <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-white/50 hover:text-white transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Menu className="h-5 w-5" />
              </motion.button>
              
              <motion.button 
                onClick={() => { setViewState("home"); setAnalysisResult(null); setAnalyzerInput(""); }}
                className="flex items-center gap-2.5 text-white hover:opacity-80 transition-opacity"
                whileHover={{ x: -2 }}
              >
                <ArrowLeft className="h-4 w-4" />
                <Zap className="h-5 w-5" />
                <span className="text-base font-medium tracking-[-0.025em]">RiteForge</span>
              </motion.button>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setViewState("home")}
                className="text-white/50 hover:text-white transition-colors text-sm"
              >
                Create
              </button>
              <button 
                onClick={() => setViewState("registry")}
                className="text-white/50 hover:text-white transition-colors text-sm"
              >
                Registry
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-medium text-white tracking-[-0.025em] mb-2">Firewall Analyzer</h1>
            <p className="text-white/50 text-base tracking-[-0.025em]">
              Detect rugpulls, honeypots & hidden privileges before you ape in 🚨
            </p>
          </motion.div>

          {/* Input */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 rounded-lg border border-[#2563eb]/30 bg-[#2563eb]/10 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <Bot className="h-5 w-5 text-[#2563eb] animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm text-white font-medium">AI is analyzing security...</p>
                    <p className="text-xs text-white/50 mt-1">Checking for vulnerabilities and risks</p>
                  </div>
                </div>
              </motion.div>
            )}
            
            <textarea
              placeholder="Paste contract code, transaction data, or ABI here..."
              className="w-full min-h-48 rounded-2xl border border-white/10 bg-white/5 px-6 py-5 text-base text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none font-mono text-sm tracking-normal transition-colors"
              value={analyzerInput}
              onChange={(e) => setAnalyzerInput(e.target.value)}
            />
            <motion.button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || !analyzerInput.trim()}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-medium text-[#0a0a0a] hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: isAnalyzing ? 1 : 1.01 }}
              whileTap={{ scale: isAnalyzing ? 1 : 0.99 }}
            >
              {isAnalyzing ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-[#0a0a0a] border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Analyzing...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Analyze Contract
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Analysis Results */}
          <AnimatePresence>
            {analysisResult && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* Critical Warning Banner for Low Scores */}
                {analysisResult.score < 40 && (
                  <motion.div
                    className="border-2 border-red-500 bg-red-500/10 rounded-xl p-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20">
                          <AlertTriangle className="h-6 w-6 text-red-400 animate-pulse" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-red-400 mb-2">⚠️ DANGER: Potential Scam Detected</h3>
                        <p className="text-sm text-red-300 mb-3">
                          This contract shows signs of a <strong>rugpull</strong>, <strong>honeypot</strong>, or contains <strong>hidden privileges</strong>. 
                          DO NOT interact with this contract unless you fully understand the risks.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-xs font-medium text-red-400">
                            🚨 Rugpull Risk
                          </span>
                          <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-xs font-medium text-red-400">
                            🍯 Honeypot Pattern
                          </span>
                          <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-xs font-medium text-red-400">
                            🔐 Hidden Privileges
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Warning Banner for Medium Risk */}
                {analysisResult.score >= 40 && analysisResult.score < 70 && (
                  <motion.div
                    className="border border-amber-500/50 bg-amber-500/10 rounded-xl p-5"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-base font-semibold text-amber-400 mb-1">⚠️ Proceed with Caution</h3>
                        <p className="text-sm text-amber-300">
                          This contract has some concerning patterns. Review the risks carefully before interacting.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Safety Score */}
                <motion.div 
                  className="border border-[#1f2228] bg-gradient-to-br from-[#1f2228]/50 to-transparent rounded-2xl p-8"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs tracking-[0.1em] text-white/50 uppercase mb-3">Safety Score</p>
                      <motion.p 
                        className="text-6xl font-medium text-white tracking-[-0.025em]"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                      >
                        {analysisResult.score}
                      </motion.p>
                      <p className="text-sm text-white/50 mt-2">
                        {analysisResult.score >= 80 ? "✅ Safe to interact" :
                         analysisResult.score >= 70 ? "⚠️ Low risk" :
                         analysisResult.score >= 40 ? "⚠️ Medium risk" :
                         "🚨 High risk - Avoid"}
                      </p>
                    </div>
                    <motion.div 
                      className={`flex h-20 w-20 items-center justify-center rounded-full ${
                        analysisResult.score >= 80 ? "bg-emerald-500/20" : 
                        analysisResult.score >= 50 ? "bg-amber-500/20" : "bg-red-500/20"
                      }`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.4 }}
                    >
                      {analysisResult.score >= 70 ? (
                        <CheckCircle className={`h-10 w-10 ${
                          analysisResult.score >= 80 ? "text-emerald-400" : "text-amber-400"
                        }`} />
                      ) : (
                        <AlertTriangle className="h-10 w-10 text-red-400" />
                      )}
                    </motion.div>
                  </div>
                </motion.div>

                {/* Explanation */}
                <motion.div 
                  className="border border-[#1f2228] bg-[#1f2228]/20 rounded-2xl p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="text-lg font-medium text-white tracking-[-0.025em] mb-4">What This Contract Does</h3>
                  <p className="text-white/50 text-base leading-relaxed tracking-[-0.025em]">{analysisResult.explanation}</p>
                </motion.div>

                {/* Risk Warnings */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-white tracking-[-0.025em]">Risk Assessment</h3>
                  {analysisResult.risks.map((risk, i) => (
                    <motion.div 
                      key={i} 
                      className={`flex items-start gap-4 p-5 rounded-xl border ${
                        risk.level === "critical" ? "border-red-600/50 bg-red-600/10" :
                        risk.level === "high" ? "border-red-500/30 bg-red-500/5" :
                        risk.level === "medium" ? "border-amber-500/30 bg-amber-500/5" :
                        "border-emerald-500/30 bg-emerald-500/5"
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                    >
                      <AlertTriangle className={`h-5 w-5 mt-0.5 shrink-0 ${
                        risk.level === "critical" ? "text-red-500 animate-pulse" :
                        risk.level === "high" ? "text-red-400" :
                        risk.level === "medium" ? "text-amber-400" : 
                        "text-emerald-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white capitalize mb-1">
                          {risk.level === "critical" ? "🚨 CRITICAL" : 
                           risk.level === "high" ? "⚠️ HIGH" :
                           risk.level === "medium" ? "⚠️ MEDIUM" : 
                           "✓ LOW"} Risk
                        </p>
                        <p className="text-sm text-white/50 break-words">{risk.message}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Permissions */}
                <motion.div 
                  className="border border-[#1f2228] bg-[#1f2228]/20 rounded-2xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <h3 className="text-lg font-medium text-white tracking-[-0.025em] mb-4">Required Permissions</h3>
                  <ul className="space-y-3">
                    {analysisResult.permissions.map((perm, i) => (
                      <motion.li 
                        key={i} 
                        className="flex items-center gap-3 text-white/50 text-base tracking-[-0.025em]"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                      >
                        <div className="h-2 w-2 rounded-full bg-[#2563eb]" />
                        {perm}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                {/* Actions */}
                <motion.div 
                  className="flex gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <motion.button 
                    onClick={() => { setAnalysisResult(null); setAnalyzerInput(""); }}
                    className="flex-1 rounded-full border border-white/20 bg-transparent px-6 py-3.5 text-base font-medium text-white hover:bg-white/5 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Clear
                  </motion.button>
                  <motion.button 
                    className="flex-1 rounded-full bg-emerald-500 px-6 py-3.5 text-base font-medium text-white hover:bg-emerald-600 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Proceed with Execution
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </motion.div>
      </>
    )
  }

  // Templates Library View
  if (viewState === "templates") {
    const categories = ["All", "Token", "NFT", "DeFi", "DAO", "Gaming", "Utility", "Oracle"]
    
    const filteredTemplates = contractTemplates.filter(template => {
      const matchesCategory = selectedCategory === "All" || template.category === selectedCategory
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesSearch
    })
    
    return (
      <>
        <Toaster position="top-right" />
        <motion.div
          className="min-h-screen bg-black text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Header */}
          <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
              <motion.button 
                onClick={() => setViewState("home")}
                className="flex items-center gap-2.5 text-white hover:opacity-80 transition-opacity"
                whileHover={{ x: -2 }}
              >
                <ArrowLeft className="h-4 w-4" />
                <Zap className="h-5 w-5" />
                <span className="text-base font-medium tracking-[-0.025em]">RiteForge</span>
              </motion.button>
              <ConnectButton showBalance={false} />
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
            {/* Header */}
            <motion.div 
              className="mb-6 sm:mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 rounded-xl bg-[#1f2228] border border-white/20">
                  <Code className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-4xl font-medium text-white tracking-[-0.025em] mb-2">Contract Templates</h1>
              <p className="text-white/50 text-sm sm:text-base tracking-[-0.025em]">
                22 production-ready smart contract templates for Ritual Chain
              </p>
            </motion.div>

            {/* Search and Filter */}
            <motion.div
              className="mb-6 sm:mb-8 space-y-3 sm:space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-[#1f2228] border border-white/20 rounded-xl text-sm sm:text-base text-white placeholder:text-white/50 focus:outline-none focus:border-emerald-400/50 transition-colors"
              />
              
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-[#1f2228] text-white/50 border border-white/20 hover:border-emerald-400/30"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Templates Grid */}
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {filteredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  className="p-4 sm:p-6 bg-[#1f2228] border border-white/20 rounded-xl hover:border-emerald-400/50 transition-all cursor-pointer group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                  onClick={() => {
                    setContractInput(template.code)
                    setGeneratedTemplate(template.code)
                    setContractSummary(template.description)
                    setContractExplanation(`${template.name} - ${template.description}`)
                    setViewState("create")
                    toast.success(`Loaded ${template.name} template!`)
                  }}
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      {template.name}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ml-2 ${
                      template.difficulty === "Beginner" ? "bg-emerald-500/10 text-emerald-400" :
                      template.difficulty === "Intermediate" ? "bg-blue-500/10 text-blue-400" :
                      "bg-purple-500/10 text-purple-400"
                    }`}>
                      {template.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-white/50 mb-3 sm:mb-4">
                    {template.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 sm:py-1 bg-black border border-white/20 rounded text-xs text-white/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span className="font-mono">{template.category}</span>
                    <span className="text-emerald-400 group-hover:translate-x-1 transition-transform">
                      Use Template →
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-16">
                <Code className="h-12 w-12 text-[#474747] mx-auto mb-4" />
                <p className="text-white/50">No templates found matching your search</p>
              </div>
            )}
          </main>
        </motion.div>
      </>
    )
  }

  // Prompt Registry View
  return (
    <>
      <Toaster position="top-right" />
      <motion.div 
      className="min-h-screen bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <motion.button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white/50 hover:text-white transition-colors flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </motion.button>
            
            <motion.button 
              onClick={() => setViewState("home")}
              className="flex items-center gap-1.5 sm:gap-2.5 text-white hover:opacity-80 transition-opacity min-w-0"
              whileHover={{ x: -2 }}
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="text-sm sm:text-base font-medium tracking-[-0.025em] truncate">RiteForge</span>
            </motion.button>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewState("home")}
              className="text-white/50 hover:text-white transition-colors text-sm"
            >
              Create
            </button>
            <button 
              onClick={() => setViewState("analyze")}
              className="text-white/50 hover:text-white transition-colors text-sm"
            >
              Analyzer
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <motion.div 
          className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-medium text-white tracking-[-0.025em] mb-2">Prompt Registry</h1>
            <p className="text-white/50 text-base tracking-[-0.025em]">
              Community-curated prompts for secure smart contracts
            </p>
          </div>
          <motion.button 
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#0a0a0a] hover:bg-white/90 transition-colors shrink-0"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Submit Prompt
          </motion.button>
        </motion.div>

        {/* Prompts List */}
        <motion.div 
          className="space-y-3"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          {prompts
            .sort((a, b) => b.voteCount - a.voteCount)
            .map((prompt, index) => (
              <motion.div 
                key={prompt.id} 
                className="group bg-[#1f2228]/30 hover:bg-[#1f2228]/50 border border-[#1f2228] hover:border-white/20 rounded-2xl p-6 flex items-start gap-6 transition-all"
                variants={fadeIn}
                custom={index}
                whileHover={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {/* Voting */}
                <div className="flex flex-col items-center gap-1.5 pt-1">
                  <motion.button 
                    onClick={() => handleVote(prompt.id, "up")}
                    className="text-white/50 hover:text-emerald-400 transition-colors p-1"
                    whileHover={{ scale: 1.2, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </motion.button>
                  <motion.span 
                    className="text-sm font-mono text-white tracking-[0.05em] min-w-[2.5rem] text-center"
                    key={prompt.voteCount}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {prompt.voteCount}
                  </motion.span>
                  <motion.button 
                    onClick={() => handleVote(prompt.id, "down")}
                    className="text-white/50 hover:text-red-400 transition-colors p-1"
                    whileHover={{ scale: 1.2, y: 2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </motion.button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-medium text-white tracking-[-0.025em] group-hover:text-white/90">{prompt.title}</h3>
                    <span className="shrink-0 font-mono text-xs tracking-[0.05em] text-white/50 bg-[#1f2228] px-2 py-1 rounded">
                      {prompt.author}
                    </span>
                  </div>
                  <p className="text-white/50 text-base mb-4 tracking-[-0.025em]">{prompt.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {prompt.tags.map((tag) => (
                      <motion.span 
                        key={tag} 
                        className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-xs tracking-[0.05em] uppercase ${
                          tag === "Safe" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          tag === "Useful" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          tag === "Popular" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        }`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Use Button */}
                <motion.button 
                  onClick={() => { setContractInput(prompt.description); setViewState("home"); }}
                  className="shrink-0 rounded-full border border-white/20 bg-transparent px-5 py-2.5 text-sm font-medium text-white hover:bg-white hover:text-[#0a0a0a] transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Use
                </motion.button>
              </motion.div>
            ))}
        </motion.div>
      </main>
    </motion.div>
    </>
  )
}
