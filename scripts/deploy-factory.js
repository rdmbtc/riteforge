const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying ContractFactory to Ritual Chain...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "RITUAL");

  // Deploy the factory contract
  const ContractFactory = await hre.ethers.getContractFactory("ContractFactory");
  const factory = await ContractFactory.deploy();

  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("ContractFactory deployed to:", factoryAddress);

  // Save the address to a file for the frontend
  const deploymentInfo = {
    factoryAddress,
    chainId: 1979,
    network: "ritual",
    deployedAt: new Date().toISOString(),
  };

  // Save to both lib and public directories
  const libDir = path.join(__dirname, "..", "lib");
  const publicDir = path.join(__dirname, "..", "public");
  
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  const deploymentJson = JSON.stringify(deploymentInfo, null, 2);
  
  fs.writeFileSync(
    path.join(libDir, "factory-address.json"),
    deploymentJson
  );
  
  fs.writeFileSync(
    path.join(publicDir, "factory-address.json"),
    deploymentJson
  );

  console.log("\n✅ Deployment complete!");
  console.log("Factory address saved to lib/factory-address.json and public/factory-address.json");
  console.log("\nVerify on explorer:");
  console.log(`https://explorer.ritualfoundation.org/address/${factoryAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
