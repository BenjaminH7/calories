import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useIsDark } from '@/hooks/use-theme';

export default function AddLayout() {
  const isDark = useIsDark();
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
