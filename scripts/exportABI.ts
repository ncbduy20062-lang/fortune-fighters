import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url || "file://" + __filename);
const __dirname = dirname(__filename);

/**
 * Exports the ElectionBettingPool contract ABI to the frontend
 * This script is automatically run after compilation
 *
 * Output: src/lib/abi/ElectionBettingPool.json
 */
async function main() {
  // Use absolute path from project root
  const projectRoot = path.resolve(__dirname, "..");
  const artifactPath = path.join(
    projectRoot,
    "artifacts/contracts/ElectionBettingPool.sol/ElectionBettingPool.json"
  );

  const outputDir = path.join(projectRoot, "src/lib/abi");
  const outputPath = path.join(outputDir, "ElectionBettingPool.json");

  console.log("Reading contract artifact from:", artifactPath);

  if (!fs.existsSync(artifactPath)) {
    throw new Error(
      "Contract artifact not found. Please compile the contract first using 'npx hardhat compile'"
    );
  }

  // Read the full artifact
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Extract only the ABI
  const abiOnly = {
    abi: artifact.abi,
  };

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log("Created output directory:", outputDir);
  }

  // Write ABI to frontend
  fs.writeFileSync(outputPath, JSON.stringify(abiOnly, null, 2));

  console.log("✅ ABI exported successfully to:", outputPath);
  console.log(`   Contract has ${artifact.abi.length} ABI entries`);
}

main().catch((error) => {
  console.error("❌ ABI export failed:", error);
  process.exitCode = 1;
});
