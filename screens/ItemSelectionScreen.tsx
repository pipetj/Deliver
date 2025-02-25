import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  Dimensions,
  SafeAreaView,
} from "react-native";

// Constantes pour les catégories et limitations
const MAX_ITEMS = 6;
const EXCLUDED_ITEMS = ["3070", "3040"]; // IDs de la Promesse Empyrean et Protège-bras du savant brisé
const UNIQUE_CATEGORIES = ["Botte", "Consommable"];
const ITEMS_CATEGORIES = ["Mage", "Assassin", "Tank", "Support", "Tireur", "Combattant", "Botte", "Consommable"];
const RARITY_ORDER = ["LEGENDARY", "EPIC", "BASIC", "STARTER"];

const ItemSelectionScreen = ({ navigation, route }) => {
  const { championId, onSaveBuild } = route.params || {};
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [currentVersion, setCurrentVersion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState(["all", ...ITEMS_CATEGORIES]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [addedItems, setAddedItems] = useState([]);
  
  const screenWidth = Dimensions.get("window").width;
  const itemWidth = screenWidth < 400 ? (screenWidth - 60) / 3 : 100;
  
  // Fonction améliorée pour déterminer la catégorie d'un item en se basant directement sur les tags de l'API
  const getItemCategory = useCallback((item) => {
    // Commencer par vérifier les cas spéciaux
    if (item.tags?.includes("Boots")) {
      return "Botte";
    } 
    if (item.tags?.includes("Consumable")) {
      return "Consommable";
    }
    
    // Cas particulier des Berserker - vérifier par ID ou nom
    if (item.id === "3006" || item.name.includes("Berserker")) {
      return "Botte";
    }
    
    // Vérification par tags comme défini dans l'API
    if (item.tags?.includes("SpellDamage")) {
      return "Mage";
    } 
    if (item.tags?.includes("Stealth") || item.tags?.includes("CriticalStrike")) {
      return "Assassin";
    } 
    if (item.tags?.includes("Armor") || item.tags?.includes("Health") || item.tags?.includes("SpellBlock")) {
      return "Tank";
    } 
    if (item.tags?.includes("ManaRegen") || item.tags?.includes("HealthRegen") || item.tags?.includes("GoldPer")) {
      return "Support";
    } 
    if (item.tags?.includes("Damage") && item.tags?.includes("AttackSpeed")) {
      return "Tireur";
    } 
    if (item.tags?.includes("Damage") || item.tags?.includes("LifeSteal")) {
      return "Combattant";
    }
    
    // Vérification basée sur la description pour certains cas particuliers
    if (item.description?.toLowerCase().includes("mage") || item.description?.toLowerCase().includes("ability power")) {
      return "Mage";
    }
    if (item.description?.toLowerCase().includes("assassin") || item.description?.toLowerCase().includes("lethality")) {
      return "Assassin";
    }
    if (item.description?.toLowerCase().includes("tank") || item.description?.toLowerCase().includes("health") && item.description?.toLowerCase().includes("resist")) {
      return "Tank";
    }
    if (item.description?.toLowerCase().includes("support") || item.description?.toLowerCase().includes("heal and shield")) {
      return "Support";
    }
    if (item.description?.toLowerCase().includes("marksman") || item.description?.toLowerCase().includes("attack speed") && item.description?.toLowerCase().includes("critical")) {
      return "Tireur";
    }
    if (item.description?.toLowerCase().includes("fighter") || item.description?.toLowerCase().includes("bruiser")) {
      return "Combattant";
    }
    
    // Catégorie par défaut basée sur les statistiques de l'item
    if (item.stats?.FlatMagicDamageMod) {
      return "Mage";
    }
    if (item.stats?.FlatArmorMod || item.stats?.FlatHPPoolMod) {
      return "Tank";
    }
    if (item.stats?.FlatPhysicalDamageMod && item.stats?.PercentAttackSpeedMod) {
      return "Tireur";
    }
    if (item.stats?.FlatPhysicalDamageMod) {
      return "Combattant";
    }
    
    // Si aucune catégorie n'est trouvée, on met par défaut en Support
    return "Support";
  }, []);

  // Fonction pour déterminer la rareté d'un item basée sur sa complétude
  const getItemRarity = useCallback((item) => {
    // Items légendaires (complétés sans évolution supérieure)
    if (item.from && item.from.length > 0 && (!item.into || item.into.length === 0)) {
      return "LEGENDARY";
    }
    // Items épiques (composants intermédiaires)
    else if (item.from && item.from.length > 0 && item.into && item.into.length > 0) {
      return "EPIC";
    }
    // Items basiques (composants de base)
    else if ((!item.from || item.from.length === 0) && item.into && item.into.length > 0) {
      return "BASIC";
    }
    // Items de départ
    else if (item.gold?.base < 500 && item.gold?.total < 500) {
      return "STARTER";
    }
    // Autres
    else {
      return "BASIC";
    }
  }, []);

  // Vérifier si un item est incompatible avec les items déjà ajoutés
  const isItemIncompatible = useCallback((item) => {
    // Règle: Un seul type de bottes
    if ((item.tags?.includes("Boots") || item.id === "3006") && addedItems.some(id => {
      const addedItem = items.find(i => i.id === id);
      return addedItem?.tags?.includes("Boots") || addedItem?.id === "3006";
    })) {
      return true;
    }
    
    // Vérification des règles d'items Uniques selon l'API
    const hasUniqueTag = item.description?.includes("<unique>") || item.description?.includes("UNIQUE");
    if (hasUniqueTag) {
      // Si c'est un item unique de même groupe, vérifions s'il y en a déjà un
      for (const addedItemId of addedItems) {
        const addedItem = items.find(i => i.id === addedItemId);
        if (addedItem && addedItem.description?.includes("<unique>") && 
            (item.name.includes(addedItem.name.split(" ")[0]) || // Même préfixe d'item
            (addedItem.from && item.from && JSON.stringify(addedItem.from) === JSON.stringify(item.from)))) { // Mêmes composants
          return true;
        }
      }
    }
    
    return false;
  }, [addedItems, items]);

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

        Object.entries(itemsData.data).forEach(([id, item]) => {
          // Exclure explicitement les items spécifiés
          if (EXCLUDED_ITEMS.includes(id)) {
            return;
          }
          
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
              const itemCategory = getItemCategory({...item, id});
              const itemWithRarity = {
                ...item,
                id,
                rarity: getItemRarity(item),
                category: itemCategory
              };
              uniqueItems.set(normalizedName, itemWithRarity);
            }
          }
        });

        const sortedItems = Array.from(uniqueItems.values()).sort((a, b) => {
          // Trier d'abord par catégorie
          const categoryComparison = ITEMS_CATEGORIES.indexOf(a.category) - ITEMS_CATEGORIES.indexOf(b.category);
          if (categoryComparison !== 0) return categoryComparison;
          
          // Ensuite par rareté
          const rarityA = RARITY_ORDER.indexOf(a.rarity);
          const rarityB = RARITY_ORDER.indexOf(b.rarity);
          if (rarityA !== rarityB) return rarityA - rarityB;
          
          // Enfin par prix
          return b.gold.total - a.gold.total;
        });

        setItems(sortedItems);
        setFilteredItems(sortedItems);
      } catch (err) {
        console.error("Erreur lors de la récupération des items:", err);
        setError("Erreur lors du chargement des données. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [getItemCategory, getItemRarity]);

  useEffect(() => {
    let result = [...items];

    if (selectedCategory !== "all") {
      result = result.filter((item) => item.category === selectedCategory);
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
  }, [searchQuery, selectedCategory, items]);

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

  const stripHtmlTags = (html) => {
    return html
      .replace(/<\/?[^>]+(>|$)/g, "") // Supprime toutes les balises HTML
      .replace(/(\r\n|\n|\r)/gm, "\n") // Conserve les retours à la ligne
      .trim();
  };

  const handleItemPress = (item) => {
    setSelectedItem(item);
  };

  const handleAddItem = (itemId) => {
    if (addedItems.includes(itemId)) {
      Alert.alert("Information", "Cet item est déjà dans votre build.");
      return;
    }
    
    if (addedItems.length >= MAX_ITEMS) {
      Alert.alert("Limite atteinte", "Vous ne pouvez pas avoir plus de 6 items dans votre build.");
      return;
    }
    
    const item = items.find((i) => i.id === itemId);
    
    if (isItemIncompatible(item)) {
      Alert.alert("Item incompatible", "Cet item ne peut pas être ajouté car il est incompatible avec votre build actuel.");
      return;
    }
    
    setAddedItems([...addedItems, itemId]);
    setSelectedItem(null); // Ferme la fenêtre détaillée après ajout
  };

  const handleRemoveItem = (itemId) => {
    setAddedItems(addedItems.filter((id) => id !== itemId));
  };

  const handleSaveBuild = () => {
    if (onSaveBuild) {
      onSaveBuild(addedItems);
      navigation.goBack();
    } else {
      Alert.alert("Succès", "Build sauvegardé avec succès.");
    }
  };

  const renderItemDetails = () => {
    if (!selectedItem) return null;

    const rarityLabel = {
      "LEGENDARY": "Légendaire",
      "EPIC": "Épique",
      "BASIC": "Basique",
      "STARTER": "Débutant"
    }[selectedItem.rarity];

    return (
      <View style={styles.detailsContainer}>
        <ScrollView style={{ maxHeight: 400 }}>
          <View style={styles.detailsContent}>
            <Image
              source={{
                uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${selectedItem.image.full}`,
              }}
              style={styles.detailsImage}
            />
            <Text style={styles.detailsTitle}>{selectedItem.name}</Text>
            <Text style={styles.detailsPrice}>{selectedItem.gold.total}g</Text>
            <Text style={styles.detailsCategory}>
              Catégorie: <Text style={{ color: "#ffcc00" }}>{selectedItem.category}</Text>
            </Text>
            <Text style={styles.detailsRarity}>
              Rareté: <Text style={{ color: getRarityColor(selectedItem.rarity) }}>
                {rarityLabel}
              </Text>
            </Text>
            <Text style={styles.detailsDescription}>
              {stripHtmlTags(selectedItem.description)}
            </Text>
          </View>
        </ScrollView>
        
        <View style={styles.buttonContainer}>
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
      </View>
    );
  };

  const renderBuildPanel = () => {
    return (
      <View style={styles.buildPanel}>
        <View style={styles.buildPanelHeader}>
          <Text style={styles.buildPanelTitle}>Votre Build ({addedItems.length}/6)</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveBuild}
          >
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buildItemsContainer}>
          {Array(MAX_ITEMS).fill(0).map((_, index) => {
            const itemId = addedItems[index];
            const item = itemId ? items.find((i) => i.id === itemId) : null;
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.buildItemSlot}
                onPress={() => item && handleRemoveItem(itemId)}
              >
                {item ? (
                  <Image
                    source={{
                      uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${item.image.full}`,
                    }}
                    style={[
                      styles.buildItemImage,
                      { borderColor: getRarityColor(item.rarity) }
                    ]}
                  />
                ) : (
                  <View style={styles.emptySlot}>
                    <Text style={styles.emptySlotText}>+</Text>
                  </View>
                )}
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
    <SafeAreaView style={styles.container}>
      {renderBuildPanel()}
      
      <View style={styles.filtersContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Rechercher un item..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <ScrollView
          horizontal
          style={styles.categoryFiltersContainer}
          showsHorizontalScrollIndicator={false}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryFilter,
                selectedCategory === category && styles.categoryFilterSelected,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryFilterText,
                  selectedCategory === category && styles.categoryFilterTextSelected,
                ]}
              >
                {category === "all" ? "Tous" : category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      <ScrollView style={styles.itemsScrollView}>
        <Text style={styles.title}>
          {selectedCategory === "all" ? "Tous les items" : selectedCategory}
          {` (${filteredItems.length})`}
        </Text>

        <View style={styles.itemsContainer}>
          {filteredItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleItemPress(item)}
            >
              <View
                style={[
                  styles.itemContainer,
                  {
                    borderColor: addedItems.includes(item.id)
                      ? "#00ffff"
                      : getRarityColor(item.rarity),
                    width: itemWidth,
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
                  numberOfLines={2}
                >
                  {item.name}
                </Text>
                <Text style={styles.itemPrice}>{item.gold.total}g</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      {renderItemDetails()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e1e",
  },
  buildPanel: {
    padding: 10,
    backgroundColor: "#333",
    borderBottomWidth: 1,
    borderBottomColor: "#666",
  },
  buildPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  buildPanelTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffcc00",
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
  },
  buildItemsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  buildItemSlot: {
    width: 46,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
    margin: 2,
  },
  buildItemImage: {
    width: 42,
    height: 42,
    borderRadius: 4,
    borderWidth: 2,
  },
  emptySlot: {
    width: 42,
    height: 42,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#666",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  emptySlotText: {
    color: "#666",
    fontSize: 20,
  },
  filtersContainer: {
    padding: 10,
    backgroundColor: "#2a2a2a",
  },
  searchBar: {
    backgroundColor: "#333",
    color: "#fff",
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ffcc00",
    fontSize: 14,
  },
  categoryFiltersContainer: {
    flexDirection: "row",
    marginBottom: 5,
  },
  categoryFilter: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "#666",
  },
  categoryFilterSelected: {
    backgroundColor: "#ffcc00",
    borderColor: "#ffcc00",
  },
  categoryFilterText: {
    color: "#fff",
    fontSize: 12,
  },
  categoryFilterTextSelected: {
    color: "#000",
    fontWeight: "bold",
  },
  itemsScrollView: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffcc00",
    marginBottom: 15,
    marginTop: 5,
  },
  itemsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  itemContainer: {
    alignItems: "center",
    margin: 5,
    backgroundColor: "#333",
    padding: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 4,
    borderWidth: 2,
  },
  itemName: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
    height: 32,
  },
  itemPrice: {
    color: "#ffcc00",
    fontSize: 10,
    marginTop: 3,
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
    borderTopWidth: 1,
    borderTopColor: "#666",
    maxHeight: "60%",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  detailsContent: {
    padding: 15,
    alignItems: "center",
  },
  detailsImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    alignSelf: "center",
    borderWidth: 2,
    borderColor: "#ffcc00",
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffcc00",
    marginTop: 10,
    textAlign: "center",
  },
  detailsPrice: {
    fontSize: 14,
    color: "#ffcc00",
    marginTop: 4,
    textAlign: "center",
  },
  detailsCategory: {
    fontSize: 14,
    color: "#fff",
    marginTop: 6,
    textAlign: "center",
  },
  detailsRarity: {
    fontSize: 14,
    color: "#fff",
    marginTop: 2,
    textAlign: "center",
  },
  detailsDescription: {
    fontSize: 14,
    color: "#fff",
    marginTop: 12,
    textAlign: "left",
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#444",
  },
  addButton: {
    backgroundColor: "#00ffff",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: "40%",
    alignItems: "center",
  },
  addButtonText: {
    color: "#000",
    fontWeight: "bold",
  },
  closeButton: {
    backgroundColor: "#ff4444",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    width: "40%",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ItemSelectionScreen;