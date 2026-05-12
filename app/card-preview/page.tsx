"use client"

import { TokenCard } from "@/components/token-card"

export default function CardPreviewPage() {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-white text-3xl font-bold mb-2 text-center">Token Card Preview</h1>
        <p className="text-white/50 text-center mb-8">No wallet needed - preview your share card</p>

        <TokenCard
          tokenName="MyToken"
          symbol="MTK"
          supply="1000000"
          decimals="18"
          tokenAddress="0xdemo1234567890abcd1234567890abcd12345678"
          creatorAddress="0xcreator1234567890creator1234567890creator12"
        />

        <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
          <h3 className="text-white font-mono text-sm mb-2">Console Debug (Paste in DevTools):</h3>
          <pre className="text-white/50 text-xs font-mono overflow-x-auto">
{`// To test without wallet, add to create-core page:
const [showDemo, setShowDemo] = useState(false)

// Add demo button:
<button onClick={() => setShowDemo(true)}>Preview Card</button>

// Then show card:
{showDemo && (
  <TokenCard
    tokenName={tokenName || "DEMO"}
    symbol={symbol || "DEMO"}
    supply={supply || "1000"}
    decimals={decimals || "18"}
    tokenAddress="0xDemo1234567890Demo1234567890Demo1234567890"
    creatorAddress="0xCreator1234567890Creator1234567890Creator123456"
  />
)}`}
          </pre>
        </div>
      </div>
    </div>
  )
}