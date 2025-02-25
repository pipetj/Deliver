import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, Pressable, Modal, TextInput } from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

const ChampionsList = () => {
  const [champions, setChampions] = useState([]);
  const [filteredChampions, setFilteredChampions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChampion, setSelectedChampion] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [version, setVersion] = useState(""); // Pour stocker la version dynamique
  const navigation = useNavigation();

  useEffect(() => {
    // Fonction pour récupérer la version la plus récente
    const fetchLatestVersion = async () => {
      try {
        const response = await axios.get("https://ddragon.leagueoflegends.com/api/versions.json");
        const latestVersion = response.data[0]; // La version la plus récente est toujours en premier
        setVersion(latestVersion);
      } catch (error) {
        console.error("Erreur lors de la récupération de la version :", error);
      }
    };

    fetchLatestVersion();
  }, []);

  useEffect(() => {
    if (!version) return; // Attendre que la version soit récupérée

    const fetchChampions = async () => {
      try {
        const response = await axios.get(
            `https://ddragon.leagueoflegends.com/cdn/${version}/data/fr_FR/champion.json`
        );
        const championsData = Object.values(response.data.data);

        // Récupérer les détails complets de chaque champion
        const championsWithDetails = await Promise.all(
            championsData.map(async (champion) => {
              const championDetailResponse = await axios.get(
                  `https://ddragon.leagueoflegends.com/cdn/${version}/data/fr_FR/champion/${champion.id}.json`
              );
              return championDetailResponse.data.data[champion.id];
            })
        );

        setChampions(championsWithDetails);
        setFilteredChampions(championsWithDetails);
      } catch (error) {
        console.error("Erreur lors de la récupération des champions :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChampions();
  }, [version]); // Recharger les champions lorsque la version change

  useEffect(() => {
    const filtered = champions.filter(champion =>
        (champion.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            champion.blurb.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedRole === "" || champion.tags.includes(selectedRole))
    );
    setFilteredChampions(filtered);
  }, [searchQuery, selectedRole, champions]);

  const handleChampionClick = (champion) => {
    navigation.navigate('ChampionDetail', { champion });
  };

  const handleChampionNavigation = (champion) => {
    navigation.navigate("ChampionDetail", { champion });
  };

  const roles = ["", "Assassin", "Fighter", "Mage", "Marksman", "Support", "Tank"];

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Liste des Champions</Text>
        <TextInput
            style={styles.searchBar}
            placeholder="Rechercher un champion..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
        />
        <View style={styles.roleContainer}>
          {roles.map(role => (
              <Pressable
                  key={role}
                  style={[styles.roleButton, selectedRole === role && styles.selectedRole]}
                  onPress={() => setSelectedRole(role)}
              >
                <Text style={styles.roleText}>{role || "Tous"}</Text>
              </Pressable>
          ))}
        </View>
        <FlatList
            data={filteredChampions}
            keyExtractor={(item) => item.id}
            numColumns={3}
            renderItem={({ item }) => (
                <Pressable
                    onPress={() => handleChampionClick(item)}
                    onLongPress={() => handleChampionNavigation(item)}
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
        />
        <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedChampion && (
                  <>
                    <Text style={styles.modalTitle}>{selectedChampion.name}</Text>
                    <Text style={styles.modalText}>Role: {selectedChampion.tags.join(", ")}</Text>
                    <Text style={styles.modalText}>Description: {selectedChampion.blurb}</Text>
                    <Text style={styles.modalText}>Sorts:</Text>
                    {Array.isArray(selectedChampion.spells) && selectedChampion.spells.length > 0 ? (
                        selectedChampion.spells.map((spell, index) => (
                            <View key={index} style={styles.spellContainer}>
                              <Text style={styles.modalText}>- {spell.name}: {spell.description}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.modalText}>Aucun sort disponible</Text>
                    )}
                  </>
              )}
              <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Fermer</Text>
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
    backgroundColor: "#121212",
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
  },
  searchBar: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    color: "#000",
  },
  roleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 10,
  },
  roleButton: {
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 5,
    margin: 5,
  },
  selectedRole: {
    backgroundColor: "#1D3D47",
  },
  roleText: {
    color: "#fff",
  },
  championContainer: {
    alignItems: "center",
    margin: 10,
  },
  championImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  championName: {
    color: "#fff",
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: "#1D3D47",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  closeButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});

export default ChampionsList;
