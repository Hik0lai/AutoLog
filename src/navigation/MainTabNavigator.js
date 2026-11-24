
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import DashboardScreen from '../screens/DashboardScreen';
import GarageStackNavigator from './GarageStackNavigator';
import RemindersStackNavigator from './RemindersStackNavigator';
import ExpensesScreen from '../screens/ExpensesScreen';
import ProfileScreen from '../screens/ProfileScreen';

import colors from '../constants/colors';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,

        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 65 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },

        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Начало':
              iconName = 'home-outline';
              break;

            case 'Гараж':
              iconName = 'car-sport-outline';
              break;

            case 'Напомняния':
              iconName = 'notifications-outline';
              break;

            case 'Разходи':
              iconName = 'wallet-outline';
              break;

            case 'Профил':
              iconName = 'person-outline';
              break;

            default:
              iconName = 'ellipse-outline';
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Начало"
        component={DashboardScreen}
      />

      <Tab.Screen
        name="Гараж"
        component={GarageStackNavigator}
      />

      <Tab.Screen
        name="Напомняния"
        component={RemindersStackNavigator}
      />

      <Tab.Screen
        name="Разходи"
        component={ExpensesScreen}
      />

      <Tab.Screen
        name="Профил"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}
