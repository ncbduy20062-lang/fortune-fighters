import { run } from "hardhat";

/**
 * Verifies the ElectionBettingPool contract on Etherscan
 * Usage: npx hardhat run scripts/verifyContract.ts --network sepolia
 *
 * Requirements:
 * - ETHERSCAN_API_KEY must be set in .env
 * - Contract must be deployed and address provided as argument
 */
async function main() {
  const contractAddress = process.env.DEPLOYED_CONTRACT_ADDRESS;
  const adminAddress = process.env.ADMIN_ADDRESS || process.env.ADDRESS;
  const gatewayAddress = process.env.FHE_GATEWAY_SIGNER || "0x0000000000000000000000000000000000000000";

  if (!contractAddress) {
    throw new Error("DEPLOYED_CONTRACT_ADDRESS environment variable is required");
  }

  if (!adminAddress) {
    throw new Error("ADMIN_ADDRESS or ADDRESS environment variable is required");
  }

  console.log("Verifying contract at:", contractAddress);
  console.log("Constructor args:");
  console.log("  - admin:", adminAddress);
  console.log("  - gateway:", gatewayAddress);

  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: [adminAddress, gatewayAddress],
      contract: "contracts/ElectionBettingPool.sol:ElectionBettingPool",
    });

    console.log("✅ Contract verified successfully!");
  } catch (error) {
    if (error instanceof Error && error.message.includes("Already Verified")) {
      console.log("✅ Contract already verified!");
    } else {
      console.error("❌ Verification failed:", error);
      throw error;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
