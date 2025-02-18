import React from "react";
import { ScrollView, View, Text, Image, StyleSheet } from "react-native";

const ChampionDetailScreen = ({ route }) => {
    const { champion } = route.params;

    // Vérifier si les sorts sont disponibles
    const spells = champion.spells || [];

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>{champion.name}</Text>
            <Image
                source={{
                    uri: `https://ddragon.leagueoflegends.com/cdn/${champion.version}/img/champion/${champion.id}.png`,
                }}
                style={styles.championImage}
            />
            <Text style={styles.role}>Role: {champion.tags.join(", ")}</Text>
            <Text style={styles.description}>Description: {champion.blurb}</Text>

            <Text style={styles.subTitle}>Statistiques de base :</Text>
            <View style={styles.statsContainer}>
                {Object.entries(champion.stats).map(([key, value]) => (
                    <Text key={key} style={styles.statText}>
                        {key}: {value}
                    </Text>
                ))}
            </View>

            <Text style={styles.subTitle}>Sorts :</Text>
            {spells.length > 0 ? (
                spells.map((spell, index) => (
                    <View key={index} style={styles.spellContainer}>
                        <Text style={styles.spellName}>- {spell.name}</Text>
                        <Text style={styles.spellDescription}>{spell.description}</Text>
                    </View>
                ))
            ) : (
                <Text style={styles.noSpells}>Aucun sort disponible</Text>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
    },
    championImage: {
        width: 200,
        height: 200,
        alignSelf: "center",
        marginBottom: 20,
    },
    role: {
        fontSize: 18,
        marginBottom: 10,
        textAlign: "center",
    },
    description: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: "center",
    },
    subTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 10,
    },
    statsContainer: {
        marginBottom: 20,
    },
    statText: {
        fontSize: 16,
        marginBottom: 5,
    },
    spellContainer: {
        marginBottom: 15,
    },
    spellName: {
        fontSize: 18,
        fontWeight: "bold",
    },
    spellDescription: {
        fontSize: 16,
    },
    noSpells: {
        fontSize: 16,
        fontStyle: "italic",
        textAlign: "center",
    },
});

export default ChampionDetailScreen;