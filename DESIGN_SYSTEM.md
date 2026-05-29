# CHUEH Portfolio Design System v1.0

> 所有 UI 改动必须严格遵循本文档。新增组件先查规范，规范没有的先讨论再实施。

适用范围：iOS App（Expo SDK 56 + React Native 0.85）。后续暗色模式扩展时另出 v2。

---

## 1. 设计原则

1. **数据优先**：金融场景，数字必须精准、对齐、易扫读。装饰元素让位于信息密度。
2. **绿色赚钱感**：主色为 #00C851（金融绿），盈利绿、亏损红，颜色即语义。
3. **白底为主**：浅色主调，营造专业、清爽的看盘氛围；不做整行染色，仅强调关键数字。
4. **节制的动效**：scale ≤ 1.06，opacity 过渡 ≤ 200ms。绝不做炫技动画。
5. **iOS 原生味**：圆角偏大、阴影柔、底部 Modal、Action Sheet 优先于自定义弹窗。

---

## 2. 色彩系统（Colors）

### 2.1 品牌色

| Token              | Hex       | 用途                                 |
| ------------------ | --------- | ------------------------------------ |
| `brand.primary`    | `#00C851` | 主色 / 盈利 / Active 指示器 / CTA    |
| `brand.primaryDim` | `#00C85112` | 盈利药丸背景（带 7% 透明度）        |
| `brand.danger`     | `#FF5252` | 亏损 / 删除 / 危险操作              |
| `brand.dangerDim`  | `#FF525212` | 亏损药丸背景                        |
| `brand.warning`    | `#FFB300` | 中性提示 / 风险预警                 |

### 2.2 中性色

| Token              | Hex       | 用途                              |
| ------------------ | --------- | --------------------------------- |
| `text.primary`     | `#1A1A2E` | 主文字（标题、关键数字）         |
| `text.secondary`   | `#8E8EA0` | 次要文字（标签、说明）           |
| `text.tertiary`    | `#B0B0C0` | 辅助文字（占位、禁用）           |
| `bg.app`           | `#FAFBFE` | App 整体背景                     |
| `bg.card`          | `#FFFFFF` | 卡片背景                         |
| `bg.surface`       | `#F8FAFC` | 输入框背景 / 内嵌区背景         |
| `bg.subtle`        | `#F0F0F5` | Tab 按钮、分隔条                |
| `border.default`   | `#F0F0F5` | 卡片边框、分隔线                |

### 2.3 语义化映射（**必须使用，禁止硬编码 hex**）

```ts
// 数字着色
profit -> brand.primary
loss   -> brand.danger
flat   -> text.secondary

// 健康分档
score >= 70 -> brand.primary
score >= 40 -> brand.warning
score <  40 -> brand.danger
```

---

## 3. 字体系统（Typography）

iOS 默认 SF Pro。所有字号 + 字重组合如下：

| Token         | Size | Weight | LineHeight | 用途                      |
| ------------- | ---- | ------ | ---------- | ------------------------- |
| `display`     | 42   | 800    | 50         | Hero 大数字（健康度分数） |
| `title`       | 28   | 800    | 36         | Hero 资产数字             |
| `h1`          | 20   | 800    | 28         | 页面主标题                |
| `h2`          | 17   | 700    | 24         | 卡片标题、Header 标题     |
| `body`        | 15   | 600    | 22         | 关键数据 / 输入文字       |
| `bodyRegular` | 15   | 400    | 22         | 正文段落                  |
| `caption`     | 13   | 600    | 18         | 标签、辅助说明（粗）      |
| `captionReg`  | 13   | 400    | 18         | 标签、辅助说明（普通）    |
| `tag`         | 12   | 700    | 16         | 药丸 / Tag 文字           |
| `tiny`        | 11   | 600    | 14         | 极小辅助（占比、单位）    |

**规则**：
- 数字一律用等宽风格（fontVariant: ['tabular-nums']）保证对齐
- 一屏内字号种类不超过 5 种
- 不使用斜体、不使用下划线（除链接）

---

## 4. 间距系统（Spacing）

8 倍数体系：

| Token  | Value | 用途                          |
| ------ | ----- | ----------------------------- |
| `xs`   | 4     | 紧密 inline 间距             |
| `sm`   | 8     | 标签/卡片内组间距            |
| `md`   | 12    | 卡片内主要 padding           |
| `lg`   | 16    | 卡片间距 / 屏幕水平边距      |
| `xl`   | 20    | 卡片内主 padding / 段落间距  |
| `xxl`  | 24    | 大卡片内边距                 |
| `xxxl` | 32    | Section 间距                 |

**屏幕水平 padding 统一 16**，例外需说明。

---

## 5. 圆角与阴影

### 5.1 圆角（Radius）

| Token  | Value | 用途                |
| ------ | ----- | ------------------- |
| `sm`   | 6     | 药丸、小标签        |
| `md`   | 10    | 输入框、按钮        |
| `lg`   | 14    | 持仓行卡片          |
| `xl`   | 18    | 主要卡片（Hero、健康度） |
| `xxl`  | 24    | Modal 顶部圆角      |

### 5.2 阴影（Shadow）

```ts
shadow.card = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.03,
  shadowRadius: 4,
  elevation: 1,
};

shadow.elevated = {
  shadowColor: '#00C851',  // 主要卡片用绿色阴影增加品牌感
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 3,
};
```

仅两档阴影，不引入更多层级。

---

## 6. 组件规范

### 6.1 Tab Bar（已固化）

- 高度 iOS 88 / Android 60
- paddingBottom iOS 34 / Android 8（含安全区）
- paddingTop 10
- 纯文字（**禁止图标**），fontSize 15 / weight 700
- Active 色 `brand.primary`，Inactive 色 `text.tertiary`
- `tabBarShowLabel: true` + `tabBarIconStyle: { display: 'none' }`

### 6.2 持仓行（HoldingRow）—— V2 规范

**布局**（左中右三列）：

```
┌───────────────────────────────────────────────┐
│ AAPL                  $24,500    +$3,200      │
│ Apple Inc                          +15.0%     │
└───────────────────────────────────────────────┘
│ ↑ symbol+name      ↑ 市值      ↑ 损益+收益率 │
│   左对齐 flex:1    中右对齐    最右对齐       │
```

**详细规则**：
- 行内边距 `paddingVertical: 14, paddingHorizontal: 16`
- 行间距 `marginBottom: 8`
- 卡片样式：`bg.card` + `radius.lg` + `shadow.card`
- **左列**：
  - symbol：`body` 大小 / weight 700 / `text.primary`
  - name：`tiny` / `text.secondary` / numberOfLines 1 / 顶部 marginTop 2
  - 下方可选 AI 标签（V2 新增）：`tag` 字号 / 浅绿底 / 圆角 sm
- **中列（市值）**：
  - `body` / weight 600 / `text.primary`
  - 单位/币种用 `tiny` / `text.tertiary` 跟随显示
- **右列（损益）**：
  - 第一行：损益金额 `body` / weight 700 / 盈亏色（绿/红）
  - 第二行：收益率药丸 `tag` / 盈亏色文字 + `Dim` 背景 / 圆角 sm
  - 整体右对齐
- 点击：弹出 ActionSheet（编辑 / 删除 / 取消）
- 不再显示"股数"和"占比%"（编辑表单内可见）

### 6.3 卡片（Card）

- 默认：`bg.card` + `radius.xl` + `padding xl` + `shadow.elevated`
- 列表内嵌卡片：`bg.card` + `radius.lg` + `padding md+lg` + `shadow.card`
- 卡片间距 16，水平 margin 16

### 6.4 药丸（Pill）

```
[ +15.0% ]   绿底绿字   背景 brand.primaryDim 文字 brand.primary
[ -5.2% ]   红底红字   背景 brand.dangerDim 文字 brand.danger
```

- padding：`8 horizontal, 2 vertical`
- 字号 `tag`（12 / 700）
- radius：`sm`（6）

### 6.5 按钮（Button）

| 类型      | 背景             | 文字色             | 用途           |
| --------- | ---------------- | ------------------ | -------------- |
| Primary   | `brand.primary`  | `#FFFFFF`          | 主 CTA、保存   |
| Secondary | `bg.subtle`      | `text.secondary`   | 取消、次要操作 |
| Outline   | 透明 + 1.5 边框  | `brand.primary`    | 备选 CTA       |
| Danger    | `brand.danger`   | `#FFFFFF`          | 删除（少用）   |

- 高度 44（iOS HIG 推荐最小可点）
- radius `md`（10），大按钮用 `lg`（14）
- 字号 `body` / weight 700

### 6.6 输入框（Input）

- 背景 `bg.surface`，边框 `border.default` 1px
- radius `md`（10），padding 12
- 字号 `body`（15）
- placeholder 色 `text.tertiary`
- 聚焦时边框变 `brand.primary`

### 6.7 Modal（底部弹出）

- overlay：`rgba(0,0,0,0.4)`
- 内容容器：白底 + 顶部 radius `xxl`（24）
- padding：水平 24 / 顶部 24 / 底部 40（含安全区）
- 标题：`h1`（20 / 800） + marginBottom 20
- 表单行间距 16
- 底部双按钮：取消（Secondary） + 保存（Primary），flex:1 各占一半，gap 12

---

## 7. 交互规范

### 7.1 点击反馈

- `TouchableOpacity activeOpacity={0.6}` 统一
- 卡片点击：opacity 反馈即可，不做 scale
- 按钮点击：opacity + 可选 scale 1.04（仅主 CTA）

### 7.2 删除确认

**禁止静默删除**。统一用 `Alert.alert` 二次确认：

```
Alert.alert('确认删除', `删除 ${name}?`, [
  { text: '取消', style: 'cancel' },
  { text: '删除', style: 'destructive', onPress: ... },
]);
```

### 7.3 操作菜单

列表行操作走 ActionSheet 模式（`Alert.alert` 多按钮）：

```
点击行 → 弹出 [编辑 / 删除 / 取消]
```

不使用 swipe-to-delete（手势识别不一致），不使用长按（不直觉）。

### 7.4 加载与空态

- 加载中：`ActivityIndicator` + `brand.primary` 着色
- 空态：居中布局，14 字号灰色文字 + 主 CTA 按钮
- 网络错误：底部 Toast 或 Alert，禁止整页错误

### 7.5 刷新

- iOS pull-to-refresh：`RefreshControl tintColor={brand.primary}`
- 不引入第三方下拉组件

---

## 8. 页面布局规范

### 8.1 通用页面结构

```
[ Tab Header ]            ← 系统级，bg.card + 17px 700
[ Header Right Action ]   ← 可选，绿色小按钮
─────────────────────────
[ ScrollView / FlatList ]
  bg.app
  contentContainer paddingBottom 32
  各 section 间隔 16
─────────────────────────
[ Tab Bar ]
```

### 8.2 首页（总览）

1. Hero 资产卡（总市值 + 总盈亏 + 收益率）—— 已敲定不改
2. 健康度紧凑卡（4 维评分）
3. 持仓 Top 5（点击跳详情）
4. ~~截图导入入口卡~~（已移除）

### 8.3 持仓页

1. 健康度卡（沿用首页样式，简版）
2. SortBar（市值 / 盈亏 / 名称 + 添加按钮）
3. 持仓行列表（V2 双行布局）

### 8.4 持仓详情页（[symbol].tsx）

1. 基本信息（symbol + name + 当前价）
2. 持仓数据（股数 / 成本 / 市值 / 盈亏）
3. 走势图（保留）
4. AI 策略标签 + 解读（V2 新增）
5. 相关新闻（V2 新增）

---

## 9. 命名约定

- 文件名：kebab-case（`holding-row.tsx`）
- 组件名：PascalCase（`HoldingRow`）
- 变量/函数：camelCase
- 常量：SCREAMING_SNAKE_CASE
- 颜色 token 引用：`tokens.color.brand.primary`
- 间距 token：`tokens.spacing.lg`

---

## 10. 实施检查清单

每个 UI PR 提交前自检：

- [ ] 没有硬编码 hex（除 token 文件外）
- [ ] 没有硬编码 fontSize / spacing 数字（用 token）
- [ ] 字体不超过 5 种字号
- [ ] 数字使用 `tabular-nums` fontVariant
- [ ] 圆角使用 token 体系
- [ ] 阴影只用 card / elevated 两档
- [ ] 按钮高度 ≥ 44
- [ ] 删除操作有二次确认
- [ ] 列表卡片点击反馈用 opacity
- [ ] 屏幕水平 padding = 16

---

## 11. 版本记录

- v1.0 (2026-05-29)：初版，覆盖色彩/字体/间距/组件/交互/页面布局规范
