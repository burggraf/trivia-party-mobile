import React from 'react';
import CustomNavigator from './CustomNavigator';
import HostHomeScreen from '../screens/host/HostHomeScreen';
import CreatePartyScreen from '../screens/host/CreatePartyScreen';
import PartySetupScreen from '../screens/host/PartySetupScreen';
import HostPartyScreen from '../screens/host/HostPartyScreen';
import EnhancedLeaderboardScreen from '../screens/host/EnhancedLeaderboardScreen';

export type HostStackParamList = {
  HostHome: undefined;
  CreateParty: undefined;
  PartySetup: { partyId: string };
  HostParty: { partyId: string };
  EnhancedLeaderboard: { partyId: string };
};

const routes = [
  { name: 'HostHome', component: HostHomeScreen, title: 'Host Dashboard' },
  { name: 'CreateParty', component: CreatePartyScreen, title: 'Create Party' },
  { name: 'PartySetup', component: PartySetupScreen, title: 'Party Setup' },
  { name: 'HostParty', component: HostPartyScreen, title: 'Host Party' },
  { name: 'EnhancedLeaderboard', component: EnhancedLeaderboardScreen, title: 'Enhanced Leaderboard' },
];

export default function HostNavigator() {
  return (
    <CustomNavigator
      routes={routes}
      initialRouteName="HostHome"
      headerStyle={{ backgroundColor: '#6366f1' }}
      headerTintColor="white"
    />
  );
}
