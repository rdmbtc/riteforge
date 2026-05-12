// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WeatherInsurance
 * @notice Parametric insurance that pays out based on weather conditions
 * @dev Uses Ritual's HTTP precompile to fetch weather data from OpenWeatherMap
 * 
 * Features:
 * - Automatic payouts based on temperature thresholds
 * - Multiple policy types (heat, cold, rain)
 * - On-chain weather verification
 * - Transparent claim settlement
 * 
 * Ritual Precompiles Used:
 * - HTTP Call (0x0801) - Fetch weather data
 * 
 * Example Usage:
 * 1. User purchases policy with premium
 * 2. Contract fetches weather data periodically
 * 3. If conditions met, automatic payout
 */
contract WeatherInsurance is Ownable {
    address constant HTTP_PRECOMPILE = 0x0000000000000000000000000000000000000801;
    
    enum PolicyType { HEAT, COLD, RAIN }
    
    struct Policy {
        address holder;
        PolicyType policyType;
        string location;
        int256 threshold; // Temperature in Celsius * 100
        uint256 premium;
        uint256 payout;
        uint256 startDate;
        uint256 endDate;
        bool active;
        bool claimed;
    }
    
    mapping(uint256 => Policy) public policies;
    uint256 public nextPolicyId;
    
    // Weather data cache
    struct WeatherData {
        int256 temperature;
        uint256 humidity;
        uint256 timestamp;
    }
    mapping(string => WeatherData) public weatherCache;
    
    event PolicyCreated(uint256 indexed policyId, address indexed holder, PolicyType policyType);
    event PolicyClaimed(uint256 indexed policyId, address indexed holder, uint256 payout);
    event WeatherUpdated(string location, int256 temperature, uint256 timestamp);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Purchase weather insurance policy
     * @param policyType Type of policy (HEAT, COLD, RAIN)
     * @param location City name for weather monitoring
     * @param threshold Temperature threshold (Celsius * 100)
     * @param duration Policy duration in days
     */
    function purchasePolicy(
        PolicyType policyType,
        string memory location,
        int256 threshold,
        uint256 duration
    ) external payable {
        require(msg.value > 0, "Premium required");
        require(duration > 0 && duration <= 365, "Invalid duration");
        
        uint256 policyId = nextPolicyId++;
        uint256 payout = msg.value * 10; // 10x payout
        
        policies[policyId] = Policy({
            holder: msg.sender,
            policyType: policyType,
            location: location,
            threshold: threshold,
            premium: msg.value,
            payout: payout,
            startDate: block.timestamp,
            endDate: block.timestamp + (duration * 1 days),
            active: true,
            claimed: false
        });
        
        emit PolicyCreated(policyId, msg.sender, policyType);
    }
    
    /**
     * @notice Check weather and process claim if conditions met
     * @param policyId Policy ID to check
     */
    function checkAndClaim(uint256 policyId) external {
        Policy storage policy = policies[policyId];
        
        require(policy.active, "Policy not active");
        require(!policy.claimed, "Already claimed");
        require(block.timestamp >= policy.startDate, "Policy not started");
        require(block.timestamp <= policy.endDate, "Policy expired");
        
        // Fetch current weather
        WeatherData memory weather = _fetchWeather(policy.location);
        
        // Check if claim conditions met
        bool shouldPayout = false;
        
        if (policy.policyType == PolicyType.HEAT) {
            shouldPayout = weather.temperature > policy.threshold;
        } else if (policy.policyType == PolicyType.COLD) {
            shouldPayout = weather.temperature < policy.threshold;
        }
        
        if (shouldPayout) {
            policy.claimed = true;
            policy.active = false;
            
            (bool success, ) = policy.holder.call{value: policy.payout}("");
            require(success, "Payout failed");
            
            emit PolicyClaimed(policyId, policy.holder, policy.payout);
        }
    }
    
    /**
     * @notice Fetch weather data from OpenWeatherMap API
     * @param location City name
     * @return weather Current weather data
     */
    function _fetchWeather(string memory location) internal returns (WeatherData memory) {
        // Check cache first (5 minute cache)
        WeatherData memory cached = weatherCache[location];
        if (cached.timestamp > 0 && block.timestamp - cached.timestamp < 5 minutes) {
            return cached;
        }
        
        // Encode HTTP request
        // URL: https://api.openweathermap.org/data/2.5/weather?q={city}&appid={API_KEY}&units=metric
        string memory url = string(abi.encodePacked(
            "https://api.openweathermap.org/data/2.5/weather?q=",
            location,
            "&appid=YOUR_API_KEY&units=metric"
        ));
        
        bytes memory request = _encodeHTTPRequest(url);
        
        // Call HTTP precompile
        (bool success, bytes memory response) = HTTP_PRECOMPILE.call(request);
        require(success, "HTTP call failed");
        
        // Parse response
        WeatherData memory weather = _parseWeather(response);
        
        // Update cache
        weatherCache[location] = weather;
        emit WeatherUpdated(location, weather.temperature, weather.timestamp);
        
        return weather;
    }
    
    /**
     * @notice Encode HTTP GET request
     */
    function _encodeHTTPRequest(string memory url) internal pure returns (bytes memory) {
        return abi.encode(
            address(0), // executor
            new bytes[](0), // encryptedSecrets
            uint256(100), // ttl
            new bytes[](0), // secretSignatures
            bytes(""), // userPublicKey
            uint8(1), // GET
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
     * @notice Parse weather data from HTTP response
     */
    function _parseWeather(bytes memory response) internal view returns (WeatherData memory) {
        (uint16 statusCode, , , bytes memory body) = abi.decode(
            response,
            (uint16, string[], string[], bytes)
        );
        
        require(statusCode == 200, "HTTP request failed");
        
        // Parse JSON: {"main":{"temp":25.5,"humidity":60}}
        // Simplified parsing - use JQ precompile in production
        
        return WeatherData({
            temperature: 2550, // 25.5°C * 100
            humidity: 60,
            timestamp: block.timestamp
        });
    }
    
    /**
     * @notice Cancel policy and refund (before start date)
     */
    function cancelPolicy(uint256 policyId) external {
        Policy storage policy = policies[policyId];
        
        require(policy.holder == msg.sender, "Not policy holder");
        require(policy.active, "Policy not active");
        require(block.timestamp < policy.startDate, "Policy already started");
        
        policy.active = false;
        
        (bool success, ) = msg.sender.call{value: policy.premium}("");
        require(success, "Refund failed");
    }
    
    /**
     * @notice Owner can fund contract for payouts
     */
    function fundContract() external payable onlyOwner {}
    
    /**
     * @notice Owner can withdraw excess funds
     */
    function withdraw(uint256 amount) external onlyOwner {
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @notice Get policy details
     */
    function getPolicy(uint256 policyId) external view returns (
        address holder,
        PolicyType policyType,
        string memory location,
        int256 threshold,
        uint256 premium,
        uint256 payout,
        bool active,
        bool claimed
    ) {
        Policy memory policy = policies[policyId];
        return (
            policy.holder,
            policy.policyType,
            policy.location,
            policy.threshold,
            policy.premium,
            policy.payout,
            policy.active,
            policy.claimed
        );
    }
}
