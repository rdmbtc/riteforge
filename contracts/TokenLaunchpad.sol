// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TokenLaunchpad
 * @dev Token sale contract with caps, timing, and contribution limits
 */
contract TokenLaunchpad {
    using SafeERC20 for IERC20;

    enum SaleStatus { Pending, Active, Completed, Cancelled }

    struct Sale {
        address creator;
        address token;
        uint256 price; // Price in wei per token
        uint256 totalTokens;
        uint256 soldTokens;
        uint256 softCap;
        uint256 hardCap;
        uint256 minContribution;
        uint256 maxContribution;
        uint256 startTime;
        uint256 endTime;
        uint256 raised;
        SaleStatus status;
    }

    struct BuyerInfo {
        uint256 contributed;
        uint256 tokensBought;
        bool claimed;
    }

    event SaleCreated(
        uint256 indexed saleId,
        address indexed creator,
        address indexed token,
        uint256 price,
        uint256 totalTokens,
        uint256 softCap,
        uint256 hardCap,
        uint256 startTime,
        uint256 endTime
    );

    event TokensPurchased(
        uint256 indexed saleId,
        address indexed buyer,
        uint256 amount,
        uint256 value
    );

    event TokensClaimed(
        uint256 indexed saleId,
        address indexed beneficiary,
        uint256 amount
    );

    event SaleEnded(
        uint256 indexed saleId,
        bool metCap
    );

    Sale[] public sales;
    mapping(uint256 => mapping(address => BuyerInfo)) public buyerInfo;
    uint256 public platformFeePercent = 1;

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
        require(price > 0, "Price must be positive");
        require(totalTokens > 0, "Total tokens must be positive");
        require(softCap <= hardCap, "Soft cap must be <= hard cap");
        require(startTime >= block.timestamp, "Start time must be in future");
        require(endTime > startTime, "End time must be after start time");

        // Transfer tokens to contract
        IERC20(token).safeTransferFrom(msg.sender, address(this), totalTokens);

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
        sale.status = SaleStatus.Pending;

        saleId = sales.length - 1;

        emit SaleCreated(
            saleId,
            msg.sender,
            token,
            price,
            totalTokens,
            softCap,
            hardCap,
            startTime,
            endTime
        );
    }

    function buyTokens(uint256 saleId) external payable {
        Sale storage sale = sales[saleId];
        require(sale.status == SaleStatus.Active, "Sale not active");
        require(block.timestamp >= sale.startTime, "Sale not started");
        require(block.timestamp <= sale.endTime, "Sale ended");
        require(msg.value >= sale.minContribution, "Below min contribution");
        require(msg.value <= sale.maxContribution, "Above max contribution");

        BuyerInfo storage buyer = buyerInfo[saleId][msg.sender];
        require(buyer.contributed + msg.value <= sale.maxContribution, "Exceeds max contribution");

        uint256 tokensBought = (msg.value * 1e18) / sale.price;
        require(tokensBought <= sale.totalTokens - sale.soldTokens, "Not enough tokens");

        buyer.contributed += msg.value;
        buyer.tokensBought += tokensBought;
        sale.soldTokens += tokensBought;
        sale.raised += msg.value;

        emit TokensPurchased(saleId, msg.sender, tokensBought, msg.value);

        if (sale.soldTokens >= sale.hardCap) {
            sale.status = SaleStatus.Completed;
            emit SaleEnded(saleId, true);
        }
    }

    function claimTokens(uint256 saleId) external {
        Sale storage sale = sales[saleId];
        BuyerInfo storage buyer = buyerInfo[saleId][msg.sender];

        require(sale.status == SaleStatus.Completed || block.timestamp > sale.endTime, "Cannot claim yet");
        require(!buyer.claimed, "Already claimed");
        require(buyer.tokensBought > 0, "No tokens to claim");

        buyer.claimed = true;
        IERC20(sale.token).safeTransfer(msg.sender, buyer.tokensBought);

        emit TokensClaimed(saleId, msg.sender, buyer.tokensBought);
    }

    function activateSale(uint256 saleId) external {
        Sale storage sale = sales[saleId];
        require(msg.sender == sale.creator, "Not the creator");
        require(sale.status == SaleStatus.Pending, "Sale already active");
        require(block.timestamp >= sale.startTime, "Start time not reached");

        sale.status = SaleStatus.Active;
    }

    function endSale(uint256 saleId) external {
        Sale storage sale = sales[saleId];
        require(msg.sender == sale.creator || block.timestamp > sale.endTime, "Cannot end yet");
        require(sale.status == SaleStatus.Active, "Sale not active");

        if (sale.raised >= sale.softCap) {
            sale.status = SaleStatus.Completed;
            emit SaleEnded(saleId, true);
        } else {
            sale.status = SaleStatus.Cancelled;
            emit SaleEnded(saleId, false);
        }
    }

    function getSaleInfo(uint256 saleId) external view returns (Sale memory) {
        return sales[saleId];
    }

    function getBuyerInfo(uint256 saleId, address buyer) external view returns (BuyerInfo memory) {
        return buyerInfo[saleId][buyer];
    }

    function getTotalSales() external view returns (uint256) {
        return sales.length;
    }

    function withdrawFunds(uint256 saleId) external {
        Sale storage sale = sales[saleId];
        require(msg.sender == sale.creator, "Not the creator");
        require(sale.status == SaleStatus.Completed, "Sale not completed");

        uint256 fee = (sale.raised * platformFeePercent) / 100;
        uint256 creatorAmount = sale.raised - fee;

        payable(msg.sender).transfer(creatorAmount);
    }

    function setPlatformFee(uint256 percent) external {
        require(percent <= 10, "Max 10%");
        platformFeePercent = percent;
    }
}