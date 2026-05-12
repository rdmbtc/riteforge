"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import styled from 'styled-components'
import { Send, Bot, User, Loader2, Sparkles, Code, Shield } from "lucide-react"
import { generateSmartContract, analyzeContract } from "@/lib/ai-api"
import toast from "react-hot-toast"
import { ChatInput } from "./styled-chat-input"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  type?: "text" | "code" | "analysis"
  metadata?: {
    code?: string
    summary?: string
    explanation?: string
    analysisResult?: any
  }
}

interface LiveChatProps {
  initialContext?: string
  onCodeGenerated?: (code: string, summary: string, explanation: string) => void
  onAnalysisComplete?: (result: any) => void
}

export function LiveChat({ initialContext, onCodeGenerated, onAnalysisComplete }: LiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Add initial context message if provided
  useEffect(() => {
    if (initialContext && messages.length === 0) {
      setMessages([
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `I've generated your contract. Feel free to ask me questions about it, request modifications, or generate something new!`,
          timestamp: new Date(),
          type: "text"
        }
      ])
    }
  }, [initialContext])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      type: "text"
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Detect intent from user message
      const lowerInput = input.toLowerCase()
      const isCodeRequest = lowerInput.includes("create") || 
                           lowerInput.includes("generate") || 
                           lowerInput.includes("build") ||
                           lowerInput.includes("make") ||
                           lowerInput.includes("write")
      
      const isAnalysisRequest = lowerInput.includes("analyze") || 
                               lowerInput.includes("security") || 
                               lowerInput.includes("check") ||
                               lowerInput.includes("audit") ||
                               lowerInput.includes("safe")

      if (isCodeRequest) {
        // Generate contract
        const result = await generateSmartContract(input)
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.summary || "I've generated a smart contract based on your request.",
          timestamp: new Date(),
          type: "code",
          metadata: {
            code: result.code,
            summary: result.summary,
            explanation: result.explanation
          }
        }

        setMessages(prev => [...prev, assistantMessage])
        
        // Notify parent component
        if (onCodeGenerated) {
          onCodeGenerated(result.code, result.summary, result.explanation)
        }

        toast.success("Contract generated!")
      } else if (isAnalysisRequest) {
        // Analyze contract (use last generated code or ask for code)
        const lastCodeMessage = [...messages].reverse().find(m => m.metadata?.code)
        
        if (lastCodeMessage?.metadata?.code) {
          const result = await analyzeContract(lastCodeMessage.metadata.code)
          
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: result.explanation,
            timestamp: new Date(),
            type: "analysis",
            metadata: {
              analysisResult: result
            }
          }

          setMessages(prev => [...prev, assistantMessage])
          
          if (onAnalysisComplete) {
            onAnalysisComplete(result)
          }

          toast.success("Analysis complete!")
        } else {
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "I don't see any contract code to analyze. Could you generate a contract first, or paste the code you'd like me to analyze?",
            timestamp: new Date(),
            type: "text"
          }
          setMessages(prev => [...prev, assistantMessage])
        }
      } else {
        // General conversation - use AI API for actual response
        try {
          const conversationMessages = [
            {
              role: 'system' as const,
              content: 'You are RiteForge AI assistant. Help users with smart contract questions, explain Solidity concepts, and guide them through contract development. Be concise and helpful.'
            },
            ...messages.map(m => ({
              role: m.role,
              content: m.content
            })),
            {
              role: 'user' as const,
              content: input
            }
          ];

          const { chatCompletion } = await import('@/lib/ai-api');
          const response = await chatCompletion(conversationMessages, {
            temperature: 0.7,
            max_tokens: 500
          });

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: response.choices[0].message.content,
            timestamp: new Date(),
            type: "text"
          }
          setMessages(prev => [...prev, assistantMessage])
        } catch (error) {
          console.error('Chat error:', error);
          // Fallback to helpful template
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: `I can help you with:\n\n• **Generate contracts** - Just describe what you want to build\n• **Analyze security** - Ask me to check any contract for vulnerabilities\n• **Explain code** - Ask questions about how contracts work\n• **Modify contracts** - Request changes to existing code\n\nWhat would you like to do?`,
            timestamp: new Date(),
            type: "text"
          }
          setMessages(prev => [...prev, assistantMessage])
        }
      }
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I encountered an error processing your request. Please try again or rephrase your question.",
        timestamp: new Date(),
        type: "text"
      }
      setMessages(prev => [...prev, errorMessage])
      toast.error("Failed to process message")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Parse markdown formatting (bold, italic, code)
  const parseMarkdown = (text: string) => {
    const parts: React.ReactNode[] = []
    let lastIndex = 0
    
    // Match **bold**, *italic*, and `code`
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g
    let match
    
    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }
      
      const matched = match[0]
      if (matched.startsWith('**') && matched.endsWith('**')) {
        // Bold
        parts.push(
          <strong key={match.index} className="font-semibold text-white">
            {matched.slice(2, -2)}
          </strong>
        )
      } else if (matched.startsWith('*') && matched.endsWith('*')) {
        // Italic
        parts.push(
          <em key={match.index} className="italic">
            {matched.slice(1, -1)}
          </em>
        )
      } else if (matched.startsWith('`') && matched.endsWith('`')) {
        // Inline code
        parts.push(
          <code key={match.index} className="px-1.5 py-0.5 bg-[#0c0c0b] border border-[#1f2228] rounded text-xs font-mono text-emerald-400">
            {matched.slice(1, -1)}
          </code>
        )
      }
      
      lastIndex = regex.lastIndex
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }
    
    return parts.length > 0 ? parts : text
  }

  // Format message content with markdown and line breaks
  const formatMessageContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {parseMarkdown(line)}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-black">
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
          <p className="text-xs text-white/50">Ask me anything about smart contracts</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              
              <div className={`max-w-[80%] ${message.role === "user" ? "order-first" : ""}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-white text-black"
                      : "bg-white/5 text-white border border-white/10"
                  }`}
                >
                  {message.type === "code" && message.metadata?.code ? (
                    <div className="space-y-2">
                      <p className="text-sm mb-3">{message.content}</p>
                      <div className="bg-black border border-white/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Code className="h-3 w-3 text-white" />
                          <span className="text-xs font-mono text-white/70">Generated Contract</span>
                        </div>
                        <pre className="text-xs font-mono text-white/50 overflow-x-auto max-h-40">
                          <code>{message.metadata.code.slice(0, 300)}...</code>
                        </pre>
                      </div>
                    </div>
                  ) : message.type === "analysis" && message.metadata?.analysisResult ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-white" />
                        <span className="text-sm font-semibold">Security Analysis</span>
                      </div>
                      <p className="text-sm mb-2">{message.content}</p>
                      <div className="bg-black border border-white/10 rounded-lg p-3">
                        <div className="text-2xl font-bold text-white mb-1">
                          {message.metadata.analysisResult.score}/100
                        </div>
                        <p className="text-xs text-white/50">Security Score</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm">{formatMessageContent(message.content)}</div>
                  )}
                </div>
                <p className="text-xs text-white/50 mt-1 px-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span className="text-sm text-white/50">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-black">
        <ChatInput
          placeholder="Ask me anything about smart contracts..."
          onSend={(message) => {
            if (!message.trim() || isLoading) return
            setInput(message)
            const fakeEvent = { preventDefault: () => {} } as React.FormEvent
            handleSubmit(fakeEvent)
          }}
        />
      </div>
    </div>
  )
}
