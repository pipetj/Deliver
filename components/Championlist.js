import { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const ChampionsList = () => {
  const [champions, setChampions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const version = '15.3.1';

  useEffect(() => {
    const fetchChampions = async () => {
      try {
        const response = await axios.get(
            `https://ddragon.leagueoflegends.com/cdn/${version}/data/fr_FR/champion.json`
        );
        setChampions(Object.values(response.data.data));
      } catch (error) {
        console.error('Erreur lors de la récupération des champions :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChampions();
  }, []);

  const handleChampionClick = (champion) => {
    navigation.navigate('ChampionDetail', { champion });
  };


  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Liste des Champions</Text>
        <FlatList
            data={champions}
            keyExtractor={(item) => item.id}
            numColumns={3}
            renderItem={({ item }) => (
                <Pressable onPress={() => handleChampionClick(item)} style={styles.championContainer}>
                  <Image
                      source={{
                        uri: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${item.id}.png`,
                      }}
                      style={styles.championImage}
                  />
                  <Text style={styles.championName}>{item.name}</Text>
                </Pressable>
            )}
        />
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  championContainer: {
    alignItems: 'center',
    margin: 10,
  },
  championImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  championName: {
    color: '#fff',
    marginTop: 5,
  },
});

export default ChampionsList;
