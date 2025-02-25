import React, { useEffect, useState } from "react";
import { ScrollView, View, Text, StyleSheet, Image, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";

const ChampionDetailScreen = ({ route }) => {
    const { champion } = route.params;
    const [currentVersion, setCurrentVersion] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [savedBuilds, setSavedBuilds] = useState([]);
    const [championLevel, setChampionLevel] = useState(1); // Ajout de l'état pour le niveau du champion
    const navigation = useNavigation();

    // Calcul des statistiques dynamiques
    const calculateStat = (base, perLevel, level) => base + perLevel * (level - 1);

    // Statistiques de base du champion
    const hp = calculateStat(champion.stats.hp, champion.stats.hpperlevel, championLevel);
    const mp = calculateStat(champion.stats.mp, champion.stats.mpperlevel, championLevel);
    const armor = calculateStat(champion.stats.armor, champion.stats.armorperlevel, championLevel);
    const spellblock = calculateStat(champion.stats.spellblock, champion.stats.spellblockperlevel, championLevel);
    const attackDamage = calculateStat(champion.stats.attackdamage, champion.stats.attackdamageperlevel, championLevel);
    const attackSpeed = champion.stats.attackspeed + champion.stats.attackspeedperlevel * (championLevel - 1);
    const moveSpeed = champion.stats.movespeed;
    const attackRange = champion.stats.attackrange;
    const hpRegen = calculateStat(champion.stats.hpregen, champion.stats.hpregenperlevel, championLevel);
    const mpRegen = calculateStat(champion.stats.mpregen, champion.stats.mpregenperlevel, championLevel);
    const crit = champion.stats.crit + champion.stats.critperlevel * (championLevel - 1);
    const abilityPower = 0; // Ajout de la statistique AP, initialisée à 0

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
            <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                    <Image
                        source={{ uri: 'path_to_hp_icon' }} // Replace with the correct icon URL
                        style={styles.statIcon}
                    />
                    <Text style={styles.statText}>HP: {hp}</Text>
                </View>
                <View style={styles.statItem}>
                    <Image
                        source={{ uri: 'path_to_mp_icon' }} // Replace with the correct icon URL
                        style={styles.statIcon}
                    />
                    <Text style={styles.statText}>MP: {mp}</Text>
                </View>
                <View style={styles.statItem}>
                    <Image
                        source={{ uri: 'path_to_armor_icon' }} // Replace with the correct icon URL
                        style={styles.statIcon}
                    />
                    <Text style={styles.statText}>Armor: {armor}</Text>
                </View>
                <View style={styles.statItem}>
                    <Image
                        source={{ uri: 'path_to_spellblock_icon' }} // Replace with the correct icon URL
                        style={styles.statIcon}
                    />
                    <Text style={styles.statText}>MR: {spellblock}</Text>
                </View>
                <View style={styles.statItem}>
                    <Image
                        source={{ uri: 'path_to_attackdamage_icon' }} // Replace with the correct icon URL
                        style={styles.statIcon}
                    />
                    <Text style={styles.statText}>AD: {attackDamage}</Text>
                </View>
                <View style={styles.statItem}>
                    <Image
                        source={{ uri: 'path_to_attackspeed_icon' }} // Replace with the correct icon URL
                        style={styles.statIcon}
                    />
                    <Text style={styles.statText}>AS: {attackSpeed.toFixed(2)}</Text>
                </View>
                <View style={styles.statItem}>
                    <Image
                        source={{ uri: 'path_to_movespeed_icon' }} // Replace with the correct icon URL
                        style={styles.statIcon}
                    />
                    <Text style={styles.statText}>Move Speed: {moveSpeed}</Text>
                </View>
                <View style={styles.statItem}>
                    <Image
                        source={{ uri: 'path_to_attackrange_icon' }} // Replace with the correct icon URL
                        style={styles.statIcon}
                    />
                    <Text style={styles.statText}>Attack Range: {attackRange}</Text>
                </View>
                <View style={styles.statItem}>
                    <Image
                        source={{ uri: 'path_to_hpregen_icon' }} // Replace with the correct icon URL
                        style={styles.statIcon}
                    />
                    <Text style={styles.statText}>HP Regen: {hpRegen}</Text>
                </View>
                <View style={styles.statItem}>
                    <Image
                        source={{ uri: 'path_to_mpregen_icon' }} // Replace with the correct icon URL
                        style={styles.statIcon}
                    />
                    <Text style={styles.statText}>MP Regen: {mpRegen}</Text>
                </View>
                <View style={styles.statItem}>
                    <Image
                        source={{ uri: 'path_to_crit_icon' }} // Replace with the correct icon URL
                        style={styles.statIcon}
                    />
                    <Text style={styles.statText}>Crit: {crit}%</Text>
                </View>
                <View style={styles.statItem}>
                    <Image
                        source={{ uri: 'path_to_ap_icon' }} // Replace with the correct icon URL
                        style={styles.statIcon}
                    />
                    <Text style={styles.statText}>AP: {abilityPower}</Text>
                </View>
            </View>
        </View>
    );


    const renderLevelControl = () => (
        <View style={styles.levelContainer}>
            <Text style={styles.levelText}>Niveau: {championLevel}</Text>
            <View style={styles.levelButtonsContainer}>
                <Pressable
                    style={styles.levelButton}
                    onPress={() => setChampionLevel(prevLevel => Math.max(1, prevLevel - 1))}
                >
                    <Text style={styles.levelButtonText}>-</Text>
                </Pressable>
                <Pressable
                    style={styles.levelButton}
                    onPress={() => setChampionLevel(prevLevel => Math.min(18, prevLevel + 1))}
                >
                    <Text style={styles.levelButtonText}>+</Text>
                </Pressable>
            </View>
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

            {renderLevelControl()} {/* Afficher le contrôle de niveau */}

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
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    statItem: {
        width: "48%",
        marginBottom: 8,
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
        backgroundColor: "#ffcc00",
    },
    addButtonText: {
        fontSize: 30,
        color: "#1e1e1e",
        fontWeight: "bold",
    },
    // Nouvelles styles pour le système de niveau
    levelContainer: {
        marginBottom: 20,
        padding: 15,
        backgroundColor: "#2c2c2c",
        borderRadius: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
    },
    levelText: {
        fontSize: 18,
        color: "#ccc",
        marginBottom: 10,
        textAlign: "center",
    },
    levelButtonsContainer: {
        flexDirection: "row",
        justifyContent: "center", // Centrer les boutons
        alignItems: "center",
        gap: 10, // Réduire l'écart entre les boutons
    },
    levelButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffcc00",
    },
    levelButtonText: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1e1e1e",
    },
    statIcon: {
        width: 20,
        height: 20,
        marginRight: 8,
    },

});

export default ChampionDetailScreen;
