
import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useThemeContext } from '@/contexts/ThemeContext';
import { IconSymbol } from './IconSymbol';
import { ErrorBoundary } from './ErrorBoundary';

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
}

// Memoized tab button component
const TabButton = React.memo(({ 
  tab, 
  active, 
  colors, 
  onPress 
}: {
  tab: TabBarItem;
  active: boolean;
  colors: any;
  onPress: () => void;
}) => {
  const getIconName = useCallback((icon: string) => {
    const iconMap: { [key: string]: { ios: string; android: string } } = {
      home: { ios: 'house.fill', android: 'home' },
      eco: { ios: 'leaf.fill', android: 'eco' },
      'attach-money': { ios: 'dollarsign.circle.fill', android: 'attach-money' },
      'bar-chart': { ios: 'chart.bar.fill', android: 'bar-chart' },
      person: { ios: 'person.fill', android: 'person' },
    };
    return iconMap[icon] || { ios: icon, android: icon };
  }, []);

  const iconNames = useMemo(() => getIconName(tab.icon), [tab.icon, getIconName]);

  return (
    <TouchableOpacity
      style={styles.tab}
      onPress={onPress}
      activeOpacity={0.7}
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
});

TabButton.displayName = 'TabButton';

function FloatingTabBarContent({ tabs }: FloatingTabBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useThemeContext();
  
  // Navigation throttling to prevent crashes - ENHANCED
  const lastNavigationRef = useRef(0);
  const isNavigatingRef = useRef(false);
  const navigationQueueRef = useRef<string | null>(null);
  const THROTTLE_DELAY = 300;

  useEffect(() => {
    console.log('FloatingTabBar mounted');
    
    return () => {
      console.log('FloatingTabBar unmounting');
      isNavigatingRef.current = false;
      navigationQueueRef.current = null;
    };
  }, []);

  const isActive = useCallback((route: string) => {
    if (route === '/(tabs)/(home)/') {
      return pathname === '/' || pathname.startsWith('/(tabs)/(home)');
    }
    return pathname.startsWith(route);
  }, [pathname]);

  const handleTabPress = useCallback((route: string) => {
    const now = Date.now();
    const timeSinceLastNav = now - lastNavigationRef.current;
    
    // If already navigating, queue the next navigation
    if (isNavigatingRef.current) {
      console.log('Navigation in progress, queueing:', route);
      navigationQueueRef.current = route;
      return;
    }
    
    // Throttle navigation to prevent rapid taps causing crashes
    if (timeSinceLastNav < THROTTLE_DELAY) {
      console.log('Navigation throttled - too fast');
      navigationQueueRef.current = route;
      
      // Schedule the queued navigation
      setTimeout(() => {
        if (navigationQueueRef.current && !isNavigatingRef.current) {
          const queuedRoute = navigationQueueRef.current;
          navigationQueueRef.current = null;
          handleTabPress(queuedRoute);
        }
      }, THROTTLE_DELAY - timeSinceLastNav);
      
      return;
    }
    
    isNavigatingRef.current = true;
    lastNavigationRef.current = now;
    
    console.log('Tab pressed:', route);
    
    try {
      router.push(route as any);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      // Reset navigation flag after delay
      setTimeout(() => {
        isNavigatingRef.current = false;
        
        // Process queued navigation if any
        if (navigationQueueRef.current) {
          const queuedRoute = navigationQueueRef.current;
          navigationQueueRef.current = null;
          handleTabPress(queuedRoute);
        }
      }, THROTTLE_DELAY);
    }
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {tabs.map((tab, index) => (
        <TabButton
          key={`tab-${tab.route}-${index}`}
          tab={tab}
          active={isActive(tab.route)}
          colors={colors}
          onPress={() => handleTabPress(tab.route)}
        />
      ))}
    </View>
  );
}

export default React.memo(function FloatingTabBar({ tabs }: FloatingTabBarProps) {
  return (
    <ErrorBoundary fallbackTitle="Navigation Error">
      <FloatingTabBarContent tabs={tabs} />
    </ErrorBoundary>
  );
});

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
