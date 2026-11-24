
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import RemindersScreen from '../screens/RemindersScreen';
import ReminderFormScreen from '../screens/reminders/ReminderFormScreen';

import colors from '../constants/colors';

const Stack = createNativeStackNavigator();

export default function RemindersStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="RemindersList"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="RemindersList"
        component={RemindersScreen}
      />

      <Stack.Screen
        name="ReminderForm"
        component={ReminderFormScreen}
      />
    </Stack.Navigator>
  );
}
