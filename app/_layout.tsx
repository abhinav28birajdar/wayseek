import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import HomeScreen from './Bottommenu/HomeScreen';
import BookScreen from './Bottommenu/BookScreen';
import CameraScreen from './Bottommenu/CameraScreen';
import AccountScreen from './Bottommenu/AccountScreen';
import HelpScreen from './Bottommenu/HelpScreen';

SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  // Ensure the correct path to the font file
  const [loaded] = useFonts({
    SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  const iconColor = colorScheme === 'light' ? 'white' : 'white';

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Tab.Navigator>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: () => <Icon size={24} name="home" color={iconColor} />,
          }}
        />
        <Tab.Screen
          name="file"
          component={BookScreen}
          options={{
            tabBarIcon: () => <Icon size={24} name="file" color={iconColor} />,
          }}
        />
        <Tab.Screen
          name="Camera"
          component={CameraScreen}
          options={{
            title: 'Explore',
            tabBarIcon: () => <Icon size={28} name="camera" color={iconColor} />,
          }}
        />
        <Tab.Screen
          name="Account"
          component={AccountScreen}
          options={{
            tabBarIcon: () => <Icon size={24} name="user" color={iconColor} />,
          }}
        />
        <Tab.Screen
          name="Help"
          component={HelpScreen}
          options={{
            tabBarIcon: () => <Icon size={24} name="question-circle" color={iconColor} />,
          }}
        />
      </Tab.Navigator>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
