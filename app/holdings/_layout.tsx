import { Stack } from 'expo-router';

export default function HoldingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[symbol]" options={{ headerShown: true, title: '持仓详情' }} />
    </Stack>
  );
}
