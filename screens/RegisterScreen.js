// screens/RegisterScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { register as registerApi } from "../api/api";

const RegisterScreen = ({ navigation }) => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleRegister = async () => {
        try {
            await registerApi(username, email, password);
            Alert.alert("Succès", "Compte créé !");
            navigation.navigate("Login"); // Redirige vers la page de connexion
        } catch (error) {
            Alert.alert("Erreur", "Impossible de s'inscrire");
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>Inscription</Text>
            <TextInput
                placeholder="Nom d'utilisateur"
                value={username}
                onChangeText={setUsername}
                style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
            />
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
            <Button title="S'inscrire" onPress={handleRegister} />
            <View style={{ marginTop: 10 }}>
                <Button
                    title="Déjà un compte ? Se connecter"
                    onPress={() => navigation.navigate("Login")}
                    color="#1D3D47" // Optionnel : couleur personnalisée pour le bouton
                />
            </View>
        </View>
    );
};

export default RegisterScreen;