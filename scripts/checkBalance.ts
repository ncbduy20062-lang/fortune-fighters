import { ethers } from "hardhat";

/**
 * Checks the Sepolia ETH balance of the deployer wallet
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balance);

  console.log("\n💰 Wallet Balance Check:");
  console.log("  - Address:", deployer.address);
  console.log("  - Balance:", balanceInEth, "ETH");
  console.log("  - Balance (Wei):", balance.toString());

  const minRequired = ethers.parseEther("0.01");
  if (balance < minRequired) {
    console.log("\n⚠️  Insufficient balance for deployment!");
    console.log("  - Required: ~0.01 ETH");
    console.log("  - Get Sepolia ETH from:");
    console.log("    • https://sepoliafaucet.com/");
    console.log("    • https://www.alchemy.com/faucets/ethereum-sepolia");
  } else {
    console.log("\n✅ Sufficient balance for deployment!");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
