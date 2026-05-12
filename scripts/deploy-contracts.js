const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance = await deployer.provider.getBalance(deployer.address);

  console.log("Deploying with account:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "RITUAL");
  console.log("Estimated cost: ~0.001-0.005 RITUAL");

  // Deploy SINGLE master contract (saves ~80% gas vs 5 separate contracts)
  console.log("\nDeploying RiteForgeMaster (all-in-one contract)...\n");

  const RiteForgeMaster = await hre.ethers.getContractFactory("RiteForgeMaster");
  const master = await RiteForgeMaster.deploy();
  await master.waitForDeployment();
  const masterAddress = await master.getAddress();

  console.log("RiteForgeMaster deployed to:", masterAddress);

  // Get deployment cost
  const tx = master.deploymentTransaction();
  const receipt = await tx.wait();
  const gasCost = receipt.gasUsed * receipt.gasPrice;

  console.log("\nDeployment Stats:");
  console.log("   Gas used:", receipt.gasUsed.toString());
  console.log("   Gas price:", hre.ethers.formatUnits(receipt.gasPrice, "gwei"), "gwei");
  console.log("   Total cost:", hre.ethers.formatEther(gasCost), "RITUAL");
  console.log("   Remaining balance:", hre.ethers.formatEther(balance - gasCost), "RITUAL");

  // Save to .env.local
  const fs = require("fs");
  const envPath = ".env.local";

  // Read existing file
  let existingContent = "";
  try {
    existingContent = fs.readFileSync(envPath, "utf8");
  } catch (e) {}

  // Remove old addresses
  const cleanedContent = existingContent
    .replace(/NEXT_PUBLIC_TOKEN_FACTORY_ADDRESS=.*/g, "")
    .replace(/NEXT_PUBLIC_LAUNCHPAD_ADDRESS=.*/g, "")
    .replace(/NEXT_PUBLIC_LOCKER_ADDRESS=.*/g, "")
    .replace(/NEXT_PUBLIC_VESTING_ADDRESS=.*/g, "")
    .replace(/NEXT_PUBLIC_NFT_ADDRESS=.*/g, "");

  // Add new master address
  const newContent = cleanedContent.trim() + `\n\n# RiteForge Master Contract (updated ${new Date().toISOString()})\nNEXT_PUBLIC_MASTER_ADDRESS=${masterAddress}\n`;

  fs.writeFileSync(envPath, newContent);
  console.log("\n✅ Contract address saved to .env.local");

  console.log("\n========================================");
  console.log("MASTER_ADDRESS:", masterAddress);
  console.log("========================================");
  console.log("\nUpdate frontend: lib/contracts/abis.ts");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });