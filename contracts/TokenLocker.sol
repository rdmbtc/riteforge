// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TokenLocker
 * @dev Time-locked token storage contract
 */
contract TokenLocker {
    using SafeERC20 for IERC20;

    struct LockInfo {
        address token;
        address beneficiary;
        uint256 amount;
        uint256 lockedAmount;
        uint256 unlockTime;
        uint256 createdAt;
        bool isClaimed;
    }

    event TokensLocked(
        uint256 indexed lockId,
        address indexed token,
        address indexed beneficiary,
        uint256 amount,
        uint256 unlockTime
    );

    event TokensUnlocked(
        uint256 indexed lockId,
        address indexed beneficiary,
        uint256 amount
    );

    LockInfo[] public locks;
    mapping(address => uint256[]) public userLocks;

    function lockTokens(
        address token,
        uint256 amount,
        uint256 unlockTime,
        address beneficiary
    ) external returns (uint256 lockId) {
        require(amount > 0, "Amount must be positive");
        require(unlockTime > block.timestamp, "Unlock time must be in future");
        require(beneficiary != address(0), "Invalid beneficiary");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        LockInfo storage lockInfo = locks.push();
        lockInfo.token = token;
        lockInfo.beneficiary = beneficiary;
        lockInfo.amount = amount;
        lockInfo.lockedAmount = amount;
        lockInfo.unlockTime = unlockTime;
        lockInfo.createdAt = block.timestamp;
        lockInfo.isClaimed = false;

        lockId = locks.length - 1;
        userLocks[beneficiary].push(lockId);

        emit TokensLocked(lockId, token, beneficiary, amount, unlockTime);

        return lockId;
    }

    function unlockTokens(uint256 lockId) external {
        LockInfo storage lockInfo = locks[lockId];
        require(!lockInfo.isClaimed, "Already claimed");
        require(block.timestamp >= lockInfo.unlockTime, "Not yet unlocked");
        require(msg.sender == lockInfo.beneficiary, "Not beneficiary");

        lockInfo.isClaimed = true;
        IERC20(lockInfo.token).safeTransfer(
            lockInfo.beneficiary,
            lockInfo.lockedAmount
        );

        emit TokensUnlocked(lockId, lockInfo.beneficiary, lockInfo.lockedAmount);
    }

    function getLockInfo(uint256 lockId) external view returns (LockInfo memory) {
        return locks[lockId];
    }

    function getUserLocks(address user) external view returns (uint256[] memory) {
        return userLocks[user];
    }

    function getUserLockCount(address user) external view returns (uint256) {
        return userLocks[user].length;
    }

    function getTotalLocks() external view returns (uint256) {
        return locks.length;
    }

    function getClaimableAmount(uint256 lockId) external view returns (uint256) {
        LockInfo storage lockInfo = locks[lockId];
        if (lockInfo.isClaimed) return 0;
        if (block.timestamp < lockInfo.unlockTime) return 0;
        return lockInfo.lockedAmount;
    }

    function extendLockTime(uint256 lockId, uint256 newUnlockTime) external {
        LockInfo storage lockInfo = locks[lockId];
        require(msg.sender == lockInfo.beneficiary, "Not beneficiary");
        require(newUnlockTime > lockInfo.unlockTime, "Must be later");
        require(!lockInfo.isClaimed, "Already claimed");

        lockInfo.unlockTime = newUnlockTime;
    }
}