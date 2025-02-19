import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Animated,
} from "react-native";

const RARITY_MAPPING = {
  LEGENDARY: 4, // Items légendaires avec les meilleurs stats et effets
  EPIC: 3, // Items avec stats additionnelles et/ou effets
  BASIC: 2, // Items avec une seule stat ou effet
  STARTER: 1, // Items de départ
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
  const [selectedItem, setSelectedItem] = useState(null); // Item sélectionné pour la vue détaillée
  const [addedItems, setAddedItems] = useState([]); // Liste des items ajoutés
  const spinValue = new Animated.Value(0); // Animation de rotation

  // Fonction pour animer la rotation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const startSpinAnimation = () => {
    Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
    ).start();
  };

  const getItemRarity = (item) => {
    // Items de départ (Starter)
    if (
        item.tags?.includes("Starter") ||
        item.description.toLowerCase().includes("starting item") ||
        (item.gold.total <= 500 && !item.from)
    ) {
      return "STARTER";
    }

    // Items légendaires
    if (
        !item.into &&
        item.from &&
        (item.description.includes("<passive>") ||
            item.description.includes("<active>")) &&
        item.gold.total >= 2500
    ) {
      return "LEGENDARY";
    }

    // Items épiques
    if (
        item.from &&
        (item.description.includes("<passive>") ||
            item.description.includes("<active>") ||
            item.description.match(/<stats>.*<\/stats>/s)?.[0]?.match(/\+/g)?.length >
            1)
    ) {
      return "EPIC";
    }

    // Items basiques par défaut
    return "BASIC";
  };

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const versionsResponse = await fetch(
            "https://ddragon.leagueoflegends.com/api/versions.json"
        );
        const versions = await versionsResponse.json();
        const latestVersion = versions[0];
        setCurrentVersion(latestVersion);

        const itemsResponse = await fetch(
            `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/fr_FR/item.json`
        );
        const itemsData = await itemsResponse.json();

        const uniqueItems = new Map();
        const uniqueClasses = new Set(["all"]);

        Object.entries(itemsData.data).forEach(([id, item]) => {
          const availableOnSR = item.maps && item.maps["11"] === true;
          const isPurchasable = item.gold && item.gold.purchasable === true;
          const isNotSpecialItem =
              !item.tags?.includes("Trinket") &&
              !item.requiredChampion &&
              !item.requiredAlly;
          const hasValidData =
              item.description && item.image && item.image.full && item.name;

          if (availableOnSR && isPurchasable && isNotSpecialItem && hasValidData) {
            const normalizedName = item.name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

            if (!uniqueItems.has(normalizedName) || uniqueItems.get(normalizedName).id < id) {
              const itemWithRarity = {
                ...item,
                id,
                rarity: getItemRarity(item),
              };
              uniqueItems.set(normalizedName, itemWithRarity);

              item.tags?.forEach((tag) => uniqueClasses.add(tag));
            }
          }
        });

        const sortedItems = Array.from(uniqueItems.values()).sort((a, b) => {
          const rarityDiff = RARITY_MAPPING[b.rarity] - RARITY_MAPPING[a.rarity];
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

  useEffect(() => {
    let result = [...items];

    if (selectedClass !== "all") {
      result = result.filter((item) => item.tags?.includes(selectedClass));
    }

    if (searchQuery) {
      const query = searchQuery
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      result = result.filter((item) =>
          item.name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .includes(query)
      );
    }

    setFilteredItems(result);
  }, [searchQuery, selectedClass, items]);

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case "LEGENDARY":
        return "#ffd700"; // Or
      case "EPIC":
        return "#c931db"; // Violet
      case "BASIC":
        return "#87ceeb"; // Bleu clair
      case "STARTER":
        return "#90EE90"; // Vert clair
      default:
        return "#ffffff";
    }
  };


  const stripHtmlTags = (html: string) => {
    return html
        .replace(/<\/?[^>]+(>|$)/g, "") // Supprime toutes les balises HTML
        .replace(/(\r\n|\n|\r)/gm, "\n") // Conserve les retours à la ligne
        .trim();
  };

  const handleItemPress = (item) => {
    setSelectedItem(item);
  };

  const handleAddItem = (itemId) => {
    if (!addedItems.includes(itemId)) {
      const item = items.find((i) => i.id === itemId);
      if (item.rarity === "LEGENDARY" && addedItems.filter((id) => items.find((i) => i.id === id).rarity === "LEGENDARY").length >= 6) {
        alert("Vous ne pouvez pas ajouter plus de 6 items légendaires.");
        return;
      }
      setAddedItems([...addedItems, itemId]);
      startSpinAnimation();
    }
  };

  const handleRemoveItem = (itemId) => {
    setAddedItems(addedItems.filter((id) => id !== itemId));
  };

  const renderItemDetails = () => {
    if (!selectedItem) return null;

    return (
        <View style={styles.detailsContainer}>
          <Image
              source={{
                uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${selectedItem.image.full}`,
              }}
              style={styles.detailsImage}
          />
          <Text style={styles.detailsTitle}>{selectedItem.name}</Text>
          <Text style={styles.detailsPrice}>{selectedItem.gold.total}g</Text>
          <Text style={styles.detailsDescription}>
            {stripHtmlTags(selectedItem.description)}
          </Text>
          <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddItem(selectedItem.id)}
          >
            <Text style={styles.addButtonText}>Ajouter</Text>
          </TouchableOpacity>
          <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedItem(null)}
          >
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
    );
  };

  const renderBuildPanel = () => {
    return (
        <View style={styles.buildPanel}>
          <Text style={styles.buildPanelTitle}>Votre Build</Text>
          <View style={styles.buildItemsContainer}>
            {addedItems.map((itemId) => {
              const item = items.find((i) => i.id === itemId);
              return (
                  <TouchableOpacity
                      key={itemId}
                      onPress={() => handleRemoveItem(itemId)}
                  >
                    <Image
                        source={{
                          uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${item.image.full}`,
                        }}
                        style={styles.buildItemImage}
                    />
                  </TouchableOpacity>
              );
            })}
          </View>
        </View>
    );
  };

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

  return (
      <View style={styles.container}>
        {renderBuildPanel()}
        <ScrollView style={styles.itemsScrollView}>
          <Text style={styles.title}>Sélectionnez vos items ({filteredItems.length})</Text>

          <TextInput
              style={styles.searchBar}
              placeholder="Rechercher un item..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
          />

          <ScrollView
              horizontal
              style={styles.classFiltersContainer}
              showsHorizontalScrollIndicator={false}
          >
            {classes.map((classTag) => (
                <TouchableOpacity
                    key={classTag}
                    style={[
                      styles.classFilter,
                      selectedClass === classTag && styles.classFilterSelected,
                    ]}
                    onPress={() => setSelectedClass(classTag)}
                >
                  <Text
                      style={[
                        styles.classFilterText,
                        selectedClass === classTag && styles.classFilterTextSelected,
                      ]}
                  >
                    {classTag === "all" ? "Tous" : classTag}
                  </Text>
                </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.itemsContainer}>
            {filteredItems.map((item) => (
                <TouchableOpacity
                    key={item.id}
                    onPress={() => handleItemPress(item)}
                >
                  <Animated.View
                      style={[
                        styles.itemContainer,
                        {
                          borderColor: addedItems.includes(item.id)
                              ? "#00ffff"
                              : getRarityColor(item.rarity),
                          transform: addedItems.includes(item.id)
                              ? [{ rotate: spin }]
                              : [],
                        },
                      ]}
                  >
                    <Image
                        source={{
                          uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${item.image.full}`,
                        }}
                        style={[
                          styles.itemImage,
                          {
                            borderColor: addedItems.includes(item.id)
                                ? "#00ffff"
                                : getRarityColor(item.rarity),
                          },
                        ]}
                    />
                    <Text
                        style={[
                          styles.itemName,
                          { color: getRarityColor(item.rarity) },
                        ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.itemPrice}>{item.gold.total}g</Text>
                  </Animated.View>
                </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        {renderItemDetails()}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e1e",
  },
  buildPanel: {
    padding: 20,
    backgroundColor: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#666",
  },
  buildPanelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffcc00",
    marginBottom: 10,
  },
  buildItemsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  buildItemImage: {
    width: 50,
    height: 50,
    margin: 5,
    borderRadius: 5,
  },
  itemsScrollView: {
    flex: 1,
    padding: 20,
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
  detailsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1e1e1e",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#666",
  },
  detailsImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    alignSelf: "center",
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffcc00",
    marginTop: 10,
    textAlign: "center",
  },
  detailsPrice: {
    fontSize: 16,
    color: "#ffcc00",
    marginTop: 5,
    textAlign: "center",
  },
  detailsDescription: {
    fontSize: 14,
    color: "#fff",
    marginTop: 10,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: "#00ffff",
    padding: 10,
    borderRadius: 5,
    marginTop: 15,
    alignSelf: "center",
  },
  addButtonText: {
    color: "#000",
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#ff4444",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ItemSelectionScreen;