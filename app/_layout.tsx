import { Tabs } from 'expo-router';
import React from 'react';

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
          height: 50,
          paddingTop: 12,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#00C851',
        tabBarInactiveTintColor: '#B0B0C0',
        tabBarLabelStyle: { fontSize: 14, fontWeight: '700' },
        tabBarIconStyle: { display: 'none' },
        tabBarIcon: () => null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '总览',
          tabBarLabel: '总览',
        }}
      />
      <Tabs.Screen
        name="holdings"
        options={{
          title: '持仓',
          tabBarLabel: '持仓',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '设置',
          tabBarLabel: '设置',
        }}
      />
      <Tabs.Screen name="import" options={{ href: null, title: '导入持仓', headerShown: true }} />
      <Tabs.Screen name="health" options={{ href: null }} />
      <Tabs.Screen name="chat" options={{ href: null }} />
    </Tabs>
  );
}
