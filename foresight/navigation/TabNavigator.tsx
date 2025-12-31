import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import Dashboard from '../screens/Dashboard';
import Activity from '../screens/Activity';
import Insights from '../screens/Insights';
import Profile from '../screens/Profile';
import { colors, spacing, borderRadius } from '../theme';

export type TabParamList = {
  Home: undefined;
  Activity: undefined;
  Add: undefined;
  Insights: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

// Placeholder for Add screen (handled by modal)
const AddPlaceholder = () => null;

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  onAddPress: () => void;
}

const CustomTabBar: React.FC<TabBarProps> = ({ state, descriptors, navigation, onAddPress }) => {
  const insets = useSafeAreaInsets();
  
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    Home: 'home',
    Activity: 'pie-chart',
    Add: 'add',
    Insights: 'flash',
    Profile: 'person',
  };

  const handlePress = (route: any, isFocused: boolean) => {
    if (route.name === 'Add') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onAddPress();
      return;
    }

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate(route.name);
    }
  };

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom || spacing[6] }]}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const isAdd = route.name === 'Add';
          
          if (isAdd) {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={() => handlePress(route, isFocused)}
                style={styles.fabContainer}
                activeOpacity={0.8}
              >
                <View style={styles.fab}>
                  <Ionicons name="add" size={32} color={colors.black} />
                </View>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => handlePress(route, isFocused)}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFocused ? icons[route.name] : `${icons[route.name]}-outline` as any}
                size={24}
                color={isFocused ? colors.mint : colors.neutral500}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

interface TabNavigatorProps {
  onAddPress: () => void;
}

const TabNavigator: React.FC<TabNavigatorProps> = ({ onAddPress }) => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} onAddPress={onAddPress} />}
    >
      <Tab.Screen name="Home" component={Dashboard} />
      <Tab.Screen name="Activity" component={Activity} />
      <Tab.Screen name="Add" component={AddPlaceholder} />
      <Tab.Screen name="Insights" component={Insights} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(17, 17, 17, 0.9)',
    borderRadius: borderRadius['3xl'],
    height: 80,
    paddingHorizontal: spacing[2],
    borderWidth: 1,
    borderColor: colors.surface300,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  fabContainer: {
    position: 'relative',
    top: -32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.mint,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});

export default TabNavigator;

