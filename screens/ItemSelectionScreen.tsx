import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator } from "react-native";

const ItemSelectionScreen = () => {
    const [items, setItems] = useState([]);
    const [currentVersion, setCurrentVersion] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                // Récupérer la version actuelle
                const versionsResponse = await fetch('https://cors-anywhere.herokuapp.com/https://ddragon.leagueoflegends.com/api/versions.json');
                const versions = await versionsResponse.json();
                const latestVersion = versions[0];
                setCurrentVersion(latestVersion);

                // Récupérer les items
                const itemsResponse = await fetch(`https://cors-anywhere.herokuapp.com/https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/fr_FR/item.json`);
                const itemsData = await itemsResponse.json();
                setItems(Object.values(itemsData.data));
            } catch (err) {
                console.error("Erreur lors de la récupération des items:", err);
                setError("Erreur lors du chargement des données. Veuillez réessayer.");
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#ffcc00" />
                <Text style={styles.loadingText}>Chargement des items...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Sélectionnez vos items</Text>
            <View style={styles.itemsContainer}>
                {items.map((item) => (
                    <View key={item.id} style={styles.itemContainer}>
                        <Image
                            source={{
                                uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${item.id}.png`
                            }}
                            style={styles.itemImage}
                        />
                        <Text style={styles.itemName}>{item.name}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#1e1e1e",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#ffcc00",
        textAlign: "center",
        marginBottom: 20,
    },
    itemsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-evenly",
    },
    itemContainer: {
        alignItems: "center",
        margin: 10,
        backgroundColor: "#333",
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ffcc00",
    },
    itemImage: {
        width: 60,
        height: 60,
    },
    itemName: {
        marginTop: 5,
        fontSize: 14,
        textAlign: "center",
        color: "#fff",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        textAlign: "center",
        color: "#ffcc00",
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        textAlign: "center",
        color: "#ff4444",
    },
});

export default ItemSelectionScreen;