// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title RiteForgeNFT
 * @dev ERC721 NFT collection for RiteForge
 */
contract RiteForgeNFT is ERC721URIStorage {
    uint256 private _tokenIds;
    uint256 private _maxSupply;
    address public owner;
    string public baseURI_;

    event Mint(address indexed to, uint256 indexed tokenId);

    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI,
        uint256 maxSupply_
    ) ERC721(name, symbol) {
        baseURI_ = baseURI;
        _maxSupply = maxSupply_;
        owner = msg.sender;
    }

    function mint(address to) external returns (uint256 tokenId) {
        require(msg.sender == owner || _tokenIds < _maxSupply, "Cannot mint");
        _tokenIds++;
        tokenId = _tokenIds;
        _safeMint(to, tokenId);

        emit Mint(to, tokenId);
        return tokenId;
    }

    function mintBatch(address to, uint256 amount) external returns (uint256[] memory) {
        require(_tokenIds + amount <= _maxSupply || msg.sender == owner, "Exceeds max supply");
        uint256[] memory tokenIds = new uint256[](amount);

        for (uint256 i = 0; i < amount; i++) {
            _tokenIds++;
            tokenIds[i] = _tokenIds;
            _safeMint(to, _tokenIds);
        }

        return tokenIds;
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIds;
    }

    function maxSupply() external view returns (uint256) {
        return _maxSupply;
    }

    function setBaseURI(string memory newBaseURI) external {
        require(msg.sender == owner, "Not owner");
        baseURI_ = newBaseURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI_;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return super.tokenURI(tokenId);
    }

    function setTokenURI(uint256 tokenId, string memory uri) external {
        require(ownerOf(tokenId) == msg.sender || msg.sender == owner, "Not authorized");
        _setTokenURI(tokenId, uri);
    }

    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        payable(owner).transfer(address(this).balance);
    }
}