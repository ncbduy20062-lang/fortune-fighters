# ElectionBet - Privacy-Preserving Election Prediction Market

A decentralized prediction market built with Fully Homomorphic Encryption (FHE) where users can place encrypted bets on election outcomes. All predictions remain completely private until official results are declared.

## 🌐 Live Demo

**Deployed Application**: [https://electionbet.vercel.app](https://electionbet.vercel.app)

**Smart Contract** (Sepolia): [0xdA53557D630FFb66473E0A25F70F0e9cAdE79Ac6](https://sepolia.etherscan.io/address/0xdA53557D630FFb66473E0A25F70F0e9cAdE79Ac6)

## 🎯 Key Features

### Complete Privacy
- **Encrypted Predictions**: Candidate choices encrypted using Zama FHE before blockchain submission
- **Hidden Bet Amounts**: Stake amounts processed as ciphertext on-chain
- **Anonymous Participation**: No prediction data revealed until election settlement

### Secure & Fair
- **Fail-Closed Security**: Smart contract designed with security-first principles
- **Automated Payouts**: Gateway decryption enables fair reward distribution
- **Role-Based Access**: Only authorized oracles can settle elections

### Modern Technology Stack
- **React + Vite**: Lightning-fast development and optimized builds
- **Wagmi v2**: Type-safe Web3 React hooks
- **RainbowKit**: Beautiful wallet connection UI
- **shadcn/ui**: Accessible, customizable components
- **Zama FHE SDK**: Client-side encryption (v0.2.0)

## 🏗️ Architecture

### Smart Contract Layer
```
ElectionBettingPool.sol
├── FHE Operations (@fhevm/solidity)
├── Access Control (OpenZeppelin)
├── Gateway Decryption
└── Payout Distribution
```

**Key Components:**
- `placePrediction()`: Submit encrypted predictions
- `settleElection()`: Declare winner and trigger payout calculation
- `claim()`: Decrypt individual predictions and distribute rewards

### Frontend Layer
```
src/
├── components/
│   ├── app/          # DApp-specific components
│   ├── landing/      # Landing page components
│   └── ui/           # shadcn/ui components
├── lib/
│   ├── fhe.ts        # FHE encryption utilities
│   ├── wagmi.ts      # Web3 configuration
│   └── config.ts     # App configuration
└── pages/
    ├── Home.tsx      # Landing page
    ├── PredictionApp.tsx  # Main DApp
    └── Methodology.tsx    # FHE explanation
```

## 📋 Prerequisites

- Node.js >= 18.x
- npm or yarn
- MetaMask or Web3-compatible wallet
- Sepolia testnet ETH ([Get from faucet](https://sepoliafaucet.com/))

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/chadellis202403011298/vote-crypt-win.git
cd vote-crypt-win
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create `.env` file:

```bash
# Blockchain Configuration
SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=your_private_key_here
ADDRESS=your_wallet_address_here
ADMIN_ADDRESS=your_wallet_address_here

# Etherscan API (for contract verification)
ETHERSCAN_API_KEY=your_etherscan_api_key

# Frontend Configuration
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_id
VITE_FHE_GATEWAY_URL=https://gateway.testnet.zama.ai
VITE_ELECTION_ID=1
VITE_ELECTION_CONTRACT_ADDRESS=0xdA53557D630FFb66473E0A25F70F0e9cAdE79Ac6
```

### 4. Development

#### Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Sepolia
npx hardhat run scripts/deployElectionBet.ts --network sepolia

# Create election
npx hardhat run scripts/createElection.ts --network sepolia

# Verify contract
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <ADMIN_ADDRESS> <GATEWAY_ADDRESS>
```

#### Frontend

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔒 How FHE Works

### Encryption Flow

1. **User Input**: Select candidate + enter bet amount
2. **Client-Side Encryption**:
   - FHE SDK encrypts data in browser
   - Generates zero-knowledge proof
3. **Blockchain Submission**:
   - Encrypted handles stored on-chain
   - Smart contract never sees plaintext
4. **Settlement**:
   - Oracle declares winner
   - Gateway decrypts aggregated data
   - Payouts calculated and distributed

### Privacy Guarantees

```typescript
// Example: Encrypted prediction
const { candidateHandle, stakeHandle, proof } =
  await encryptElectionPrediction(
    walletAddress,    // Your address
    candidateId,      // 0, 1, 2, etc.
    stakeWei          // Bet amount in wei
  );

// On-chain: All values remain encrypted
// ✓ Candidate choice: Hidden
// ✓ Bet amount: Hidden
// ✓ User identity: Public (wallet address)
```

## 🛠️ Technology Stack

### Smart Contracts
- Solidity ^0.8.24
- @fhevm/solidity ^0.8.0 (Zama FHE library)
- @openzeppelin/contracts ^5.2.0
- Hardhat ^2.22.0

### Frontend
- React ^18.3.1
- Vite ^5.4.19
- Wagmi ^2.13.5 (Web3 React hooks)
- RainbowKit ^2.2.3 (Wallet UI)
- @zama-fhe/relayer-sdk 0.2.0
- shadcn/ui + Tailwind CSS
- TanStack Query ^5.62.11

### Development Tools
- TypeScript ^5.7.2
- ESLint ^9.17.0
- Ethers.js ^6.13.1

## 📁 Project Structure

```
.
├── contracts/              # Solidity smart contracts
│   └── ElectionBettingPool.sol
├── scripts/               # Deployment & utility scripts
│   ├── deployElectionBet.ts
│   ├── createElection.ts
│   └── verifyContract.ts
├── src/
│   ├── components/        # React components
│   ├── lib/              # Utilities & config
│   ├── pages/            # Route pages
│   └── data/             # Static data
├── docs/                 # Documentation
├── test/                 # Test files
└── public/               # Static assets
```

## 🧪 Testing

Run smart contract tests:

```bash
npx hardhat test
```

Example test output:
```
ElectionBettingPool
  ✓ Should deploy with correct admin
  ✓ Should create election
  ✓ Should allow encrypted predictions
  ✓ Should settle election and calculate payouts
```

## 📖 Documentation

- [Frontend Development Guide](./docs/FRONTEND_DEV.md)
- [Backend Development Guide](./docs/BACKEND_DEV.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Zama FHE Documentation](https://docs.zama.ai/fhevm)

## 🔐 Security Considerations

1. **Private Keys**: Never commit `.env` file to version control
2. **ACL Permissions**: FHE decryption requires proper ACL setup
3. **Gateway Configuration**: Use official Zama gateway for testnet
4. **Audit**: Smart contracts have not been professionally audited - use at your own risk

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to your fork
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [Zama](https://zama.ai) for FHE technology
- [RainbowKit](https://rainbowkit.com) for wallet UI
- [shadcn/ui](https://ui.shadcn.com) for components
- [Hardhat](https://hardhat.org) for development environment

## 📞 Support

- GitHub Issues: [Create an issue](https://github.com/chadellis202403011298/vote-crypt-win/issues)
- Documentation: [Zama Docs](https://docs.zama.ai/fhevm)
- Demo: [electionbet.vercel.app](https://electionbet.vercel.app)

---

Built with ❤️ using Zama FHE Technology
