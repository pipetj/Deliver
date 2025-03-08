// screens/RegisterScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, Alert, StyleSheet, Dimensions, Pressable } from "react-native";
import { register as registerApi } from "../api/api";

// Dimensions responsives
const { width: screenWidth } = Dimensions.get('window');
const getResponsiveSize = (size) => screenWidth * (size / 375); // Ajusté pour un écran mobile typique (iPhone 8)

const RegisterScreen = ({ navigation }) => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleRegister = async () => {
        try {
            await registerApi(username, email, password);
            Alert.alert("Succès", "Compte créé !");
            navigation.navigate("Login");
        } catch (error) {
            Alert.alert("Erreur", "Impossible de s'inscrire");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Inscription</Text>
            <TextInput
                placeholder="Nom d'utilisateur"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                placeholderTextColor="#888"
            />
            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                style={styles.input}
                placeholderTextColor="#888"
            />
            <TextInput
                placeholder="Mot de passe"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                placeholderTextColor="#888"
            />
            <Pressable style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>S'inscrire</Text>
            </Pressable>
            <View style={styles.buttonContainer}>
                <Pressable
                    style={styles.button}
                    onPress={() => navigation.navigate("Login")}
                >
                    <Text style={styles.buttonText}>Déjà un compte ? Se connecter</Text>
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1c1c1e",
        padding: getResponsiveSize(20),
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: getResponsiveSize(28),
        fontWeight: "bold",
        color: "#fbcd03",
        textAlign: "center",
        marginBottom: getResponsiveSize(20),
    },
    input: {
        backgroundColor: "#2c2c2e",
        paddingHorizontal: getResponsiveSize(12),
        paddingVertical: getResponsiveSize(7), // Hauteur encore plus grande pour mobile
        borderRadius: 10,
        marginBottom: getResponsiveSize(10),
        color: "#fff",
        width: "90%",
        textAlign: "center",
        fontSize: getResponsiveSize(14), // Texte encore plus grand
        borderWidth: 1,
        borderColor: "#fbcd03",
    },
    button: {
        backgroundColor: "#fbcd03",
        paddingVertical: getResponsiveSize(8), // Boutons plus petits
        paddingHorizontal: getResponsiveSize(12),
        borderRadius: 8,
        alignItems: "center",
    },
    buttonText: {
        color: "#1c1c1e",
        fontSize: getResponsiveSize(14), // Texte des boutons plus petit
        fontWeight: "bold",
    },
    buttonContainer: {
        marginTop: getResponsiveSize(10),
    },
});

export default RegisterScreen;