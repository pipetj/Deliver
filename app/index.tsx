import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import ChampionsList from '@/components/Championlist'; // Ajustez le chemin selon votre structure
import ChampionDetailScreen from '@/components/ChampionDetail'; // Ajustez le chemin
import ItemSelectionScreen from '@/screens/ItemSelectionScreen'; // Si cette page existe

// Définir les types pour les paramètres de navigation
export type RootStackParamList = {
  Champions: undefined;
  ChampionDetail: { champion: any };
  ItemSelectionScreen: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <>
      {/* Personnalisation de la barre de statut */}
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
        {/* Masque l'en-tête sur l'écran Champions */}
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
    </>
  );
}
