import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import HomeScreen from '@/screens/HomeScreen';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from "@/screens/RegisterScreen";
import ChampionDetailScreen from '@/components/ChampionDetail';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function ChampionsStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ChampionDetail" component={ChampionDetailScreen} />
        </Stack.Navigator>
    );
}

export default function AppNavigator() {
    return (
        <NavigationContainer>
            <Tab.Navigator>
                <Tab.Screen name="Champions" component={ChampionsStack} />
                <Tab.Screen name="Login" component={LoginScreen} />
                <Tab.Screen name="Register" component={RegisterScreen} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}
