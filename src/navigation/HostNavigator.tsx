import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HostHomeScreen from '../screens/host/HostHomeScreen';
import CreatePartyScreen from '../screens/host/CreatePartyScreen';
import PartySetupScreen from '../screens/host/PartySetupScreen';
import HostPartyScreen from '../screens/host/HostPartyScreen';
import TVDisplayScreen from '../screens/host/TVDisplayScreen';

export type HostStackParamList = {
  HostHome: undefined;
  CreateParty: undefined;
  PartySetup: { partyId: string };
  HostParty: { partyId: string };
  TVDisplay: { partyId: string };
};

const Stack = createStackNavigator<HostStackParamList>();

export default function HostNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="HostHome"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#6366f1',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="HostHome"
        component={HostHomeScreen}
        options={{ title: 'Host Dashboard' }}
      />
      <Stack.Screen
        name="CreateParty"
        component={CreatePartyScreen}
        options={{ title: 'Create Party' }}
      />
      <Stack.Screen
        name="PartySetup"
        component={PartySetupScreen}
        options={{ title: 'Party Setup' }}
      />
      <Stack.Screen
        name="HostParty"
        component={HostPartyScreen}
        options={{ title: 'Host Party' }}
      />
      <Stack.Screen
        name="TVDisplay"
        component={TVDisplayScreen}
        options={{ 
          title: 'TV Display',
          headerShown: false // Hide header for TV display
        }}
      />
    </Stack.Navigator>
  );
}
