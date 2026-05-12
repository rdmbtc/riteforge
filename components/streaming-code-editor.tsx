"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Sparkles, CheckCircle, XCircle, Zap, Code, FileText } from "lucide-react"

interface StreamingCodeEditorProps {
  code: string
  summary?: string
  explanation?: string
  status?: string
  isStreaming: boolean
  error?: string | null
}

const loadingSteps = [
  "Analyzing request...",
  "Finding best model...",
  "Generating contract...",
  "Optimizing code...",
  "Adding documentation...",
  "Finalizing...",
]

export function StreamingCodeEditor({
  code,
  summary,
  explanation,
  status,
  isStreaming,
  error,
}: StreamingCodeEditorProps) {
  const codeRef = useRef<HTMLPreElement>(null)
  const shouldAutoScroll = useRef(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [dots, setDots] = useState("")

  // Auto-scroll to bottom as code streams in
  useEffect(() => {
    if (shouldAutoScroll.current && codeRef.current) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight
    }
  }, [code])

  // Animate loading steps and dots
  useEffect(() => {
    if (!isStreaming) {
      setCurrentStep(loadingSteps.length - 1)
      setProgress(100)
      return
    }

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => Math.min(prev + 1, loadingSteps.length - 1))
    }, 1500)

    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".")
    }, 400)

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.random() * 15, 95))
    }, 800)

    return () => {
      clearInterval(stepInterval)
      clearInterval(dotsInterval)
      clearInterval(progressInterval)
    }
  }, [isStreaming])

  // Detect manual scroll
  const handleScroll = () => {
    if (codeRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = codeRef.current
      shouldAutoScroll.current = scrollTop + clientHeight >= scrollHeight - 50
    }
  }

  return (
    <div className="space-y-4">
      {/* Animated Status Bar */}
      <AnimatePresence mode="wait">
        {isStreaming && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-black/50 p-4"
          >
            {/* Progress background */}
            <motion.div
              className="absolute inset-0 bg-white/5"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />

            <div className="relative flex flex-col gap-3">
              {/* Header with icon and status */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Zap className="h-5 w-5 text-white" />
                  </motion.div>
                  <motion.div
                    className="absolute inset-0"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Zap className="h-5 w-5 text-white/50" />
                  </motion.div>
                </div>
                <div className="flex-1">
                  <motion.p
                    key={currentStep}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm font-medium text-white"
                  >
                    {loadingSteps[currentStep]}{dots}
                  </motion.p>
                </div>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs text-white/50 font-mono"
                >
                  {Math.round(progress)}%
                </motion.div>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Animated dots pattern */}
              <div className="flex items-center gap-1">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-white/30"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10"
          >
            <XCircle className="h-5 w-5 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
          </motion.div>
        )}

        {!isStreaming && !error && code && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-3 rounded-xl border border-white/10 bg-white/5"
          >
            <CheckCircle className="h-5 w-5 text-white" />
            <span className="text-sm text-white/70">Contract ready</span>
            <span className="text-xs text-white/30 ml-auto">{code.length} chars</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Code Display */}
      <div className="relative">
        {/* Streaming indicator */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full"
          >
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Sparkles className="h-3 w-3 text-white" />
            </motion.div>
            <span className="text-xs text-white/70 font-medium">Writing...</span>
          </motion.div>
        )}

        <motion.pre
          ref={codeRef}
          onScroll={handleScroll}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative bg-black/80 border border-white/10 rounded-xl p-4 overflow-auto max-h-[500px] overflow-y-auto"
        >
          <code className="text-xs sm:text-sm font-mono text-white/80 whitespace-pre-wrap break-words">
            {code || "// Code will appear here..."}
            {isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-2 h-4 bg-white/50 ml-1"
              />
            )}
          </code>
        </motion.pre>
      </div>

      {/* Summary & Explanation */}
      <AnimatePresence>
        {(summary || explanation) && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid gap-3"
          >
            {summary && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-xl border border-white/10 bg-white/5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-white/50" />
                  <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Summary</span>
                </div>
                <p className="text-sm text-white/70">{summary}</p>
              </motion.div>
            )}

            {explanation && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-xl border border-white/10 bg-white/5"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4 text-white/50" />
                  <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Explanation</span>
                </div>
                <p className="text-sm text-white/70">{explanation}</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}