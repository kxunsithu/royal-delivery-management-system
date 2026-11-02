import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';
import { View, Text, ActivityIndicator } from 'react-native';
import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/main/DashboardScreen';
import ParcelsScreen from '../screens/parcels/ParcelsScreen';
import ParcelDetailScreen from '../screens/parcels/ParcelDetailScreen';
import RegisterParcelScreen from '../screens/parcels/RegisterParcelScreen';
import EditParcelScreen from '../screens/parcels/EditParcelScreen';
import DeliveriesScreen from '../screens/deliveries/DeliveriesScreen';
import MyAssignmentsScreen from '../screens/deliveries/MyAssignmentsScreen';
import AssignmentDetailScreen from '../screens/deliveries/AssignmentDetailScreen';
import RecordAttemptScreen from '../screens/deliveries/RecordAttemptScreen';
import UsersScreen from '../screens/users/UsersScreen';
import UserDetailScreen from '../screens/users/UserDetailScreen';
import CreateUserScreen from '../screens/users/CreateUserScreen';
import EditUserScreen from '../screens/users/EditUserScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import MoreScreen from '../screens/main/MoreScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function MainTabs() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const isManager = hasRole('manager');
  const isStaff = hasRole('delivery_staff');
  const canManageParcels = isAdmin || isManager;

  return (
    <Tabs.Navigator>
      <Tabs.Screen name="Dashboard" component={DashboardScreen} />
      {canManageParcels && <Tabs.Screen name="Parcels" component={ParcelsScreen} />}
      {canManageParcels && <Tabs.Screen name="Deliveries" component={DeliveriesScreen} />}
      {isStaff && <Tabs.Screen name="MyAssignments" component={MyAssignmentsScreen} options={{ title: 'My Assignments' }} />}
      <Tabs.Screen name="More" component={MoreScreen} />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack.Navigator>
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="ParcelDetail" component={ParcelDetailScreen} options={{ title: 'Parcel' }} />
          <Stack.Screen name="RegisterParcel" component={RegisterParcelScreen} options={{ title: 'Register Parcel' }} />
          <Stack.Screen name="EditParcel" component={EditParcelScreen} options={{ title: 'Edit Parcel' }} />
          <Stack.Screen name="AssignmentDetail" component={AssignmentDetailScreen} options={{ title: 'Delivery' }} />
          <Stack.Screen name="RecordAttempt" component={RecordAttemptScreen} options={{ title: 'Record Attempt' }} />
          <Stack.Screen name="Users" component={UsersScreen} />
          <Stack.Screen name="UserDetail" component={UserDetailScreen} options={{ title: 'User' }} />
          <Stack.Screen name="CreateUser" component={CreateUserScreen} options={{ title: 'Create User' }} />
          <Stack.Screen name="EditUser" component={EditUserScreen} options={{ title: 'Edit User' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
