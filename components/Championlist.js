import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, Pressable, TextInput, Dimensions } from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "@/context/AuthContext";
import { addFavorite, removeFavorite, getFavorites } from "../api/api";

const { width: screenWidth } = Dimensions.get('window');
const getResponsiveSize = (size) => screenWidth * (size / 375);
const columnCount = screenWidth > 700 ? 4 : 3;
const isMobile = screenWidth <= 600;

const ChampionsList = () => {
  const [champions, setChampions] = useState([]);
  const [filteredChampions, setFilteredChampions] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [version, setVersion] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false); // Nouvel état pour le filtre favoris
  const navigation = useNavigation();
  const { token } = useContext(AuthContext);

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

    const fetchData = async () => {
      try {
        const [championsResponse, favoritesResponse] = await Promise.all([
          axios.get(`https://ddragon.leagueoflegends.com/cdn/${version}/data/fr_FR/champion.json`),
          getFavorites(token),
        ]);

        const championsData = Object.values(championsResponse.data.data);
        const championsWithDetails = await Promise.all(
            championsData.map(async (champion) => {
              const detailResponse = await axios.get(
                  `https://ddragon.leagueoflegends.com/cdn/${version}/data/fr_FR/champion/${champion.id}.json`
              );
              return detailResponse.data.data[champion.id];
            })
        );

        setChampions(championsWithDetails);
        setFilteredChampions(championsWithDetails);
        setFavorites(favoritesResponse.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [version, token]);

  useEffect(() => {
    const filtered = champions.filter(champion =>
        // Filtre de recherche (nom ou description)
        (champion.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            champion.blurb.toLowerCase().includes(searchQuery.toLowerCase())) &&
        // Filtre par rôle
        (selectedRole === "" || champion.tags.includes(selectedRole)) &&
        // Filtre par favoris (si activé)
        (!showFavoritesOnly || favorites.includes(champion.id))
    );
    setFilteredChampions(filtered);
  }, [searchQuery, selectedRole, showFavoritesOnly, champions, favorites]);

  const toggleFavorite = async (championId) => {
    try {
      if (favorites.includes(championId)) {
        await removeFavorite(token, championId);
        setFavorites(favorites.filter(id => id !== championId));
      } else {
        await addFavorite(token, championId);
        setFavorites([...favorites, championId]);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des favoris :", error);
    }
  };

  const handleChampionClick = (champion) => {
    navigation.navigate('ChampionDetail', { champion });
  };

  const roles = ["", "Assassin", "Fighter", "Mage", "Marksman", "Support", "Tank"];

  if (loading) return <ActivityIndicator size="large" color="#fbcd03" />;

  return (
      <View style={styles.container}>
        {/* Bouton Profil fixe en haut à droite */}
        <Pressable
            style={styles.profileButtonFixed}
            onPress={() => navigation.navigate("Profile")}
        >
          <Text style={styles.profileButtonText}>Profil</Text>
        </Pressable>

        {/* Menu burger ou classique */}
        {isMobile ? (
            <Pressable onPress={() => setMenuOpen(!menuOpen)} style={styles.menuButton}>
              <Text style={styles.menuButtonText}>☰</Text>
            </Pressable>
        ) : (
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
              {/* Bouton pour afficher uniquement les favoris */}
              <Pressable
                  style={[styles.favoriteFilterButton, showFavoritesOnly && styles.selectedFavoriteFilter]}
                  onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Text style={styles.favoriteFilterText}>
                  {showFavoritesOnly ? "Afficher tous" : "Favoris uniquement"}
                </Text>
              </Pressable>
            </View>
        )}
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
              {/* Bouton pour afficher uniquement les favoris dans le menu burger */}
              <Pressable
                  style={[styles.favoriteFilterButton, showFavoritesOnly && styles.selectedFavoriteFilter]}
                  onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
              >
                <Text style={styles.favoriteFilterText}>
                  {showFavoritesOnly ? "Afficher tous" : "Favoris uniquement"}
                </Text>
              </Pressable>
            </View>
        )}

        {/* Liste des champions avec marge en haut */}
        <FlatList
            data={filteredChampions}
            keyExtractor={(item) => item.id}
            numColumns={columnCount}
            renderItem={({ item }) => (
                <View style={styles.championContainer}>
                  <Pressable onPress={() => handleChampionClick(item)}>
                    <Image
                        source={{ uri: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${item.id}.png` }}
                        style={styles.championImage}
                    />
                    <Text style={styles.championName}>{item.name}</Text>
                  </Pressable>
                  <Pressable
                      style={styles.favoriteButton}
                      onPress={() => toggleFavorite(item.id)}
                  >
                    <Text style={styles.favoriteText}>{favorites.includes(item.id) ? "★" : "☆"}</Text>
                  </Pressable>
                </View>
            )}
            contentContainerStyle={[
              styles.flatListContainer,
              { paddingTop: menuOpen ? getResponsiveSize(260) : getResponsiveSize(60) }, // Ajusté pour le nouveau bouton
            ]}
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
    top: getResponsiveSize(10),
    left: getResponsiveSize(10),
    padding: getResponsiveSize(8),
    backgroundColor: "#fbcd03",
    borderRadius: 8,
    zIndex: 10,
  },
  menuButtonText: {
    fontSize: getResponsiveSize(24),
    color: "#1c1c1e",
  },
  title: {
    fontSize: getResponsiveSize(28),
    fontWeight: "bold",
    color: "#fbcd03",
    textAlign: "center",
    marginBottom: getResponsiveSize(20),
    marginTop: getResponsiveSize(10),
  },
  menu: {
    backgroundColor: "#2c2c2e",
    width: '100%',
    height: getResponsiveSize(230), // Ajusté pour le nouveau bouton
    padding: getResponsiveSize(15),
    borderRadius: 10,
    marginBottom: getResponsiveSize(15),
  },
  burgerMenu: {
    position: "absolute",
    top: getResponsiveSize(50),
    left: 0,
    right: 0,
    backgroundColor: "#2c2c2e",
    padding: getResponsiveSize(15),
    borderRadius: 10,
    zIndex: 10,
  },
  searchBar: {
    backgroundColor: "#fbcd03",
    padding: getResponsiveSize(12),
    borderRadius: 10,
    marginBottom: getResponsiveSize(15),
    color: "#1c1c1e",
    width: "90%",
    textAlign: "center",
    fontSize: getResponsiveSize(16),
  },
  roleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: getResponsiveSize(10),
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
  favoriteFilterButton: {
    backgroundColor: "#444",
    paddingVertical: getResponsiveSize(10),
    paddingHorizontal: getResponsiveSize(15),
    borderRadius: 8,
    marginTop: getResponsiveSize(10),
    alignSelf: "center",
  },
  selectedFavoriteFilter: {
    backgroundColor: "#fbcd03",
  },
  favoriteFilterText: {
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
  favoriteButton: {
    marginTop: getResponsiveSize(5),
  },
  favoriteText: {
    fontSize: getResponsiveSize(20),
    color: "#fbcd03",
  },
  profileButtonFixed: {
    position: "absolute",
    top: getResponsiveSize(10),
    right: getResponsiveSize(10),
    backgroundColor: "#fbcd03",
    paddingVertical: getResponsiveSize(8),
    paddingHorizontal: getResponsiveSize(12),
    borderRadius: 8,
    zIndex: 10,
  },
  profileButtonText: {
    color: "#1c1c1e",
    fontSize: getResponsiveSize(14),
    fontWeight: "bold",
  },
});

export default ChampionsList;