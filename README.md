# RiteForge 🔥

**AI-Powered Smart Contract Generator for Ritual Chain**

Generate, analyze, and deploy smart contracts on Ritual Chain using AI. Built specifically for the Ritual community.

![RiteForge Banner](public/hero-bg.svg)

## ✨ Features

- 🤖 **AI Contract Generation** - Describe your contract in plain English, get production-ready Solidity
- 🔒 **Security Analysis** - AI-powered security auditing and risk assessment
- 🎨 **AI-Generated Token Cards** - Beautiful, shareable cards for social media (first one FREE!)
- 📚 **22+ Templates** - Production-ready templates for tokens, NFTs, DeFi, DAOs, and more
- 🚀 **One-Click Deploy** - Deploy directly to Ritual Chain from your browser
- 💾 **Chat History** - Save and revisit your contract generations
- 🏭 **Factory Contract** - Gas-efficient on-chain deployment system
- ⚡ **Fast Compilation** - Server-side Solidity compilation with Hardhat

## 🎯 Built For Ritual Chain

- **Chain ID:** 1979
- **RPC:** https://rpc.ritualfoundation.org
- **Explorer:** https://explorer.ritualfoundation.org
- **Faucet:** https://faucet.ritualfoundation.org

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- MetaMask or compatible Web3 wallet
- Ritual testnet tokens (get from [faucet](https://faucet.ritualfoundation.org))

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/riteforge.git
cd riteforge

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Add your API keys to .env.local
# - AI API key from https://freetheai.xyz
# - WalletConnect project ID from https://cloud.walletconnect.com

# Start development server
pnpm dev
```

Visit `http://localhost:3000` and start building!

## 🏗️ Architecture

### Contract Deployment Options

RiteForge supports multiple deployment methods:

#### 1. **Client-Side Compilation (Recommended for Vercel)**
- ✅ Works on Vercel and other serverless platforms
- ✅ No backend required
- ⚠️ Only supports simple contracts without external imports
- Uses `solc-js` for in-browser compilation

#### 2. **Remix IDE Integration**
- ✅ Supports all contracts including OpenZeppelin imports
- ✅ Full IDE features (debugging, testing, verification)
- ✅ One-click export from RiteForge
- Recommended for production deployments

#### 3. **Local Hardhat Deployment**
- ✅ Full control over compilation and deployment
- ✅ Supports all Solidity features
- ✅ Best for development and testing
- Requires local Node.js environment

### Factory Contract System

RiteForge uses a factory contract deployed on Ritual Chain to enable browser-based contract deployment:

1. **AI Generation** - User describes contract, AI generates Solidity code
2. **Client Compilation** - Browser compiles simple contracts using solc-js
3. **Factory Deployment** - Bytecode sent to factory contract
4. **On-Chain Deploy** - Factory uses CREATE opcode to deploy

**Factory Address:** `0xA70f6320271881E79998b3b2CC72FE872A781f89`

### Tech Stack

- **Frontend:** Next.js 16, React 19, TailwindCSS, Framer Motion
- **Web3:** wagmi, viem, RainbowKit
- **Smart Contracts:** Solidity 0.8.20, Hardhat, OpenZeppelin
- **Compilation:** solc-js (client-side), Hardhat (local)
- **AI:** OpenAI-compatible API (FreeTheAI)
- **Database:** Supabase (optional)

## 📚 Contract Templates

22 production-ready templates across 6 categories:

- **Tokens:** ERC-20, Capped, Vesting, Airdrop
- **NFTs:** ERC-721, ERC-1155, Royalties, Marketplace
- **DeFi:** Staking, Swaps, Crowdfunding
- **DAO:** Governance, Voting, Timelock
- **Gaming:** Lottery, Random NFTs
- **Utility:** Multisig, Escrow, Whitelist, Payment Splitter

## 🔧 Configuration

### Environment Variables

See `.env.example` for all configuration options.

**Required:**
- `NEXT_PUBLIC_AI_API_KEY` - AI API key
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID

**AI Image Generation (Optional):**
- `NEXT_PUBLIC_AI_IMAGE_MODEL` - Image model (default: vhr/gpt_image_2)
- `NEXT_PUBLIC_AI_IMAGE_API_KEY` - API key for image generation

**Optional:**
- Supabase credentials (for chat history persistence)
- `DEPLOYER_PRIVATE_KEY` (only for deploying factory contract)

### AI-Generated Images

RiteForge can generate beautiful token cards for social sharing:

```bash
# Add to .env.local
NEXT_PUBLIC_AI_IMAGE_MODEL=vhr/gpt_image_2
NEXT_PUBLIC_AI_IMAGE_API_KEY=your_image_api_key
```

**Features:**
- 🎨 AI-generated token icons with cyberpunk aesthetic
- 📱 Shareable cards for Twitter/social media
- 👑 Unlimited access for whitelisted addresses
- 💰 First generation FREE for all users, then 0.01 RITUAL per image
- 🚀 Viral marketing through social sharing

**Whitelist:**
- Creator address has unlimited generations
- Add more addresses in `lib/image-pricing.ts`

See [AI_IMAGE_GUIDE.md](AI_IMAGE_GUIDE.md) for detailed documentation.
See [UNLIMITED_ACCESS.md](UNLIMITED_ACCESS.md) for whitelist management.

### Deploy Factory Contract

If you want to deploy your own factory contract:

```bash
# Add your private key to .env.local
DEPLOYER_PRIVATE_KEY=your_private_key

# Compile contracts
npx hardhat compile

# Deploy to Ritual Chain
npx hardhat run scripts/deploy-factory.js --network ritual
```

## 🎨 Features in Detail

### AI Contract Generation

Powered by Claude 4.5 Sonnet via FreeTheAI:
- Natural language to Solidity
- Automatic OpenZeppelin imports
- Best practices and security patterns
- Ritual Chain optimizations

### Security Analyzer

AI-powered security analysis:
- Risk assessment
- Permission analysis
- Vulnerability detection
- Security score (0-100)

### Templates Library

Browse and customize 22+ templates:
- Filter by category and difficulty
- Search by name, description, or tags
- One-click load and customize
- Deploy directly to Ritual Chain

## 📖 Documentation

- [Ritual Chain Docs](https://docs.ritualfoundation.org)
- [Factory Contract Guide](DEPLOYMENT.md)
- [Database Setup](DATABASE_OPTIONAL.md)
- [Completed Features](COMPLETE_FEATURES.md)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - see LICENSE file for details

## 👨‍💻 Creator

Built with ❤️ by [@rdmnad](https://x.com/rdmnad) • @therdm on Discord

Special thanks to the Ritual community!

## 🔗 Links

- **Website:** [Your deployed URL]
- **Twitter:** [@rdmnad](https://x.com/rdmnad)
- **Discord:** @therdm
- **Ritual Chain:** [ritualfoundation.org](https://ritualfoundation.org)

## ⚠️ Disclaimer

This tool is for educational and development purposes. Always audit smart contracts before deploying to production. The creators are not responsible for any losses incurred from using generated contracts.

---

**Made for Ritual Chain 🌟**
