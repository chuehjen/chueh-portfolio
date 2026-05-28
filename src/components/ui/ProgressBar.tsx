import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  score: number;
  size?: number;
  showLabel?: boolean;
}

export function ProgressBar({ score, size = 80, showLabel = false }: Props) {
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
  const circumference = Math.PI * size;
  const progress = (score / 100) * circumference;

  return (
    <View style={styles.container}>
      <View style={{ width: size, height: size / 2, overflow: 'hidden' }}>
        <View
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: 'transparent',
              borderWidth: 6,
              borderColor: '#E2E8F0',
            },
          ]}
        >
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: size / 2,
              overflow: 'hidden',
            }}
          />
        </View>
      </View>
      <View style={[styles.scoreContainer, { width: size }]}>
        <Text style={[styles.score, { color }]}>{score}</Text>
      </View>
      {showLabel && (
        <Text style={styles.label}>
          {score >= 70 ? '良好' : score >= 40 ? '关注' : '风险'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    position: 'absolute',
  },
  score: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
  },
  label: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  ring: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
