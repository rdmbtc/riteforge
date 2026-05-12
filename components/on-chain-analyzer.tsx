"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Zap, CheckCircle, AlertTriangle, Loader2, ExternalLink, Sparkles, TrendingUp, FileCode } from "lucide-react"
import { useAccount, useWalletClient } from "wagmi"
import toast from "react-hot-toast"
import { analyzeContractOnChain, analyzeContractOffChain, type LLMAnalysisResult } from "@/lib/ritual-llm"
import { RITUAL_EXPLORER_URL } from "@/lib/ritual-config"

interface OnChainAnalyzerProps {
  contractCode: string
  onAnalysisComplete?: (result: LLMAnalysisResult) => void
}

export function OnChainAnalyzer({ contractCode, onAnalysisComplete }: OnChainAnalyzerProps) {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<LLMAnalysisResult | null>(null)
  const [analysisType, setAnalysisType] = useState<'security' | 'gas' | 'best-practices' | 'full'>('full')

  const handleAnalyze = async (useOnChain: boolean = true) => {
    if (!contractCode.trim()) {
      toast.error('No contract code to analyze')
      return
    }

    if (useOnChain && !isConnected) {
      toast.error('Please connect your wallet for on-chain analysis')
      return
    }

    setIsAnalyzing(true)
    setAnalysisResult(null)

    const toastId = toast.loading(
      useOnChain 
        ? '🔗 Analyzing on-chain with TEE verification...' 
        : '🤖 Analyzing with AI...',
      {
        style: {
          background: '#1f2228',
          color: '#ffffff',
          border: useOnChain ? '1px solid #10b981' : '1px solid #3b82f6',
          borderRadius: '12px',
        },
      }
    )

    try {
      let result: LLMAnalysisResult

      if (useOnChain && walletClient) {
        // On-chain analysis using LLM precompile
        result = await analyzeContractOnChain({
          contractCode,
          analysisType,
          walletClient,
        })
      } else {
        // Fallback to off-chain AI API
        result = await analyzeContractOffChain(contractCode, analysisType)
      }

      setAnalysisResult(result)
      onAnalysisComplete?.(result)

      if (result.success) {
        toast.success(
          result.isOnChain 
            ? '✅ On-chain analysis complete!' 
            : '✅ Analysis complete!',
          {
            id: toastId,
            style: {
              background: '#1f2228',
              color: '#ffffff',
              border: '1px solid #10b981',
              borderRadius: '12px',
            },
          }
        )
      } else {
        toast.error(`Analysis failed: ${result.error}`, { id: toastId })
      }
    } catch (error: any) {
      console.error('Analysis error:', error)
      toast.error('Analysis failed', { id: toastId })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'critical': return 'text-red-500 bg-red-500/10 border-red-500/30'
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/30'
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
      case 'low': return 'text-blue-500 bg-blue-500/10 border-blue-500/30'
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/30'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-4">
      {/* Analysis Type Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-[#7d8187]">Analysis Type:</span>
        {(['full', 'security', 'gas', 'best-practices'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setAnalysisType(type)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              analysisType === type
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-[#1f2228] text-[#7d8187] border border-[#474747] hover:border-emerald-500/30'
            }`}
          >
            {type === 'full' && '🔍 Full Analysis'}
            {type === 'security' && '🛡️ Security'}
            {type === 'gas' && '⚡ Gas'}
            {type === 'best-practices' && '✨ Best Practices'}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <motion.button
          onClick={() => handleAnalyze(true)}
          disabled={isAnalyzing || !isConnected}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          whileHover={{ scale: isAnalyzing || !isConnected ? 1 : 1.02 }}
          whileTap={{ scale: isAnalyzing || !isConnected ? 1 : 0.98 }}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4" />
              Analyze with AI (TEE Coming Soon)
            </>
          )}
        </motion.button>

        <motion.button
          onClick={() => handleAnalyze(false)}
          disabled={isAnalyzing}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1f2228] border border-[#474747] text-white rounded-lg hover:border-emerald-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
          whileHover={{ scale: isAnalyzing ? 1 : 1.02 }}
          whileTap={{ scale: isAnalyzing ? 1 : 0.98 }}
        >
          <Sparkles className="h-4 w-4" />
          Quick AI Analysis
        </motion.button>
      </div>

      {!isConnected && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-xs text-amber-400">
            💡 Connect your wallet to use AI analysis (on-chain TEE is in development)
          </p>
        </div>
      )}

      {isConnected && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-400">
            ℹ️ On-chain TEE verification is in development. Currently using off-chain AI analysis.
          </p>
        </div>
      )}

      {/* Analysis Results */}
      <AnimatePresence>
        {analysisResult && analysisResult.success && analysisResult.analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Header with Score */}
            <div className="flex items-center justify-between p-4 bg-[#1f2228] border border-[#474747] rounded-lg">
              <div className="flex items-center gap-3">
                {analysisResult.isOnChain ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-emerald-400" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-blue-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {analysisResult.isOnChain ? 'On-Chain Analysis' : 'AI Analysis'}
                  </h3>
                  <p className="text-xs text-[#7d8187]">
                    {analysisResult.isOnChain ? 'TEE Verified' : 'Off-chain'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className={`text-3xl font-bold ${getScoreColor(analysisResult.analysis.score)}`}>
                  {analysisResult.analysis.score}
                </div>
                <p className="text-xs text-[#7d8187]">Security Score</p>
              </div>
            </div>

            {/* Transaction Link (On-Chain Only) */}
            {analysisResult.isOnChain && analysisResult.txHash && (
              <a
                href={`${RITUAL_EXPLORER_URL}/tx/${analysisResult.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-all text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                View on Ritual Explorer
              </a>
            )}

            {/* Summary */}
            <div className="p-4 bg-[#1f2228] border border-[#474747] rounded-lg">
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <FileCode className="h-4 w-4" />
                Summary
              </h4>
              <p className="text-sm text-[#7d8187] leading-relaxed">
                {analysisResult.analysis.summary}
              </p>
            </div>

            {/* Risks */}
            {analysisResult.analysis.risks.length > 0 && (
              <div className="p-4 bg-[#1f2228] border border-[#474747] rounded-lg">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Security Risks ({analysisResult.analysis.risks.length})
                </h4>
                <div className="space-y-2">
                  {analysisResult.analysis.risks.map((risk, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${getRiskColor(risk.level)}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          {risk.level}
                        </span>
                        <span className="text-xs flex-1">{risk.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gas Optimizations */}
            {analysisResult.analysis.gasOptimizations.length > 0 && (
              <div className="p-4 bg-[#1f2228] border border-[#474747] rounded-lg">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  Gas Optimizations
                </h4>
                <ul className="space-y-2">
                  {analysisResult.analysis.gasOptimizations.map((opt, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-[#7d8187]">
                      <TrendingUp className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      {opt}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Best Practices */}
            {analysisResult.analysis.bestPractices.length > 0 && (
              <div className="p-4 bg-[#1f2228] border border-[#474747] rounded-lg">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Best Practices
                </h4>
                <ul className="space-y-2">
                  {analysisResult.analysis.bestPractices.map((practice, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-[#7d8187]">
                      <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      {practice}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
