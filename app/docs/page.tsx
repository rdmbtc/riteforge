"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown, ChevronRight, Copy, ExternalLink, BookOpen, Code, FileCode, Sparkles, Bot, Shield, Search, MessageSquare, Users, Zap, Plus, Settings, Rocket, Lock, Image as ImageIcon, Clock, Calendar, Shuffle, Send, BarChart, Clipboard, Fuel, Droplet } from "lucide-react"

const sections = [
  {
    id: "ai-generator",
    title: "AI Contract Generator",
    icon: Sparkles,
    description: "Generate smart contracts using natural language",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    sections: [
      {
        title: "How It Works",
        content: "Describe your contract in plain English. AI generates Solidity code based on your requirements.",
      },
      {
        title: "Features",
        items: [
          "Natural language to Solidity conversion",
          "Streaming code generation",
          "Real-time error detection",
          "Contract explanation in plain English",
        ],
      },
      {
        title: "Output Options",
        items: [
          "Deploy directly to Ritual Chain",
          "Export to Remix IDE",
          "Open in browser editor",
          "Save to library",
        ],
      },
    ],
  },
  {
    id: "templates",
    title: "Contract Templates",
    icon: FileCode,
    description: "Pre-built contracts ready to customize",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    sections: [
      {
        title: "Token Templates",
        items: [
          "Basic ERC-20 Token - Simple mintable token",
          "Capped ERC-20 Token - With maximum supply limit",
          "Pausable Token - Can be paused by owner",
          "Permit Token - EIP-2612 gasless approvals",
        ],
      },
      {
        title: "NFT Templates",
        items: [
          "Basic NFT Collection - Simple ERC-721",
          "Multi-Token Standard - ERC-1155 for gaming",
          "Soulbound Token - Non-transferable NFTs",
        ],
      },
      {
        title: "DeFi Templates",
        items: [
          "Staking Contract - Earn rewards by staking",
          "Vesting Schedule - Time-locked token release",
          "Timelock Controller - Delay execution",
        ],
      },
      {
        title: "DAO Templates",
        items: [
          "Governor Contract - On-chain voting",
          "Timelock + Governor - Delayed execution",
        ],
      },
    ],
  },
  {
    id: "community-prompts",
    title: "Community Prompts",
    icon: Users,
    description: "Shared contract prompts from the community",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    sections: [
      {
        title: "Featured Prompts",
        items: [
          "Simple Token Transfer - ERC-20 with gas optimization",
          "NFT Minting Contract - With metadata and royalties",
          "Staking Rewards Claim - Validator rewards",
          "DAO Proposal Submission - Governance parameters",
          "Liquidity Pool Add - DEX with slippage protection",
        ],
      },
      {
        title: "Features",
        items: [
          "Upvote/downvote prompts",
          "Filter by category (Safe, Useful, Popular, Creative)",
          "Submit your own prompts",
          "Anonymous or attributed authorship",
        ],
      },
    ],
  },
  {
    id: "security",
    title: "Security Analysis",
    icon: Shield,
    description: "Automated contract vulnerability scanning",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    sections: [
      {
        title: "Analysis Types",
        items: [
          "Re-entrancy vulnerabilities",
          "Integer overflow/underflow",
          "Access control issues",
          "Front-running detection",
          "Centralization risks",
        ],
      },
      {
        title: "Output",
        items: [
          "Risk level assessment (Low, Medium, High, Critical)",
          "Detailed explanation of each finding",
          "Permission analysis",
          "Overall security score (0-100)",
        ],
      },
    ],
  },
  {
    id: "analyzer",
    title: "On-Chain Analyzer",
    icon: Search,
    description: "Analyze deployed contracts",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    sections: [
      {
        title: "Capabilities",
        items: [
          "Read contract source from explorer",
          "Analyze deployed bytecode",
          "Identify standard interfaces",
          "Detect common vulnerabilities",
        ],
      },
      {
        title: "Input Methods",
        items: [
          "Contract address input",
          "Paste source code directly",
          "Import from file",
        ],
      },
    ],
  },
  {
    id: "chat",
    title: "AI Assistant",
    icon: MessageSquare,
    description: "Chat with AI about contracts",
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    sections: [
      {
        title: "Features",
        items: [
          "Ask questions about Solidity",
          "Get contract explanations",
          "Debugging assistance",
          "Code optimization suggestions",
        ],
      },
    ],
  },
]

const tokenCreationDocs = [
  {
    id: "tokens",
    title: "Token Creation",
    icon: Plus,
    description: "Create custom ERC20 tokens on Ritual Chain",
    sections: [
      {
        title: "Core Token",
        path: "/create-core",
        description: "Create a basic ERC20 token with standard parameters",
        params: [
          { name: "Name", desc: "Full name of your token (e.g., 'My Token')" },
          { name: "Symbol", desc: "Ticker symbol (e.g., 'MTK')" },
          { name: "Decimals", desc: "Token decimals (typically 18)" },
          { name: "Initial Supply", desc: "Total tokens to mint at creation" },
        ],
      },
      {
        title: "Advanced Token",
        path: "/create-advanced",
        description: "Create token with AI-generated metadata and custom features",
        params: [
          { name: "Name", desc: "Full name of your token" },
          { name: "Symbol", desc: "Ticker symbol" },
          { name: "Decimals", desc: "Token decimals" },
          { name: "Initial Supply", desc: "Initial token supply" },
          { name: "AI Description", desc: "AI-generated token description" },
          { name: "AI Image", desc: "AI-generated token logo" },
        ],
      },
      {
        title: "Asset Token",
        path: "/create-asset",
        description: "Tokenize real-world assets (real estate, commodities, etc.)",
        params: [
          { name: "Asset Type", desc: "Type of asset being tokenized" },
          { name: "Name", desc: "Asset token name" },
          { name: "Symbol", desc: "Ticker symbol" },
          { name: "Total Supply", desc: "Total tokens representing asset value" },
        ],
      },
    ],
  },
  {
    id: "mint-burn",
    title: "Token Management",
    icon: Settings,
    description: "Mint and burn tokens after creation",
    sections: [
      {
        title: "Mint Tokens",
        path: "/manage",
        params: [
          { name: "Token Address", desc: "Address of your created token" },
          { name: "Amount", desc: "Number of tokens to mint" },
          { name: "Recipient", desc: "Address to receive minted tokens" },
        ],
      },
      {
        title: "Burn Tokens",
        path: "/manage",
        params: [
          { name: "Token Address", desc: "Address of your created token" },
          { name: "Amount", desc: "Number of tokens to burn" },
        ],
      },
    ],
  },
]

const defiDocs = [
  {
    id: "launchpad",
    title: "Token Sales",
    icon: Rocket,
    description: "Launch token sales with customizable pricing",
    sections: [
      {
        title: "Create Sale",
        params: [
          { name: "Token", desc: "Token address to sell" },
          { name: "Price", desc: "Price per token in RITUAL" },
          { name: "Total Tokens", desc: "Tokens available for sale" },
          { name: "Soft Cap", desc: "Minimum raise to succeed" },
          { name: "Hard Cap", desc: "Maximum raise cap" },
          { name: "Start/End Time", desc: "Sale window" },
        ],
      },
    ],
  },
  {
    id: "locker",
    title: "Token Locker",
    icon: Lock,
    sections: [
      { title: "Lock Tokens", params: [
        { name: "Token", desc: "Token to lock" },
        { name: "Amount", desc: "Quantity to lock" },
        { name: "Unlock Time", desc: "When tokens become claimable" },
      ]},
    ],
  },
  {
    id: "streams",
    title: "Payment Streams",
    icon: Clock,
    sections: [
      { title: "Create Stream", params: [
        { name: "Recipient", desc: "Address receiving payments" },
        { name: "Token", desc: "Token being streamed" },
        { name: "Total Amount", desc: "Total to stream" },
        { name: "Start/Stop Time", desc: "Stream duration" },
      ]},
    ],
  },
  {
    id: "vesting",
    title: "Token Vesting",
    icon: Calendar,
    sections: [
      { title: "Create Vesting", params: [
        { name: "Token", desc: "Token for vesting" },
        { name: "Beneficiary", desc: "Recipient of vested tokens" },
        { name: "Total Amount", desc: "Total tokens to vest" },
        { name: "Start Time", desc: "When vesting begins" },
        { name: "Cliff Duration", desc: "Time before first unlock" },
        { name: "Vesting Duration", desc: "Total vesting period" },
      ]},
    ],
  },
  {
    id: "airdrop",
    title: "Airdrop",
    icon: Send,
    sections: [
      { title: "Batch Transfer", params: [
        { name: "Token", desc: "Token to distribute" },
        { name: "Recipients", desc: "List of recipient addresses" },
        { name: "Amounts", desc: "Amount per recipient" },
      ]},
    ],
  },
  {
    id: "dvp",
    title: "DvP (Delivery vs Payment)",
    icon: Shuffle,
    sections: [
      { title: "Create Swap", params: [
        { name: "Party B", desc: "Counterparty address" },
        { name: "Token A / Amount A", desc: "Your token and amount" },
        { name: "Token B / Amount B", desc: "Wanted token and amount" },
      ]},
    ],
  },
  {
    id: "nft",
    title: "NFT Minting",
    icon: ImageIcon,
    sections: [
      { title: "Deploy Collection", params: [
        { name: "Name", desc: "Collection name" },
        { name: "Symbol", desc: "Collection symbol" },
        { name: "Base URI", desc: "Metadata base URL" },
        { name: "Max Supply", desc: "Maximum NFTs in collection" },
      ]},
    ],
  },
]

const utilityDocs = [
  {
    id: "portfolio",
    title: "Portfolio Tracker",
    icon: BarChart,
    sections: [
      { title: "View Holdings", description: "See all tokens you own or created" },
      { title: "Transaction History", description: "View past transactions" },
    ],
  },
  {
    id: "record",
    title: "Chain Record",
    icon: Clipboard,
    sections: [
      { title: "Create Record", params: [
        { name: "Data Hash", desc: "Hash of data to record" },
        { name: "Description", desc: "Human-readable description" },
      ]},
    ],
  },
  {
    id: "gas",
    title: "Gas Tracker",
    icon: Fuel,
    sections: [
      { title: "Gas Prices", description: "View current gas costs for transactions" },
    ],
  },
  {
    id: "faucet",
    title: "Testnet Faucets",
    icon: Droplet,
    sections: [
      { title: "Claim RITUAL", description: "Receive test RITUAL tokens" },
    ],
  },
]

export default function DocsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedSections, setExpandedSections] = useState<string[]>(["ai-generator"])

  const toggleSection = (id: string) => {
    setExpandedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-0"}`}>
        <div className="max-w-5xl mx-auto p-8">
          <div className="mb-8 flex items-center gap-4">
            <div className={`p-3 bg-purple-500/20 rounded-lg`}>
              <BookOpen className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">RiteForge Docs</h1>
              <p className="text-white/50">Complete guide to all features</p>
            </div>
          </div>

          <Tabs defaultValue="ai" className="space-y-6">
            <TabsList className="bg-white/10">
              <TabsTrigger value="ai" className="data-[state=active]:bg-purple-500/20">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Features
              </TabsTrigger>
              <TabsTrigger value="tokens" className="data-[state=active]:bg-blue-500/20">
                <Plus className="h-4 w-4 mr-2" />
                Tokens
              </TabsTrigger>
              <TabsTrigger value="defi" className="data-[state=active]:bg-green-500/20">
                <Zap className="h-4 w-4 mr-2" />
                DeFi
              </TabsTrigger>
              <TabsTrigger value="utility" className="data-[state=active]:bg-orange-500/20">
                <Settings className="h-4 w-4 mr-2" />
                Utility
              </TabsTrigger>
              <TabsTrigger value="contract" className="data-[state=active]:bg-cyan-500/20">
                <Code className="h-4 w-4 mr-2" />
                Contract
              </TabsTrigger>
            </TabsList>

            {/* AI Features Tab */}
            <TabsContent value="ai" className="space-y-4">
              {sections.map((section) => (
                <Card key={section.id} className="border-white/10 bg-card/50 overflow-hidden">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 ${section.bgColor} rounded-lg`}>
                        <section.icon className={`h-5 w-5 ${section.color}`} />
                      </div>
                      <div className="text-left">
                        <h2 className="text-xl font-semibold">{section.title}</h2>
                        <p className="text-sm text-white/50">{section.description}</p>
                      </div>
                    </div>
                    {expandedSections.includes(section.id) ? (
                      <ChevronDown className="h-5 w-5 text-white/50" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-white/50" />
                    )}
                  </button>

                  {expandedSections.includes(section.id) && (
                    <CardContent className="border-t border-white/10 p-6 space-y-4">
                      {section.sections.map((s, idx) => (
                        <div key={idx}>
                          <h3 className="text-sm font-medium text-white/70 mb-2">{s.title}</h3>
                          {s.items && (
                            <ul className="space-y-1">
                              {s.items.map((item, i) => (
                                <li key={i} className="text-sm text-white/60 flex items-start gap-2">
                                  <span className="text-white/30">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                          {s.content && (
                            <p className="text-sm text-white/60">{s.content}</p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              ))}
            </TabsContent>

            {/* Tokens Tab */}
            <TabsContent value="tokens" className="space-y-4">
              {tokenCreationDocs.map((doc) => (
                <Card key={doc.id} className="border-white/10 bg-card/50 overflow-hidden">
                  <button
                    onClick={() => toggleSection(doc.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <doc.icon className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="text-left">
                        <h2 className="text-xl font-semibold">{doc.title}</h2>
                        <p className="text-sm text-white/50">{doc.description}</p>
                      </div>
                    </div>
                    {expandedSections.includes(doc.id) ? (
                      <ChevronDown className="h-5 w-5 text-white/50" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-white/50" />
                    )}
                  </button>

                  {expandedSections.includes(doc.id) && (
                    <CardContent className="border-t border-white/10 p-6 space-y-4">
                      {doc.sections.map((section, idx) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-white/10 text-white">
                              {section.title}
                            </Badge>
                            {section.path && (
                              <span className="text-xs text-white/30">{section.path}</span>
                            )}
                          </div>
                          {section.description && (
                            <p className="text-sm text-white/60 pl-1">{section.description}</p>
                          )}
                          {section.params && section.params.length > 0 && (
                            <div className="bg-black/30 rounded-lg p-3 space-y-1">
                              {section.params.map((param, pIdx) => (
                                <div key={pIdx} className="flex gap-4 text-sm">
                                  <code className="text-blue-400 min-w-[120px]">{param.name}</code>
                                  <span className="text-white/50">{param.desc}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              ))}
            </TabsContent>

            {/* DeFi Tab */}
            <TabsContent value="defi" className="space-y-4">
              {defiDocs.map((doc) => (
                <Card key={doc.id} className="border-white/10 bg-card/50 overflow-hidden">
                  <button
                    onClick={() => toggleSection(doc.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <doc.icon className="h-5 w-5 text-green-400" />
                      </div>
                      <div className="text-left">
                        <h2 className="text-xl font-semibold">{doc.title}</h2>
                        <p className="text-sm text-white/50">{doc.description}</p>
                      </div>
                    </div>
                    {expandedSections.includes(doc.id) ? (
                      <ChevronDown className="h-5 w-5 text-white/50" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-white/50" />
                    )}
                  </button>

                  {expandedSections.includes(doc.id) && (
                    <CardContent className="border-t border-white/10 p-6 space-y-4">
                      {doc.sections.map((section, idx) => (
                        <div key={idx} className="space-y-2">
                          <Badge variant="secondary" className="bg-white/10 text-white">
                            {section.title}
                          </Badge>
                          {section.description && (
                            <p className="text-sm text-white/60 pl-1">{section.description}</p>
                          )}
                          {section.params && section.params.length > 0 && (
                            <div className="bg-black/30 rounded-lg p-3 space-y-1">
                              {section.params.map((param, pIdx) => (
                                <div key={pIdx} className="flex gap-4 text-sm">
                                  <code className="text-green-400 min-w-[120px]">{param.name}</code>
                                  <span className="text-white/50">{param.desc}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              ))}
            </TabsContent>

            {/* Utility Tab */}
            <TabsContent value="utility" className="space-y-4">
              {utilityDocs.map((doc) => (
                <Card key={doc.id} className="border-white/10 bg-card/50 overflow-hidden">
                  <button
                    onClick={() => toggleSection(doc.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <doc.icon className="h-5 w-5 text-orange-400" />
                      </div>
                      <div className="text-left">
                        <h2 className="text-xl font-semibold">{doc.title}</h2>
                        <p className="text-sm text-white/50">{doc.description}</p>
                      </div>
                    </div>
                    {expandedSections.includes(doc.id) ? (
                      <ChevronDown className="h-5 w-5 text-white/50" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-white/50" />
                    )}
                  </button>

                  {expandedSections.includes(doc.id) && (
                    <CardContent className="border-t border-white/10 p-6 space-y-4">
                      {doc.sections.map((section, idx) => (
                        <div key={idx} className="space-y-2">
                          <Badge variant="secondary" className="bg-white/10 text-white">
                            {section.title}
                          </Badge>
                          {section.description && (
                            <p className="text-sm text-white/60 pl-1">{section.description}</p>
                          )}
                          {section.params && section.params.length > 0 && (
                            <div className="bg-black/30 rounded-lg p-3 space-y-1">
                              {section.params.map((param, pIdx) => (
                                <div key={pIdx} className="flex gap-4 text-sm">
                                  <code className="text-orange-400 min-w-[120px]">{param.name}</code>
                                  <span className="text-white/50">{param.desc}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              ))}
            </TabsContent>

            {/* Contract Info Tab */}
            <TabsContent value="contract" className="space-y-4">
              <Card className="border-white/10 bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Contract Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-white/50 mb-1">Master Contract Address</p>
                    <div className="flex items-center gap-2 bg-black/50 p-3 rounded-lg">
                      <code className="text-green-400 font-mono text-sm flex-1">
                        0xb7020bed896e92E8Ff5cE3B551Ba1044A32f8922
                      </code>
                      <button
                        onClick={() => navigator.clipboard.writeText("0xb7020bed896e92E8Ff5cE3B551Ba1044A32f8922")}
                        className="text-white/50 hover:text-white"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <a
                        href="https://explorer.ritualfoundation.org/address/0xb7020bed896e92E8Ff5cE3B551Ba1044A32f8922"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/50 hover:text-white"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-white/50 mb-1">Network</p>
                      <p className="text-white">Ritual Testnet (Chain ID: 1979)</p>
                    </div>
                    <div>
                      <p className="text-sm text-white/50 mb-1">RPC URL</p>
                      <code className="text-white/70 text-sm">https://rpc.ritualfoundation.org</code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Contract Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      "Token Factory",
                      "Mint/Burn",
                      "Token Sales",
                      "Token Locker",
                      "Vesting",
                      "NFT Minting",
                      "Payment Streams",
                      "Airdrop",
                      "DvP Swaps",
                      "Chain Records",
                      "Pull-Based Escrow",
                    ].map((feature) => (
                      <div key={feature} className="p-2 bg-white/5 rounded text-sm text-white/70">
                        {feature}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Quick Links */}
          <Card className="mt-8 border-white/10 bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Explorer", url: "https://explorer.ritualfoundation.org" },
                  { label: "Website", url: "https://ritualfoundation.org" },
                  { label: "RPC Docs", url: "https://docs.ritualfoundation.org" },
                  { label: "Discord", url: "https://discord.gg/ritual" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors text-center"
                  >
                    <p className="text-sm text-white">{link.label}</p>
                    <ExternalLink className="h-3 w-3 text-white/30 mx-auto mt-1" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
