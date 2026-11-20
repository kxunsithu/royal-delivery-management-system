import { useTheme } from '../../src/context/ThemeContext';
import { Redirect } from 'expo-router';
export default function MonthlySummaryScreen() {
  const { colors } = useTheme();
  return <Redirect href="/(tabs)/daily-summary" />;
}
