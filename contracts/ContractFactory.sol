// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ContractFactory
 * @dev Factory contract that deploys other contracts on Ritual Chain
 * This allows users to deploy contracts without needing to compile them locally
 */
contract ContractFactory {
    event ContractDeployed(
        address indexed deployer,
        address indexed contractAddress,
        bytes32 salt,
        uint256 timestamp
    );

    event ContractDeployedWithConstructor(
        address indexed deployer,
        address indexed contractAddress,
        bytes32 salt,
        bytes constructorArgs,
        uint256 timestamp
    );

    // Mapping to track deployed contracts
    mapping(address => address[]) public deployedContracts;
    address[] public allDeployedContracts;

    /**
     * @dev Deploy a contract using CREATE opcode
     * @param bytecode The bytecode of the contract to deploy
     * @return contractAddress The address of the deployed contract
     */
    function deployContract(bytes memory bytecode) 
        public 
        returns (address contractAddress) 
    {
        require(bytecode.length > 0, "Bytecode cannot be empty");

        assembly {
            contractAddress := create(0, add(bytecode, 0x20), mload(bytecode))
        }

        require(contractAddress != address(0), "Contract deployment failed");

        deployedContracts[msg.sender].push(contractAddress);
        allDeployedContracts.push(contractAddress);

        emit ContractDeployed(
            msg.sender,
            contractAddress,
            bytes32(0),
            block.timestamp
        );

        return contractAddress;
    }

    /**
     * @dev Deploy a contract with constructor arguments using CREATE opcode
     * @param bytecode The bytecode of the contract to deploy
     * @param constructorArgs ABI-encoded constructor arguments
     * @return contractAddress The address of the deployed contract
     */
    function deployContractWithConstructor(
        bytes memory bytecode,
        bytes memory constructorArgs
    ) 
        public 
        returns (address contractAddress) 
    {
        require(bytecode.length > 0, "Bytecode cannot be empty");

        // Concatenate bytecode with constructor arguments
        bytes memory deploymentData = abi.encodePacked(bytecode, constructorArgs);

        assembly {
            contractAddress := create(0, add(deploymentData, 0x20), mload(deploymentData))
        }

        require(contractAddress != address(0), "Contract deployment failed");

        deployedContracts[msg.sender].push(contractAddress);
        allDeployedContracts.push(contractAddress);

        emit ContractDeployedWithConstructor(
            msg.sender,
            contractAddress,
            bytes32(0),
            constructorArgs,
            block.timestamp
        );

        return contractAddress;
    }

    /**
     * @dev Deploy a contract using CREATE2 opcode for deterministic addresses
     * @param bytecode The bytecode of the contract to deploy
     * @param salt A salt for deterministic address generation
     * @return contractAddress The address of the deployed contract
     */
    function deployContractDeterministic(
        bytes memory bytecode,
        bytes32 salt
    ) 
        public 
        returns (address contractAddress) 
    {
        require(bytecode.length > 0, "Bytecode cannot be empty");

        assembly {
            contractAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }

        require(contractAddress != address(0), "Contract deployment failed");

        deployedContracts[msg.sender].push(contractAddress);
        allDeployedContracts.push(contractAddress);

        emit ContractDeployed(
            msg.sender,
            contractAddress,
            salt,
            block.timestamp
        );

        return contractAddress;
    }

    /**
     * @dev Deploy a contract with constructor arguments using CREATE2
     * @param bytecode The bytecode of the contract to deploy
     * @param constructorArgs ABI-encoded constructor arguments
     * @param salt A salt for deterministic address generation
     * @return contractAddress The address of the deployed contract
     */
    function deployContractDeterministicWithConstructor(
        bytes memory bytecode,
        bytes memory constructorArgs,
        bytes32 salt
    ) 
        public 
        returns (address contractAddress) 
    {
        require(bytecode.length > 0, "Bytecode cannot be empty");

        bytes memory deploymentData = abi.encodePacked(bytecode, constructorArgs);

        assembly {
            contractAddress := create2(0, add(deploymentData, 0x20), mload(deploymentData), salt)
        }

        require(contractAddress != address(0), "Contract deployment failed");

        deployedContracts[msg.sender].push(contractAddress);
        allDeployedContracts.push(contractAddress);

        emit ContractDeployedWithConstructor(
            msg.sender,
            contractAddress,
            salt,
            constructorArgs,
            block.timestamp
        );

        return contractAddress;
    }

    /**
     * @dev Get all contracts deployed by a specific address
     * @param deployer The address of the deployer
     * @return An array of deployed contract addresses
     */
    function getDeployedContracts(address deployer) 
        public 
        view 
        returns (address[] memory) 
    {
        return deployedContracts[deployer];
    }

    /**
     * @dev Get the total number of contracts deployed through this factory
     * @return The total count of deployed contracts
     */
    function getTotalDeployedContracts() 
        public 
        view 
        returns (uint256) 
    {
        return allDeployedContracts.length;
    }

    /**
     * @dev Compute the address of a contract deployed with CREATE2
     * @param bytecode The bytecode of the contract
     * @param salt The salt used for deployment
     * @return The predicted address
     */
    function computeAddress(
        bytes memory bytecode,
        bytes32 salt
    ) 
        public 
        view 
        returns (address) 
    {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(bytecode)
            )
        );

        return address(uint160(uint256(hash)));
    }
}
