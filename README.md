# Gainly

> 拍一张券商截图，AI 帮你搞定持仓管理。面向中美港多市场散户的 iOS 持仓追踪与健康度诊断 App。

[![Expo SDK](https://img.shields.io/badge/Expo-SDK_56-000020?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.85-61DAFB?logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

## 需求背景

散户管理多个券商账户（富途、FirstTrade 等）的持仓，痛点集中在三个方面：

1. **数据分散** — 美股用一个 App，港股用另一个，没有统一视图
2. **录入繁琐** — 手动输入股票代码、成本价、数量，极易出错且耗时
3. **缺乏诊断** — 持仓是否过度集中？行业分散够不够？只凭感觉判断

Gainly 的核心主张是「截图即录入」——用户只需对券商持仓页拍一张截图，AI 视觉模型自动识别股票代码、持仓数量、成本价，秒级完成录入。在此基础上提供四维健康度评分和 AI 智能分析，让散户"一眼看懂自己的钱"。

## 产品目标

- **极低录入门槛**：截图 → OCR 识别 → 一键确认，3 步完成持仓导入
- **统一多市场视图**：美股 + 港股 + ETF 混合持仓，一屏总览
- **量化健康诊断**：四维评分体系（集中度/行业分散/波动率/回撤），替代主观判断
- **AI 辅助决策**：基于持仓结构的智能分析与调仓建议，按需触发不烧 token

## 核心功能

- **截图 OCR 导入** — 百炼 qwen-vl-plus 视觉模型，支持富途 / FirstTrade 持仓页识别，自动推断行业分类
- **实时行情** — Twelve Data（美股主源）+ 腾讯财经（港股 + 兜底），混合策略 8s 超时
- **四维健康度** — 集中度 30% / 行业分散 25% / 波动率 20% / 回撤 25%，0-100 评分
- **AI 智能分析** — 百炼 qwen-plus 组合诊断，持久化缓存 + 持仓变更 stale 标记
- **持仓 CRUD** — 详情页编辑/删除，支持行业手动修正
- **每日快照** — 30 天持仓趋势，本地 SQLite 存储

## 技术栈

| 层面 | 技术 |
|---|---|
| Framework | Expo SDK 56 + React Native 0.85 |
| Router | expo-router (file-based routing) |
| Storage | expo-sqlite (holdings / snapshots / insights) |
| Language | TypeScript strict mode |
| AI Vision | 阿里云百炼 qwen-vl-plus（OCR + 行业推断） |
| AI Text | 阿里云百炼 qwen-plus（组合分析） |
| 行情 | Twelve Data API + 腾讯财经 qt.gtimg.cn |
| UI | 手写 StyleSheet + Design Tokens（绿色主调 #00C851） |

## 架构

```
gainly/
├── app/                          # expo-router 页面
│   ├── _layout.tsx               # Tab 导航（总览 / 持仓 / 设置）
│   ├── index.tsx                 # 总览：Hero 资产卡 + AI 分析 + Top 5
│   ├── holdings/
│   │   ├── _layout.tsx           # Holdings Stack
│   │   ├── index.tsx             # 持仓列表 + 健康度 + 排序 + CRUD Modal
│   │   └── [symbol].tsx          # 个股详情（自渲 NavBar + Hero + Cards）
│   ├── import/index.tsx          # 截图 / 拍照导入
│   └── settings/index.tsx        # 设置（数据同步 / 关于 / 危险操作）
├── src/
│   ├── data/
│   │   ├── storage.ts            # SQLite 建表 + CRUD + AI 缓存
│   │   ├── market-api.ts         # 混合行情（Twelve Data + 腾讯）
│   │   ├── ocr-service.ts        # 百炼 VL 截图识别
│   │   ├── ai-service.ts         # 百炼组合分析
│   │   ├── insight-service.ts    # AI 策略标签
│   │   └── sector-map.ts         # 230+ 条行业映射 + normalizeSector
│   ├── domain/
│   │   ├── health-score.ts       # 四维健康度算法
│   │   ├── portfolio-calculator.ts
│   │   └── types.ts
│   ├── hooks/
│   │   ├── use-portfolio.ts      # 核心 hook（loadData / refresh / CRUD）
│   │   ├── use-holding-insights.ts
│   │   └── use-daily-sync.ts
│   ├── components/
│   │   └── portfolio/
│   │       ├── HoldingRow.tsx
│   │       └── HoldingFormModal.tsx
│   ├── theme/tokens.ts           # Design System tokens
│   └── utils/formatters.ts       # 金额/百分比/日期格式化
├── DESIGN_SYSTEM.md              # UI 设计规范
├── PRD.md                        # 产品需求文档
├── CODE_INDEX.md                 # 代码索引
└── AGENTS.md                     # Agent 协作约定
```

## 数据流

```
┌─────────────┐    ┌──────────────┐    ┌───────────────┐
│  截图 OCR    │───▶│  SQLite 持仓  │◀──▶│  手动 CRUD     │
│  (qwen-vl)  │    │  (holdings)  │    │  (Modal)      │
└─────────────┘    └──────┬───────┘    └───────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
      ┌──────────┐ ┌──────────┐ ┌──────────┐
      │  行情刷新  │ │  健康度   │ │  AI 分析  │
      │  (网络)   │ │  (本地)   │ │  (按需)   │
      └──────────┘ └──────────┘ └──────────┘
```

**三类操作心智模型：**

- **本地**：loadData 读 SQLite，无网络，切 Tab 触发
- **网络**：refresh 拉实时行情，8s 超时，下拉刷新触发
- **AI**：triggerAI 跑组合分析，5-10s，持久化结果，持仓变更才标记过期

## 健康度算法

总分 = 集中度(30%) + 行业分散(25%) + 波动率(20%) + 回撤(25%)

- **集中度**：单一持仓占比 ≤20% 满分；>40% 为 0 分
- **行业分散**：覆盖 ≥6 个 GICS 行业满分；HHI 加权
- **波动率**：组合年化标准差 ≤15% 满分；>40% 为 0 分
- **回撤**：从最高点回撤 ≤5% 满分；>30% 为 0 分

## 快速开始

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入百炼 API Key 和 Twelve Data API Key

# 启动开发（模拟器）
npx expo start --port 19000

# 真机 Release 构建（USB 连接 iPhone）
npx expo run:ios --device "YOUR_UDID" --configuration Release
```

## 环境变量

| 变量 | 用途 | 获取方式 |
|---|---|---|
| EXPO_PUBLIC_BAILIAN_API_KEY | 百炼 OCR + AI 分析 | [百炼控制台](https://bailian.console.aliyun.com/) |
| EXPO_PUBLIC_TWELVEDATA_API_KEY | 美股实时行情 | [Twelve Data](https://twelvedata.com/) |

## License

MIT © 2026 chuehjen
