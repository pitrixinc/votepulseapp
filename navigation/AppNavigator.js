import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';

import VoterDashboard from '../screens/voter/VoterDashboard';
import ElectionsDiscovery from '../screens/voter/ElectionsDiscovery'

import AdminDashboard from '../screens/admin/AdminDashboard';


const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Onboarding">
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }} 
       // options={{ title: 'Login' }}
      />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
      {/* Voter Portal */}
      <Stack.Screen name="VoterDashboard" component={VoterDashboard} options={{ headerShown: false }} />
      <Stack.Screen name="ElectionsDiscovery" component={ElectionsDiscovery} options={{ headerShown: true }} />
      
      {/* Admin Portal */}
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
