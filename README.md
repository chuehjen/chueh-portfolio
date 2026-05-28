# CHUEH Portfolio

> 一个面向中美港多市场散户的 iOS 持仓健康度追踪 App，主打"一眼看懂自己的钱"。

[![Expo SDK](https://img.shields.io/badge/Expo-SDK_56-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.85-61DAFB?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://www.typescriptlang.org)

## 截图

| 总览 | 持仓 | 健康度 |
|---|---|---|
| 资产总值 + AI 分析 + Top 5 | 四维评分 + 风险提示 + 持仓列表 | 集中度 / 行业 / 波动 / 回撤 |

## 核心功能

- 截图导入持仓（百炼 VL 模型识别 Futu / FirstTrade 持仓页）
- CSV 导入持仓（兼容 Futu 与 FirstTrade 导出文件）
- Yahoo Finance 实时行情（美股 + 港股，无需 API Key）
- 四维健康度评分（集中度 30% / 行业分散 25% / 波动率 20% / 回撤 25%）
- 每日持仓快照趋势（30 天历史）
- AI 智能分析（百炼 Qwen-Plus，组合诊断 + 调仓建议）

## 技术栈

- **Framework**: Expo SDK 56 + React Native 0.85
- **Router**: expo-router (file-based routing)
- **Storage**: expo-sqlite
- **Language**: TypeScript (strict mode)
- **AI**: 阿里云百炼 (qwen-vl-plus 视觉识别 + qwen-plus 文本分析)

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 填入百炼 API Key

# 3. 启动开发服务器
npx expo start

# 4. 模拟器运行
npx expo start --ios

# 5. 真机运行（需要 Apple 开发者签名）
npx expo run:ios --device
```

## 目录结构

```
chueh-portfolio/
├── app/                      # expo-router 页面
│   ├── _layout.tsx           # Tab 导航（总览 / 持仓 / 设置）
│   ├── index.tsx             # 总览：Hero 资产卡 + 健康度 + Top 5
│   ├── holdings/             # 持仓详情页
│   ├── import/               # 截图 / CSV 导入
│   └── settings/             # 设置
├── src/
│   ├── data/                 # 数据层（storage, market-api, ocr-service, ai-service）
│   ├── domain/               # 领域逻辑（health-score, portfolio-calculator, types）
│   ├── hooks/                # use-portfolio / use-prices / use-health-score
│   ├── components/ui/        # 基础组件
│   └── utils/                # constants, formatters, tips
├── PRD.md                    # 完整 PRD
├── CODE_INDEX.md             # 代码索引
└── AGENTS.md                 # 协作约定
```

## 健康度算法

```
总分 = 集中度(30%) + 行业分散(25%) + 波动率(20%) + 回撤(25%)
```

- **集中度**：单一持仓 ≤20% 满分；>40% 0 分
- **行业分散**：覆盖 ≥6 个行业满分；HHI 加权
- **波动率**：组合 σ ≤15% 满分；>40% 0 分
- **回撤**：从最高点回撤 ≤5% 满分；>30% 0 分

## 文档

- [PRD.md](./PRD.md) — 完整产品文档
- [CODE_INDEX.md](./CODE_INDEX.md) — 代码结构索引
- [AGENTS.md](./AGENTS.md) — Agent 协作规范

## 许可证

MIT © 2026 chuehjen
