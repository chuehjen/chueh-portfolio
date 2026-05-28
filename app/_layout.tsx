import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';

function ImportHeaderButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={{ backgroundColor: '#00C851', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginRight: 16 }}
      onPress={() => router.push('/import')}
    >
      <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>+ 导入</Text>
    </TouchableOpacity>
  );
}

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF', shadowOpacity: 0 },
        headerTintColor: '#1A1A2E',
        headerTitleStyle: { fontWeight: '700', fontSize: 17 },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F0F0F5',
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 34 : 8,
          paddingTop: 10,
        },
        tabBarShowLabel: true,
        tabBarIconStyle: { display: 'none' },
        tabBarLabelStyle: { fontSize: 15, fontWeight: '700' },
        tabBarActiveTintColor: '#00C851',
        tabBarInactiveTintColor: '#B0B0C0',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '总览',
          headerRight: () => <ImportHeaderButton />,
        }}
      />
      <Tabs.Screen
        name="holdings"
        options={{
          title: '持仓',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '设置',
        }}
      />
      <Tabs.Screen name="import" options={{ href: null, title: '导入持仓', headerShown: true }} />
      <Tabs.Screen name="health" options={{ href: null }} />
      <Tabs.Screen name="chat" options={{ href: null }} />
    </Tabs>
  );
}
