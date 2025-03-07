// screens/LoginScreen.js
import React, { useState, useContext } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login as loginApi } from "../api/api";
import { AuthContext } from "@/context/AuthContext";

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login: loginContext } = useContext(AuthContext);

    const handleLogin = async () => {
        try {
            const response = await loginApi(email, password);
            await AsyncStorage.setItem("token", response.data.token);
            // Met à jour le contexte d'authentification
            await loginContext(response.data.token, response.data.user);
            Alert.alert("Succès", "Connexion réussie !");
            navigation.navigate("Champions"); // Redirige vers l'écran d'accueil
        } catch (error) {
            Alert.alert("Erreur", "Email ou mot de passe incorrect");
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>Connexion</Text>
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
            />
            <TextInput
                placeholder="Mot de passe"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
            />
            <Button title="Se connecter" onPress={handleLogin} />
            <View style={{ marginTop: 10 }}>
                <Button
                    title="Pas de compte ? S'inscrire"
                    onPress={() => navigation.navigate("Register")}
                    color="#1D3D47" // Optionnel : couleur personnalisée pour le bouton
                />
            </View>
        </View>
    );
};

export default LoginScreen;