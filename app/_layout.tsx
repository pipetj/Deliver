import { Stack } from "expo-router";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#091428', // Bleu foncé de l'UI de LoL
          borderBottomWidth: 2,
          borderBottomColor: '#C89B3C', // Or/bronze caractéristique de LoL
        },
        headerTintColor: '#F0E6D2', // Couleur texte claire de LoL
        headerTitleStyle: {
          fontWeight: 'bold',
          fontFamily: 'System',
        },
        headerShown: true, // Affiche le header
        // Ne modifie pas le style du contenu de la page
      }}
    >
      {/* Personnalisation des titres pour chaque page */}
      <Stack.Screen
        name="index"
        options={{
          title: "Deliver LolBuild",
        }}
      />
      <Stack.Screen
        name="login"
        options={{
          title: "Login",
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: "Register",
        }}
      />
      {/* Vous pouvez ajouter d'autres écrans ici si nécessaire */}
    </Stack>
  );
}