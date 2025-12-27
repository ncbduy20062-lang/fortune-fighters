import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { ethers, fhevm } from "hardhat";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { ElectionBettingPool } from "../types";

const ELECTION_ID = 42;
const WINNING_CANDIDATE = 0;
const LOSING_CANDIDATE = 1;

async function encryptPrediction(
  contractAddress: string,
  user: HardhatEthersSigner,
  candidate: number,
  stakeWei: bigint,
  scale: bigint,
) {
  const input = fhevm.createEncryptedInput(contractAddress, user.address);
  input.add32(candidate);
  input.add64(stakeWei * scale);
  const encrypted = await input.encrypt();

  const commitment = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "bytes32", "bytes32"],
      [user.address, ELECTION_ID, encrypted.handles[0], encrypted.handles[1]],
    ),
  );

  return { encrypted, commitment };
}

describe("ElectionBettingPool", function () {
  let deployer: HardhatEthersSigner;
  let oracle: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let contract: ElectionBettingPool;
  let contractAddress: string;
  let gatewayAddress: string;
  let scale: bigint;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("Skipping ElectionBettingPool tests outside of FHE mock runtime");
      this.skip();
    }

    [deployer, oracle, , alice, bob] = await ethers.getSigners();
    await fhevm.initializeCLIApi();

    const metadata = await fhevm.getRelayerMetadata();
    gatewayAddress = metadata.DecryptionOracleAddress;

    const factory = await ethers.getContractFactory("ElectionBettingPool");
    contract = (await factory.deploy(await deployer.getAddress(), gatewayAddress)) as ElectionBettingPool;
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
    scale = await contract.SCALE();

    await contract.connect(deployer).grantRole(await contract.RESULT_ORACLE_ROLE(), await oracle.getAddress());
    await contract.connect(deployer).grantRole(await contract.GATEWAY_ROLE(), gatewayAddress);
    await contract.connect(deployer).grantRole(await contract.GATEWAY_ROLE(), metadata.relayerSignerAddress);

    const lockTimestamp = Math.floor(Date.now() / 1000) + 600;
    await contract.connect(deployer).createElection(ELECTION_ID, 3, lockTimestamp);
  });

  it("handles encrypted predictions and payouts end-to-end", async function () {
    const aliceStake = BigInt(5_000_000_000_000); // 0.000005 ETH
    const bobStake = BigInt(4_000_000_000_000); // 0.000004 ETH

    const aliceEncrypted = await encryptPrediction(contractAddress, alice, WINNING_CANDIDATE, aliceStake, scale);
    const bobEncrypted = await encryptPrediction(contractAddress, bob, LOSING_CANDIDATE, bobStake, scale);

    await expect(
      contract
        .connect(alice)
        .placePrediction(
          ELECTION_ID,
          aliceEncrypted.encrypted.handles[0],
          aliceEncrypted.encrypted.handles[1],
          aliceEncrypted.encrypted.inputProof,
          aliceEncrypted.commitment,
          { value: aliceStake },
        ),
    )
      .to.emit(contract, "PredictionPlaced")
      .withArgs(ELECTION_ID, await alice.getAddress(), 1);

    await contract
      .connect(bob)
      .placePrediction(
        ELECTION_ID,
        bobEncrypted.encrypted.handles[0],
        bobEncrypted.encrypted.handles[1],
        bobEncrypted.encrypted.inputProof,
        bobEncrypted.commitment,
        { value: bobStake },
      );

    const marketAfterBets = await contract.getElection(ELECTION_ID);
    expect(marketAfterBets.totalDepositedWei).to.equal(aliceStake + bobStake);

    await expect(contract.connect(oracle).settleElection(ELECTION_ID, WINNING_CANDIDATE))
      .to.emit(contract, "ElectionSettled")
      .withArgs(ELECTION_ID, WINNING_CANDIDATE, anyValue);

    await fhevm.awaitDecryptionOracle();

    const postSettlement = await contract.getElection(ELECTION_ID);
    expect(postSettlement.settled).to.equal(true);
    expect(postSettlement.payoutRatio).to.be.greaterThan(0n);

    const tickets = await contract.getTicketsForElection(ELECTION_ID);
    const aliceTicketId = tickets[0];

    const aliceAddress = await alice.getAddress();
    const balanceBefore = await ethers.provider.getBalance(aliceAddress);

    const claimTx = await contract
      .connect(alice)
      .claim(aliceTicketId, aliceEncrypted.encrypted.inputProof, aliceEncrypted.encrypted.inputProof);
    const claimReceipt = await claimTx.wait();
    const gasPrice = claimReceipt.effectiveGasPrice ?? claimReceipt.gasPrice ?? BigInt(0);
    const gasFee = claimReceipt.fee ?? claimReceipt.gasUsed * gasPrice;

    await fhevm.awaitDecryptionOracle();

    const balanceAfter = await ethers.provider.getBalance(aliceAddress);
    const net = balanceAfter - balanceBefore + gasFee;
    expect(net).to.equal(aliceStake + bobStake);

    const finalMarket = await contract.getElection(ELECTION_ID);
    expect(finalMarket.totalPaidWei).to.be.greaterThan(0);
  });
});
