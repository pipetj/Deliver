// frontend/App.tsx (ou index.js si c'est votre point d'entrée)
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { AuthProvider } from '../context/AuthContext'; 
import ChampionsList from '@/components/Championlist'; 
import ChampionDetailScreen from '@/components/ChampionDetail'; 
import ItemSelectionScreen from '@/screens/ItemSelectionScreen'; 

// Définir les types pour les paramètres de navigation
export type RootStackParamList = {
  Champions: undefined;
  ChampionDetail: { champion: any };
  ItemSelectionScreen: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AuthProvider>
        <StatusBar barStyle="light-content" backgroundColor="#1D3D47" />
        <Stack.Navigator 
          initialRouteName="Champions"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#1D3D47',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
          <Stack.Screen 
            name="Champions" 
            component={ChampionsList} 
            options={{ title: 'Liste des Champions', headerShown: false }}
          />
          <Stack.Screen 
            name="ChampionDetail" 
            component={ChampionDetailScreen} 
            options={({ route }) => ({ 
              title: route.params?.champion?.name || 'Détails du Champion' 
            })}
          />
          <Stack.Screen 
            name="ItemSelectionScreen" 
            component={ItemSelectionScreen} 
            options={{ title: 'Sélection d\'objets' }}
          />
        </Stack.Navigator>
    </AuthProvider>
  );
}