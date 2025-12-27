// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {
    FHE,
    ebool,
    euint32,
    euint64,
    euint128,
    externalEuint32,
    externalEuint64
} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ElectionBettingPool
 * @notice Privacy-preserving election prediction market that stores candidate choices
 *         and stake amounts as ciphertext while exposing only aggregated metrics.
 * @dev    Candidates are referenced by zero-based indices. Encrypted stakes are
 *         submitted as plain wei amounts (not scaled). SCALE is used only for
 *         computing payout ratios with precision.
 */
contract ElectionBettingPool is AccessControl, SepoliaConfig {
    bytes32 public constant EDITOR_ROLE = keccak256("EDITOR_ROLE");
    bytes32 public constant RESULT_ORACLE_ROLE = keccak256("RESULT_ORACLE_ROLE");
    bytes32 public constant GATEWAY_ROLE = keccak256("GATEWAY_ROLE");

    /// @notice Fixed point precision used when computing payout ratios.
    uint64 public constant SCALE = 1_000_000;

    /// @notice Hard cap for supported candidates per election to bound loops.
    uint8 public constant MAX_CANDIDATES = 8;

    /**
     * @dev Stores encrypted aggregates and settlement metadata.
     *      - encryptedPool accumulates the sum of encrypted stakes (in wei, not scaled).
     *      - encryptedOutcomeTotals[i] keeps the encrypted total for candidate i (in wei).
     */
    struct Election {
        bool exists;
        uint8 candidateCount;
        uint256 lockTimestamp;
        bool settled;
        uint8 winningCandidate;
        uint64 payoutRatio;
        uint64 winningTotalScaled;
        uint256 gatewayRequestId;
        uint256 totalDepositedWei;
        uint256 totalPaidWei;
        euint64 encryptedPool;
        euint64[MAX_CANDIDATES] encryptedOutcomeTotals;
    }

    /**
     * @dev Stores encrypted ticket data submitted by a predictor.
     */
    struct Ticket {
        uint256 electionId;
        address bettor;
        externalEuint32 encryptedCandidate;
        externalEuint64 encryptedStake;
        bytes32 commitment;
        bool claimed;
    }

    /**
     * @dev Tracks payout ratio decryption jobs keyed by gateway request id.
     */
    struct PayoutDecryption {
        uint256 electionId;
        bool fulfilled;
        uint64 payoutRatio;
        uint64 poolScaled;
        uint64 winningScaled;
    }

    /**
     * @dev Tracks pending claim decryption requests keyed by request id.
     */
    struct ClaimDecryption {
        uint256 ticketId;
        address bettor;
        uint256 electionId;
    }

    event ElectionCreated(uint256 indexed electionId, uint8 candidateCount, uint256 lockTimestamp);
    event PredictionPlaced(uint256 indexed electionId, address indexed bettor, uint256 indexed ticketId);
    event ElectionSettled(uint256 indexed electionId, uint8 winningCandidate, uint256 requestId);
    event PredictionPaid(uint256 indexed ticketId, address indexed bettor, uint256 payoutWei);

    mapping(uint256 => Election) private elections;
    mapping(uint256 => Ticket) private tickets;
    mapping(uint256 => uint256[]) private electionTickets;
    mapping(bytes32 => bool) private commitmentUsed;
    mapping(uint256 => PayoutDecryption) private payoutDecryptions;
    mapping(uint256 => ClaimDecryption) private claimDecryptions;

    uint256 private nextTicketId = 1;

    error ElectionNotFound(uint256 electionId);
    error ElectionAlreadyExists(uint256 electionId);
    error ElectionLocked(uint256 electionId);
    error InvalidCandidateCount(uint8 count);
    error DuplicateCommitment();
    error SettlementPending(uint256 electionId);
    error WinningTotalsZero(uint256 electionId);
    error InsufficientLiquidity(uint256 electionId);
    error ClaimNotReady(uint256 electionId);
    error TicketNotOwned(uint256 ticketId);
    error TicketAlreadyClaimed(uint256 ticketId);
    error InvalidGatewayPayload(uint256 requestId);

    constructor(address admin, address gateway) {
        require(admin != address(0), "Admin required");
        require(gateway != address(0), "Gateway required");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(EDITOR_ROLE, admin);
        _grantRole(GATEWAY_ROLE, gateway);
    }

    /**
     * @notice Configures a new encrypted election market.
     * @param electionId Unique election identifier managed off-chain.
     * @param candidateCount Total number of supported candidates (max MAX_CANDIDATES).
     * @param lockTimestamp Timestamp after which predictions are rejected.
     */
    function createElection(
        uint256 electionId,
        uint8 candidateCount,
        uint256 lockTimestamp
    ) external onlyRole(EDITOR_ROLE) {
        if (candidateCount == 0 || candidateCount > MAX_CANDIDATES) {
            revert InvalidCandidateCount(candidateCount);
        }
        if (lockTimestamp <= block.timestamp) {
            revert ElectionLocked(electionId);
        }
        Election storage election = elections[electionId];
        if (election.exists) {
            revert ElectionAlreadyExists(electionId);
        }

        election.exists = true;
        election.candidateCount = candidateCount;
        election.lockTimestamp = lockTimestamp;
        election.encryptedPool = FHE.asEuint64(0);
        FHE.allowThis(election.encryptedPool);

        for (uint8 i = 0; i < candidateCount; i++) {
            election.encryptedOutcomeTotals[i] = FHE.asEuint64(0);
            FHE.allowThis(election.encryptedOutcomeTotals[i]);
        }

        emit ElectionCreated(electionId, candidateCount, lockTimestamp);
    }

    /**
     * @notice Retrieves a plain summary for UI consumption.
     */
    function getElection(
        uint256 electionId
    )
        external
        view
        returns (
            bool exists,
            uint8 candidateCount,
            uint256 lockTimestamp,
            bool settled,
            uint8 winningCandidate,
            uint64 payoutRatio,
            uint256 totalDepositedWei,
            uint256 totalPaidWei,
            uint256 gatewayRequestId,
            uint64 winningTotalScaled
        )
    {
        Election storage election = elections[electionId];
        return (
            election.exists,
            election.candidateCount,
            election.lockTimestamp,
            election.settled,
            election.winningCandidate,
            election.payoutRatio,
            election.totalDepositedWei,
            election.totalPaidWei,
            election.gatewayRequestId,
            election.winningTotalScaled
        );
    }

    /**
     * @notice Places an encrypted prediction ticket.
     * @dev    The caller must also send the plain stake as msg.value.
     */
    function placePrediction(
        uint256 electionId,
        externalEuint32 encryptedCandidate,
        externalEuint64 encryptedStake,
        bytes calldata proof,
        bytes32 commitment
    ) external payable returns (uint256 ticketId) {
        Election storage election = elections[electionId];
        if (!election.exists) {
            revert ElectionNotFound(electionId);
        }
        if (block.timestamp >= election.lockTimestamp || election.settled) {
            revert ElectionLocked(electionId);
        }
        if (commitment == bytes32(0) || commitmentUsed[commitment]) {
            revert DuplicateCommitment();
        }

        euint32 candidate = FHE.fromExternal(encryptedCandidate, proof);
        euint64 stake = FHE.fromExternal(encryptedStake, proof);

        FHE.allowThis(candidate);
        FHE.allowThis(stake);
        FHE.allow(candidate, msg.sender);
        FHE.allow(stake, msg.sender);

        election.encryptedPool = FHE.add(election.encryptedPool, stake);
        FHE.allowThis(election.encryptedPool);

        for (uint8 i = 0; i < election.candidateCount; i++) {
            ebool isMatch = FHE.eq(candidate, FHE.asEuint32(i));
            euint64 incremented = FHE.add(election.encryptedOutcomeTotals[i], stake);
            election.encryptedOutcomeTotals[i] = FHE.select(isMatch, incremented, election.encryptedOutcomeTotals[i]);
            FHE.allowThis(election.encryptedOutcomeTotals[i]);
        }

        election.totalDepositedWei += msg.value;
        commitmentUsed[commitment] = true;

        ticketId = nextTicketId++;
        tickets[ticketId] = Ticket({
            electionId: electionId,
            bettor: msg.sender,
            encryptedCandidate: encryptedCandidate,
            encryptedStake: encryptedStake,
            commitment: commitment,
            claimed: false
        });
        electionTickets[electionId].push(ticketId);

        emit PredictionPlaced(electionId, msg.sender, ticketId);
    }

    /**
     * @notice Declares the winning candidate and schedules payout ratio decryption.
     */
    function settleElection(uint256 electionId, uint8 winningCandidate) external onlyRole(RESULT_ORACLE_ROLE) {
        Election storage election = elections[electionId];
        if (!election.exists) {
            revert ElectionNotFound(electionId);
        }
        if (winningCandidate >= election.candidateCount) {
            revert InvalidCandidateCount(winningCandidate);
        }
        if (election.settled) {
            revert SettlementPending(electionId);
        }

        election.settled = true;
        election.winningCandidate = winningCandidate;

        bytes32[] memory handles = new bytes32[](2);
        handles[0] = euint64.unwrap(election.encryptedPool);
        handles[1] = euint64.unwrap(election.encryptedOutcomeTotals[winningCandidate]);

        uint256 requestId = FHE.requestDecryption(handles, this.gatewayCallback.selector);
        election.gatewayRequestId = requestId;

        payoutDecryptions[requestId] = PayoutDecryption({
            electionId: electionId,
            fulfilled: false,
            payoutRatio: 0,
            poolScaled: 0,
            winningScaled: 0
        });

        emit ElectionSettled(electionId, winningCandidate, requestId);
    }

    /**
     * @notice Claims payout for a ticket once the payout ratio is available.
     */
    function claim(uint256 ticketId, bytes calldata proofCandidate, bytes calldata proofStake) external {
        Ticket storage ticket = tickets[ticketId];
        if (ticket.bettor != msg.sender) {
            revert TicketNotOwned(ticketId);
        }
        if (ticket.claimed) {
            revert TicketAlreadyClaimed(ticketId);
        }

        Election storage election = elections[ticket.electionId];
        if (!election.settled) {
            revert SettlementPending(ticket.electionId);
        }

        PayoutDecryption storage job = payoutDecryptions[election.gatewayRequestId];
        if (!job.fulfilled) {
            revert ClaimNotReady(ticket.electionId);
        }

        euint32 candidate = FHE.fromExternal(ticket.encryptedCandidate, proofCandidate);
        euint64 stake = FHE.fromExternal(ticket.encryptedStake, proofStake);
        FHE.allowThis(candidate);
        FHE.allowThis(stake);

        ebool isWinner = FHE.eq(candidate, FHE.asEuint32(election.winningCandidate));

        euint128 stake128 = FHE.asEuint128(stake);
        euint128 ratio128 = FHE.asEuint128(job.payoutRatio);
        euint128 scaledProduct = FHE.mul(stake128, ratio128);
        euint128 scaledPayout = FHE.div(scaledProduct, SCALE);
        euint128 maskedPayout = FHE.select(isWinner, scaledPayout, FHE.asEuint128(0));

        bytes32[] memory handles = new bytes32[](1);
        handles[0] = euint128.unwrap(maskedPayout);

        uint256 requestId = FHE.requestDecryption(handles, this.gatewayCallback.selector);
        claimDecryptions[requestId] = ClaimDecryption({ticketId: ticketId, bettor: msg.sender, electionId: ticket.electionId});

        ticket.claimed = true;
    }

    /**
     * @dev Processes gateway callbacks for settlement ratios and claim payouts.
     */
    function gatewayCallback(uint256 requestId, bytes calldata cleartexts, bytes calldata decryptionProof) external onlyRole(GATEWAY_ROLE) {
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        PayoutDecryption storage payoutJob = payoutDecryptions[requestId];
        if (payoutJob.electionId != 0 && !payoutJob.fulfilled) {
            (uint64 poolScaled, uint64 winningScaled) = abi.decode(cleartexts, (uint64, uint64));
            if (winningScaled == 0) {
                revert WinningTotalsZero(payoutJob.electionId);
            }

            Election storage election = elections[payoutJob.electionId];
            // Note: poolScaled is in wei (not multiplied by SCALE) since client sends raw wei values
            // We only use SCALE for computing the payout ratio with precision
            if (election.totalDepositedWei != uint256(poolScaled)) {
                revert InsufficientLiquidity(payoutJob.electionId);
            }

            uint64 ratio = uint64((uint256(poolScaled) * SCALE) / uint256(winningScaled));

            payoutJob.fulfilled = true;
            payoutJob.payoutRatio = ratio;
            payoutJob.poolScaled = poolScaled;
            payoutJob.winningScaled = winningScaled;

            election.payoutRatio = ratio;
            election.winningTotalScaled = winningScaled;

            return;
        }

        ClaimDecryption memory claimJob = claimDecryptions[requestId];
        if (claimJob.ticketId != 0) {
            uint128 payoutScaled = abi.decode(cleartexts, (uint128));
            uint256 payoutWei = uint256(payoutScaled) / SCALE;

            if (payoutWei > 0) {
                if (payoutWei > address(this).balance) {
                    revert InsufficientLiquidity(claimJob.electionId);
                }

                Election storage electionData = elections[claimJob.electionId];
                electionData.totalPaidWei += payoutWei;

                (bool sent, ) = payable(claimJob.bettor).call{value: payoutWei}("");
                require(sent, "Transfer failed");
                emit PredictionPaid(claimJob.ticketId, claimJob.bettor, payoutWei);
            } else {
                emit PredictionPaid(claimJob.ticketId, claimJob.bettor, 0);
            }

            delete claimDecryptions[requestId];
            return;
        }

        revert InvalidGatewayPayload(requestId);
    }

    /**
     * @notice Returns metadata for a given ticket.
     */
    function getTicket(uint256 ticketId) external view returns (Ticket memory) {
        return tickets[ticketId];
    }

    /**
     * @notice Lists tickets placed for an election.
     */
    function getTicketsForElection(uint256 electionId) external view returns (uint256[] memory) {
        return electionTickets[electionId];
    }

    /**
     * @notice Exposes payout decryption metadata for monitoring.
     */
    function getPayoutDecryption(uint256 requestId) external view returns (PayoutDecryption memory) {
        return payoutDecryptions[requestId];
    }

    /**
     * @notice Allows treasury managers to pre-fund payout liquidity.
     */
    function fundPool() external payable onlyRole(DEFAULT_ADMIN_ROLE) {}

    /**
     * @notice Allows admins to withdraw surplus funds.
     */
    function withdrawSurplus(address payable recipient, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(recipient != address(0), "Invalid recipient");
        (bool sent, ) = recipient.call{value: amount}("");
        require(sent, "Withdraw failed");
    }
}
