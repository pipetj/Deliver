import React, { useEffect, useState } from "react";
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, Pressable, TextInput, Dimensions } from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

// Définition des dimensions en dehors du composant
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Calculs responsifs basés sur la taille de l'écran
const getResponsiveSize = (size) => screenWidth * (size / 975); // Basé sur un design pour iPhone 8
const columnCount = screenWidth > 700 ? 4 : 3; // Plus de colonnes sur grand écran
const isMobile = screenWidth <= 600; // Condition pour détecter un petit écran

const ChampionsList = () => {
  const [champions, setChampions] = useState([]);
  const [filteredChampions, setFilteredChampions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChampion, setSelectedChampion] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [menuOpen, setMenuOpen] = useState(false); // État pour contrôler le menu burger
  const [version, setVersion] = useState(null); // Ajout de la variable version
  const navigation = useNavigation();

  useEffect(() => {
    // Fonction pour récupérer la version la plus récente
    const fetchLatestVersion = async () => {
      try {
        const response = await axios.get("https://ddragon.leagueoflegends.com/api/versions.json");
        const latestVersion = response.data[0]; // La version la plus récente est toujours en premier
        setVersion(latestVersion); // Définir la version ici
      } catch (error) {
        console.error("Erreur lors de la récupération de la version :", error);
      }
    };

    fetchLatestVersion();
  }, []); // Appel au début pour récupérer la version

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

  const roles = ["", "Assassin", "Fighter", "Mage", "Marksman", "Support", "Tank"];

  if (loading) return <ActivityIndicator size="large" color="#0000ff" />;

  return (
      <View style={styles.container}>
        {/* Menu burger au-dessus de la liste */}
        {isMobile ? (
            <Pressable onPress={() => setMenuOpen(!menuOpen)} style={styles.menuButton}>
              <Text style={styles.menuButtonText}>☰</Text>
            </Pressable>
        ) : (
            // Menu classique pour grand écran
            <View style={styles.menu}>
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
            </View>
        )}

        {/* Menu burger qui apparaît lorsque le menu burger est ouvert */}
        {menuOpen && isMobile && (
            <View style={styles.burgerMenu}>
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
            </View>
        )}

        {/* Liste des champions */}
        <FlatList
            data={filteredChampions}
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
            contentContainerStyle={[styles.flatListContainer, menuOpen && { marginTop: getResponsiveSize(220) }]}
            showsVerticalScrollIndicator={false}
        />
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1c1c1e",
    padding: getResponsiveSize(1),
    alignItems: "center",
  },
  menuButton: {
    position: "absolute",
    top: 20,
    left: 20,
    padding: 10,
    backgroundColor: "#fbcd03",
    borderRadius: 8,
    zIndex: 10,
  },
  menuButtonText: {
    fontSize: 30,
    color: "#1c1c1e",
  },
  title: {
    fontSize: getResponsiveSize(28),
    fontWeight: "bold",
    color: "#fbcd03", /* Couleur principale pour le titre */
    textAlign: "center",
    marginBottom: getResponsiveSize(20),
    marginTop: getResponsiveSize(10),
  },
  menu: {
    backgroundColor: "#2c2c2e",
    width: '100%',
    height: getResponsiveSize(190),
    padding: getResponsiveSize(15),
    borderRadius: 10,
    marginBottom: getResponsiveSize(15),
  },
  searchBar: {
    backgroundColor: "#fbcd03", /* Couleur principale pour la barre de recherche */
    padding: getResponsiveSize(12),
    borderRadius: 10,
    marginBottom: getResponsiveSize(15),
    color: "#1c1c1e", /* Texte sombre */
    width: "90%",
    textAlign: "center",
    fontSize: getResponsiveSize(16),
  },
  roleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: getResponsiveSize(20),
  },
  roleButton: {
    backgroundColor: "#444",
    paddingVertical: getResponsiveSize(10),
    paddingHorizontal: getResponsiveSize(15),
    borderRadius: 8,
    margin: getResponsiveSize(5),
  },
  selectedRole: {
    backgroundColor: "#fbcd03",
  },
  roleText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: getResponsiveSize(14),
  },
  flatListContainer: {
    paddingBottom: getResponsiveSize(20),
    alignItems: 'center',
  },
  championContainer: {
    alignItems: "center",
    margin: screenWidth * 0.02,
    backgroundColor: "#2c2c2e",
    padding: screenWidth * 0.03,
    borderRadius: 15,
    width: screenWidth / columnCount - (screenWidth * 0.06),
    elevation: 5,
    shadowColor: "#fbcd03",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 3.25,
    shadowRadius: 3.84,
  },
  championImage: {
    width: screenWidth / columnCount - (screenWidth * 0.12),
    height: screenWidth / columnCount - (screenWidth * 0.12),
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
});

export default ChampionsList;
