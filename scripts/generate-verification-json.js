const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const input = {
    language: "Solidity",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
      evmVersion: "cancun",
      libraries: {}
    },
    sources: {}
  };

  const projectRoot = path.join(__dirname, "..");
  const sources = [
    "contracts/RiteForgeMaster.sol",
    "contracts/RiteForgeToken.sol",
    "node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol",
    "node_modules/@openzeppelin/contracts/token/ERC20/IERC20.sol",
    "node_modules/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol",
    "node_modules/@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol",
    "node_modules/@openzeppelin/contracts/utils/Address.sol",
    "node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol",
    "node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol",
    "node_modules/@openzeppelin/contracts/token/ERC721/IERC721.sol",
    "node_modules/@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol",
    "node_modules/@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol",
    "node_modules/@openzeppelin/contracts/utils/introspection/IERC165.sol",
    "node_modules/@openzeppelin/contracts/utils/introspection/ERC165.sol",
    "node_modules/@openzeppelin/contracts/utils/Strings.sol",
    "node_modules/@openzeppelin/contracts/utils/base64/Base64.sol",
    "node_modules/@openzeppelin/contracts/utils/Context.sol",
  ];

  for (const sp of sources) {
    try {
      const fullPath = path.join(projectRoot, sp);
      const content = fs.readFileSync(fullPath, "utf8");
      input.sources[sp] = { content };
    } catch (e) {
      console.log("Could not read:", sp);
    }
  }

  fs.writeFileSync(path.join(projectRoot, "verification-input.json"), JSON.stringify(input, null, 2));
  console.log("Saved verification-input.json");
  console.log("Sources:", Object.keys(input.sources).length);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });