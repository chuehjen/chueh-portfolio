# CHUEH Portfolio App - 代码索引

## 项目根目录
```
/Users/zhangjueren/Desktop/CHUEH_ai_agent/chueh-portfolio/
```

## 核心源文件列表

### 页面 (app/)
| 文件 | 说明 |
|------|------|
| `app/_layout.tsx` | 根布局，Tab 导航配置 |
| `app/index.tsx` | 首页仪表盘 |
| `app/import/index.tsx` | CSV 导入页面 |
| `app/holdings/_layout.tsx` | 持仓页面布局 |
| `app/holdings/index.tsx` | 持仓列表 |
| `app/holdings/[symbol].tsx` | 单只持仓详情 |
| `app/health/index.tsx` | 健康度评分页面 |
| `app/chat/index.tsx` | AI 对话（预留） |
| `app/settings/index.tsx` | 设置页面 |

### 数据层 (src/data/)
| 文件 | 说明 |
|------|------|
| `src/data/storage.ts` | SQLite 数据库操作 |
| `src/data/market-api.ts` | Yahoo Finance API 封装 |
| `src/data/csv-parser.ts` | CSV 解析（Futu/FirstTrade） |
| `src/data/sector-map.ts` | 股票代码→行业映射 |
| `src/data/context-export.ts` | AI context 序列化 |

### 领域逻辑 (src/domain/)
| 文件 | 说明 |
|------|------|
| `src/domain/types.ts` | TypeScript 类型定义 |
| `src/domain/health-score.ts` | 健康度评分算法 |
| `src/domain/portfolio-calculator.ts` | 持仓计算逻辑 |

### Hooks (src/hooks/)
| 文件 | 说明 |
|------|------|
| `src/hooks/use-portfolio.ts` | 持仓管理 hook |
| `src/hooks/use-prices.ts` | 行情获取 hook |
| `src/hooks/use-health-score.ts` | 健康度评分 hook |
| `src/hooks/use-daily-sync.ts` | 每日同步 hook |

### UI 组件 (src/components/ui/)
| 文件 | 说明 |
|------|------|
| `src/components/ui/Card.tsx` | 卡片组件 |
| `src/components/ui/EmptyState.tsx` | 空状态组件 |
| `src/components/ui/HoldingRow.tsx` | 持仓行组件 |
| `src/components/ui/MetricRow.tsx` | 指标行组件 |
| `src/components/ui/ProgressBar.tsx` | 进度条组件 |

### 工具函数 (src/utils/)
| 文件 | 说明 |
|------|------|
| `src/utils/constants.ts` | 评分权重、货币符号、Beta 值 |
| `src/utils/formatters.ts` | 货币/百分比/时间格式化 |

### 配置文件
| 文件 | 说明 |
|------|------|
| `app.json` | Expo 配置 |
| `package.json` | 依赖配置 |
| `tsconfig.json` | TypeScript 配置 |
| `index.ts` | 入口文件 |
| `App.tsx` | 应用根组件 |

## 文档
| 文件 | 说明 |
|------|------|
| `PRD.md` | 产品需求文档 |
| `CODE_INDEX.md` | 本文件 |

## 注意事项
1. `chueh-portfolio/chueh-portfolio/` 是冗余嵌套目录，可忽略
2. `ios/` 目录是 prebuild 生成的原生代码，可重新生成
3. 代码修复记录见 PRD.md 的"已知问题"章节
