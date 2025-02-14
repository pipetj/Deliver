import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, TouchableOpacity, Modal, TextInput } from "react-native";
import axios from "axios";

const ChampionsList = () => {
  const [champions, setChampions] = useState([]);
  const [filteredChampions, setFilteredChampions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChampion, setSelectedChampion] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const version = "15.3.1";

  useEffect(() => {
    const fetchChampions = async () => {
      try {
        const response = await axios.get(
            `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`
        );
        const championsData = Object.values(response.data.data);
        setChampions(championsData);
        setFilteredChampions(championsData);
      } catch (error) {
        console.error("Erreur lors de la récupération des champions :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChampions();
  }, []);

  useEffect(() => {
    const filtered = champions.filter(champion =>
        (champion.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            champion.blurb.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedRole === "" || champion.tags.includes(selectedRole))
    );
    setFilteredChampions(filtered);
  }, [searchQuery, selectedRole, champions]);

  const handleChampionClick = (champion) => {
    setSelectedChampion(champion);
    setModalVisible(true);
  };

  const roleTranslations = {
    "Assassin": "Assassin",
    "Fighter": "Combattant",
    "Mage": "Mage",
    "Marksman": "Tireur",
    "Support": "Support",
    "Tank": "Tank",
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
              <TouchableOpacity
                  key={role}
                  style={[styles.roleButton, selectedRole === role && styles.selectedRole]}
                  onPress={() => setSelectedRole(role)}
              >
                <Text style={styles.roleText}>{role ? roleTranslations[role] : "Tous"}</Text>
              </TouchableOpacity>
          ))}
        </View>
        <FlatList
            data={filteredChampions}
            keyExtractor={(item) => item.id}
            numColumns={3}
            renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleChampionClick(item)} style={styles.championContainer}>
                  <Image
                      source={{
                        uri: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${item.id}.png`,
                      }}
                      style={styles.championImage}
                  />
                  <Text style={styles.championName}>{item.name}</Text>
                </TouchableOpacity>
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
                    <Text style={styles.modalText}>
                      Rôle: {selectedChampion.tags.map(tag => roleTranslations[tag] || tag).join(", ")}
                    </Text>
                    <Text style={styles.modalText}>Description: {selectedChampion.blurb}</Text>
                  </>
              )}
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Fermer</Text>
              </TouchableOpacity>
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