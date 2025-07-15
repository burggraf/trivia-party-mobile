import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Route {
  name: string;
  component: React.ComponentType<any>;
  title: string;
  headerShown?: boolean;
}

interface CustomNavigatorProps {
  routes: Route[];
  initialRouteName: string;
  screenProps?: any;
  headerStyle?: {
    backgroundColor?: string;
  };
  headerTintColor?: string;
}

export default function CustomNavigator({
  routes,
  initialRouteName,
  screenProps = {},
  headerStyle = { backgroundColor: '#6366f1' },
  headerTintColor = 'white',
}: CustomNavigatorProps) {
  const [currentRoute, setCurrentRoute] = useState(initialRouteName);
  const [routeHistory, setRouteHistory] = useState<string[]>([initialRouteName]);
  const [routeParams, setRouteParams] = useState<{ [key: string]: any }>({});

  const navigation = {
    navigate: (routeName: string, params?: any) => {
      console.log('🚨 NAVIGATION CALLED:', routeName, params);
      setCurrentRoute(routeName);
      setRouteHistory(prev => [...prev, routeName]);
      if (params) {
        setRouteParams(prev => ({ ...prev, [routeName]: params }));
      }
    },
    goBack: () => {
      if (routeHistory.length > 1) {
        const newHistory = routeHistory.slice(0, -1);
        setRouteHistory(newHistory);
        setCurrentRoute(newHistory[newHistory.length - 1]);
      }
    },
    canGoBack: () => routeHistory.length > 1,
  };

  const currentRouteConfig = routes.find(route => route.name === currentRoute);
  const CurrentComponent = currentRouteConfig?.component;

  if (!CurrentComponent) {
    return <Text>Route not found: {currentRoute}</Text>;
  }

  const showHeader = currentRouteConfig.headerShown !== false;

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={[styles.header, headerStyle]}>
          <View style={styles.headerContent}>
            {navigation.canGoBack() && (
              <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={headerTintColor} />
              </TouchableOpacity>
            )}
            <Text style={[styles.headerTitle, { color: headerTintColor }]}>
              {currentRouteConfig.title}
            </Text>
            <View style={styles.headerRight} />
          </View>
        </View>
      )}
      <View style={styles.content}>
        <CurrentComponent 
          navigation={navigation} 
          route={{ params: routeParams[currentRoute] || {} }}
          {...screenProps} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 44, // Status bar height
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40, // To balance the back button
  },
  content: {
    flex: 1,
  },
});