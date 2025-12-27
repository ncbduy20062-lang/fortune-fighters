import { type HardhatUserConfig } from "hardhat/config";
import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-toolbox";
import "./tasks/accounts";
import "dotenv/config";

const {
  SEPOLIA_RPC_URL,
  PRIVATE_KEY,
  FHE_GATEWAY_URL,
  ETHERSCAN_API_KEY,
} = process.env as Record<string, string | undefined>;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    sepolia: {
      url: SEPOLIA_RPC_URL || "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY || "",
  },
  fhEVM: {
    gatewayUrl: FHE_GATEWAY_URL || "https://gateway.testnet.zama.ai",
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;
