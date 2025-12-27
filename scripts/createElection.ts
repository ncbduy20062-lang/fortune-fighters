import { ethers } from "hardhat";

/**
 * Creates an election market on the deployed ElectionBettingPool contract
 *
 * Environment variables required:
 * - DEPLOYED_CONTRACT_ADDRESS: Address of deployed contract
 * - PRIVATE_KEY: Admin wallet private key
 */
async function main() {
  const contractAddress = process.env.DEPLOYED_CONTRACT_ADDRESS || process.env.VITE_ELECTION_CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("DEPLOYED_CONTRACT_ADDRESS or VITE_ELECTION_CONTRACT_ADDRESS must be set in .env");
  }

  const [admin] = await ethers.getSigners();

  console.log("\n📋 Creating Election Market:");
  console.log("  - Contract:", contractAddress);
  console.log("  - Admin:", admin.address);

  // Get contract instance
  const contract = await ethers.getContractAt("ElectionBettingPool", contractAddress);

  // Election parameters
  const electionId = 1; // Can be changed for multiple elections
  const candidateCount = 2; // Number of candidates
  const daysUntilLock = 30; // Election locks in 30 days
  const lockTimestamp = Math.floor(Date.now() / 1000) + (daysUntilLock * 24 * 60 * 60);

  console.log("\n🗳️  Election Parameters:");
  console.log("  - Election ID:", electionId);
  console.log("  - Candidates:", candidateCount);
  console.log("  - Lock Date:", new Date(lockTimestamp * 1000).toLocaleString());

  console.log("\n🚀 Creating election...");

  const tx = await contract.createElection(electionId, candidateCount, lockTimestamp);

  console.log("⏳ Waiting for transaction confirmation...");
  console.log("  - TX Hash:", tx.hash);

  const receipt = await tx.wait();

  console.log("\n✅ Election Created Successfully!");
  console.log("  - Block:", receipt.blockNumber);
  console.log("  - Gas Used:", receipt.gasUsed.toString());

  // Verify election was created
  const election = await contract.getElection(electionId);

  console.log("\n📊 Election Details:");
  console.log("  - Exists:", election.exists);
  console.log("  - Candidate Count:", election.candidateCount);
  console.log("  - Lock Timestamp:", election.lockTimestamp.toString());
  console.log("  - Settled:", election.settled);

  console.log("\n🎯 Next Steps:");
  console.log("  1. Update VITE_ELECTION_ID=1 in .env (if not already set)");
  console.log("  2. Start frontend: npm run dev");
  console.log("  3. Connect wallet and place predictions!");
  console.log("\n🔗 View on Etherscan:");
  console.log(`   https://sepolia.etherscan.io/tx/${tx.hash}`);
}

main().catch((error) => {
  console.error("\n❌ Election creation failed:", error);
  process.exitCode = 1;
});
