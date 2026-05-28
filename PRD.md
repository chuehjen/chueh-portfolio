# CHUEH Portfolio App - PRD & 项目文档

## 项目概述

**名称**: CHUEH Portfolio App
**类型**: iOS 理财持仓追踪 App
**创建时间**: 2026-05-27
**项目路径**: `/Users/zhangjueren/Desktop/CHUEH_ai_agent/chueh-portfolio/`

## 目标用户

散户投资者，同时使用 Futu（富途）和 FirstTrade 两个券商平台，需要一个统一的工具来追踪持仓表现和组合健康度。

## 核心功能

### 1. CSV 手动导入持仓
- 支持 Futu 和 FirstTrade 两种 CSV 格式自动识别
- Futu 格式：支持股票代码（含 .HK/.SH/.SZ 后缀）、股票名称、数量、成本价
- FirstTrade 格式：支持 Symbol、Description、Quantity、Cost Basis
- 导入时提供预览，支持合并或替换现有持仓

### 2. 实时行情获取
- 使用 Yahoo Finance API（免费、无 API key）
- 支持美股和港股行情
- 符号自动标准化（如 `00700` → `00700.HK`）

### 3. 健康度评分系统（0-100 分）
四维度加权评分：
- **集中度** (30%): 评估单一持仓权重风险
- **行业分散** (25%): 评估行业覆盖广度
- **波动率** (20%): 基于行业 Beta 计算组合波动
- **回撤** (25%): 评估整体浮亏程度

### 4. 每日快照与趋势分析
- 每日自动记录组合总值、P&L、健康度
- 7 天/30 天趋势对比
- 趋势方向判断（上升/下降/稳定）

### 5. AI-Native 预留架构
- context-export.ts 将持仓序列化为 LLM 友好文本
- 健康度子分数可解释
- 每日快照形成时间序列，未来可接入 AI 投顾

## 技术栈

- **框架**: Expo (React Native + TypeScript)
- **版本**: Expo SDK 56, React 19.2.6, React Native 0.85.3
- **数据库**: expo-sqlite (SQLite)
- **路由**: expo-router
- **样式**: 内联 StyleSheet (NativeWind 已安装但未启用)
- **市场数据**: Yahoo Finance API

## 架构设计

```
chueh-portfolio/
├── app/                    # Expo Router 页面
│   ├── _layout.tsx         # 根布局（Tab 导航）
│   ├── index.tsx           # 首页仪表盘
│   ├── import/index.tsx    # CSV 导入页面
│   ├── holdings/           # 持仓相关页面
│   │   ├── _layout.tsx
│   │   ├── index.tsx       # 持仓列表
│   │   └── [symbol].tsx    # 单只详情
│   ├── health/index.tsx    # 健康度评分详情
│   ├── chat/index.tsx      # AI 对话（预留）
│   └── settings/index.tsx  # 设置页
├── src/
│   ├── data/               # 数据层
│   │   ├── storage.ts      # SQLite CRUD
│   │   ├── market-api.ts   # Yahoo Finance API
│   │   ├── csv-parser.ts   # CSV 解析器
│   │   ├── sector-map.ts   # 行业映射
│   │   └── context-export.ts # AI context 序列化
│   ├── domain/             # 领域逻辑
│   │   ├── types.ts        # 类型定义
│   │   ├── health-score.ts # 健康度评分算法
│   │   └── portfolio-calculator.ts # 持仓计算
│   ├── hooks/              # React Hooks
│   │   ├── use-portfolio.ts
│   │   ├── use-prices.ts
│   │   ├── use-health-score.ts
│   │   └── use-daily-sync.ts
│   ├── components/ui/      # UI 组件
│   │   ├── Card.tsx
│   │   ├── EmptyState.tsx
│   │   ├── HoldingRow.tsx
│   │   ├── MetricRow.tsx
│   │   └── ProgressBar.tsx
│   └── utils/              # 工具函数
│       ├── constants.ts    # 评分权重等常量
│       └── formatters.ts   # 货币/时间格式化
── app.json                # Expo 配置
├── package.json            # 依赖配置
├── tsconfig.json           # TypeScript 配置
└── ios/                    # iOS 原生项目（prebuild 生成）
```

## 数据库设计

### holdings 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| symbol | TEXT | 股票代码 |
| name | TEXT | 股票名称 |
| shares | REAL | 持仓数量 |
| cost_basis | REAL | 成本价 |
| currency | TEXT | 货币（USD/HKD/CNY） |
| sector | TEXT | 行业 |
| imported_at | TEXT | 导入时间 |

### price_snapshots 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 主键 |
| symbol | TEXT | 股票代码 |
| price | REAL | 当前价格 |
| previous_close | REAL | 昨日收盘价 |
| change | REAL | 涨跌额 |
| change_percent | REAL | 涨跌幅 |
| high_52w | REAL | 52周最高 |
| low_52w | REAL | 52周最低 |
| captured_at | TEXT | 抓取时间 |

### daily_portfolio_snapshots 表
| 字段 | 类型 | 说明 |
|------|------|------|
| date | TEXT | 日期（主键） |
| total_value | REAL | 组合总值 |
| total_cost | REAL | 组合成本 |
| total_pnl | REAL | 总盈亏 |
| total_pnl_percent | REAL | 总收益率 |
| health_score | REAL | 健康度评分 |
| holding_count | INTEGER | 持仓数量 |

## 健康度评分算法

### 集中度评分
- 最高持仓 > 50%: 20分
- 最高持仓 > 30%: 50分
- 最高持仓 > 20%: 75分
- 最高持仓 ≤ 20%: 100分
- 前三大持仓 > 80%: -20分惩罚
- 前三大持仓 > 60%: -10分惩罚

### 行业分散评分
- 1 个行业: 25分
- 2 个行业: 50分
- 3 个行业: 70分
- 4 个行业: 85分
- 5+ 个行业: 100分
- 未知行业 > 30%: -10分
- 单一行业 > 60%: -15分

### 波动率评分（基于 Beta）
- |Beta - 1.0| < 0.2: 100分
- |Beta - 1.0| < 0.5: 75分
- |Beta - 1.0| < 0.8: 50分
- 其他: 25分

### 回撤评分
- 盈利: 100分
- 浮亏 < 5%: 85分
- 浮亏 < 10%: 70分
- 浮亏 < 20%: 50分
- 浮亏 < 30%: 30分
- 浮亏 ≥ 30%: 10分

## 当前状态

### 已完成
- ✅ 所有核心代码已编写完成（27 个文件，约 2000 行）
- ✅ TypeScript 编译零错误
- ✅ iOS 原生项目 prebuild 成功
- ✅ 模拟器构建成功（0 错误，0 警告）
- ✅ 6 个 bug 已修复

### 已知问题
1. **Dev Client URL 连接问题**: 模拟器/真机打开 App 后显示 "No script URL provided" 错误，Dev Client 未能正确连接 Metro bundler
2. **端口 8081 被 AliLang 占用**: Expo 默认端口被系统进程占用，需要使用其他端口
3. **iOS scheme 配置**: app.json 中添加了 scheme，但 Dev Client 自动发现功能未生效

### 待修复
- Dev Client 自动发现 Metro 服务器的配置
- 可能需要检查 expo-dev-client 的 iOS 原生配置
- 可能需要手动在 Dev Client 中输入 Metro URL

## 下一步建议

1. 检查 expo-dev-client 是否正确集成到 iOS 项目
2. 确认 Info.plist 中的 URL scheme 配置
3. 尝试手动在 Dev Client 中输入 `http://localhost:<port>`
4. 或考虑使用 Expo Go 代替 Development Build
