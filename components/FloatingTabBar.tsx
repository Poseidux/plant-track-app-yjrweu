
import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from './IconSymbol';

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
}

export default function FloatingTabBar({ tabs }: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useThemeContext();

  useEffect(() => {
    console.log('FloatingTabBar mounted');
    console.log('Current pathname:', pathname);
    console.log('Tab bar colors:', colors);
  }, [pathname]);

  const isActive = (route: string) => {
    if (route === '/(tabs)/(home)/') {
      return pathname === '/' || pathname.startsWith('/(tabs)/(home)');
    }
    return pathname.startsWith(route);
  };

  const getIconName = (icon: string) => {
    const iconMap: { [key: string]: { ios: string; android: string } } = {
      home: { ios: 'house.fill', android: 'home' },
      eco: { ios: 'leaf.fill', android: 'eco' },
      'attach-money': { ios: 'dollarsign.circle.fill', android: 'attach-money' },
      'bar-chart': { ios: 'chart.bar.fill', android: 'bar-chart' },
      person: { ios: 'person.fill', android: 'person' },
    };
    return iconMap[icon] || { ios: icon, android: icon };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {tabs.map((tab, index) => {
        const active = isActive(tab.route);
        const iconNames = getIconName(tab.icon);
        
        return (
          <TouchableOpacity
            key={`tab-${tab.name}-${index}`}
            style={styles.tab}
            onPress={() => {
              console.log('Tab pressed:', tab.route);
              router.push(tab.route as any);
            }}
          >
            <IconSymbol
              ios_icon_name={iconNames.ios}
              android_material_icon_name={iconNames.android}
              size={24}
              color={active ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.label,
                {
                  color: active ? colors.primary : colors.textSecondary,
                  fontWeight: active ? '600' : '400',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.1)',
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 11,
    marginTop: 4,
  },
});
