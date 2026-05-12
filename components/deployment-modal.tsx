"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Loader2, CheckCircle, AlertTriangle, ExternalLink, Copy, Check } from "lucide-react"
import { useState } from "react"

interface DeploymentModalProps {
  isOpen: boolean
  onClose: () => void
  status: 'idle' | 'deploying' | 'success' | 'error'
  contractAddress?: string
  transactionHash?: string
  error?: string
}

export function DeploymentModal({
  isOpen,
  onClose,
  status,
  contractAddress,
  transactionHash,
  error
}: DeploymentModalProps) {
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [copiedTx, setCopiedTx] = useState(false)

  const copyToClipboard = (text: string, type: 'address' | 'tx') => {
    navigator.clipboard.writeText(text)
    if (type === 'address') {
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    } else {
      setCopiedTx(true)
      setTimeout(() => setCopiedTx(false), 2000)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => status !== 'deploying' && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#1f2228] border border-[#474747] rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#474747]">
              <h3 className="text-lg sm:text-xl font-semibold text-white">
                {status === 'deploying' && 'Deploying Contract'}
                {status === 'success' && 'Deployment Successful!'}
                {status === 'error' && 'Deployment Failed'}
                {status === 'idle' && 'Deploy Contract'}
              </h3>
              {status !== 'deploying' && (
                <button
                  onClick={onClose}
                  className="text-[#7d8187] hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Deploying State */}
              {status === 'deploying' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="h-12 w-12 text-[#19D184] animate-spin" />
                  <div className="text-center">
                    <p className="text-white font-medium mb-1">Deploying to Ritual Chain...</p>
                    <p className="text-sm text-[#7d8187]">Please confirm the transaction in your wallet</p>
                  </div>
                </div>
              )}

              {/* Success State */}
              {status === 'success' && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-4 space-y-3">
                    <div className="h-16 w-16 rounded-full bg-[#19D184]/10 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-[#19D184]" />
                    </div>
                    <p className="text-white font-medium text-center">Contract deployed successfully!</p>
                  </div>

                  {/* Contract Address */}
                  {contractAddress && (
                    <div className="space-y-2">
                      <label className="text-xs text-[#7d8187] uppercase tracking-wider">Contract Address</label>
                      <div className="flex items-center gap-2 p-3 bg-[#0c0c0b] border border-[#474747] rounded-lg">
                        <code className="flex-1 text-sm text-white font-mono break-all">
                          {contractAddress}
                        </code>
                        <button
                          onClick={() => copyToClipboard(contractAddress, 'address')}
                          className="flex-shrink-0 text-[#7d8187] hover:text-white transition-colors"
                        >
                          {copiedAddress ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Transaction Hash */}
                  {transactionHash && (
                    <div className="space-y-2">
                      <label className="text-xs text-[#7d8187] uppercase tracking-wider">Transaction Hash</label>
                      <div className="flex items-center gap-2 p-3 bg-[#0c0c0b] border border-[#474747] rounded-lg">
                        <code className="flex-1 text-sm text-white font-mono break-all">
                          {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(transactionHash, 'tx')}
                          className="flex-shrink-0 text-[#7d8187] hover:text-white transition-colors"
                        >
                          {copiedTx ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Explorer Link */}
                  {contractAddress && (
                    <a
                      href={`https://explorer.ritualfoundation.org/address/${contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-[#19D184] hover:bg-[#17b872] text-white rounded-lg font-medium transition-colors"
                    >
                      View on Explorer
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}

              {/* Error State */}
              {status === 'error' && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center py-4 space-y-3">
                    <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-white font-medium text-center">Deployment failed</p>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-400 break-words">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={onClose}
                    className="w-full py-3 px-4 bg-[#474747] hover:bg-[#5a5a5a] text-white rounded-lg font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
