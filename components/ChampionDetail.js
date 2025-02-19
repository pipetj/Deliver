import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, StyleSheet, Image, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

const ChampionDetailScreen = ({ route }) => {
    const { champion } = route.params;
    const [currentVersion, setCurrentVersion] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savedBuilds, setSavedBuilds] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        const fetchVersion = async () => {
            try {
                const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
                const versions = await response.json();
                setCurrentVersion(versions[0]);
                setLoading(false);
            } catch (err) {
                console.error("Erreur lors de la récupération de la version:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchVersion();
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Chargement...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Erreur: {error}</Text>
            </View>
        );
    }

    const renderStats = () => (
        <View style={styles.statsContainer}>
            {Object.entries(champion.stats).map(([key, value]) => (
                <Text key={key} style={styles.statText}>
                    {key}: {value}
                </Text>
            ))}
        </View>
    );

    const renderPassive = () => (
        champion.passive && (
            <View style={styles.spellContainer}>
                <Text style={styles.spellName}>Passif - {champion.passive.name}</Text>
                <Image
                    source={{
                        uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/passive/${champion.passive.image.full}`
                    }}
                    style={styles.spellIcon}
                />
                <Text style={styles.spellDescription}>{champion.passive.description}</Text>
            </View>
        )
    );

    const renderSpells = () => (
        champion.spells.map((spell, index) => (
            <View key={index} style={styles.spellContainer}>
                <Text style={styles.spellName}>
                    {['Q', 'W', 'E', 'R'][index]} - {spell.name}
                </Text>
                <Image
                    source={{
                        uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/spell/${spell.image.full}`
                    }}
                    style={styles.spellIcon}
                />
                <Text style={styles.spellDescription}>{spell.description}</Text>
            </View>
        ))
    );

    const renderBuilds = () => (
        <View>
            <Text style={styles.subTitle}>Vos builds :</Text>
            <Pressable 
                style={({ pressed }) => [
                    styles.addButton,
                    { backgroundColor: pressed ? "#e6b800" : "#ffcc00" }
                ]}
                onPress={() => navigation.navigate("ItemSelectionScreen")}
            >
                <Text style={styles.addButtonText}>+</Text>
            </Pressable>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>{champion.name}</Text>
            
            <Image
                source={{
                    uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${champion.id}.png`
                }}
                style={styles.championImage}
            />
            
            <Text style={styles.role}>Role: {champion.tags.join(", ")}</Text>
            <Text style={styles.description}>{champion.blurb}</Text>

            <Text style={styles.subTitle}>Statistiques de base :</Text>
            {renderStats()}

            <Text style={styles.subTitle}>Sorts :</Text>
            {renderPassive()}
            {renderSpells()}

            {renderBuilds()}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#1e1e1e",
    },
    loadingText: {
        color: "#ffcc00",
        fontSize: 18,
        textAlign: "center",
        marginTop: 20,
    },
    errorText: {
        color: "#ff4444",
        fontSize: 18,
        textAlign: "center",
        marginTop: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
        color: "#ffcc00",
        textShadowColor: "#ffcc00",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    championImage: {
        width: 250,
        height: 250,
        alignSelf: "center",
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 4,
        borderColor: "#ffcc00",
    },
    role: {
        fontSize: 18,
        marginBottom: 10,
        textAlign: "center",
        color: "#999",
    },
    description: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: "center",
        color: "#ccc",
    },
    subTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
        color: "#ffcc00",
        textShadowColor: "#333",
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 5,
    },
    statsContainer: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: "#2c2c2c",
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    statText: {
        fontSize: 16,
        marginBottom: 5,
        color: "#ccc",
    },
    spellContainer: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: "#2c2c2c",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#ffcc00",
    },
    spellName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#ffcc00",
        marginBottom: 5,
    },
    spellIcon: {
        width: 50,
        height: 50,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: "#ffcc00",
        marginVertical: 10,
    },
    spellDescription: {
        fontSize: 16,
        color: "#ccc",
    },
    addButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        marginTop: 10,
    },
    addButtonText: {
        fontSize: 30,
        color: "#1e1e1e",
        fontWeight: "bold",
    },
});

export default ChampionDetailScreen;
