// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./MinimalToken.sol";
import "./RiteForgeToken.sol";

/**
 * @title RiteForgeMaster
 * @dev All-in-one contract for RiteForge - single deployment saves ~80% gas vs separate contracts
 */
contract RiteForgeMaster {
    using SafeERC20 for IERC20;

    // ============ ERC20 SECTION ============
    uint256 private _tokenIds;
    mapping(address => address[]) public userTokens;
    mapping(address => address) public tokenOwners; // Track token ownership

    event TokenCreated(address indexed creator, address indexed token, string name, string symbol, uint256 supply);

    // ============ LAUNCHPAD SECTION ============
    struct Sale {
        address creator;
        address token;
        uint256 price;
        uint256 totalTokens;
        uint256 soldTokens;
        uint256 softCap;
        uint256 hardCap;
        uint256 minContribution;
        uint256 maxContribution;
        uint256 startTime;
        uint256 endTime;
        uint256 raised;
        uint8 status; // 0=Pending, 1=Active, 2=Completed, 3=Cancelled
    }

    Sale[] public sales;
    mapping(uint256 => mapping(address => uint256)) public buyerContributions;
    uint256 public platformFeePercent = 1;

    event SaleCreated(uint256 indexed saleId, address indexed creator, address token, uint256 price, uint256 hardCap);
    event TokensPurchased(uint256 indexed saleId, address indexed buyer, uint256 amount);
    event TokensClaimed(uint256 indexed saleId, address indexed beneficiary, uint256 amount);

    // ============ LOCKER SECTION ============
    struct Lock {
        address token;
        address beneficiary;
        uint256 amount;
        uint256 unlockTime;
        bool claimed;
    }

    struct LockDeposit {
        address token;
        address depositor;
        uint256 amount;
        uint256 timestamp;
    }

    Lock[] public locks;
    LockDeposit[] public lockDeposits;
    mapping(address => uint256[]) public userLocks;

    event TokensDeposited(uint256 indexed depositId, address indexed token, address indexed depositor, uint256 amount);
    event TokensLocked(uint256 indexed lockId, address indexed token, address indexed beneficiary, uint256 amount, uint256 unlockTime);
    event TokensUnlocked(uint256 indexed lockId, address indexed beneficiary, uint256 amount);

    // ============ VESTING SECTION ============
    struct VestingSchedule {
        address token;
        address beneficiary;
        uint256 totalAmount;
        uint256 released;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
        bool revoked;
    }

    struct VestingDeposit {
        address token;
        address depositor;
        uint256 amount;
        uint256 timestamp;
    }

    VestingSchedule[] public vestings;
    VestingDeposit[] public vestingDeposits;
    mapping(address => uint256[]) public userVestings;

    event VestingDeposited(uint256 indexed depositId, address indexed token, address indexed depositor, uint256 amount);
    event VestingCreated(uint256 indexed scheduleId, address indexed beneficiary, address token, uint256 amount, uint256 startTime, uint256 cliff, uint256 vesting);
    event TokensReleased(uint256 indexed scheduleId, address indexed beneficiary, uint256 amount);

    // ============ NFT SECTION ============
    uint256 private _nftTokenIds;
    uint256 public nftMaxSupply;
    string public nftBaseURI;
    address public nftOwner;

    event NFTDeployed(address indexed owner, string name, string symbol, uint256 maxSupply);
    event NFTMinted(address indexed to, uint256 indexed tokenId);

    // ============ CONSTRUCTOR ============
    constructor() {
        // Initialize NFT defaults
        nftMaxSupply = 10000;
        nftBaseURI = "https://api.riteforge.io/metadata/";
        nftOwner = msg.sender;
    }

    // ============ TOKEN FUNCTIONS ============
    function createToken(string memory name, string memory symbol, uint8 decimals, uint256 initialSupply) external returns (address) {
        // Create new RiteForgeToken
        RiteForgeToken newToken = new RiteForgeToken(
            name,
            symbol,
            decimals,
            initialSupply,
            msg.sender,
            address(this)
        );

        userTokens[msg.sender].push(address(newToken));
        tokenOwners[address(newToken)] = msg.sender;
        emit TokenCreated(msg.sender, address(newToken), name, symbol, initialSupply);
        return address(newToken);
    }

    function getUserTokens(address user) external view returns (address[] memory) {
        return userTokens[user];
    }

    function isTokenOwner(address token, address user) external view returns (bool) {
        return tokenOwners[token] == user;
    }

    // ============ LAUNCHPAD FUNCTIONS ============
    function createSale(
        address token,
        uint256 price,
        uint256 totalTokens,
        uint256 softCap,
        uint256 hardCap,
        uint256 minContribution,
        uint256 maxContribution,
        uint256 startTime,
        uint256 endTime
    ) external returns (uint256 saleId) {
        require(price > 0 && totalTokens > 0 && softCap <= hardCap);

        IERC20(token).transferFrom(msg.sender, address(this), totalTokens);

        Sale storage sale = sales.push();
        sale.creator = msg.sender;
        sale.token = token;
        sale.price = price;
        sale.totalTokens = totalTokens;
        sale.softCap = softCap;
        sale.hardCap = hardCap;
        sale.minContribution = minContribution;
        sale.maxContribution = maxContribution;
        sale.startTime = startTime;
        sale.endTime = endTime;
        sale.status = 1; // Active

        saleId = sales.length - 1;
        emit SaleCreated(saleId, msg.sender, token, price, hardCap);
    }

    function buyTokens(uint256 saleId) external payable {
        Sale storage sale = sales[saleId];
        require(sale.status == 1, "Sale not active");
        require(block.timestamp >= sale.startTime && block.timestamp <= sale.endTime, "Outside sale window");

        uint256 contribution = msg.value;
        require(contribution >= sale.minContribution && contribution <= sale.maxContribution, "Invalid contribution");

        uint256 tokensBought = (contribution * 1e18) / sale.price;
        require(tokensBought <= sale.totalTokens - sale.soldTokens, "Not enough tokens");

        buyerContributions[saleId][msg.sender] += contribution;
        sale.soldTokens += tokensBought;
        sale.raised += contribution;

        emit TokensPurchased(saleId, msg.sender, tokensBought);

        if (sale.soldTokens >= sale.hardCap) {
            sale.status = 2;
        }
    }

    function claimTokens(uint256 saleId) external {
        Sale storage sale = sales[saleId];
        uint256 contributed = buyerContributions[saleId][msg.sender];
        require(contributed > 0, "No contribution");
        require(sale.status == 2 || block.timestamp > sale.endTime, "Cannot claim yet");

        uint256 tokensBought = (contributed * 1e18) / sale.price;
        buyerContributions[saleId][msg.sender] = 0;

        IERC20(sale.token).safeTransfer(msg.sender, tokensBought);
        emit TokensClaimed(saleId, msg.sender, tokensBought);
    }

    function getSaleInfo(uint256 saleId) external view returns (Sale memory) {
        return sales[saleId];
    }

    // ============ LOCKER FUNCTIONS ============
    // Pull-based: user deposits first, then creates lock
    function depositForLock(address token, uint256 amount) external returns (uint256 depositId) {
        require(amount > 0, "Amount must be positive");
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        depositId = lockDeposits.length;
        lockDeposits.push(LockDeposit({
            token: token,
            depositor: msg.sender,
            amount: amount,
            timestamp: block.timestamp
        }));

        emit TokensDeposited(depositId, token, msg.sender, amount);
    }

    function createLockFromDeposit(uint256 depositId, uint256 unlockTime, address beneficiary) external returns (uint256 lockId) {
        require(depositId < lockDeposits.length, "Invalid deposit");
        LockDeposit storage deposit = lockDeposits[depositId];
        require(deposit.depositor == msg.sender, "Not depositor");
        require(deposit.amount > 0, "Already used");
        require(unlockTime > block.timestamp, "Unlock time must be future");

        uint256 amount = deposit.amount;
        deposit.amount = 0; // Mark as used

        Lock storage lockInfo = locks.push();
        lockInfo.token = deposit.token;
        lockInfo.beneficiary = beneficiary;
        lockInfo.amount = amount;
        lockInfo.unlockTime = unlockTime;

        lockId = locks.length - 1;
        userLocks[beneficiary].push(lockId);

        emit TokensLocked(lockId, deposit.token, beneficiary, amount, unlockTime);
    }

    function lockTokens(address token, uint256 amount, uint256 unlockTime, address beneficiary) external returns (uint256 lockId) {
        require(amount > 0 && unlockTime > block.timestamp);

        IERC20(token).transferFrom(msg.sender, address(this), amount);

        Lock storage lockInfo = locks.push();
        lockInfo.token = token;
        lockInfo.beneficiary = beneficiary;
        lockInfo.amount = amount;
        lockInfo.unlockTime = unlockTime;

        lockId = locks.length - 1;
        userLocks[beneficiary].push(lockId);

        emit TokensLocked(lockId, token, beneficiary, amount, unlockTime);
    }

    function unlockTokens(uint256 lockId) external {
        Lock storage lockInfo = locks[lockId];
        require(!lockInfo.claimed, "Already claimed");
        require(block.timestamp >= lockInfo.unlockTime, "Not yet unlocked");
        require(msg.sender == lockInfo.beneficiary, "Not beneficiary");

        lockInfo.claimed = true;
        IERC20(lockInfo.token).safeTransfer(lockInfo.beneficiary, lockInfo.amount);
        emit TokensUnlocked(lockId, lockInfo.beneficiary, lockInfo.amount);
    }

    function getUserLockCount(address user) external view returns (uint256) {
        return userLocks[user].length;
    }

    // ============ VESTING FUNCTIONS ============
    function depositForVesting(address token, uint256 amount) external returns (uint256 depositId) {
        require(amount > 0, "Amount must be positive");
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        depositId = vestingDeposits.length;
        vestingDeposits.push(VestingDeposit({
            token: token,
            depositor: msg.sender,
            amount: amount,
            timestamp: block.timestamp
        }));

        emit VestingDeposited(depositId, token, msg.sender, amount);
    }

    function createVestingFromDeposit(
        uint256 depositId,
        address beneficiary,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration
    ) external returns (uint256 scheduleId) {
        require(depositId < vestingDeposits.length, "Invalid deposit");
        VestingDeposit storage deposit = vestingDeposits[depositId];
        require(deposit.depositor == msg.sender, "Not depositor");
        require(deposit.amount > 0, "Already used");
        require(cliffDuration <= vestingDuration);

        uint256 totalAmount = deposit.amount;
        deposit.amount = 0;

        VestingSchedule storage vesting = vestings.push();
        vesting.token = deposit.token;
        vesting.beneficiary = beneficiary;
        vesting.totalAmount = totalAmount;
        vesting.startTime = startTime;
        vesting.cliffDuration = cliffDuration;
        vesting.vestingDuration = vestingDuration;

        scheduleId = vestings.length - 1;
        userVestings[beneficiary].push(scheduleId);

        emit VestingCreated(scheduleId, beneficiary, deposit.token, totalAmount, startTime, cliffDuration, vestingDuration);
    }

    // Legacy function (still works for backwards compatibility)
    function createVesting(
        address token,
        address beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration
    ) external returns (uint256 scheduleId) {
        require(totalAmount > 0 && cliffDuration <= vestingDuration);

        IERC20(token).transferFrom(msg.sender, address(this), totalAmount);

        VestingSchedule storage vesting = vestings.push();
        vesting.token = token;
        vesting.beneficiary = beneficiary;
        vesting.totalAmount = totalAmount;
        vesting.startTime = startTime;
        vesting.cliffDuration = cliffDuration;
        vesting.vestingDuration = vestingDuration;

        scheduleId = vestings.length - 1;
        userVestings[beneficiary].push(scheduleId);

        emit VestingCreated(scheduleId, beneficiary, token, totalAmount, startTime, cliffDuration, vestingDuration);
    }

    function release(uint256 scheduleId) external {
        VestingSchedule storage vesting = vestings[scheduleId];
        require(!vesting.revoked && msg.sender == vesting.beneficiary);

        uint256 claimable = getClaimableAmount(scheduleId);
        require(claimable > 0, "Nothing to claim");

        vesting.released += claimable;
        IERC20(vesting.token).safeTransfer(vesting.beneficiary, claimable);
        emit TokensReleased(scheduleId, vesting.beneficiary, claimable);
    }

    function getClaimableAmount(uint256 scheduleId) public view returns (uint256) {
        VestingSchedule storage vesting = vestings[scheduleId];
        if (vesting.revoked || vesting.released >= vesting.totalAmount) return 0;

        uint256 currentTime = block.timestamp;
        uint256 cliffEnd = vesting.startTime + vesting.cliffDuration;
        uint256 vestingEnd = vesting.startTime + vesting.vestingDuration;

        if (currentTime < cliffEnd) return 0;

        uint256 vested = (currentTime >= vestingEnd)
            ? vesting.totalAmount
            : (vesting.totalAmount * (currentTime - cliffEnd)) / (vesting.vestingDuration - vesting.cliffDuration);

        return vested - vesting.released;
    }

    function getUserVestingCount(address user) external view returns (uint256) {
        return userVestings[user].length;
    }

    // ============ STREAMING SECTION ============
    // Pull-based: sender deposits tokens, then creates stream
    struct Stream {
        address sender;
        address recipient;
        address token;
        uint256 totalAmount;
        uint256 withdrawn;
        uint256 startTime;
        uint256 stopTime;
        bool cancelled;
    }

    struct StreamDeposit {
        address token;
        address depositor;
        uint256 amount;
        uint256 timestamp;
    }

    Stream[] public streams;
    StreamDeposit[] public streamDeposits;
    mapping(address => uint256[]) public userStreams;

    event StreamDeposited(uint256 indexed depositId, address indexed token, address indexed depositor, uint256 amount);
    event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 totalAmount);
    event StreamWithdrawn(uint256 indexed streamId, address indexed recipient, uint256 amount);
    event StreamCancelled(uint256 indexed streamId);

    function depositForStream(address token, uint256 amount) external returns (uint256 depositId) {
        require(amount > 0, "Amount must be positive");
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        depositId = streamDeposits.length;
        streamDeposits.push(StreamDeposit({
            token: token,
            depositor: msg.sender,
            amount: amount,
            timestamp: block.timestamp
        }));

        emit StreamDeposited(depositId, token, msg.sender, amount);
    }

    function createStreamFromDeposit(uint256 depositId, address recipient, uint256 startTime, uint256 stopTime) external returns (uint256 streamId) {
        require(depositId < streamDeposits.length, "Invalid deposit");
        StreamDeposit storage deposit = streamDeposits[depositId];
        require(deposit.depositor == msg.sender, "Not depositor");
        require(deposit.amount > 0, "Already used");
        require(recipient != address(0) && recipient != msg.sender);
        require(stopTime > startTime && stopTime > block.timestamp);

        uint256 totalAmount = deposit.amount;
        deposit.amount = 0;

        Stream storage stream = streams.push();
        stream.sender = msg.sender;
        stream.recipient = recipient;
        stream.token = deposit.token;
        stream.totalAmount = totalAmount;
        stream.withdrawn = 0;
        stream.startTime = startTime;
        stream.stopTime = stopTime;

        streamId = streams.length - 1;
        userStreams[msg.sender].push(streamId);
        userStreams[recipient].push(streamId);

        emit StreamCreated(streamId, msg.sender, recipient, totalAmount);
    }

    // Legacy function (still works for backwards compatibility)
    function createStream(
        address recipient,
        address token,
        uint256 totalAmount,
        uint256 startTime,
        uint256 stopTime
    ) external returns (uint256 streamId) {
        require(recipient != address(0) && recipient != msg.sender);
        require(stopTime > startTime && stopTime > block.timestamp);
        require(totalAmount > 0);

        IERC20(token).transferFrom(msg.sender, address(this), totalAmount);

        Stream storage stream = streams.push();
        stream.sender = msg.sender;
        stream.recipient = recipient;
        stream.token = token;
        stream.totalAmount = totalAmount;
        stream.withdrawn = 0;
        stream.startTime = startTime;
        stream.stopTime = stopTime;

        streamId = streams.length - 1;
        userStreams[msg.sender].push(streamId);
        userStreams[recipient].push(streamId);

        emit StreamCreated(streamId, msg.sender, recipient, totalAmount);
    }

    function withdrawFromStream(uint256 streamId, uint256 amount) external {
        Stream storage stream = streams[streamId];
        require(msg.sender == stream.recipient, "Not recipient");
        require(!stream.cancelled, "Stream cancelled");

        uint256 withdrawable = getWithdrawableAmount(streamId);
        require(withdrawable >= amount, "Insufficient balance");

        stream.withdrawn += amount;
        IERC20(stream.token).safeTransfer(stream.recipient, amount);
        emit StreamWithdrawn(streamId, stream.recipient, amount);
    }

    function cancelStream(uint256 streamId) external {
        Stream storage stream = streams[streamId];
        require(msg.sender == stream.sender || msg.sender == stream.recipient, "Not authorized");
        require(!stream.cancelled, "Already cancelled");

        stream.cancelled = true;
        uint256 balance = stream.totalAmount - stream.withdrawn;

        if (balance > 0) {
            if (msg.sender == stream.sender) {
                IERC20(stream.token).safeTransfer(stream.recipient, balance);
            }
        }
        emit StreamCancelled(streamId);
    }

    function getWithdrawableAmount(uint256 streamId) public view returns (uint256) {
        Stream storage stream = streams[streamId];
        if (stream.cancelled || stream.withdrawn >= stream.totalAmount) return 0;

        uint256 currentTime = block.timestamp;
        uint256 eligibleTime = currentTime < stream.startTime ? stream.startTime : currentTime;
        uint256 endTime = currentTime > stream.stopTime ? stream.stopTime : currentTime;

        if (eligibleTime >= endTime) return 0;

        uint256 totalDuration = stream.stopTime - stream.startTime;
        uint256 elapsed = eligibleTime - stream.startTime;
        uint256 totalWithdrawable = (stream.totalAmount * elapsed) / totalDuration;

        return totalWithdrawable > stream.withdrawn ? totalWithdrawable - stream.withdrawn : 0;
    }

    function getStreamInfo(uint256 streamId) external view returns (Stream memory) {
        return streams[streamId];
    }

    function getUserStreamCount(address user) external view returns (uint256) {
        return userStreams[user].length;
    }

    // ============ CHAIN RECORD SECTION ============
    struct Record {
        address recorder;
        bytes32 dataHash;
        string description;
        uint256 timestamp;
    }

    Record[] public records;
    mapping(address => uint256[]) public userRecords;

    event RecordCreated(uint256 indexed recordId, address indexed recorder, bytes32 dataHash, string description);

    function createRecord(bytes32 dataHash, string memory description) external returns (uint256 recordId) {
        require(dataHash != bytes32(0), "Invalid hash");

        Record storage record = records.push();
        record.recorder = msg.sender;
        record.dataHash = dataHash;
        record.description = description;
        record.timestamp = block.timestamp;

        recordId = records.length - 1;
        userRecords[msg.sender].push(recordId);

        emit RecordCreated(recordId, msg.sender, dataHash, description);
    }

    function getRecord(uint256 recordId) external view returns (Record memory) {
        return records[recordId];
    }

    function getUserRecordCount(address user) external view returns (uint256) {
        return userRecords[user].length;
    }

    // ============ DVP SWAP SECTION ============
    // Pull-based: partyA deposits first, then partyB completes
    struct Swap {
        address partyA;
        address partyB;
        address tokenA;
        uint256 amountA;
        address tokenB;
        uint256 amountB;
        uint8 status; // 0=Open, 1=Completed, 2=Cancelled
        uint256 createdAt;
    }

    struct SwapDeposit {
        address token;
        address depositor;
        uint256 amount;
        uint256 timestamp;
    }

    Swap[] public swaps;
    SwapDeposit[] public swapDeposits;
    mapping(address => uint256[]) public userSwaps;

    event SwapDeposited(uint256 indexed depositId, address indexed token, address indexed depositor, uint256 amount);
    event SwapCreated(uint256 indexed swapId, address indexed partyA, address tokenA, uint256 amountA, address tokenB, uint256 amountB);
    event SwapCompleted(uint256 indexed swapId, address indexed partyA, address indexed partyB);
    event SwapCancelled(uint256 indexed swapId);

    function depositForSwap(address token, uint256 amount) external returns (uint256 depositId) {
        require(amount > 0, "Amount must be positive");
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        depositId = swapDeposits.length;
        swapDeposits.push(SwapDeposit({
            token: token,
            depositor: msg.sender,
            amount: amount,
            timestamp: block.timestamp
        }));

        emit SwapDeposited(depositId, token, msg.sender, amount);
    }

    function createSwapFromDeposit(uint256 depositId, address tokenB, uint256 amountB) external returns (uint256 swapId) {
        require(depositId < swapDeposits.length, "Invalid deposit");
        SwapDeposit storage deposit = swapDeposits[depositId];
        require(deposit.depositor == msg.sender, "Not depositor");
        require(deposit.amount > 0, "Already used");
        require(amountB > 0, "AmountB must be positive");

        uint256 amountA = deposit.amount;
        deposit.amount = 0;

        Swap storage swap = swaps.push();
        swap.partyA = msg.sender;
        swap.partyB = address(0); // Will be set when partyB completes
        swap.tokenA = deposit.token;
        swap.amountA = amountA;
        swap.tokenB = tokenB;
        swap.amountB = amountB;
        swap.status = 0;
        swap.createdAt = block.timestamp;

        swapId = swaps.length - 1;
        userSwaps[msg.sender].push(swapId);

        emit SwapCreated(swapId, msg.sender, deposit.token, amountA, tokenB, amountB);
    }

    function completeSwap(uint256 swapId) external {
        Swap storage swap = swaps[swapId];
        require(swap.status == 0, "Swap not open");
        require(msg.sender == swap.partyB, "Not partyB");

        IERC20(swap.tokenB).transferFrom(msg.sender, address(this), swap.amountB);

        swap.status = 1;
        IERC20(swap.tokenA).safeTransfer(swap.partyB, swap.amountA);
        IERC20(swap.tokenB).safeTransfer(swap.partyA, swap.amountB);

        emit SwapCompleted(swapId, swap.partyA, swap.partyB);
    }

    function cancelSwap(uint256 swapId) external {
        Swap storage swap = swaps[swapId];
        require(swap.status == 0, "Swap not open");
        require(msg.sender == swap.partyA || msg.sender == swap.partyB, "Not authorized");

        swap.status = 2;
        if (msg.sender == swap.partyA) {
            IERC20(swap.tokenA).safeTransfer(swap.partyA, swap.amountA);
        }
        emit SwapCancelled(swapId);
    }

    function getSwapInfo(uint256 swapId) external view returns (Swap memory) {
        return swaps[swapId];
    }

    // ============ BATCH AIRDROP SECTION ============
    event AirdropCompleted(uint256 indexed airdropId, address indexed token, uint256 totalRecipients, uint256 totalAmount);

    function batchTransfer(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external returns (bool) {
        require(recipients.length == amounts.length && recipients.length > 0, "Invalid input");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }

        IERC20(token).transferFrom(msg.sender, address(this), totalAmount);

        for (uint256 i = 0; i < recipients.length; i++) {
            IERC20(token).safeTransfer(recipients[i], amounts[i]);
        }

        emit AirdropCompleted(0, token, recipients.length, totalAmount);
        return true;
    }

    // ============ TOKEN ADMIN (MINT/BURN) SECTION ============
    function mintTokens(
        address token,
        address to,
        uint256 amount
    ) external returns (bool) {
        require(tokenOwners[token] == msg.sender, "Not token owner");
        RiteForgeToken t = RiteForgeToken(token);
        t.mint(to, amount);
        return true;
    }

    function burnTokens(
        address token,
        uint256 amount
    ) external returns (bool) {
        require(tokenOwners[token] == msg.sender, "Not token owner");
        RiteForgeToken t = RiteForgeToken(token);
        t.burn(msg.sender, amount);
        return true;
    }
}

// MinimalNFT remains embedded as it's only used for NFT minting
contract MinimalNFT is ERC721 {
    uint256 private _tokenId;
    uint256 public maxSupply;
    address public owner;
    string public baseURI_;

    constructor(string memory name, string memory symbol, string memory baseURI, uint256 maxSupply_, address _owner) ERC721(name, symbol) {
        maxSupply = maxSupply_;
        baseURI_ = baseURI;
        owner = _owner;
    }

    function mint(address to) external returns (uint256) {
        require(_tokenId < maxSupply || msg.sender == owner);
        _tokenId++;
        _safeMint(to, _tokenId);
        return _tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return string(abi.encodePacked(baseURI_, Strings.toString(tokenId)));
    }

    function totalSupply() external view returns (uint256) { return _tokenId; }
}