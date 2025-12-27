# ElectionBet Backend Development Guide

## 概述
`ElectionBetMarket` 合约提供选举预测的密态下注、资金托管与胜者分配。候选人选择、下注金额均通过 FHE 加密提交，链上进行累积与胜率计算，最终在官方结果公布后触发网关解密、执行奖金发放。

## 角色模型
- `DEFAULT_ADMIN_ROLE`：部署者，负责任务配置与角色分配。
- `EDITOR_ROLE`：创建、关闭选举市场，维护候选人参数。
- `RESULT_ORACLE_ROLE`：写入正式选举结果。
- `GATEWAY_ROLE`：处理网关回调。

## 数据结构
### `Election`
- `uint256 electionId`
- `uint8 candidateCount`
- `uint256 lockTimestamp`
- `bool settled`
- `uint8 winningCandidate`
- `euint64 encryptedPool`
- `euint64[] encryptedOutcomeTotals`

### `Ticket`
- `address bettor`
- `uint256 electionId`
- `bytes32 commitment`
- `externalEuint32 encryptedCandidate`
- `externalEuint64 encryptedStake`
- `bool claimed`

### `DecryptionRequest`
- `uint256 requestId`
- `uint256 electionId`
- `uint256 createdAt`
- `bool fulfilled`
- `uint64 decryptedRatio`

## 事件
- `ElectionCreated(uint256 indexed electionId, uint8 candidateCount)`
- `PredictionPlaced(uint256 indexed electionId, address indexed bettor)`
- `ElectionSettled(uint256 indexed electionId, uint8 winningCandidate, uint256 requestId)`
- `PredictionPaid(uint256 indexed ticketId, address indexed bettor, uint64 payout)`

## 核心流程

### 创建市场
```solidity
function createElection(uint256 electionId, uint8 candidateCount, uint256 lockTimestamp) external onlyRole(EDITOR_ROLE)
```
- 初始化 `encryptedPool` 与 `encryptedOutcomeTotals[i] = FHE.asEuint64(0)`。
- 设置下注锁定时间，防止结果公布后继续下注。

### 提交预测
```solidity
function placePrediction(uint256 electionId, externalEuint32 encryptedCandidate, externalEuint64 encryptedStake, bytes calldata proof, bytes32 commitment) external
```
- 校验锁定时间。
- 调用 `FHE.fromExternal` 导入候选人 ID 与金额：
  ```solidity
  euint32 candidate = FHE.fromExternal(encryptedCandidate, proof);
  euint64 stake = FHE.fromExternal(encryptedStake, proof);
  FHE.allowThis(candidate);
  FHE.allowThis(stake);
  ```
- 更新总奖池与该候选人的密态总和。
- 保存 `Ticket`，commitment 用于防重。

### 结算市场
```solidity
function settleElection(uint256 electionId, uint8 resultCandidate) external onlyRole(RESULT_ORACLE_ROLE)
```
- 写入获胜候选人，标记 `settled = true`。
- 计算奖金比例：
  ```solidity
  // 前端下注金额乘以 SCALE = 1e6
  euint64 scaledPool = election.encryptedPool;
  euint64 scaledWinnerTotal = election.encryptedOutcomeTotals[resultCandidate];
  euint64 payoutRatio = FHE.div(FHE.mul(scaledPool, FHE.asEuint64(SCALE)), scaledWinnerTotal);
  ```
- 触发网关解密上述 `payoutRatio`，记录 `DecryptionRequest`。

### 领取奖金
```solidity
function claim(uint256 ticketId, bytes calldata proofCandidate, bytes calldata proofStake) external
```
- 确认票据归属，并导入密态：
  ```solidity
  euint32 candidate = FHE.fromExternal(tickets[ticketId].encryptedCandidate, proofCandidate);
  euint64 stake = FHE.fromExternal(tickets[ticketId].encryptedStake, proofStake);
  ```
- 若 `candidate` ≠ `winningCandidate`，使用 `FHE.select` 直接返回 0。
- 中奖时根据网关提供的 `decryptedRatio` 计算应付金额。
- 将票据标记为已领取。

### 网关回调
```solidity
function gatewayCallback(uint256 requestId, uint64 payoutRatioPlain) external onlyRole(GATEWAY_ROLE)
```
- 写入 `decryptionRequests[requestId].decryptedRatio = payoutRatioPlain`。
- 触发事件 `ElectionSettled`，通知前端刷新 UI。

## FHE 细节
- 候选人编号使用 `externalEuint32`，范围 0-255 足够。
- 金额沿用 `externalEuint64`，前端以 wei 传递并乘以 `SCALE` 实现除法。
- 更新密文后均调用 `FHE.allowThis`，若需玩家解密票据则 `FHE.allow(cipher, bettor)`。
- 票据 commitment 可取 `keccak256(abi.encode(handle, proof, block.number))`。

## Solidity 模板
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { FHE, euint32, euint64, externalEuint32, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";

contract ElectionBetMarket is AccessControl {
    bytes32 public constant EDITOR_ROLE = keccak256("EDITOR_ROLE");
    bytes32 public constant RESULT_ORACLE_ROLE = keccak256("RESULT_ORACLE_ROLE");
    bytes32 public constant GATEWAY_ROLE = keccak256("GATEWAY_ROLE");

    struct Election {
        euint64 encryptedPool;
        euint64[] encryptedOutcomeTotals;
        bool settled;
        uint8 winningCandidate;
        uint256 lockTimestamp;
    }

    mapping(uint256 => Election) public elections;

    constructor(address admin, address gateway) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(EDITOR_ROLE, admin);
        _grantRole(GATEWAY_ROLE, gateway);
    }
}
```

## Hardhat 设置
```ts
import { defineConfig } from "hardhat/config";
import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-toolbox";

export default defineConfig({
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 11155111,
    },
  },
  fhEVM: {
    gatewayUrl: process.env.FHE_GATEWAY_URL!,
  },
});
```

## 测试策略
- **锁定机制**：确保锁定时间后下注会 revert。
- **加密累积**：多次下注后检查密态奖池是否随之更新。
- **结算流程**：模拟获胜候选人，检查解密请求与回调事件。
- **安全性**：验证重复使用 commitment、非本人领取奖金均被拒绝。

## 部署清单
1. 在 `.env` 中配置 `SEPOLIA_RPC_URL`、`PRIVATE_KEY`、`FHE_GATEWAY_URL`。
2. 部署合约并记录地址，使用脚本授予 `RESULT_ORACLE_ROLE` 给官方预言机。
3. 启动 off-chain 服务监听 `ElectionSettled`、`PredictionPaid`。

## 安全提示
- 角色权限需在部署后立即核查，避免任何人伪造结果。
- 建议前端限制下注最大值，并在合约内部设置 `maxStake` 防范异常。
- 所有回调需校验 requestId 状态，防止重复执行。
