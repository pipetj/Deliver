// screens/RegisterScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Dimensions, Pressable, Modal, Animated } from "react-native";
import { register as registerApi } from "../api/api";

// Dimensions responsives
const { width: screenWidth } = Dimensions.get('window');
const getResponsiveSize = (size) => screenWidth * (size / 375);

const RegisterScreen = ({ navigation }) => {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [fadeAnim] = useState(new Animated.Value(0));

    const isValidUsername = (username) => {
        return username.length >= 1 && username.length <= 20;
    };

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isValidPassword = (password) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    };

    const showModal = (message) => {
        setModalMessage(message);
        setModalVisible(true);
    };

    const showSuccessAlert = (message) => {
        setSuccessMessage(message);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start(() => {
            setTimeout(() => {
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }).start(() => {
                    setSuccessMessage("");
                    navigation.navigate("Login");
                });
            }, 2000);
        });
    };

    const handleRegister = async () => {
        try {
            if (!username.trim()) {
                showModal("Le nom d'utilisateur est requis");
                return;
            }
            if (!isValidUsername(username)) {
                showModal("Le nom d'utilisateur doit contenir entre 1 et 20 caractères");
                return;
            }

            if (!email.trim()) {
                showModal("L'email est requis");
                return;
            }

            if (!isValidEmail(email)) {
                showModal("Veuillez entrer un email valide");
                return;
            }

            if (!password.trim()) {
                showModal("Le mot de passe est requis");
                return;
            }

            if (!isValidPassword(password)) {
                showModal(
                    "Le mot de passe doit contenir au moins 8 caractères, " +
                    "dont une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)"
                );
                return;
            }

            await registerApi(username, email, password);
            showSuccessAlert("Compte créé avec succès !");

        } catch (error) {
            console.log("Erreur d'inscription:", error);
            let errorMessage = "Une erreur est survenue lors de l'inscription";

            if (error.response) {
                console.log("Détails de la réponse API:", error.response.data); // Ajout pour debug
                if (error.response.status === 400) {
                    // Vérifier si l'API renvoie un message spécifique
                    if (error.response.data?.message) {
                        errorMessage = error.response.data.message; // Utiliser le message exact de l'API
                    } else if (error.response.data?.errors) {
                        errorMessage = Object.values(error.response.data.errors).join(", ");
                    } else {
                        errorMessage = "Les données fournies sont invalides";
                    }
                } else if (error.response.status === 500) {
                    errorMessage = "Erreur serveur, veuillez réessayer plus tard";
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            showModal(errorMessage);
        }
    };

    const handleModalClose = () => {
        setModalVisible(false);
    };

    return (
        <View style={styles.container}>
            {successMessage ? (
                <Animated.View style={[styles.successAlert, { opacity: fadeAnim }]}>
                    <Text style={styles.successText}>{successMessage}</Text>
                </Animated.View>
            ) : null}

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
                keyboardType="email-address"
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

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={handleModalClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>{modalMessage}</Text>
                        <Pressable
                            style={[styles.button, styles.modalButton]}
                            onPress={handleModalClose}
                        >
                            <Text style={styles.buttonText}>OK</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
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
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalView: {
        width: "80%",
        backgroundColor: "#2c2c2e",
        borderRadius: 10,
        padding: getResponsiveSize(20),
        alignItems: "center",
        borderColor: "#ff3333",
        borderWidth: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalText: {
        color: "#fff",
        fontSize: getResponsiveSize(16),
        textAlign: "center",
        marginBottom: getResponsiveSize(15),
    },
    modalButton: {
        marginTop: getResponsiveSize(10),
    },
    successAlert: {
        position: "absolute",
        top: getResponsiveSize(50),
        width: "90%",
        backgroundColor: "#00cc00",
        padding: getResponsiveSize(10),
        borderRadius: 5,
        alignItems: "center",
        zIndex: 1000,
    },
    successText: {
        color: "#fff",
        fontSize: getResponsiveSize(14),
        fontWeight: "bold",
    },
});

export default RegisterScreen;