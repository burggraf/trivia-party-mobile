import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import PlayerHomeScreen from '../screens/player/PlayerHomeScreen';
import JoinPartyScreen from '../screens/player/JoinPartyScreen';
import QRScannerScreen from '../screens/player/QRScannerScreen';
import TeamSelectionScreen from '../screens/player/TeamSelectionScreen';
import PlayerPartyScreen from '../screens/player/PlayerPartyScreen';

export type PlayerStackParamList = {
  PlayerHome: undefined;
  JoinParty: { joinCode?: string };
  QRScanner: undefined;
  TeamSelection: { partyId: string };
  PlayerGame: { partyId: string; teamId: string };
  PlayerParty: { partyId: string; teamId: string };
};

const Stack = createStackNavigator<PlayerStackParamList>();

export default function PlayerNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="PlayerHome"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#10b981',
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="PlayerHome"
        component={PlayerHomeScreen}
        options={{ title: 'Join Game' }}
      />
      <Stack.Screen
        name="JoinParty"
        component={JoinPartyScreen}
        options={{ title: 'Join Party' }}
      />
      <Stack.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{ title: 'Scan QR Code' }}
      />
      <Stack.Screen
        name="TeamSelection"
        component={TeamSelectionScreen}
        options={{ title: 'Select Team' }}
      />
      <Stack.Screen
        name="PlayerGame"
        component={PlayerPartyScreen}
        options={{ title: 'Playing' }}
      />
      <Stack.Screen
        name="PlayerParty"
        component={PlayerPartyScreen}
        options={{ title: 'Playing' }}
      />
    </Stack.Navigator>
  );
}
