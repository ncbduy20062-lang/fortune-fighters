# ElectionBet Frontend Development Guide

## 概述
`election-bet-hub` 为选举结果预测提供舆论主页与下注面板。界面采用新闻编辑室风格，强调实时民调与数据可信度，所有下注金额和选择在浏览器通过 FHE SDK 加密后再提交链上。

## 应用身份
- **App Name**: `election-bet-hub`
- **Package Path**: `apps/election-bet-hub`
- **Design System**: 主题 *Newsroom Infographic*，红白蓝配色配合新闻排版与数据小组件。

| Token | Hex |
|-------|-----|
| Primary | `#0B1120` |
| Secondary | `#EF4444` |
| Accent | `#3B82F6` |
| Surface | `#1E293B` |
| Background | `#F8FAFC` |
| Gradient | `linear-gradient(125deg, #0B1120 0%, #1E293B 45%, #EF4444 100%)` |

## 技术栈
- Next.js 14 App Router + TypeScript
- Tailwind CSS + Headless UI 组合式组件
- Wagmi v2、RainbowKit (MetaMask、WalletConnect、Ledger)
- `@zama-fhe/relayer-sdk/bundle` 处理全同态加密
- TanStack Query 同步选举 API（FiveThirtyEight / CivicsPoll 可替换）
- Victory Charts 绘制民调折线与历史结果
- i18next 支持双语切换（中/英）

## 布局导航
- `app/layout.tsx` 装载 Provider、全局 TopBar ticker、Footer。
- 顶部 `NewsTicker` 滚动显示 breaking news 与投票率。
- 侧边 `SideChainPanel` 展示区块链网络状态、加密保障说明。

## 路由规划
- `/` — 新闻式首页：民调图表、核心卖点、投票进度条、CTA。
- `/app` — 投注控制台：候选人列表、下注表单、历史票据。
- `/insights` — 深度分析：交互式地图、各州预测情况（可后续扩展）。

## Homepage 模块

### Hero Headline
- 文件：`components/landing/HeroHeadline.tsx`
- 结构：左侧头条、右侧直播窗口（可嵌入视频或实时图表）。
- CTA：`Open Prediction Desk` + `Read Methodology`。

### PollingDashboard
- 文件：`components/landing/PollingDashboard.tsx`
- 功能：使用 Victory 绘制最新民调，附 “Encrypted Settlement” 标记说明。

### MethodologySection
- 文件：`components/landing/Methodology.tsx`
- 内容：详细解释 FHE 安全性、资金托管流程、解密触发条件。

## DApp 核心

### CandidateGrid
- 文件：`components/app/CandidateGrid.tsx`
- 展示：候选人头像、政党、当前赔率、历史支持率。
- 点击后将候选人 ID 传入 `BetComposer`。

### BetComposer
- 文件：`components/app/BetComposer.tsx`
- 流程：
  1. 输入下注金额与预测胜率。
  2. 调用 `encryptElectionBet` 先加密候选人 ID 与金额。
  3. 发送交易 `placePrediction(electionId, handles[0], handles[1], proof)`。
- 同时显示“所有数据仅以密文形式写入链上”提醒。

### TicketLedger
- 文件：`components/app/TicketLedger.tsx`
- 内容：用户投注记录（密态），当 `OutcomeDecrypted` 事件触发后更新明文收益。
- 支持按照州或候选人标签过滤。

## FHE 集成工具
```typescript
import { initSDK, createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/bundle";

let fheInstance: Awaited<ReturnType<typeof createInstance>> | null = null;

export async function ensureFheInstance() {
  if (fheInstance) return fheInstance;
  await initSDK();
  fheInstance = await createInstance(SepoliaConfig);
  return fheInstance;
}

export async function encryptElectionBet(contractAddress: `0x${string}`, wallet: `0x${string}`, candidateId: number, stakeWei: bigint) {
  const fhe = await ensureFheInstance();
  const input = fhe.createEncryptedInput(contractAddress, wallet);
  input.add32(candidateId);
  input.add64(stakeWei);
  const { handles, inputProof } = await input.encrypt();
  return {
    candidateHandle: handles[0],
    stakeHandle: handles[1],
    proof: inputProof,
  };
}
```

## 状态与数据
- `useElectionStore` (Zustand)：保存当前选举 ID、所选候选人、SDK 状态。
- `usePredictionMarketsQuery`：轮询链上市场数据，配合外部民调 API。
- `EncryptionToast`：展示 SDK 加载进度、错误原因（COOP/COEP）。

## 测试
- 单元测试：验证 BetComposer 输入校验、金额上下限、候选人选择逻辑。
- 集成测试：Cypress 覆盖完整下注流程，确认交易前调用 `encryptElectionBet`。
- 可用性测试：确保无障碍辅助文本覆盖核心 CTA 与图表内容。
