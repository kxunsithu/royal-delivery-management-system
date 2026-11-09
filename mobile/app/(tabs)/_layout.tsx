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
  const tabHeight = isWeb ? 72 : ((isIos ? 56 : 58) + bottomInset);

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
          paddingBottom: isWeb ? 8 : bottomInset,
          paddingTop: isWeb ? 6 : 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 1,
        },
        tabBarLabel: ({ color, children }) => (
          <Text
            style={{
              color,
              fontSize: 10.5,
              fontWeight: '600',
              fontFamily: FONTS.semiBold,
              textAlign: 'center',
              lineHeight: 18,
              paddingBottom: 3,
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="parcels"
        options={{
          title: 'ပါဆယ်များ',
          href: canSeeParcels ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-assignments"
        options={{
          title: 'ကျွန်ုပ်၏လုပ်ငန်းများ',
          href: isStaff ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bicycle" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="deliveries"
        options={{
          title: 'ပို့ဆောင်မှု',
          href: canSeeParcels ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'အသုံးပြုသူ',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'ပရိုဖိုင်',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}