// CHUEH Portfolio Design Tokens — see DESIGN_SYSTEM.md
// 所有 UI 必须使用这里的 token，禁止在组件中硬编码 hex / fontSize / spacing

export const color = {
  brand: {
    primary: '#00C851',
    primaryDim: '#00C85112',
    primarySoft: '#00C8511A',
    danger: '#FF5252',
    dangerDim: '#FF525212',
    dangerSoft: '#FF52521A',
    warning: '#FFB300',
    warningDim: '#FFB30012',
  },
  text: {
    primary: '#1A1A2E',
    secondary: '#8E8EA0',
    tertiary: '#B0B0C0',
    onPrimary: '#FFFFFF',
  },
  bg: {
    app: '#FAFBFE',
    card: '#FFFFFF',
    surface: '#F8FAFC',
    subtle: '#F0F0F5',
  },
  border: {
    default: '#F0F0F5',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
} as const;

export const font = {
  display: { fontSize: 42, fontWeight: '800' as const, lineHeight: 50 },
  title: { fontSize: 28, fontWeight: '800' as const, lineHeight: 36 },
  h1: { fontSize: 20, fontWeight: '800' as const, lineHeight: 28 },
  h2: { fontSize: 17, fontWeight: '700' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  bodyRegular: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  captionReg: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  tag: { fontSize: 12, fontWeight: '700' as const, lineHeight: 16 },
  tiny: { fontSize: 11, fontWeight: '600' as const, lineHeight: 14 },
} as const;

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  elevated: {
    shadowColor: '#00C851',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
} as const;

// 语义化映射
export const semantic = {
  /** 根据数值返回盈亏颜色 */
  pnlColor: (v: number) => (v > 0 ? color.brand.primary : v < 0 ? color.brand.danger : color.text.secondary),
  /** 根据数值返回药丸背景 */
  pnlPillBg: (v: number) => (v > 0 ? color.brand.primaryDim : v < 0 ? color.brand.dangerDim : color.bg.subtle),
  /** 健康分档色 */
  scoreColor: (s: number) => (s >= 70 ? color.brand.primary : s >= 40 ? color.brand.warning : color.brand.danger),
  /** 等宽数字 */
  numberStyle: { fontVariant: ['tabular-nums'] } as { fontVariant: ['tabular-nums'] },
};

export const tokens = { color, spacing, radius, font, shadow, semantic };
