// screens/ProfileScreen.js
import React, { useEffect, useState, useContext } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    StyleSheet,
    Dimensions,
    Pressable,
    ActivityIndicator,
    ScrollView,
} from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "@/context/AuthContext";
import { getFavorites } from "@/api/api";

const { width: screenWidth } = Dimensions.get("window");
const getResponsiveSize = (size) => screenWidth * (size / 375);
const columnCount = screenWidth > 700 ? 4 : 3;

const ProfileScreen = () => {
    const [favorites, setFavorites] = useState([]);
    const [favoriteChampions, setFavoriteChampions] = useState([]);
    const [builds, setBuilds] = useState([]);
    const [itemsData, setItemsData] = useState({});
    const [loading, setLoading] = useState(true);
    const [version, setVersion] = useState(null);
    const navigation = useNavigation();
    const { token, user } = useContext(AuthContext);

    useEffect(() => {
        const fetchLatestVersion = async () => {
            try {
                const response = await axios.get("https://ddragon.leagueoflegends.com/api/versions.json");
                setVersion(response.data[0]);
            } catch (error) {
                console.error("Erreur lors de la récupération de la version :", error);
            }
        };
        fetchLatestVersion();
    }, []);

    useEffect(() => {
        if (!version || !token) return;

        const loadData = async () => {
            try {
                const [favoriteIds, buildsResponse, itemsResponse] = await Promise.all([
                    getFavorites(token),
                    axios.get("http://localhost:3000/api/auth/builds", {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get(`https://ddragon.leagueoflegends.com/cdn/${version}/data/fr_FR/item.json`),
                ]);

                const championsData = await Promise.all(
                    favoriteIds.data.map(async (id) => {
                        const response = await axios.get(
                            `https://ddragon.leagueoflegends.com/cdn/${version}/data/fr_FR/champion/${id}.json`
                        );
                        return response.data.data[id];
                    })
                );

                const itemsMap = itemsResponse.data.data;
                setItemsData(itemsMap);

                setFavorites(favoriteIds.data);
                setFavoriteChampions(championsData);
                setBuilds(buildsResponse.data);
            } catch (error) {
                console.error("Erreur lors de la récupération des données :", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [version, token]);

    const handleChampionClick = (champion) => {
        navigation.navigate("ChampionDetail", { champion });
    };

    const renderBuildItems = (itemIds) => {
        const items = JSON.parse(itemIds || "[]");
        return (
            <View style={styles.buildItemsContainer}>
                {items.map((itemId, index) => {
                    const item = itemsData[itemId];
                    return item ? (
                        <Image
                            key={index}
                            source={{
                                uri: `https://ddragon.leagueoflegends.com/cdn/${version}/img/item/${item.image.full}`,
                            }}
                            style={styles.buildItemImage}
                        />
                    ) : (
                        <View key={index} style={styles.emptySlot} />
                    );
                })}
                {Array(6 - items.length)
                    .fill(0)
                    .map((_, index) => (
                        <View key={`empty-${index}`} style={styles.emptySlot} />
                    ))}
            </View>
        );
    };

    if (loading) return <ActivityIndicator size="large" color="#fbcd03" />;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Profil de {user?.username || "Utilisateur"}</Text>

            {/* Section Favoris */}
            <Text style={styles.subtitle}>Mes Favoris</Text>
            {favoriteChampions.length === 0 ? (
                <Text style={styles.noFavorites}>Aucun favori pour le moment</Text>
            ) : (
                <FlatList
                    data={favoriteChampions}
                    keyExtractor={(item) => item.id}
                    numColumns={columnCount}
                    renderItem={({ item }) => (
                        <Pressable
                            onPress={() => handleChampionClick(item)}
                            style={styles.championContainer}
                        >
                            <Image
                                source={{
                                    uri: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${item.id}.png`,
                                }}
                                style={styles.championImage}
                            />
                            <Text style={styles.championName}>{item.name}</Text>
                        </Pressable>
                    )}
                    contentContainerStyle={styles.flatListContainer}
                    scrollEnabled={false}
                />
            )}

            {/* Section Builds */}
            <Text style={styles.subtitle}>Mes Builds</Text>
            {builds.length === 0 ? (
                <Text style={styles.noFavorites}>Aucun build pour le moment</Text>
            ) : (
                <FlatList
                    data={builds}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.buildContainer}>
                            <Text style={styles.buildTitle}>{item.champion}</Text>
                            {renderBuildItems(item.items)}
                        </View>
                    )}
                    contentContainerStyle={styles.flatListContainer}
                    scrollEnabled={false}
                />
            )}

            {/* Bouton Retour */}
            <Pressable
                style={styles.backButton}
                onPress={() => navigation.navigate("Championlist")}
            >
                <Text style={styles.backButtonText}>Retour aux Champions</Text>
            </Pressable>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1c1c1e",
        padding: getResponsiveSize(20),
    },
    title: {
        fontSize: getResponsiveSize(28),
        fontWeight: "bold",
        color: "#fbcd03",
        textAlign: "center",
        marginBottom: getResponsiveSize(10),
    },
    subtitle: {
        fontSize: getResponsiveSize(20),
        fontWeight: "bold",
        color: "#fbcd03",
        textAlign: "center",
        marginTop: getResponsiveSize(20),
        marginBottom: getResponsiveSize(10),
    },
    flatListContainer: {
        paddingBottom: getResponsiveSize(20),
        alignItems: "center",
    },
    championContainer: {
        alignItems: "center",
        margin: screenWidth * 0.02,
        backgroundColor: "#2c2c2e",
        padding: screenWidth * 0.03,
        borderRadius: 15,
        width: screenWidth / columnCount - screenWidth * 0.06,
        elevation: 5,
        shadowColor: "#fbcd03",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    championImage: {
        width: screenWidth / columnCount - screenWidth * 0.12,
        height: screenWidth / columnCount - screenWidth * 0.12,
        borderRadius: 12,
    },
    championName: {
        color: "#fbcd03",
        marginTop: getResponsiveSize(12),
        fontWeight: "bold",
        textAlign: "center",
        fontSize: getResponsiveSize(14),
        width: "100%",
        flexShrink: 1,
    },
    buildContainer: {
        backgroundColor: "#2c2c2e",
        padding: getResponsiveSize(15),
        borderRadius: 10,
        marginVertical: getResponsiveSize(5),
        width: "90%", // Largeur fixe pour cohérence
        alignSelf: "center", // Centrage horizontal du conteneur
        elevation: 5,
        shadowColor: "#fbcd03",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buildTitle: {
        fontSize: getResponsiveSize(16),
        fontWeight: "bold",
        color: "#fbcd03",
        marginBottom: getResponsiveSize(10),
        textAlign: "center",
    },
    buildItemsContainer: {
        flexDirection: "row",
        justifyContent: "center", // Centrage des items horizontalement
        flexWrap: "wrap",
    },
    buildItemImage: {
        width: getResponsiveSize(40),
        height: getResponsiveSize(40),
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "#fbcd03",
        margin: getResponsiveSize(5),
    },
    emptySlot: {
        width: getResponsiveSize(40),
        height: getResponsiveSize(40),
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "#fbcd03",
        borderStyle: "dashed",
        backgroundColor: "#333",
        margin: getResponsiveSize(5),
    },
    noFavorites: {
        color: "#fff",
        fontSize: getResponsiveSize(16),
        textAlign: "center",
        marginBottom: getResponsiveSize(20),
    },
    backButton: {
        backgroundColor: "#fbcd03",
        paddingVertical: getResponsiveSize(8),
        paddingHorizontal: getResponsiveSize(12),
        borderRadius: 8,
        alignItems: "center",
        marginTop: getResponsiveSize(20),
        marginBottom: getResponsiveSize(20),
        alignSelf: "center",
    },
    backButtonText: {
        color: "#1c1c1e",
        fontSize: getResponsiveSize(14),
        fontWeight: "bold",
    },
});

export default ProfileScreen;