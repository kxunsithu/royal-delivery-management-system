import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants';
import { useAuth } from '../../src/context/AuthContext';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isStaff = user?.role === 'delivery_staff';
  const isAdminOrManager = isAdmin || isManager;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ဒက်ရှ်ဘုတ်',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color as string} />
          ),
        }}
      />
      {isAdminOrManager && (
        <Tabs.Screen
          name="parcels"
          options={{
            title: 'ပါဆယ်များ',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cube" size={size} color={color as string} />
            ),
          }}
        />
      )}
      {isStaff && (
        <Tabs.Screen
          name="my-assignments"
          options={{
            title: 'ကျွန်ုပ်၏လုပ်ငန်းများ',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bicycle" size={size} color={color as string} />
            ),
          }}
        />
      )}
      {isAdminOrManager && (
        <Tabs.Screen
          name="deliveries"
          options={{
            title: 'ပို့ဆောင်မှုများ',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="car" size={size} color={color as string} />
            ),
          }}
        />
      )}
      {isAdmin && (
        <Tabs.Screen
          name="users"
          options={{
            title: 'အသုံးပြုသူများ',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people" size={size} color={color as string} />
            ),
          }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'ပရိုဖိုင်',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color as string} />
          ),
        }}
      />
      {/* Hidden tabs - accessible but not in tab bar */}
      {!isAdminOrManager && (
        <Tabs.Screen
          name="parcels"
          options={{ href: null }}
        />
      )}
      {!isStaff && (
        <Tabs.Screen
          name="my-assignments"
          options={{ href: null }}
        />
      )}
      {!isAdminOrManager && (
        <Tabs.Screen
          name="deliveries"
          options={{ href: null }}
        />
      )}
      {!isAdmin && (
        <Tabs.Screen
          name="users"
          options={{ href: null }}
        />
      )}
    </Tabs>
  );
}
