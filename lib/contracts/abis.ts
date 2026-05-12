// Contract ABIs for RiteForge on Ritual Chain

export const ERC20_ABI = [
  { inputs: [], name: "decimals", outputs: [{ name: "", type: "uint8" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "name", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSupply", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], name: "allowance", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve", outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], name: "transfer", outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }], name: "transferFrom", outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
] as const

export const ERC721_ABI = [
  { inputs: [], name: "name", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "tokenURI", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "owner", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "tokenId", type: "uint256" }], name: "ownerOf", outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "to", type: "address" }, { name: "tokenId", type: "uint256" }], name: "approve", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "to", type: "address" }], name: "mint", outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
] as const

// RiteForgeMaster - All-in-one contract ABI
export const MASTER_ABI = [
  // ============ TOKEN FUNCTIONS ============
  { inputs: [{ name: "name", type: "string" }, { name: "symbol", type: "string" }, { name: "decimals", type: "uint8" }, { name: "initialSupply", type: "uint256" }], name: "createToken", outputs: [{ name: "", type: "address" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "user", type: "address" }], name: "getUserTokens", outputs: [{ name: "", type: "address[]" }], stateMutability: "view", type: "function" },

  // ============ LAUNCHPAD FUNCTIONS ============
  { inputs: [{ name: "token", type: "address" }, { name: "price", type: "uint256" }, { name: "totalTokens", type: "uint256" }, { name: "softCap", type: "uint256" }, { name: "hardCap", type: "uint256" }, { name: "minContribution", type: "uint256" }, { name: "maxContribution", type: "uint256" }, { name: "startTime", type: "uint256" }, { name: "endTime", type: "uint256" }], name: "createSale", outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "saleId", type: "uint256" }], name: "buyTokens", outputs: [], stateMutability: "payable", type: "function" },
  { inputs: [{ name: "saleId", type: "uint256" }], name: "claimTokens", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "saleId", type: "uint256" }], name: "getSaleInfo", outputs: [{ components: [{ name: "creator", type: "address" }, { name: "token", type: "address" }, { name: "price", type: "uint256" }, { name: "totalTokens", type: "uint256" }, { name: "soldTokens", type: "uint256" }, { name: "softCap", type: "uint256" }, { name: "hardCap", type: "uint256" }, { name: "minContribution", type: "uint256" }, { name: "maxContribution", type: "uint256" }, { name: "startTime", type: "uint256" }, { name: "endTime", type: "uint256" }, { name: "raised", type: "uint256" }, { name: "status", type: "uint8" }], name: "", type: "tuple" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getTotalSales", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },

  // ============ LOCKER FUNCTIONS ============
  { inputs: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }, { name: "unlockTime", type: "uint256" }, { name: "beneficiary", type: "address" }], name: "lockTokens", outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "lockId", type: "uint256" }], name: "unlockTokens", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "lockId", type: "uint256" }], name: "getLockInfo", outputs: [{ components: [{ name: "token", type: "address" }, { name: "beneficiary", type: "address" }, { name: "amount", type: "uint256" }, { name: "unlockTime", type: "uint256" }, { name: "claimed", type: "bool" }], name: "", type: "tuple" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "user", type: "address" }], name: "getUserLockCount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getTotalLocks", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },

  // ============ VESTING FUNCTIONS ============
  { inputs: [{ name: "token", type: "address" }, { name: "beneficiary", type: "address" }, { name: "totalAmount", type: "uint256" }, { name: "startTime", type: "uint256" }, { name: "cliffDuration", type: "uint256" }, { name: "vestingDuration", type: "uint256" }], name: "createVesting", outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "scheduleId", type: "uint256" }], name: "release", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "scheduleId", type: "uint256" }], name: "getClaimableAmount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "user", type: "address" }], name: "getUserVestingCount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getTotalVestings", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },

  // ============ NFT FUNCTIONS ============
  { inputs: [{ name: "name", type: "string" }, { name: "symbol", type: "string" }, { name: "baseURI", type: "string" }, { name: "maxSupply", type: "uint256" }], name: "deployNFTCollection", outputs: [{ name: "", type: "address" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "collection", type: "address" }, { name: "to", type: "address" }], name: "mintNFT", outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable", type: "function" },

  // ============ STREAMING FUNCTIONS ============
  { inputs: [{ name: "recipient", type: "address" }, { name: "token", type: "address" }, { name: "totalAmount", type: "uint256" }, { name: "startTime", type: "uint256" }, { name: "stopTime", type: "uint256" }], name: "createStream", outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "streamId", type: "uint256" }, { name: "amount", type: "uint256" }], name: "withdrawFromStream", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "streamId", type: "uint256" }], name: "cancelStream", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "streamId", type: "uint256" }], name: "getWithdrawableAmount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "streamId", type: "uint256" }], name: "getStreamInfo", outputs: [{ components: [{ name: "sender", type: "address" }, { name: "recipient", type: "address" }, { name: "token", type: "address" }, { name: "totalAmount", type: "uint256" }, { name: "withdrawn", type: "uint256" }, { name: "startTime", type: "uint256" }, { name: "stopTime", type: "uint256" }, { name: "cancelled", type: "bool" }], name: "", type: "tuple" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "user", type: "address" }], name: "getUserStreamCount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },

  // ============ CHAIN RECORD FUNCTIONS ============
  { inputs: [{ name: "dataHash", type: "bytes32" }, { name: "description", type: "string" }], name: "createRecord", outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "recordId", type: "uint256" }], name: "getRecord", outputs: [{ components: [{ name: "recorder", type: "address" }, { name: "dataHash", type: "bytes32" }, { name: "description", type: "string" }, { name: "timestamp", type: "uint256" }], name: "", type: "tuple" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "user", type: "address" }], name: "getUserRecordCount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },

  // ============ DVP SWAP FUNCTIONS ============
  { inputs: [{ name: "partyB", type: "address" }, { name: "tokenA", type: "address" }, { name: "amountA", type: "uint256" }, { name: "tokenB", type: "address" }, { name: "amountB", type: "uint256" }], name: "createSwap", outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "swapId", type: "uint256" }], name: "completeSwap", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "swapId", type: "uint256" }], name: "cancelSwap", outputs: [], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "swapId", type: "uint256" }], name: "getSwapInfo", outputs: [{ components: [{ name: "partyA", type: "address" }, { name: "partyB", type: "address" }, { name: "tokenA", type: "address" }, { name: "amountA", type: "uint256" }, { name: "tokenB", type: "address" }, { name: "amountB", type: "uint256" }, { name: "status", type: "uint8" }, { name: "createdAt", type: "uint256" }], name: "", type: "tuple" }], stateMutability: "view", type: "function" },

  // ============ BATCH AIRDROP FUNCTIONS ============
  { inputs: [{ name: "token", type: "address" }, { name: "recipients", type: "address[]" }, { name: "amounts", type: "uint256[]" }], name: "batchTransfer", outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },

  // ============ TOKEN ADMIN (MINT/BURN) FUNCTIONS ============
  { inputs: [{ name: "token", type: "address" }, { name: "to", type: "address" }, { name: "amount", type: "uint256" }], name: "mintTokens", outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "token", type: "address" }, { name: "amount", type: "uint256" }], name: "burnTokens", outputs: [{ name: "", type: "bool" }], stateMutability: "nonpayable", type: "function" },

  // ============ EVENTS ============
  { anonymous: false, inputs: [{ indexed: true, name: "creator", type: "address" }, { indexed: true, name: "token", type: "address" }, { name: "name", type: "string" }, { name: "symbol", type: "string" }, { name: "supply", type: "uint256" }], name: "TokenCreated", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "saleId", type: "uint256" }, { indexed: true, name: "creator", type: "address" }, { name: "token", type: "address" }, { name: "price", type: "uint256" }, { name: "hardCap", type: "uint256" }], name: "SaleCreated", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "saleId", type: "uint256" }, { indexed: true, name: "buyer", type: "address" }, { name: "amount", type: "uint256" }], name: "TokensPurchased", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "saleId", type: "uint256" }, { indexed: true, name: "beneficiary", type: "address" }, { name: "amount", type: "uint256" }], name: "TokensClaimed", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "lockId", type: "uint256" }, { indexed: true, name: "token", type: "address" }, { indexed: true, name: "beneficiary", type: "address" }, { name: "amount", type: "uint256" }, { name: "unlockTime", type: "uint256" }], name: "TokensLocked", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "lockId", type: "uint256" }, { indexed: true, name: "beneficiary", type: "address" }, { name: "amount", type: "uint256" }], name: "TokensUnlocked", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "scheduleId", type: "uint256" }, { indexed: true, name: "beneficiary", type: "address" }, { name: "token", type: "address" }, { name: "amount", type: "uint256" }, { name: "startTime", type: "uint256" }, { name: "cliff", type: "uint256" }, { name: "vesting", type: "uint256" }], name: "VestingCreated", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "scheduleId", type: "uint256" }, { indexed: true, name: "beneficiary", type: "address" }, { name: "amount", type: "uint256" }], name: "TokensReleased", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "owner", type: "address" }, { name: "name", type: "string" }, { name: "symbol", type: "string" }, { name: "maxSupply", type: "uint256" }], name: "NFTDeployed", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "to", type: "address" }, { indexed: true, name: "tokenId", type: "uint256" }], name: "NFTMinted", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "streamId", type: "uint256" }, { indexed: true, name: "sender", type: "address" }, { indexed: true, name: "recipient", type: "address" }, { name: "totalAmount", type: "uint256" }], name: "StreamCreated", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "streamId", type: "uint256" }, { indexed: true, name: "recipient", type: "address" }, { name: "amount", type: "uint256" }], name: "StreamWithdrawn", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "streamId", type: "uint256" }], name: "StreamCancelled", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "recordId", type: "uint256" }, { indexed: true, name: "recorder", type: "address" }, { name: "dataHash", type: "bytes32" }, { name: "description", type: "string" }], name: "RecordCreated", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "swapId", type: "uint256" }, { indexed: true, name: "partyA", type: "address" }, { name: "tokenA", type: "address" }, { name: "amountA", type: "uint256" }, { name: "tokenB", type: "address" }, { name: "amountB", type: "uint256" }], name: "SwapCreated", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "swapId", type: "uint256" }, { indexed: true, name: "partyA", type: "address" }, { indexed: true, name: "partyB", type: "address" }], name: "SwapCompleted", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "swapId", type: "uint256" }], name: "SwapCancelled", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "airdropId", type: "uint256" }, { indexed: true, name: "token", type: "address" }, { name: "totalRecipients", type: "uint256" }, { name: "totalAmount", type: "uint256" }], name: "AirdropCompleted", type: "event" },
] as const

// Contract address (update after deployment)
export const MASTER_ADDRESS = process.env.NEXT_PUBLIC_MASTER_ADDRESS || "0x0000000000000000000000000000000000000000"

export type ContractName = "MASTER"
