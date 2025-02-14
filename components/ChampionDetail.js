import { ScrollView, View, Text, Image, StyleSheet } from 'react-native';

const ChampionDetailScreen = ({ route }) => {
    const { champion } = route.params;
    champion.spells = undefined;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>{champion.name}</Text>
            <Image
                source={{
                    uri: `https://ddragon.leagueoflegends.com/cdn/${champion.version}/img/champion/${champion.id}.png`,
                }}
                style={styles.championImage}
            />
            <Text style={styles.role}>Role: {champion.tags.join(', ')}</Text>
            <Text style={styles.description}>Description: {champion.blurb}</Text>

            <Text style={styles.spellTitle}>Sorts:</Text>
            {Array.isArray(champion.spells) && champion.spells.length > 0 ? (
                champion.spells.map((spell, index) => (
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
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    championImage: {
        width: 200,
        height: 200,
        alignSelf: 'center',
        marginBottom: 20,
    },
    role: {
        fontSize: 18,
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        marginBottom: 20,
    },
    spellTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    spellContainer: {
        marginBottom: 12,
    },
    spellName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    spellDescription: {
        fontSize: 16,
    },
    noSpells: {
        fontSize: 16,
        fontStyle: 'italic',
    },
});

export default ChampionDetailScreen;
