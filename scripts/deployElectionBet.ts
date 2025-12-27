import { ethers } from "hardhat";

/**
 * Deploys the ElectionBettingPool contract to Sepolia testnet
 * - Grants DEFAULT_ADMIN_ROLE and EDITOR_ROLE to deployer
 * - Grants GATEWAY_ROLE to Zama FHE Gateway Relayer
 *
 * Environment variables required:
 * - PRIVATE_KEY: Deployer wallet private key
 * - SEPOLIA_RPC_URL: Sepolia RPC endpoint
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  // Zama's Sepolia Gateway Relayer address (as per fhEVM documentation)
  // This address handles decryption callbacks for FHE operations
  // Using getAddress to ensure proper checksum
  const ZAMA_GATEWAY_RELAYER = ethers.getAddress("0x33347831500f1e73f0cccbbe71418f2cd6749cd4");

  const deployerAddress = await deployer.getAddress();

  console.log("\n📋 Deployment Configuration:");
  console.log("  - Deployer:", deployerAddress);
  console.log("  - Admin:", deployerAddress);
  console.log("  - Gateway Relayer:", ZAMA_GATEWAY_RELAYER);
  console.log("  - Network:", (await ethers.provider.getNetwork()).name);
  console.log("  - ChainId:", (await ethers.provider.getNetwork()).chainId);

  console.log("\n🚀 Deploying ElectionBettingPool...");

  const factory = await ethers.getContractFactory("ElectionBettingPool");
  const contract = await factory.deploy(deployerAddress, ZAMA_GATEWAY_RELAYER);

  console.log("⏳ Waiting for deployment transaction...");
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  console.log("\n✅ Deployment Successful!");
  console.log("  - Contract Address:", address);
  console.log("\n📝 Next Steps:");
  console.log("  1. Update VITE_ELECTION_CONTRACT_ADDRESS in .env:");
  console.log(`     VITE_ELECTION_CONTRACT_ADDRESS=${address}`);
  console.log("  2. Update DEPLOYED_CONTRACT_ADDRESS in .env:");
  console.log(`     DEPLOYED_CONTRACT_ADDRESS=${address}`);
  console.log("  3. Run ABI export: npm run hardhat:export-abi");
  console.log("  4. Verify contract: npm run verify:sepolia");
  console.log("  5. Create an election using createElection()");

  console.log("\n🔗 Etherscan:", `https://sepolia.etherscan.io/address/${address}`);
}

main().catch((error) => {
  console.error("\n❌ Deployment failed:", error);
  process.exitCode = 1;
});
