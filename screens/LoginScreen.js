import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login } from "../frontend/src/api/api";

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        try {
            const response = await login(email, password);
            await AsyncStorage.setItem("token", response.data.token);
            Alert.alert("Succès", "Connexion réussie !");
            navigation.navigate("Home"); // Rediriger après connexion
        } catch (error) {
            Alert.alert("Erreur", "Email ou mot de passe incorrect");
        }
    };

    return (
        <View>
            <Text>Connexion</Text>
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
            <TextInput placeholder="Mot de passe" secureTextEntry value={password} onChangeText={setPassword} />
            <Button title="Se connecter" onPress={handleLogin} />
        </View>
    );
};

export default LoginScreen;
