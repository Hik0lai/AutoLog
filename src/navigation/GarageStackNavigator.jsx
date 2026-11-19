
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import VehicleFormScreen from '../screens/vehicles/VehicleFormScreen';
import VehiclesScreen from '../screens/vehicles/VehiclesScreen';
import VehicleDetailsScreen from '../screens/vehicles/VehicleDetailsScreen';

import colors from '../constants/colors';

const Stack = createNativeStackNavigator();

export default function GarageStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="Vehicles"
        component={VehiclesScreen}
      />

      <Stack.Screen
        name="VehicleForm"
        component={VehicleFormScreen}
      />

      <Stack.Screen
        name="VehicleDetails"
        component={VehicleDetailsScreen}
      />
    </Stack.Navigator>
  );
}
