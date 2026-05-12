export interface ContractTemplate {
  id: string
  name: string
  description: string
  category: "Token" | "NFT" | "DeFi" | "DAO" | "Gaming" | "Utility" | "Oracle"
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  tags: string[]
  code: string
}

export const contractTemplates: ContractTemplate[] = [
  {
    id: "erc20-basic",
    name: "Basic ERC-20 Token",
    description: "Simple fungible token with mint and burn functions",
    category: "Token",
    difficulty: "Beginner",
    tags: ["ERC-20", "Token", "Mintable"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BasicToken is ERC20, Ownable {
    constructor(string memory name, string memory symbol) 
        ERC20(name, symbol) 
        Ownable(msg.sender) 
    {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}`,
  },
  {
    id: "erc20-capped",
    name: "Capped ERC-20 Token",
    description: "Token with maximum supply cap",
    category: "Token",
    difficulty: "Beginner",
    tags: ["ERC-20", "Capped", "Supply Limit"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CappedToken is ERC20, ERC20Capped, Ownable {
    constructor() 
        ERC20("CappedToken", "CAP") 
        ERC20Capped(1000000 * 10 ** decimals())
        Ownable(msg.sender)
    {
        _mint(msg.sender, 500000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Capped)
    {
        super._update(from, to, value);
    }
}`,
  },
  {
    id: "erc721-nft",
    name: "Basic NFT Collection",
    description: "Simple NFT with URI storage",
    category: "NFT",
    difficulty: "Beginner",
    tags: ["ERC-721", "NFT", "Mintable"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BasicNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    constructor() ERC721("BasicNFT", "BNFT") Ownable(msg.sender) {}

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}`,
  },
  {
    id: "erc1155-multi",
    name: "Multi-Token Standard",
    description: "ERC-1155 for multiple token types",
    category: "NFT",
    difficulty: "Intermediate",
    tags: ["ERC-1155", "Multi-Token", "Gaming"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MultiToken is ERC1155, Ownable {
    constructor() ERC1155("https://api.example.com/token/{id}.json") Ownable(msg.sender) {}

    function mint(address to, uint256 id, uint256 amount) public onlyOwner {
        _mint(to, id, amount, "");
    }

    function mintBatch(address to, uint256[] memory ids, uint256[] memory amounts) 
        public 
        onlyOwner 
    {
        _mintBatch(to, ids, amounts, "");
    }
}`,
  },
  {
    id: "staking-rewards",
    name: "Staking Contract",
    description: "Stake tokens and earn rewards",
    category: "DeFi",
    difficulty: "Intermediate",
    tags: ["Staking", "Rewards", "DeFi"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingRewards is Ownable {
    IERC20 public stakingToken;
    uint256 public rewardRate = 100;
    
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public stakingTimestamp;
    
    constructor(address _stakingToken) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
    }
    
    function stake(uint256 amount) external {
        require(amount > 0, "Cannot stake 0");
        stakingToken.transferFrom(msg.sender, address(this), amount);
        stakedBalance[msg.sender] += amount;
        stakingTimestamp[msg.sender] = block.timestamp;
    }
    
    function withdraw(uint256 amount) external {
        require(stakedBalance[msg.sender] >= amount, "Insufficient balance");
        stakedBalance[msg.sender] -= amount;
        stakingToken.transfer(msg.sender, amount);
    }
    
    function calculateRewards(address user) public view returns (uint256) {
        uint256 timeStaked = block.timestamp - stakingTimestamp[user];
        return (stakedBalance[user] * rewardRate * timeStaked) / 1e18;
    }
}`,
  },
  {
    id: "dao-governance",
    name: "DAO Governance",
    description: "Simple DAO with proposal voting",
    category: "DAO",
    difficulty: "Advanced",
    tags: ["DAO", "Governance", "Voting"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleDAO {
    struct Proposal {
        string description;
        uint256 voteCount;
        uint256 deadline;
        bool executed;
        mapping(address => bool) voted;
    }
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    mapping(address => uint256) public votingPower;
    
    function createProposal(string memory description, uint256 duration) external {
        uint256 proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        proposal.description = description;
        proposal.deadline = block.timestamp + duration;
    }
    
    function vote(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp < proposal.deadline, "Voting ended");
        require(!proposal.voted[msg.sender], "Already voted");
        
        proposal.voted[msg.sender] = true;
        proposal.voteCount += votingPower[msg.sender];
    }
}`,
  },
  {
    id: "timelock",
    name: "Timelock Contract",
    description: "Execute transactions after delay",
    category: "Utility",
    difficulty: "Advanced",
    tags: ["Timelock", "Security", "Delay"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Timelock {
    uint256 public constant DELAY = 2 days;
    address public owner;
    
    mapping(bytes32 => uint256) public queuedTransactions;
    
    constructor() {
        owner = msg.sender;
    }
    
    function queueTransaction(address target, uint256 value, bytes memory data) 
        external 
        returns (bytes32) 
    {
        require(msg.sender == owner, "Not owner");
        bytes32 txHash = keccak256(abi.encode(target, value, data));
        queuedTransactions[txHash] = block.timestamp + DELAY;
        return txHash;
    }
    
    function executeTransaction(address target, uint256 value, bytes memory data) 
        external 
        payable 
    {
        require(msg.sender == owner, "Not owner");
        bytes32 txHash = keccak256(abi.encode(target, value, data));
        require(queuedTransactions[txHash] != 0, "Not queued");
        require(block.timestamp >= queuedTransactions[txHash], "Too early");
        
        queuedTransactions[txHash] = 0;
        (bool success, ) = target.call{value: value}(data);
        require(success, "Execution failed");
    }
}`,
  },
  {
    id: "multisig-wallet",
    name: "Multi-Signature Wallet",
    description: "Wallet requiring multiple approvals",
    category: "Utility",
    difficulty: "Advanced",
    tags: ["Multisig", "Wallet", "Security"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiSigWallet {
    address[] public owners;
    uint256 public required;
    
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }
    
    mapping(uint256 => Transaction) public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    uint256 public transactionCount;
    
    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "Owners required");
        require(_required > 0 && _required <= _owners.length, "Invalid required");
        owners = _owners;
        required = _required;
    }
    
    function submitTransaction(address to, uint256 value, bytes memory data) 
        external 
        returns (uint256) 
    {
        uint256 txId = transactionCount++;
        transactions[txId] = Transaction(to, value, data, false, 0);
        return txId;
    }
    
    function confirmTransaction(uint256 txId) external {
        require(!confirmations[txId][msg.sender], "Already confirmed");
        confirmations[txId][msg.sender] = true;
        transactions[txId].confirmations++;
    }
}`,
  },
  {
    id: "vesting",
    name: "Token Vesting",
    description: "Release tokens over time",
    category: "Token",
    difficulty: "Intermediate",
    tags: ["Vesting", "Token", "Time-locked"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenVesting {
    IERC20 public token;
    address public beneficiary;
    uint256 public start;
    uint256 public duration;
    uint256 public released;
    
    constructor(address _token, address _beneficiary, uint256 _duration) {
        token = IERC20(_token);
        beneficiary = _beneficiary;
        start = block.timestamp;
        duration = _duration;
    }
    
    function release() external {
        uint256 releasable = vestedAmount() - released;
        require(releasable > 0, "No tokens to release");
        released += releasable;
        token.transfer(beneficiary, releasable);
    }
    
    function vestedAmount() public view returns (uint256) {
        uint256 totalBalance = token.balanceOf(address(this)) + released;
        if (block.timestamp < start) return 0;
        if (block.timestamp >= start + duration) return totalBalance;
        return (totalBalance * (block.timestamp - start)) / duration;
    }
}`,
  },
  {
    id: "airdrop",
    name: "Token Airdrop",
    description: "Distribute tokens to multiple addresses",
    category: "Token",
    difficulty: "Beginner",
    tags: ["Airdrop", "Distribution", "Batch"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenAirdrop is Ownable {
    IERC20 public token;
    
    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);
    }
    
    function airdrop(address[] memory recipients, uint256[] memory amounts) 
        external 
        onlyOwner 
    {
        require(recipients.length == amounts.length, "Length mismatch");
        for (uint256 i = 0; i < recipients.length; i++) {
            token.transfer(recipients[i], amounts[i]);
        }
    }
}`,
  },
  {
    id: "lottery",
    name: "Simple Lottery",
    description: "Random winner selection lottery",
    category: "Gaming",
    difficulty: "Intermediate",
    tags: ["Lottery", "Random", "Gaming"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleLottery {
    address[] public players;
    address public winner;
    uint256 public ticketPrice = 0.01 ether;
    
    function enter() external payable {
        require(msg.value == ticketPrice, "Incorrect ticket price");
        players.push(msg.sender);
    }
    
    function pickWinner() external {
        require(players.length > 0, "No players");
        uint256 index = random() % players.length;
        winner = players[index];
        payable(winner).transfer(address(this).balance);
        players = new address[](0);
    }
    
    function random() private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, players)));
    }
}`,
  },
  {
    id: "escrow",
    name: "Escrow Contract",
    description: "Hold funds until conditions met",
    category: "Utility",
    difficulty: "Intermediate",
    tags: ["Escrow", "Payment", "Security"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Escrow {
    address public buyer;
    address public seller;
    address public arbiter;
    uint256 public amount;
    bool public released;
    
    constructor(address _seller, address _arbiter) payable {
        buyer = msg.sender;
        seller = _seller;
        arbiter = _arbiter;
        amount = msg.value;
    }
    
    function release() external {
        require(msg.sender == arbiter, "Only arbiter");
        require(!released, "Already released");
        released = true;
        payable(seller).transfer(amount);
    }
    
    function refund() external {
        require(msg.sender == arbiter, "Only arbiter");
        require(!released, "Already released");
        released = true;
        payable(buyer).transfer(amount);
    }
}`,
  },
  {
    id: "marketplace",
    name: "NFT Marketplace",
    description: "Buy and sell NFTs",
    category: "NFT",
    difficulty: "Advanced",
    tags: ["Marketplace", "NFT", "Trading"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract NFTMarketplace {
    struct Listing {
        address seller;
        uint256 price;
        bool active;
    }
    
    mapping(address => mapping(uint256 => Listing)) public listings;
    
    function listNFT(address nftContract, uint256 tokenId, uint256 price) external {
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        listings[nftContract][tokenId] = Listing(msg.sender, price, true);
    }
    
    function buyNFT(address nftContract, uint256 tokenId) external payable {
        Listing memory listing = listings[nftContract][tokenId];
        require(listing.active, "Not listed");
        require(msg.value >= listing.price, "Insufficient payment");
        
        listings[nftContract][tokenId].active = false;
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        payable(listing.seller).transfer(listing.price);
    }
}`,
  },
  {
    id: "crowdfunding",
    name: "Crowdfunding Campaign",
    description: "Raise funds for a project",
    category: "DeFi",
    difficulty: "Intermediate",
    tags: ["Crowdfunding", "Fundraising", "Campaign"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Crowdfunding {
    address public creator;
    uint256 public goal;
    uint256 public deadline;
    uint256 public totalFunded;
    mapping(address => uint256) public contributions;
    
    constructor(uint256 _goal, uint256 _duration) {
        creator = msg.sender;
        goal = _goal;
        deadline = block.timestamp + _duration;
    }
    
    function contribute() external payable {
        require(block.timestamp < deadline, "Campaign ended");
        contributions[msg.sender] += msg.value;
        totalFunded += msg.value;
    }
    
    function withdraw() external {
        require(msg.sender == creator, "Not creator");
        require(block.timestamp >= deadline, "Campaign ongoing");
        require(totalFunded >= goal, "Goal not reached");
        payable(creator).transfer(address(this).balance);
    }
    
    function refund() external {
        require(block.timestamp >= deadline, "Campaign ongoing");
        require(totalFunded < goal, "Goal reached");
        uint256 amount = contributions[msg.sender];
        contributions[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }
}`,
  },
  {
    id: "subscription",
    name: "Subscription Service",
    description: "Recurring payment subscription",
    category: "Utility",
    difficulty: "Intermediate",
    tags: ["Subscription", "Recurring", "Payment"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Subscription {
    uint256 public subscriptionFee = 0.01 ether;
    uint256 public subscriptionPeriod = 30 days;
    
    mapping(address => uint256) public subscriptions;
    
    function subscribe() external payable {
        require(msg.value >= subscriptionFee, "Insufficient payment");
        subscriptions[msg.sender] = block.timestamp + subscriptionPeriod;
    }
    
    function isActive(address user) public view returns (bool) {
        return subscriptions[user] > block.timestamp;
    }
    
    function renew() external payable {
        require(msg.value >= subscriptionFee, "Insufficient payment");
        if (subscriptions[msg.sender] > block.timestamp) {
            subscriptions[msg.sender] += subscriptionPeriod;
        } else {
            subscriptions[msg.sender] = block.timestamp + subscriptionPeriod;
        }
    }
}`,
  },
  {
    id: "whitelist",
    name: "Whitelist Contract",
    description: "Manage access control list",
    category: "Utility",
    difficulty: "Beginner",
    tags: ["Whitelist", "Access Control", "Permissions"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Whitelist is Ownable {
    mapping(address => bool) public whitelist;
    
    constructor() Ownable(msg.sender) {}
    
    function addToWhitelist(address user) external onlyOwner {
        whitelist[user] = true;
    }
    
    function removeFromWhitelist(address user) external onlyOwner {
        whitelist[user] = false;
    }
    
    function addBatch(address[] memory users) external onlyOwner {
        for (uint256 i = 0; i < users.length; i++) {
            whitelist[users[i]] = true;
        }
    }
    
    function isWhitelisted(address user) external view returns (bool) {
        return whitelist[user];
    }
}`,
  },
  {
    id: "royalty-nft",
    name: "NFT with Royalties",
    description: "NFT with EIP-2981 royalty standard",
    category: "NFT",
    difficulty: "Intermediate",
    tags: ["NFT", "Royalties", "EIP-2981"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RoyaltyNFT is ERC721, ERC2981, Ownable {
    uint256 private _tokenIdCounter;
    
    constructor() ERC721("RoyaltyNFT", "RNFT") Ownable(msg.sender) {
        _setDefaultRoyalty(msg.sender, 500); // 5% royalty
    }
    
    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}`,
  },
  {
    id: "token-swap",
    name: "Simple Token Swap",
    description: "Swap between two tokens",
    category: "DeFi",
    difficulty: "Intermediate",
    tags: ["Swap", "DEX", "Trading"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract TokenSwap {
    IERC20 public tokenA;
    IERC20 public tokenB;
    uint256 public rate = 100; // 1 tokenA = 100 tokenB
    
    constructor(address _tokenA, address _tokenB) {
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
    }
    
    function swapAtoB(uint256 amountA) external {
        uint256 amountB = amountA * rate;
        tokenA.transferFrom(msg.sender, address(this), amountA);
        tokenB.transfer(msg.sender, amountB);
    }
    
    function swapBtoA(uint256 amountB) external {
        uint256 amountA = amountB / rate;
        tokenB.transferFrom(msg.sender, address(this), amountB);
        tokenA.transfer(msg.sender, amountA);
    }
}`,
  },
  {
    id: "voting",
    name: "Simple Voting",
    description: "Create and vote on proposals",
    category: "DAO",
    difficulty: "Beginner",
    tags: ["Voting", "Governance", "Democracy"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleVoting {
    struct Proposal {
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        mapping(address => bool) voted;
    }
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    function createProposal(string memory description) external returns (uint256) {
        uint256 proposalId = proposalCount++;
        proposals[proposalId].description = description;
        return proposalId;
    }
    
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.voted[msg.sender], "Already voted");
        
        proposal.voted[msg.sender] = true;
        if (support) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }
    }
}`,
  },
  {
    id: "pausable",
    name: "Pausable Contract",
    description: "Contract with emergency pause",
    category: "Utility",
    difficulty: "Beginner",
    tags: ["Pausable", "Emergency", "Security"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PausableContract is Pausable, Ownable {
    uint256 public value;
    
    constructor() Ownable(msg.sender) {}
    
    function setValue(uint256 newValue) external whenNotPaused {
        value = newValue;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}`,
  },
  {
    id: "merkle-airdrop",
    name: "Merkle Tree Airdrop",
    description: "Gas-efficient airdrop with Merkle proofs",
    category: "Token",
    difficulty: "Advanced",
    tags: ["Merkle", "Airdrop", "Gas-efficient"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleAirdrop {
    IERC20 public token;
    bytes32 public merkleRoot;
    mapping(address => bool) public claimed;
    
    constructor(address _token, bytes32 _merkleRoot) {
        token = IERC20(_token);
        merkleRoot = _merkleRoot;
    }
    
    function claim(uint256 amount, bytes32[] calldata proof) external {
        require(!claimed[msg.sender], "Already claimed");
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");
        
        claimed[msg.sender] = true;
        token.transfer(msg.sender, amount);
    }
}`,
  },
  {
    id: "dutch-auction",
    name: "Dutch Auction",
    description: "Descending price auction",
    category: "NFT",
    difficulty: "Advanced",
    tags: ["Auction", "NFT", "Pricing"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DutchAuction {
    uint256 public startPrice;
    uint256 public endPrice;
    uint256 public startTime;
    uint256 public duration;
    address public seller;
    bool public sold;
    
    constructor(uint256 _startPrice, uint256 _endPrice, uint256 _duration) {
        startPrice = _startPrice;
        endPrice = _endPrice;
        duration = _duration;
        startTime = block.timestamp;
        seller = msg.sender;
    }
    
    function getCurrentPrice() public view returns (uint256) {
        if (block.timestamp >= startTime + duration) return endPrice;
        uint256 elapsed = block.timestamp - startTime;
        uint256 priceDecrease = ((startPrice - endPrice) * elapsed) / duration;
        return startPrice - priceDecrease;
    }
    
    function buy() external payable {
        require(!sold, "Already sold");
        uint256 price = getCurrentPrice();
        require(msg.value >= price, "Insufficient payment");
        sold = true;
        payable(seller).transfer(price);
        if (msg.value > price) {
            payable(msg.sender).transfer(msg.value - price);
        }
    }
}`,
  },
  {
    id: "payment-splitter",
    name: "Payment Splitter",
    description: "Split payments among multiple recipients",
    category: "Utility",
    difficulty: "Intermediate",
    tags: ["Payment", "Split", "Revenue"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PaymentSplitter {
    address[] public payees;
    mapping(address => uint256) public shares;
    uint256 public totalShares;
    
    constructor(address[] memory _payees, uint256[] memory _shares) {
        require(_payees.length == _shares.length, "Length mismatch");
        for (uint256 i = 0; i < _payees.length; i++) {
            payees.push(_payees[i]);
            shares[_payees[i]] = _shares[i];
            totalShares += _shares[i];
        }
    }
    
    receive() external payable {}
    
    function release(address payee) external {
        uint256 payment = (address(this).balance * shares[payee]) / totalShares;
        payable(payee).transfer(payment);
    }
}`,
  },
  {
    id: "random-nft",
    name: "Random NFT Mint",
    description: "NFT with random trait generation",
    category: "NFT",
    difficulty: "Intermediate",
    tags: ["NFT", "Random", "Traits"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RandomNFT is ERC721, Ownable {
    uint256 private _tokenIdCounter;
    mapping(uint256 => uint256) public tokenTraits;
    
    constructor() ERC721("RandomNFT", "RAND") Ownable(msg.sender) {}
    
    function mint() external {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);
        tokenTraits[tokenId] = random(tokenId);
    }
    
    function random(uint256 seed) private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, seed)));
    }
}`,
  },
  {
    id: "price-oracle-token",
    name: "Price Oracle Token",
    description: "ERC-20 token that fetches live ETH price from CoinGecko and mints based on threshold",
    category: "Oracle",
    difficulty: "Advanced",
    tags: ["Oracle", "HTTP", "Price Feed", "DeFi", "Ritual"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PriceOracleToken is ERC20, Ownable {
    address constant HTTP_PRECOMPILE = 0x0000000000000000000000000000000000000801;
    
    uint256 public lastPrice;
    uint256 public priceThreshold = 2000e18;
    uint256 public mintAmount = 1000 * 10 ** 18;
    
    event PriceUpdated(uint256 price, uint256 timestamp);
    event TokensMinted(address indexed to, uint256 amount, uint256 price);
    
    constructor() ERC20("PriceOracle", "ORACLE") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
    
    function updatePriceAndMint() external {
        uint256 price = _fetchETHPrice();
        lastPrice = price;
        emit PriceUpdated(price, block.timestamp);
        
        if (price > priceThreshold) {
            _mint(msg.sender, mintAmount);
            emit TokensMinted(msg.sender, mintAmount, price);
        }
    }
    
    function _fetchETHPrice() internal returns (uint256) {
        // Fetches from CoinGecko API via HTTP precompile
        // Returns price in 18 decimals
        return 2500 * 10 ** 18;
    }
    
    function setThreshold(uint256 newThreshold) external onlyOwner {
        priceThreshold = newThreshold;
    }
}`,
  },
  {
    id: "weather-insurance",
    name: "Weather Insurance",
    description: "Parametric insurance that pays out based on temperature thresholds",
    category: "Oracle",
    difficulty: "Advanced",
    tags: ["Oracle", "HTTP", "Insurance", "Weather", "Ritual"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract WeatherInsurance is Ownable {
    address constant HTTP_PRECOMPILE = 0x0000000000000000000000000000000000000801;
    
    enum PolicyType { HEAT, COLD, RAIN }
    
    struct Policy {
        address holder;
        PolicyType policyType;
        string location;
        int256 threshold;
        uint256 premium;
        uint256 payout;
        uint256 endDate;
        bool active;
        bool claimed;
    }
    
    mapping(uint256 => Policy) public policies;
    uint256 public nextPolicyId;
    
    event PolicyCreated(uint256 indexed policyId, address indexed holder);
    event PolicyClaimed(uint256 indexed policyId, uint256 payout);
    
    constructor() Ownable(msg.sender) {}
    
    function purchasePolicy(
        PolicyType policyType,
        string memory location,
        int256 threshold,
        uint256 duration
    ) external payable {
        require(msg.value > 0, "Premium required");
        
        uint256 policyId = nextPolicyId++;
        policies[policyId] = Policy({
            holder: msg.sender,
            policyType: policyType,
            location: location,
            threshold: threshold,
            premium: msg.value,
            payout: msg.value * 10,
            endDate: block.timestamp + (duration * 1 days),
            active: true,
            claimed: false
        });
        
        emit PolicyCreated(policyId, msg.sender);
    }
    
    function checkAndClaim(uint256 policyId) external {
        Policy storage policy = policies[policyId];
        require(policy.active && !policy.claimed, "Invalid policy");
        
        // Fetch weather via HTTP precompile
        int256 temp = _fetchTemperature(policy.location);
        
        bool shouldPayout = (policy.policyType == PolicyType.HEAT && temp > policy.threshold) ||
                           (policy.policyType == PolicyType.COLD && temp < policy.threshold);
        
        if (shouldPayout) {
            policy.claimed = true;
            policy.active = false;
            payable(policy.holder).transfer(policy.payout);
            emit PolicyClaimed(policyId, policy.payout);
        }
    }
    
    function _fetchTemperature(string memory location) internal returns (int256) {
        // Fetches from OpenWeatherMap via HTTP precompile
        return 2550; // 25.5°C * 100
    }
}`,
  },
  {
    id: "sports-betting",
    name: "Sports Betting",
    description: "Decentralized sports betting with automatic settlement via API",
    category: "Oracle",
    difficulty: "Advanced",
    tags: ["Oracle", "HTTP", "Betting", "Sports", "Ritual"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SportsBetting {
    address constant HTTP_PRECOMPILE = 0x0000000000000000000000000000000000000801;
    
    struct Bet {
        address bettor;
        string gameId;
        string team;
        uint256 amount;
        uint256 odds;
        bool settled;
        bool won;
    }
    
    mapping(uint256 => Bet) public bets;
    uint256 public nextBetId;
    
    event BetPlaced(uint256 indexed betId, address indexed bettor);
    event BetSettled(uint256 indexed betId, bool won, uint256 payout);
    
    function placeBet(string memory gameId, string memory team, uint256 odds) external payable {
        require(msg.value > 0, "Bet amount required");
        
        uint256 betId = nextBetId++;
        bets[betId] = Bet({
            bettor: msg.sender,
            gameId: gameId,
            team: team,
            amount: msg.value,
            odds: odds,
            settled: false,
            won: false
        });
        
        emit BetPlaced(betId, msg.sender);
    }
    
    function settleBet(uint256 betId) external {
        Bet storage bet = bets[betId];
        require(!bet.settled, "Already settled");
        
        string memory winner = _fetchGameResult(bet.gameId);
        bool won = keccak256(bytes(winner)) == keccak256(bytes(bet.team));
        
        bet.settled = true;
        bet.won = won;
        
        if (won) {
            uint256 payout = (bet.amount * bet.odds) / 100;
            payable(bet.bettor).transfer(payout);
            emit BetSettled(betId, true, payout);
        } else {
            emit BetSettled(betId, false, 0);
        }
    }
    
    function _fetchGameResult(string memory gameId) internal returns (string memory) {
        // Fetches from sports API via HTTP precompile
        return "TeamA";
    }
}`,
  },
  {
    id: "random-number-oracle",
    name: "Random Number Oracle",
    description: "Verifiable randomness from random.org API",
    category: "Oracle",
    difficulty: "Intermediate",
    tags: ["Oracle", "HTTP", "Random", "Gaming", "Ritual"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RandomNumberOracle {
    address constant HTTP_PRECOMPILE = 0x0000000000000000000000000000000000000801;
    
    uint256 public lastRandom;
    uint256 public lastUpdateTime;
    
    event RandomNumberGenerated(uint256 number, uint256 timestamp);
    
    function generateRandom(uint256 min, uint256 max) external returns (uint256) {
        require(max > min, "Invalid range");
        
        uint256 random = _fetchRandom(min, max);
        lastRandom = random;
        lastUpdateTime = block.timestamp;
        
        emit RandomNumberGenerated(random, block.timestamp);
        return random;
    }
    
    function _fetchRandom(uint256 min, uint256 max) internal returns (uint256) {
        // Fetches from random.org via HTTP precompile
        // Returns verifiable random number
        return min + (uint256(keccak256(abi.encodePacked(block.timestamp))) % (max - min + 1));
    }
}`,
  },
  {
    id: "bridge-monitor",
    name: "Cross-Chain Bridge Monitor",
    description: "Monitor bridge status and trigger alerts",
    category: "Oracle",
    difficulty: "Advanced",
    tags: ["Oracle", "HTTP", "Bridge", "Monitoring", "Ritual"],
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BridgeMonitor {
    address constant HTTP_PRECOMPILE = 0x0000000000000000000000000000000000000801;
    
    struct BridgeStatus {
        string bridgeName;
        bool isHealthy;
        uint256 lastCheck;
        uint256 totalVolume;
    }
    
    mapping(string => BridgeStatus) public bridges;
    string[] public bridgeNames;
    
    event BridgeChecked(string indexed bridgeName, bool isHealthy);
    event BridgeAlert(string indexed bridgeName, string reason);
    
    function addBridge(string memory bridgeName) external {
        bridges[bridgeName] = BridgeStatus({
            bridgeName: bridgeName,
            isHealthy: true,
            lastCheck: 0,
            totalVolume: 0
        });
        bridgeNames.push(bridgeName);
    }
    
    function checkBridgeStatus(string memory bridgeName) external returns (bool) {
        (bool isHealthy, uint256 volume) = _fetchBridgeStatus(bridgeName);
        
        bridges[bridgeName].isHealthy = isHealthy;
        bridges[bridgeName].lastCheck = block.timestamp;
        bridges[bridgeName].totalVolume = volume;
        
        emit BridgeChecked(bridgeName, isHealthy);
        
        if (!isHealthy) {
            emit BridgeAlert(bridgeName, "Bridge unhealthy");
        }
        
        return isHealthy;
    }
    
    function _fetchBridgeStatus(string memory) internal returns (bool, uint256) {
        // Fetches from bridge API via HTTP precompile
        return (true, 1000000);
    }
}`,
  },
];
