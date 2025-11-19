
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Screen name="(home)" options={{ title: 'Home' }}>
        <NativeTabs.Trigger>
          <Icon sf="house.fill" />
          <Label>Home</Label>
        </NativeTabs.Trigger>
      </NativeTabs.Screen>
      
      <NativeTabs.Screen name="tracker" options={{ title: 'Tracker' }}>
        <NativeTabs.Trigger>
          <Icon sf="leaf.fill" />
          <Label>Log</Label>
        </NativeTabs.Trigger>
      </NativeTabs.Screen>
      
      <NativeTabs.Screen name="earnings" options={{ title: 'Earnings' }}>
        <NativeTabs.Trigger>
          <Icon sf="dollarsign.circle.fill" />
          <Label>Earnings</Label>
        </NativeTabs.Trigger>
      </NativeTabs.Screen>
      
      <NativeTabs.Screen name="analytics" options={{ title: 'Analytics' }}>
        <NativeTabs.Trigger>
          <Icon sf="chart.bar.fill" />
          <Label>Analytics</Label>
        </NativeTabs.Trigger>
      </NativeTabs.Screen>
      
      <NativeTabs.Screen name="profile" options={{ title: 'Profile' }}>
        <NativeTabs.Trigger>
          <Icon sf="person.fill" />
          <Label>Profile</Label>
        </NativeTabs.Trigger>
      </NativeTabs.Screen>
    </NativeTabs>
  );
}
