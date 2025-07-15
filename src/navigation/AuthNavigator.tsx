import React, { useState } from 'react';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

export default function AuthNavigator() {
  const [currentScreen, setCurrentScreen] = useState<'Login' | 'Register'>('Login');

  const navigation = {
    navigate: (screen: 'Login' | 'Register') => setCurrentScreen(screen),
  };

  if (currentScreen === 'Login') {
    return <LoginScreen navigation={navigation} />;
  } else {
    return <RegisterScreen navigation={navigation} />;
  }
}
