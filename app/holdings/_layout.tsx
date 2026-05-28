import { Stack } from 'expo-router';

export default function HoldingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: '持仓列表' }} />
      <Stack.Screen name="[symbol]" options={{ title: '持仓详情' }} />
    </Stack>
  );
}
