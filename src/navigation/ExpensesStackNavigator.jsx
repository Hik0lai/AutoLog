
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ExpensesScreen from '../screens/ExpensesScreen';
import ExpenseFormScreen from '../screens/expenses/ExpenseFormScreen';
import ExpenseDetailsScreen from '../screens/expenses/ExpenseDetailsScreen';

import colors from '../constants/colors';

const Stack = createNativeStackNavigator();

export default function ExpensesStackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="ExpensesList"
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="ExpensesList"
        component={ExpensesScreen}
      />

      <Stack.Screen
        name="ExpenseForm"
        component={ExpenseFormScreen}
      />

      <Stack.Screen
        name="ExpenseDetails"
        component={ExpenseDetailsScreen}
      />
    </Stack.Navigator>
  );
}
