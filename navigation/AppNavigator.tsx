import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';

import HomeScreen from '@/screens/HomeScreen';
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
            </Tab.Navigator>
        </NavigationContainer>
    );
}
