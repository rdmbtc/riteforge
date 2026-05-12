// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RandomNumberOracle
 * @notice Verifiable randomness from random.org API
 * @dev Uses Ritual HTTP precompile for external randomness
 */
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
        // HTTP call to random.org
        string memory url = string(abi.encodePacked(
            "https://www.random.org/integers/?num=1&min=",
            _uint2str(min),
            "&max=",
            _uint2str(max),
            "&col=1&base=10&format=plain&rnd=new"
        ));
        
        bytes memory request = abi.encode(
            address(0), new bytes[](0), uint256(100), new bytes[](0),
            bytes(""), uint8(1), url, new string[](0), new string[](0),
            "", uint256(0), uint8(0), ""
        );
        
        (bool success, bytes memory response) = HTTP_PRECOMPILE.call(request);
        require(success, "HTTP call failed");
        
        // Parse response
        (, , , bytes memory body) = abi.decode(response, (uint16, string[], string[], bytes));
        return _parseUint(string(body));
    }
    
    function _uint2str(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
    
    function _parseUint(string memory s) internal pure returns (uint256) {
        bytes memory b = bytes(s);
        uint256 result = 0;
        for (uint256 i = 0; i < b.length; i++) {
            uint8 c = uint8(b[i]);
            if (c >= 48 && c <= 57) {
                result = result * 10 + (c - 48);
            }
        }
        return result;
    }
}
