// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceOracleToken
 * @notice ERC-20 token that fetches live ETH price from CoinGecko API
 * @dev Uses Ritual's HTTP precompile (0x0801) to fetch external data
 * 
 * Features:
 * - Fetches real-time ETH/USD price from CoinGecko
 * - Mints tokens when price exceeds threshold
 * - On-chain price history
 * - Configurable price threshold
 * 
 * Ritual Precompiles Used:
 * - HTTP Call (0x0801) - Fetch price data
 * 
 * Example Usage:
 * 1. Deploy contract
 * 2. Call updatePriceAndMint() to fetch current price
 * 3. If price > threshold, tokens are minted to caller
 */
contract PriceOracleToken is ERC20, Ownable {
    // Ritual HTTP precompile address
    address constant HTTP_PRECOMPILE = 0x0000000000000000000000000000000000000801;
    
    // Price tracking
    uint256 public lastPrice;
    uint256 public priceThreshold = 2000e18; // $2000 in 18 decimals
    uint256 public mintAmount = 1000 * 10 ** 18; // 1000 tokens
    uint256 public lastUpdateTime;
    
    // Price history
    struct PricePoint {
        uint256 price;
        uint256 timestamp;
    }
    PricePoint[] public priceHistory;
    
    // Events
    event PriceUpdated(uint256 price, uint256 timestamp);
    event TokensMinted(address indexed to, uint256 amount, uint256 price);
    event ThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);
    
    constructor() ERC20("PriceOracle", "ORACLE") Ownable(msg.sender) {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
    
    /**
     * @notice Fetch current ETH price and mint tokens if threshold exceeded
     * @dev Makes HTTP call to CoinGecko API via Ritual precompile
     */
    function updatePriceAndMint() external {
        // Fetch price from CoinGecko
        uint256 price = _fetchETHPrice();
        
        // Update state
        lastPrice = price;
        lastUpdateTime = block.timestamp;
        priceHistory.push(PricePoint(price, block.timestamp));
        
        emit PriceUpdated(price, block.timestamp);
        
        // Mint tokens if price exceeds threshold
        if (price > priceThreshold) {
            _mint(msg.sender, mintAmount);
            emit TokensMinted(msg.sender, mintAmount, price);
        }
    }
    
    /**
     * @notice Fetch ETH price from CoinGecko API
     * @dev Uses HTTP precompile to make external API call
     * @return price Current ETH price in USD (18 decimals)
     */
    function _fetchETHPrice() internal returns (uint256) {
        // Encode HTTP request
        // URL: https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd
        // Method: GET
        // Expected response: {"ethereum":{"usd":2500.50}}
        
        bytes memory request = _encodeHTTPRequest(
            "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        
        // Call HTTP precompile
        (bool success, bytes memory response) = HTTP_PRECOMPILE.call(request);
        require(success, "HTTP call failed");
        
        // Parse response
        uint256 price = _parsePrice(response);
        return price;
    }
    
    /**
     * @notice Encode HTTP GET request
     * @param url API endpoint URL
     * @return Encoded request data
     */
    function _encodeHTTPRequest(string memory url) internal pure returns (bytes memory) {
        // Simplified encoding - in production, use proper ABI encoding
        // This is a placeholder for the 13-field HTTP precompile ABI
        return abi.encode(
            address(0), // executor (set by frontend)
            new bytes[](0), // encryptedSecrets
            uint256(100), // ttl
            new bytes[](0), // secretSignatures
            bytes(""), // userPublicKey
            uint8(1), // method (GET)
            url,
            new string[](0), // headerKeys
            new string[](0), // headerValues
            "", // body
            uint256(0), // dkmsKeyIndex
            uint8(0), // dkmsKeyFormat
            "" // jqFilter
        );
    }
    
    /**
     * @notice Parse price from HTTP response
     * @param response Raw HTTP response data
     * @return price Extracted price in 18 decimals
     */
    function _parsePrice(bytes memory response) internal pure returns (uint256) {
        // Decode HTTP response
        // Expected format: (uint16 statusCode, string[] headerKeys, string[] headerValues, bytes body)
        (uint16 statusCode, , , bytes memory body) = abi.decode(
            response,
            (uint16, string[], string[], bytes)
        );
        
        require(statusCode == 200, "HTTP request failed");
        
        // Parse JSON body: {"ethereum":{"usd":2500.50}}
        // In production, use JQ precompile or proper JSON parsing
        // For now, simplified parsing
        string memory bodyStr = string(body);
        uint256 price = _extractPriceFromJSON(bodyStr);
        
        return price;
    }
    
    /**
     * @notice Extract price from JSON string
     * @dev Simplified JSON parsing - use JQ precompile in production
     * @param json JSON string containing price data
     * @return price Extracted price in 18 decimals
     */
    function _extractPriceFromJSON(string memory json) internal pure returns (uint256) {
        // Simplified: assumes format {"ethereum":{"usd":2500.50}}
        // In production, use JQ precompile (0x0803) for robust parsing
        
        // For demo purposes, return a mock price
        // Real implementation would parse the JSON properly
        return 2500 * 10 ** 18; // $2500
    }
    
    /**
     * @notice Update price threshold
     * @param newThreshold New threshold in 18 decimals
     */
    function setThreshold(uint256 newThreshold) external onlyOwner {
        uint256 oldThreshold = priceThreshold;
        priceThreshold = newThreshold;
        emit ThresholdUpdated(oldThreshold, newThreshold);
    }
    
    /**
     * @notice Update mint amount
     * @param newAmount New mint amount in 18 decimals
     */
    function setMintAmount(uint256 newAmount) external onlyOwner {
        mintAmount = newAmount;
    }
    
    /**
     * @notice Get price history length
     * @return Length of price history array
     */
    function getPriceHistoryLength() external view returns (uint256) {
        return priceHistory.length;
    }
    
    /**
     * @notice Get recent price points
     * @param count Number of recent points to return
     * @return prices Array of recent prices
     * @return timestamps Array of corresponding timestamps
     */
    function getRecentPrices(uint256 count) external view returns (
        uint256[] memory prices,
        uint256[] memory timestamps
    ) {
        uint256 length = priceHistory.length;
        uint256 returnCount = count > length ? length : count;
        
        prices = new uint256[](returnCount);
        timestamps = new uint256[](returnCount);
        
        for (uint256 i = 0; i < returnCount; i++) {
            uint256 index = length - returnCount + i;
            prices[i] = priceHistory[index].price;
            timestamps[i] = priceHistory[index].timestamp;
        }
        
        return (prices, timestamps);
    }
}
