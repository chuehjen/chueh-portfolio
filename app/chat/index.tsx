import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { EmptyState } from '../../src/components/ui/EmptyState';

export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <EmptyState
        title="AI 投顾即将上线"
        description="未来你可以直接与 AI 对话，分析持仓风险、获取调仓建议、回答个股问题"
      />
      <View style={styles.features}>
        <Feature icon="🔍" text="分析持仓风险，发现隐藏问题" />
        <Feature icon="💡" text="智能调仓建议，优化组合结构" />
        <Feature icon="📊" text="个股基本面快速查询" />
        <Feature icon="📅" text="每日投资简报，跟踪市场动态" />
      </View>
    </View>
  );
}

function Feature({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    paddingTop: 40,
  },
  features: {
    width: '100%',
    paddingHorizontal: 32,
    gap: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureText: {
    fontSize: 15,
    color: '#475569',
  },
});
