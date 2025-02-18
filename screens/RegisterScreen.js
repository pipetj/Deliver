import React, { useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { register } from "../frontend/src/api/api";

const RegisterScreen = ({ navigation }) => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleRegister = async () => {
        try {
            await register(username, email, password);
            Alert.alert("Succès", "Compte créé !");
            navigation.navigate("Login");
        } catch (error) {
            Alert.alert("Erreur", "Impossible de s'inscrire");
        }
    };

    return (
        <View>
            <Text>Inscription</Text>
            <TextInput placeholder="Nom d'utilisateur" value={username} onChangeText={setUsername} />
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
            <TextInput placeholder="Mot de passe" secureTextEntry value={password} onChangeText={setPassword} />
            <Button title="S'inscrire" onPress={handleRegister} />
        </View>
    );
};

export default RegisterScreen;
