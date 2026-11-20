import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, RADIUS } from '../../src/constants';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { Platform, TouchableOpacity, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ name, color, focused }: { name: IconName; color: any; focused: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: 42,
        height: 28,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? colors.primaryBg : 'transparent',
      }}
    >
      <Ionicons name={name} size={21} color={color} />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isAccountant = user?.role === 'accountant';
  const isStaff = user?.role === 'delivery_staff';
  // parcels & deliveries tabs: visible to admin, manager, accountant
  const canSeeParcels = isAdmin || isManager || isAccountant;

  const isWeb = Platform.OS === 'web';
  const isIos = Platform.OS === 'ios';
  const bottomInset = insets.bottom > 0 ? insets.bottom : (isIos ? 20 : 8);
  const tabHeight = isWeb ? 66 : ((isIos ? 54 : 56) + bottomInset);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: isWeb ? 6 : bottomInset,
          paddingTop: isWeb ? 4 : 8,
          elevation: 0,
          shadowColor: '#0F172A',
          shadowOpacity: 0.04,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarItemStyle: {
          paddingVertical: 2,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 3,
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
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'grid' : 'grid-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="parcels"
        options={{
          title: 'ပါဆယ်များ',
          tabBarButton: canSeeParcels ? undefined : () => null,
          tabBarItemStyle: canSeeParcels ? undefined : { display: 'none' },
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'cube' : 'cube-outline'} color={color} focused={focused} />
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
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'people' : 'people-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-assignments"
        options={{
          title: 'ကျွန်ုပ်၏လုပ်ငန်းများ',
          tabBarButton: isStaff ? undefined : () => null,
          tabBarItemStyle: isStaff ? undefined : { display: 'none' },
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'bicycle' : 'bicycle-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="deliveries"
        options={{
          title: 'ပို့ဆောင်မှုများ',
          tabBarButton: isStaff ? undefined : () => null,
          tabBarItemStyle: isStaff ? undefined : { display: 'none' },
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'car' : 'car-outline'} color={color} focused={focused} />
          ),
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
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'person-circle' : 'person-circle-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'မီနူး',
          tabBarButton: isStaff ? () => null : undefined,
          tabBarItemStyle: isStaff ? { display: 'none' } : undefined,
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'menu' : 'menu-outline'} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
