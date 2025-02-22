import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import HomeScreen from '@/app/Bottommenu/HomeScreen';
import BookScreen from '@/app/Bottommenu/BookScreen';
import CameraScreen from '@/app/Bottommenu/CameraScreen';
import AccountScreen from '@/app/Bottommenu/AccountScreen';
import HelpScreen from '@/app/Bottommenu/HelpScreen';

// Prevent splash screen from auto hiding
SplashScreen.preventAutoHideAsync();

const Tab = createBottomTabNavigator();

export default function HomeLayout() {
  const colorScheme = useColorScheme();

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

  const iconColor = colorScheme === 'dark' ? 'white' : 'black';

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Tab.Navigator>
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: () => <Icon size={24} name="home" color={iconColor} />,
          }}
        />
        <Tab.Screen
          name="Book"
          component={BookScreen}
          options={{
            tabBarIcon: () => <Icon size={24} name="book" color={iconColor} />,
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
