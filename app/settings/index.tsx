import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useDailySync } from '../../src/hooks/use-daily-sync';
import { usePortfolio } from '../../src/hooks/use-portfolio';
import { Card } from '../../src/components/ui/Card';
import { MetricRow } from '../../src/components/ui/MetricRow';
import { clearAllHoldings } from '../../src/data/storage';
import { formatLastUpdate } from '../../src/utils/formatters';

export default function SettingsScreen() {
  const { lastSync, syncInProgress, triggerSync } = useDailySync();
  const { holdings, loadData } = usePortfolio();

  const handleClearData = () => {
    Alert.alert(
      '清除所有数据',
      '这将删除所有持仓和价格记录，无法恢复',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确认清除',
          style: 'destructive',
          onPress: async () => {
            await clearAllHoldings();
            await loadData();
            Alert.alert('已清除', '所有数据已清除');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>设置</Text>

      {/* Sync */}
      <Card>
        <Text style={styles.sectionTitle}>数据同步</Text>
        <MetricRow
          label="上次同步"
          value={formatLastUpdate(lastSync)}
        />
        <TouchableOpacity
          style={[
            styles.syncButton,
            syncInProgress && styles.syncButtonDisabled,
          ]}
          onPress={triggerSync}
          disabled={syncInProgress}
        >
          <Text style={styles.syncButtonText}>
            {syncInProgress ? '同步中...' : '立即同步'}
          </Text>
        </TouchableOpacity>
      </Card>

      {/* Data */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>数据管理</Text>
        <MetricRow
          label="持仓数量"
          value={holdings.length.toString()}
        />
        <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
          <Text style={styles.dangerButtonText}>清除所有数据</Text>
        </TouchableOpacity>
      </Card>

      {/* About */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>关于</Text>
        <MetricRow label="版本" value="1.0.0" />
        <MetricRow label="数据源" value="Yahoo Finance" />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 12,
  },
  card: {},
  syncButton: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  syncButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  dangerButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
