// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TokenVesting
 * @dev Schedule-based token vesting contract
 */
contract TokenVesting {
    using SafeERC20 for IERC20;

    struct VestingInfo {
        address token;
        address beneficiary;
        uint256 totalAmount;
        uint256 released;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
        bool isRevoked;
    }

    event VestingCreated(
        uint256 indexed scheduleId,
        address indexed beneficiary,
        address indexed token,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration
    );

    event TokensReleased(
        uint256 indexed scheduleId,
        address indexed beneficiary,
        uint256 amount
    );

    VestingInfo[] public vestings;
    mapping(address => uint256[]) public userVestings;

    function createVesting(
        address token,
        address beneficiary,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration
    ) external returns (uint256 scheduleId) {
        require(totalAmount > 0, "Amount must be positive");
        require(beneficiary != address(0), "Invalid beneficiary");
        require(cliffDuration <= vestingDuration, "Cliff must be <= vesting duration");

        IERC20(token).safeTransferFrom(msg.sender, address(this), totalAmount);

        VestingInfo storage vesting = vestings.push();
        vesting.token = token;
        vesting.beneficiary = beneficiary;
        vesting.totalAmount = totalAmount;
        vesting.released = 0;
        vesting.startTime = startTime;
        vesting.cliffDuration = cliffDuration;
        vesting.vestingDuration = vestingDuration;
        vesting.isRevoked = false;

        scheduleId = vestings.length - 1;
        userVestings[beneficiary].push(scheduleId);

        emit VestingCreated(
            scheduleId,
            beneficiary,
            token,
            totalAmount,
            startTime,
            cliffDuration,
            vestingDuration
        );

        return scheduleId;
    }

    function release(uint256 scheduleId) external {
        VestingInfo storage vesting = vestings[scheduleId];
        require(!vesting.isRevoked, "Vesting revoked");
        require(msg.sender == vesting.beneficiary, "Not beneficiary");

        uint256 claimable = getClaimableAmount(scheduleId);
        require(claimable > 0, "Nothing to claim");

        vesting.released += claimable;
        IERC20(vesting.token).safeTransfer(vesting.beneficiary, claimable);

        emit TokensReleased(scheduleId, vesting.beneficiary, claimable);
    }

    function getClaimableAmount(uint256 scheduleId) public view returns (uint256) {
        VestingInfo storage vesting = vestings[scheduleId];
        if (vesting.isRevoked || vesting.released >= vesting.totalAmount) {
            return 0;
        }

        uint256 currentTime = block.timestamp;
        uint256 cliffEnd = vesting.startTime + vesting.cliffDuration;
        uint256 vestingEnd = vesting.startTime + vesting.vestingDuration;

        if (currentTime < cliffEnd) {
            return 0;
        }

        uint256 vestedAmount;
        if (currentTime >= vestingEnd) {
            vestedAmount = vesting.totalAmount;
        } else {
            uint256 timeAfterCliff = currentTime - cliffEnd;
            uint256 vestingPeriod = vesting.vestingDuration - vesting.cliffDuration;
            vestedAmount = (vesting.totalAmount * timeAfterCliff) / vestingPeriod;
        }

        uint256 claimable = vestedAmount - vesting.released;
        return claimable;
    }

    function getVestingInfo(uint256 scheduleId) external view returns (VestingInfo memory) {
        return vestings[scheduleId];
    }

    function getUserVestings(address user) external view returns (uint256[] memory) {
        return userVestings[user];
    }

    function getTotalVestings() external view returns (uint256) {
        return vestings.length;
    }

    function revoke(uint256 scheduleId) external {
        VestingInfo storage vesting = vestings[scheduleId];
        require(!vesting.isRevoked, "Already revoked");
        // Only contract owner or beneficiary can revoke
        // For simplicity, allowing beneficiary to revoke
        require(msg.sender == vesting.beneficiary, "Not beneficiary");

        vesting.isRevoked = true;

        uint256 remaining = vesting.totalAmount - vesting.released;
        if (remaining > 0) {
            IERC20(vesting.token).safeTransfer(vesting.beneficiary, remaining);
        }
    }
}