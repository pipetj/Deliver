import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthProvider, AuthContext } from '@/context/AuthContext';
import ChampionDetailScreen from '@/components/ChampionDetail';
import LoginScreen from '@/screens/LoginScreen';
import Championlist from '@/components/Championlist';
import ProfileScreen from '@/screens/ProfileScreen';
import ItemSelectionScreen from '@/screens/ItemSelectionScreen';
import RegisterScreen from "@/screens/RegisterScreen";

const Stack = createStackNavigator();

const RootNavigator = () => {
    const { token } = useContext(AuthContext);

    return (
        <Stack.Navigator
            initialRouteName={token ? 'Championlist' : 'Login'}
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#1e1e1e',
                },
                headerTintColor: '#ffcc00',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
                headerRight: () => <LogoutButton />,
            }}
        >
            <Stack.Screen
                name="Championlist"
                component={Championlist}
                options={{ headerLeft: () => null }} // Pas de flèche
            />
            <Stack.Screen
                name="ItemSelectionScreen"
                component={ItemSelectionScreen}
            />
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
            />
            <Stack.Screen
                name="ChampionDetail"
                component={ChampionDetailScreen}
                // Flèche conservée par défaut
            />
            <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{
                    headerRight: null,
                    headerLeft: () => null // Pas de flèche
                }}
            />
            <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{
                    headerRight: null,
                    headerLeft: () => null // Pas de flèche
                }}
            />
        </Stack.Navigator>
    );
};

const LogoutButton = () => {
    const { logout } = useContext(AuthContext);
    const navigation = useNavigation();

    const handleLogout = () => {
        if (logout) {
            logout();
            navigation.navigate('Login');
        }
    };

    return (
        <Pressable
            style={({ pressed }) => [
                styles.logoutButton,
                { backgroundColor: pressed ? '#cc0000' : '#ff4444' },
            ]}
            onPress={handleLogout}
        >
            <Text style={styles.logoutButtonText}>Déconnexion</Text>
        </Pressable>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <RootNavigator />
        </AuthProvider>
    );
};

const styles = StyleSheet.create({
    logoutButton: {
        paddingVertical: 3,    // Réduit de 5 à 3
        paddingHorizontal: 8,  // Réduit de 10 à 8
        borderRadius: 4,       // Légèrement réduit
        marginRight: 10,
    },
    logoutButtonText: {
        fontSize: 14,          // Réduit de 16 à 14
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default App;