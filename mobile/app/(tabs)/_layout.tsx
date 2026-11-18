import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../../src/constants';
import { useAuth } from '../../src/context/AuthContext';
import { Platform, TouchableOpacity, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isAccountant = user?.role === 'accountant';
  const isStaff = user?.role === 'delivery_staff';
  // parcels & deliveries tabs: visible to admin, manager, accountant
  const canSeeParcels = isAdmin || isManager || isAccountant;

  const isWeb = Platform.OS === 'web';
  const isIos = Platform.OS === 'ios';
  const bottomInset = insets.bottom > 0 ? insets.bottom : (isIos ? 20 : 8);
  const tabHeight = isWeb ? 64 : ((isIos ? 52 : 54) + bottomInset);

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
          height: tabHeight,
          paddingBottom: isWeb ? 6 : bottomInset,
          paddingTop: isWeb ? 4 : 6,
          elevation: 0,
          shadowOpacity: 0,
          shadowRadius: 0,
          shadowOffset: { width: 0, height: 0 },
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 2,
        },
        tabBarLabel: ({ color, children }) => (
          <Text
            style={{
              color,
              fontSize: 10,
              fontWeight: '600',
              fontFamily: FONTS.semiBold,
              textAlign: 'center',
              lineHeight: 14,
              paddingBottom: 2,
              overflow: 'visible',
              textDecorationLine: 'none',
              ...(isWeb ? { userSelect: 'none' } : {}),
            }}
          >
            {children}
          </Text>
        ),
        // Strip href from tab button to remove Android underline
        tabBarButton: (props) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { href: _href, ...rest } = props as any;
          return (
            <TouchableOpacity
              {...rest}
              activeOpacity={0.7}
              style={[
                rest.style,
                {
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...(isWeb ? { cursor: 'pointer', outline: 'none' } : {}),
                },
              ]}
            />
          );
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ဒက်ရှ်ဘုတ်',
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid" size={20} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="parcels"
        options={{
          title: 'ပါဆယ်များ',
          tabBarButton: canSeeParcels ? undefined : () => null,
          tabBarItemStyle: canSeeParcels ? undefined : { display: 'none' },
          tabBarIcon: ({ color }) => (
            <Ionicons name="cube" size={20} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="daily-summary"
        options={{
          title: 'နေ့စဉ်',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="monthly-summary"
        options={{
          title: 'လစဉ်',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: 'ဖောက်သည်',
          tabBarButton: canSeeParcels ? undefined : () => null,
          tabBarItemStyle: canSeeParcels ? undefined : { display: 'none' },
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={20} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-assignments"
        options={{
          title: 'ကျွန်ုပ်၏လုပ်ငန်းများ',
          tabBarButton: isStaff ? undefined : () => null,
          tabBarItemStyle: isStaff ? undefined : { display: 'none' },
          tabBarIcon: ({ color }) => (
            <Ionicons name="bicycle" size={20} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="deliveries"
        options={{
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="assign-staff"
        options={{
          title: 'ချိတ်ဆက်ထားသောဝန်ထမ်း',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'အသုံးပြုသူ',
          tabBarButton: () => null,
          tabBarItemStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'ပရိုဖိုင်',
          tabBarButton: isStaff ? undefined : () => null,
          tabBarItemStyle: isStaff ? undefined : { display: 'none' },
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" size={20} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'မီနူး',
          tabBarButton: isStaff ? () => null : undefined,
          tabBarItemStyle: isStaff ? { display: 'none' } : undefined,
          tabBarIcon: ({ color }) => (
            <Ionicons name="menu" size={20} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}