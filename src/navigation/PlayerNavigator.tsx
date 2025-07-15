import React from 'react';
import CustomNavigator from './CustomNavigator';
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

const routes = [
  { name: 'PlayerHome', component: PlayerHomeScreen, title: 'Join Game' },
  { name: 'JoinParty', component: JoinPartyScreen, title: 'Join Party' },
  { name: 'QRScanner', component: QRScannerScreen, title: 'Scan QR Code' },
  { name: 'TeamSelection', component: TeamSelectionScreen, title: 'Select Team' },
  { name: 'PlayerGame', component: PlayerPartyScreen, title: 'Playing' },
  { name: 'PlayerParty', component: PlayerPartyScreen, title: 'Playing' },
];

export default function PlayerNavigator() {
  return (
    <CustomNavigator
      routes={routes}
      initialRouteName="PlayerHome"
      headerStyle={{ backgroundColor: '#10b981' }}
      headerTintColor="white"
    />
  );
}
