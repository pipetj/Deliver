import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity } from "react-native";

const RARITY_ORDER = {
  "COMMON": 1,
  "EPIC": 2,
  "LEGENDARY": 3
};

const ItemSelectionScreen = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [currentVersion, setCurrentVersion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [classes, setClasses] = useState([]);

  // Fonction pour déterminer la rareté d'un item basée sur son prix
  const getItemRarity = (item) => {
    const price = item.gold.total;
    if (price >= 3000) return "LEGENDARY";
    if (price >= 2000) return "EPIC";
    return "COMMON";
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const versionsResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await versionsResponse.json();
        const latestVersion = versions[0];
        setCurrentVersion(latestVersion);

        const itemsResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/fr_FR/item.json`);
        const itemsData = await itemsResponse.json();

        const uniqueItems = new Map();
        const uniqueClasses = new Set(["all"]);

        // Premier filtrage des items
        Object.entries(itemsData.data).forEach(([id, item]) => {
          const availableOnSR = item.maps && item.maps["11"] === true;
          const isPurchasable = item.gold && item.gold.purchasable === true;
          const isNotSpecialItem = !item.tags?.includes("Trinket") && 
                                 !item.requiredChampion && 
                                 !item.requiredAlly;
          const hasValidData = item.description && 
                             item.image && 
                             item.image.full && 
                             item.name;

          if (availableOnSR && isPurchasable && isNotSpecialItem && hasValidData) {
            const normalizedName = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            if (!uniqueItems.has(normalizedName) || uniqueItems.get(normalizedName).id < id) {
              // Ajouter la rareté à l'item
              const itemWithRarity = {
                ...item,
                id,
                rarity: getItemRarity(item)
              };
              uniqueItems.set(normalizedName, itemWithRarity);
              
              // Collecter les classes uniques
              item.tags?.forEach(tag => uniqueClasses.add(tag));
            }
          }
        });

        // Trier les items par rareté puis par prix
        const sortedItems = Array.from(uniqueItems.values()).sort((a, b) => {
          const rarityDiff = RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
          return rarityDiff !== 0 ? rarityDiff : b.gold.total - a.gold.total;
        });

        setItems(sortedItems);
        setFilteredItems(sortedItems);
        setClasses(Array.from(uniqueClasses));
      } catch (err) {
        console.error("Erreur lors de la récupération des items:", err);
        setError("Erreur lors du chargement des données. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Fonction pour filtrer les items
  useEffect(() => {
    let result = [...items];
    
    // Filtrer par classe
    if (selectedClass !== "all") {
      result = result.filter(item => item.tags?.includes(selectedClass));
    }
    
    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      result = result.filter(item => 
        item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query)
      );
    }
    
    setFilteredItems(result);
  }, [searchQuery, selectedClass, items]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#ffcc00" />
        <Text style={styles.loadingText}>Chargement des items...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "LEGENDARY": return "#ff8c00";
      case "EPIC": return "#c931db";
      case "COMMON": return "#ffffff";
      default: return "#ffffff";
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Sélectionnez vos items ({filteredItems.length})</Text>
      
      {/* Barre de recherche */}
      <TextInput
        style={styles.searchBar}
        placeholder="Rechercher un item..."
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Filtres de classe */}
      <ScrollView horizontal style={styles.classFiltersContainer} showsHorizontalScrollIndicator={false}>
        {classes.map((classTag) => (
          <TouchableOpacity
            key={classTag}
            style={[
              styles.classFilter,
              selectedClass === classTag && styles.classFilterSelected
            ]}
            onPress={() => setSelectedClass(classTag)}
          >
            <Text style={[
              styles.classFilterText,
              selectedClass === classTag && styles.classFilterTextSelected
            ]}>
              {classTag === "all" ? "Tous" : classTag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.itemsContainer}>
        {filteredItems.map((item) => (
          <View key={item.id} style={[styles.itemContainer, { borderColor: getRarityColor(item.rarity) }]}>
            <Image
              source={{
                uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${item.image.full}`
              }}
              style={[styles.itemImage, { borderColor: getRarityColor(item.rarity) }]}
            />
            <Text style={[styles.itemName, { color: getRarityColor(item.rarity) }]}>{item.name}</Text>
            <Text style={styles.itemPrice}>{item.gold.total}g</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#1e1e1e",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffcc00",
    textAlign: "center",
    marginBottom: 20,
  },
  searchBar: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ffcc00",
  },
  classFiltersContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },
  classFilter: {
    padding: 8,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "#666",
  },
  classFilterSelected: {
    backgroundColor: "#ffcc00",
    borderColor: "#ffcc00",
  },
  classFilterText: {
    color: "#fff",
  },
  classFilterTextSelected: {
    color: "#000",
  },
  itemsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
  },
  itemContainer: {
    alignItems: "center",
    margin: 10,
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    width: 100,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 5,
    borderWidth: 2,
  },
  itemName: {
    marginTop: 5,
    fontSize: 14,
    textAlign: "center",
    height: 40,
  },
  itemPrice: {
    color: "#ffcc00",
    fontSize: 12,
    marginTop: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
    color: "#ffcc00",
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
    color: "#ff4444",
  },
});

export default ItemSelectionScreen;