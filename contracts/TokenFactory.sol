// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CoreToken.sol";

/**
 * @title TokenFactory
 * @dev Factory contract for creating CoreToken instances on Ritual Chain
 */
contract TokenFactory {
    event TokenCreated(
        address indexed deployer,
        address indexed tokenAddress,
        string name,
        string symbol,
        uint8 decimals,
        uint256 initialSupply
    );

    mapping(address => address[]) public deployedTokens;
    address[] public allDeployedTokens;

    uint256 public creationFee = 0.0425 ether;

    constructor() {
        // Set the deployer as the owner
    }

    function createToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 initialSupply
    ) external payable returns (address tokenAddress) {
        require(msg.value >= creationFee, "Insufficient fee");

        CoreToken token = new CoreToken(
            name,
            symbol,
            decimals,
            initialSupply
        );

        tokenAddress = address(token);

        deployedTokens[msg.sender].push(tokenAddress);
        allDeployedTokens.push(tokenAddress);

        emit TokenCreated(
            msg.sender,
            tokenAddress,
            name,
            symbol,
            decimals,
            initialSupply
        );

        // Refund excess fee
        if (msg.value > creationFee) {
            payable(msg.sender).transfer(msg.value - creationFee);
        }

        return tokenAddress;
    }

    function getDeployedTokens(address deployer) external view returns (address[] memory) {
        return deployedTokens[deployer];
    }

    function getDeployedTokenCount() external view returns (uint256) {
        return allDeployedTokens.length;
    }

    function getAllDeployedTokens() external view returns (address[] memory) {
        return allDeployedTokens;
    }

    function setCreationFee(uint256 newFee) external {
        creationFee = newFee;
    }

    function withdraw() external {
        payable(msg.sender).transfer(address(this).balance);
    }
}