
import React from 'react';
import { Stack } from 'expo-router';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';

export default function TabLayout() {
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)/',
      icon: 'home',
      label: 'Home',
    },
    {
      name: 'tracker',
      route: '/(tabs)/tracker',
      icon: 'eco',
      label: 'Log',
    },
    {
      name: 'earnings',
      route: '/(tabs)/earnings',
      icon: 'attach-money',
      label: 'Earnings',
    },
    {
      name: 'analytics',
      route: '/(tabs)/analytics',
      icon: 'bar-chart',
      label: 'Analytics',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile',
      icon: 'person',
      label: 'Profile',
    },
  ];

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="(home)" />
        <Stack.Screen name="tracker" />
        <Stack.Screen name="earnings" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="profile" />
      </Stack>
      <FloatingTabBar tabs={tabs} />
    </>
  );
}
