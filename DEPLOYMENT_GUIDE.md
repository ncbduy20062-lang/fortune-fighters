# ElectionBet Deployment Guide

Complete guide for deploying the ElectionBet encrypted prediction market.

## ✅ Pre-Deployment Checklist

All code is ready and properly configured:
- [x] Smart contract with FHE operations
- [x] Frontend with Wagmi + RainbowKit + FHE SDK
- [x] COOP/COEP headers configured (vite.config.ts + vercel.json)
- [x] Deployment and verification scripts
- [x] Comprehensive test suite
- [x] Documentation (README.md)

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Sepolia ETH**: ~0.01 ETH for contract deployment
   - Faucets:
     - https://sepoliafaucet.com/
     - https://www.alchemy.com/faucets/ethereum-sepolia
     - https://cloud.google.com/application/web3/faucet/ethereum/sepolia

2. **API Keys**:
   - Etherscan API key (for verification): https://etherscan.io/myapikey
   - WalletConnect Project ID: https://cloud.walletconnect.com/

## 🚀 Step-by-Step Deployment

### Step 1: Get Sepolia ETH

1. Visit a Sepolia faucet (links above)
2. Request Sepolia ETH for address: `0x298cf0b87aecc15d1bf93d6e4ebe9ac8828b11a8`
3. Wait for confirmation (~30 seconds)

### Step 2: Update Environment Variables

Update `.env` with your Etherscan API key:

```bash
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

### Step 3: Deploy Smart Contract

```bash
npm run deploy:sepolia
```

Expected output:
```
📋 Deployment Configuration:
  - Deployer: 0x298CF0B87aEcc15D1bf93D6e4eBe9ac8828B11a8
  - Admin: 0x298CF0B87aEcc15D1bf93D6e4eBe9ac8828B11a8
  - Gateway Relayer: 0x33347831500f1E73f0cCcbbe71418F2CD6749cD4
  - Network: sepolia
  - ChainId: 11155111n

🚀 Deploying ElectionBettingPool...
⏳ Waiting for deployment transaction...

✅ Deployment Successful!
  - Contract Address: 0x...
```

### Step 4: Update Contract Address

Update `.env` with the deployed contract address:

```bash
VITE_ELECTION_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
DEPLOYED_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
```

### Step 5: Export ABI

```bash
npm run hardhat:export-abi
```

This copies the contract ABI to `src/lib/abi/ElectionBettingPool.json` for frontend use.

### Step 6: Verify Contract on Etherscan

```bash
npm run verify:sepolia
```

Expected output:
```
✅ Contract verified successfully!
```

### Step 7: Create an Election Market

You need to call `createElection()` on the deployed contract. You can do this via:

**Option A: Using Hardhat Console**

```bash
npx hardhat console --network sepolia
```

```javascript
const contract = await ethers.getContractAt(
  "ElectionBettingPool",
  "0xYOUR_DEPLOYED_ADDRESS"
);

// Create election with ID=1, 2 candidates, locks in 30 days
const lockTime = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60);
const tx = await contract.createElection(1, 2, lockTime);
await tx.wait();
console.log("Election created!");
```

**Option B: Using Etherscan**

1. Go to your contract on Etherscan
2. Click "Contract" → "Write Contract"
3. Connect your wallet (0x298cf...)
4. Call `createElection`:
   - `electionId`: 1
   - `candidateCount`: 2
   - `lockTimestamp`: Future timestamp (e.g., `1735660800` for Jan 1, 2025)

### Step 8: Test Frontend Locally

```bash
npm run dev
```

Visit `http://localhost:8080` and test:
1. Connect wallet (MetaMask on Sepolia)
2. Select a candidate
3. Enter bet amount (minimum 0.01 ETH)
4. Place encrypted prediction
5. Check transaction on Etherscan

### Step 9: Deploy to Vercel

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy
vercel --prod

# Or use the GitHub integration:
# 1. Push code to GitHub
# 2. Import project in Vercel dashboard
# 3. Add environment variables
# 4. Deploy
```

**Required Vercel Environment Variables:**
```
VITE_SEPOLIA_RPC_URL=https://rpc.sepolia.org
VITE_WALLETCONNECT_PROJECT_ID=4ef1c6cdd2f246f2b1c8d5f8f02f2a1d
VITE_FHE_GATEWAY_URL=https://gateway.testnet.zama.ai
VITE_ELECTION_ID=1
VITE_ELECTION_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_ADDRESS
```

### Step 10: Update Documentation

Update the deployed link in `@docs/50_FHE_Web3_Projects.csv`:

```csv
7,ElectionBet,https://your-app.vercel.app,选举结果预测
```

## 🧪 Testing Checklist

After deployment, verify:

- [ ] Contract deployed successfully
- [ ] Contract verified on Etherscan
- [ ] Election market created (ID=1)
- [ ] Frontend connects to Sepolia
- [ ] Wallet connection works (MetaMask)
- [ ] FHE SDK initializes (check browser console)
- [ ] Can select candidate
- [ ] Can enter bet amount
- [ ] Encryption works (no CORS errors)
- [ ] Transaction submits successfully
- [ ] Transaction confirmed on Etherscan
- [ ] Prediction recorded in contract

## 🔧 Troubleshooting

### Issue: "Insufficient funds"
**Solution**: Get more Sepolia ETH from faucets

### Issue: "WASM not initialized"
**Solution**:
- Check browser console for CORS errors
- Verify COOP/COEP headers are set
- Try in a different browser (Chrome/Brave recommended)

### Issue: "Wrong network"
**Solution**: Switch MetaMask to Sepolia network

### Issue: "Contract verification failed"
**Solution**:
- Check ETHERSCAN_API_KEY in .env
- Ensure constructor args match deployment
- Try again (sometimes Etherscan is slow)

### Issue: "Transaction reverted"
**Solution**:
- Check election exists (call `getElection(1)`)
- Check election isn't locked/settled
- Ensure bet amount >= 0.01 ETH
- Check commitment hasn't been used

## 📊 Post-Deployment Monitoring

Monitor your deployment:

1. **Etherscan Contract Page**:
   https://sepolia.etherscan.io/address/YOUR_ADDRESS

2. **Check Contract State**:
   ```bash
   npx hardhat console --network sepolia
   ```
   ```javascript
   const contract = await ethers.getContractAt("ElectionBettingPool", "YOUR_ADDRESS");
   await contract.getElection(1); // Check election details
   ```

3. **Monitor Events**:
   - ElectionCreated
   - PredictionPlaced
   - ElectionSettled
   - PredictionPaid

## 🎯 Next Steps

After successful deployment:

1. Share the Vercel URL with users
2. Create more elections for different races/outcomes
3. Monitor predictions and gas usage
4. Settle election when results are official
5. Ensure winners can claim payouts

## 📞 Support

If you encounter issues:
- Check browser console for errors
- Review Hardhat logs
- Check Etherscan for failed transactions
- Verify all environment variables are set correctly

Good luck with your deployment! 🚀
