import React, { useState } from 'react';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

export default function AuthNavigator() {
  const [currentScreen, setCurrentScreen] = useState<'Login' | 'Register' | 'ResetPassword'>('Login');

  const navigation = {
    navigate: (screen: 'Login' | 'Register' | 'ResetPassword') => setCurrentScreen(screen),
    goBack: () => setCurrentScreen('Login'),
  };

  if (currentScreen === 'Login') {
    return <LoginScreen navigation={navigation} />;
  } else if (currentScreen === 'Register') {
    return <RegisterScreen navigation={navigation} />;
  } else {
    return <ResetPasswordScreen navigation={navigation} />;
  }
}
