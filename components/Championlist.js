import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, TouchableOpacity, Modal } from "react-native";
import axios from "axios";

const ChampionsList = () => {
  const [champions, setChampions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChampion, setSelectedChampion] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const version = "15.3.1";

  useEffect(() => {
    const fetchChampions = async () => {
      try {
        const response = await axios.get(
            `https://ddragon.leagueoflegends.com/cdn/${version}/data/fr_FR/champion.json`
        );
        setChampions(Object.values(response.data.data));
      } catch (error) {
        console.error("Erreur lors de la récupération des champions :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChampions();
  }, []);

  const handleChampionClick = (champion) => {
    setSelectedChampion(champion);
    setModalVisible(true);
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

        {/* Modal pour afficher les informations détaillées du champion */}
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
                    {/* Vérification de spells */}
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
  spellContainer: {
    marginBottom: 8,
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
