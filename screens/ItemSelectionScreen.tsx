import React, { useEffect, useState, useCallback, useContext } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Pressable,
  Alert,
  Dimensions,
  SafeAreaView,
  Animated,
} from "react-native";
import { AuthContext } from '../context/AuthContext';
import { createBuild, updateBuild } from '../api/api';

// Types
interface Item {
  id: string;
  name: string;
  description: string;
  image: { full: string };
  gold: { total: number; base: number; purchasable: boolean };
  tags: string[];
  from?: string[];
  into?: string[];
  maps: { [key: string]: boolean };
  stats: { [key: string]: number };
  requiredChampion?: string;
  requiredAlly?: string;
  category?: string;
  rarity?: string;
}

interface Props {
  navigation: any;
  route: { params?: { championId?: string; buildId?: string; initialItems?: string[]; onSaveBuild?: (items: string[]) => void } };
}

// Constantes
const MAX_ITEMS = 6;
const EXCLUDED_ITEMS = ["3070", "3040"];
const UNIQUE_CATEGORIES = ["Botte", "Consommable"];
const ITEMS_CATEGORIES = ["Mage", "Assassin", "Tank", "Support", "Tireur", "Combattant", "Botte", "Consommable"];
const RARITY_ORDER = ["LEGENDARY", "EPIC", "BASIC", "STARTER"];

const ItemSelectionScreen: React.FC<Props> = ({ navigation, route }) => {
  const { championId, onSaveBuild, buildId, initialItems } = route.params || {};
  const { token } = useContext(AuthContext);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories] = useState<string[]>(["all", ...ITEMS_CATEGORIES]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [addedItems, setAddedItems] = useState<string[]>(initialItems || []);
  const [isSaving, setIsSaving] = useState(false);
  const [rotation] = useState(new Animated.Value(0)); // Pour l'animation du dégradé

  const screenWidth = Dimensions.get("window").width;
  const itemWidth = screenWidth < 400 ? (screenWidth - 60) / 3 : 100;

  // Animation du dégradé
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000, // Durée d'un tour complet (2 secondes)
        useNativeDriver: true,
      })
    ).start();
  }, [rotation]);

  const getItemCategory = useCallback((item: Item): string => {
    if (item.tags?.includes("Boots") || item.id === "3006" || item.name.includes("Berserker")) return "Botte";
    if (item.tags?.includes("Consumable")) return "Consommable";
    if (item.tags?.includes("SpellDamage") || item.description?.toLowerCase().includes("mage")) return "Mage";
    if (item.tags?.includes("Stealth") || item.tags?.includes("CriticalStrike")) return "Assassin";
    if (item.tags?.includes("Armor") || item.tags?.includes("Health")) return "Tank";
    if (item.tags?.includes("ManaRegen") || item.tags?.includes("HealthRegen")) return "Support";
    if (item.tags?.includes("Damage") && item.tags?.includes("AttackSpeed")) return "Tireur";
    if (item.tags?.includes("Damage") || item.tags?.includes("LifeSteal")) return "Combattant";
    if (item.stats?.FlatMagicDamageMod) return "Mage";
    if (item.stats?.FlatArmorMod || item.stats?.FlatHPPoolMod) return "Tank";
    if (item.stats?.FlatPhysicalDamageMod && item.stats?.PercentAttackSpeedMod) return "Tireur";
    if (item.stats?.FlatPhysicalDamageMod) return "Combattant";
    return "Support";
  }, []);

  const getItemRarity = useCallback((item: Item): string => {
    if (item.from && item.from.length > 0 && (!item.into || item.into.length === 0)) return "LEGENDARY";
    if (item.from && item.from.length > 0 && item.into && item.into.length > 0) return "EPIC";
    if ((!item.from || item.from.length === 0) && item.into && item.into.length > 0) return "BASIC";
    if (item.gold?.base < 500 && item.gold?.total < 500) return "STARTER";
    return "BASIC";
  }, []);

  const isItemIncompatible = useCallback((item: Item): boolean => {
    if ((item.tags?.includes("Boots") || item.id === "3006") && 
        addedItems.some(id => {
          const addedItem = items.find(i => i.id === id);
          return addedItem?.tags?.includes("Boots") || addedItem?.id === "3006";
        })) {
      return true;
    }
    
    const hasUniqueTag = item.description?.includes("<unique>") || item.description?.includes("UNIQUE");
    if (hasUniqueTag) {
      for (const addedItemId of addedItems) {
        const addedItem = items.find(i => i.id === addedItemId);
        if (addedItem && addedItem.description?.includes("<unique>") && 
            (item.name.includes(addedItem.name.split(" ")[0]) || 
            (addedItem.from && item.from && JSON.stringify(addedItem.from) === JSON.stringify(item.from)))) {
          return true;
        }
      }
    }
    return false;
  }, [addedItems, items]);

  useEffect(() => {
    console.log("initialItems reçus :", initialItems);
    if (initialItems && addedItems.length === 0) {
      setAddedItems(initialItems);
    }
  }, [initialItems]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const versionsResponse = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
        const versions: string[] = await versionsResponse.json();
        const latestVersion = versions[0];
        setCurrentVersion(latestVersion);

        const itemsResponse = await fetch(
          `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/fr_FR/item.json`
        );
        const itemsData = await itemsResponse.json();

        const uniqueItems = new Map<string, Item>();

        Object.entries(itemsData.data).forEach(([id, item]: [string, any]) => {
          if (EXCLUDED_ITEMS.includes(id)) return;
          
          const availableOnSR = item.maps && item.maps["11"] === true;
          const isPurchasable = item.gold && item.gold.purchasable === true;
          const isNotSpecialItem = !item.tags?.includes("Trinket") && !item.requiredChampion && !item.requiredAlly;
          const hasValidData = item.description && item.image && item.image.full && item.name;

          if (availableOnSR && isPurchasable && isNotSpecialItem && hasValidData) {
            const normalizedName = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (!uniqueItems.has(normalizedName) || uniqueItems.get(normalizedName)!.id < id) {
              const itemCategory = getItemCategory({ ...item, id });
              const itemWithRarity: Item = {
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
          const categoryComparison = ITEMS_CATEGORIES.indexOf(a.category!) - ITEMS_CATEGORIES.indexOf(b.category!);
          if (categoryComparison !== 0) return categoryComparison;
          const rarityA = RARITY_ORDER.indexOf(a.rarity!);
          const rarityB = RARITY_ORDER.indexOf(b.rarity!);
          if (rarityA !== rarityB) return rarityA - rarityB;
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
      const query = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      result = result.filter((item) =>
        item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query)
      );
    }
    setFilteredItems(result);
  }, [searchQuery, selectedCategory, items]);

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case "LEGENDARY": return "#ffd700";
      case "EPIC": return "#c931db";
      case "BASIC": return "#87ceeb";
      case "STARTER": return "#90EE90";
      default: return "#ffffff";
    }
  };

  const stripHtmlTags = (html: string): string => {
    return html
      .replace(/<\/?[^>]+(>|$)/g, "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/\n\s*\n/g, "\n\n")
      .trim();
  };

  const handleItemPress = (item: Item) => setSelectedItem(item);

  const handleToggleItem = (itemId: string) => {
    if (addedItems.includes(itemId)) {
      // Retirer l'item
      setAddedItems(addedItems.filter((id) => id !== itemId));
    } else {
      // Ajouter l'item
      if (addedItems.length >= MAX_ITEMS) {
        Alert.alert("Limite atteinte", "Vous ne pouvez pas avoir plus de 6 items dans votre build.");
        return;
      }
      const item = items.find((i) => i.id === itemId);
      if (item && isItemIncompatible(item)) {
        Alert.alert("Item incompatible", "Cet item ne peut pas être ajouté car il est incompatible avec votre build actuel.");
        return;
      }
      setAddedItems([...addedItems, itemId]);
    }
    setSelectedItem(null);
  };

  const handleSaveBuild = async () => {
    if (!token || isSaving) {
      Alert.alert("Erreur", isSaving ? "Sauvegarde en cours..." : "Vous devez être connecté pour sauvegarder un build.");
      return;
    }
    
    if (addedItems.length === 0) {
      Alert.alert("Erreur", "Aucun item sélectionné pour le build.");
      return;
    }
    
    if (!buildId && !championId) {
      Alert.alert("Erreur", "Champion non spécifié pour créer un build.");
      return;
    }

    setIsSaving(true);
    try {
      const sortedItems = [...addedItems].sort((a, b) => {
        const itemA = items.find(i => i.id === a);
        const itemB = items.find(i => i.id === b);
        return RARITY_ORDER.indexOf(itemA?.rarity || "") - RARITY_ORDER.indexOf(itemB?.rarity || "");
      });
  
      if (buildId) {
        await updateBuild(token, buildId, JSON.stringify(sortedItems));
      } else {
        await createBuild(token, championId, JSON.stringify(sortedItems));
      }
  
      if (onSaveBuild) {
        onSaveBuild(sortedItems);
      }
      navigation.goBack();
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err.response?.data || err.message);
      Alert.alert("Erreur", "Impossible de sauvegarder le build. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderItemDetails = () => {
    if (!selectedItem) return null;
    const rarityLabel = {
      "LEGENDARY": "Légendaire",
      "EPIC": "Épique",
      "BASIC": "Basique",
      "STARTER": "Débutant"
    }[selectedItem.rarity!] || "Inconnu";

    const descriptionWithBreaks = stripHtmlTags(selectedItem.description);
    const descriptionLines = descriptionWithBreaks.split("\n").filter(line => line.trim() !== "");
    const isAdded = addedItems.includes(selectedItem.id);

    return (
      <View style={styles.detailsContainer}>
        <ScrollView style={{ maxHeight: 400 }}>
          <View style={styles.detailsContent}>
            <Image
              source={{ uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${selectedItem.image.full}` }}
              style={styles.detailsImage}
            />
            <Text style={styles.detailsTitle}>{selectedItem.name}</Text>
            <Text style={styles.detailsPrice}>{selectedItem.gold.total}g</Text>
            <Text style={styles.detailsCategory}>Catégorie: <Text style={{ color: "#ffcc00" }}>{selectedItem.category}</Text></Text>
            <Text style={styles.detailsRarity}>Rareté: <Text style={{ color: getRarityColor(selectedItem.rarity!) }}>{rarityLabel}</Text></Text>
            {descriptionLines.map((line, index) => (
              <Text key={index} style={styles.detailsDescription}>{line}</Text>
            ))}
          </View>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.addButton, isAdded && styles.removeButton]}
            onPress={() => handleToggleItem(selectedItem.id)}
          >
            <Text style={styles.addButtonText}>{isAdded ? "Retirer" : "Ajouter"}</Text>
          </Pressable>
          <Pressable style={styles.closeButton} onPress={() => setSelectedItem(null)}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderBuildPanel = () => {
    const sortedAddedItems = [...addedItems].sort((a, b) => {
      const itemA = items.find(i => i.id === a);
      const itemB = items.find(i => i.id === b);
      return RARITY_ORDER.indexOf(itemA?.rarity || "") - RARITY_ORDER.indexOf(itemB?.rarity || "");
    });

    const spin = rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <View style={styles.buildPanel}>
        <View style={styles.buildPanelHeader}>
          <Text style={styles.buildPanelTitle}>Votre Build ({addedItems.length}/6)</Text>
          <Pressable style={styles.saveButton} onPress={handleSaveBuild} disabled={isSaving}>
            <Text style={styles.saveButtonText}>{isSaving ? "Sauvegarde..." : "Sauvegarder"}</Text>
          </Pressable>
        </View>
        <View style={styles.buildItemsContainer}>
          {Array(MAX_ITEMS).fill(0).map((_, index) => {
            const itemId = sortedAddedItems[index];
            const item = itemId ? items.find((i) => i.id === itemId) : null;
            return (
              <Pressable key={index} style={styles.buildItemSlot} onPress={() => item && handleToggleItem(itemId)}>
                {item ? (
                  <Animated.View style={[styles.animatedBorder, { transform: [{ rotate: spin }] }]}>
                    <Image
                      source={{ uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${item.image.full}` }}
                      style={[styles.buildItemImage, { borderColor: getRarityColor(item.rarity!) }]}
                    />
                  </Animated.View>
                ) : (
                  <View style={styles.emptySlot}>
                    <Text style={styles.emptySlotText}>+</Text>
                  </View>
                )}
              </Pressable>
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
        <ScrollView horizontal style={styles.categoryFiltersContainer} showsHorizontalScrollIndicator={false}>
          {categories.map((category) => (
            <Pressable
              key={category}
              style={[styles.categoryFilter, selectedCategory === category && styles.categoryFilterSelected]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[styles.categoryFilterText, selectedCategory === category && styles.categoryFilterTextSelected]}>
                {category === "all" ? "Tous" : category}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <ScrollView style={styles.itemsScrollView}>
        <Text style={styles.title}>{selectedCategory === "all" ? "Tous les items" : selectedCategory} ({filteredItems.length})</Text>
        <View style={styles.itemsContainer}>
          {filteredItems.map((item) => (
            <Pressable key={item.id} onPress={() => handleItemPress(item)}>
              <View style={[styles.itemContainer, { borderColor: addedItems.includes(item.id) ? "#00ffff" : getRarityColor(item.rarity!), width: itemWidth }]}>
                <Image
                  source={{ uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${item.image.full}` }}
                  style={[styles.itemImage, { borderColor: addedItems.includes(item.id) ? "#00ffff" : getRarityColor(item.rarity!) }]}
                />
                <Text style={[styles.itemName, { color: getRarityColor(item.rarity!) }]} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemPrice}>{item.gold.total}g</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      {renderItemDetails()}
    </SafeAreaView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1e1e1e" },
  buildPanel: { padding: 10, backgroundColor: "#333", borderBottomWidth: 1, borderBottomColor: "#666" },
  buildPanelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  buildPanelTitle: { fontSize: 16, fontWeight: "bold", color: "#ffcc00" },
  saveButton: { backgroundColor: "#4CAF50", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5 },
  saveButtonText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  buildItemsContainer: { flexDirection: "row", justifyContent: "space-around" },
  buildItemSlot: { width: 46, height: 46, justifyContent: "center", alignItems: "center", margin: 2 },
  buildItemImage: { width: 42, height: 42, borderRadius: 4, borderWidth: 2 },
  animatedBorder: {
    width: 46,
    height: 46,
    borderRadius: 6,
    borderWidth: 2,
    borderStyle: "solid",
    borderColor: "transparent",
    backgroundImage: "linear-gradient(45deg, #ff0000, #00ff00, #ff0000)",
    backgroundOrigin: "border-box",
    justifyContent: "center",
    alignItems: "center",
  },
  emptySlot: { width: 42, height: 42, borderRadius: 4, borderWidth: 1, borderColor: "#666", borderStyle: "dashed", justifyContent: "center", alignItems: "center", backgroundColor: "rgba(255, 255, 255, 0.1)" },
  emptySlotText: { color: "#666", fontSize: 20 },
  filtersContainer: { padding: 10, backgroundColor: "#2a2a2a" },
  searchBar: { backgroundColor: "#333", color: "#fff", padding: 8, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: "#ffcc00", fontSize: 14 },
  categoryFiltersContainer: { flexDirection: "row", marginBottom: 5 },
  categoryFilter: { paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, borderRadius: 16, backgroundColor: "#333", borderWidth: 1, borderColor: "#666" },
  categoryFilterSelected: { backgroundColor: "#ffcc00", borderColor: "#ffcc00" },
  categoryFilterText: { color: "#fff", fontSize: 12 },
  categoryFilterTextSelected: { color: "#000", fontWeight: "bold" },
  itemsScrollView: { flex: 1, padding: 10 },
  title: { fontSize: 18, fontWeight: "bold", color: "#ffcc00", marginBottom: 15, marginTop: 5 },
  itemsContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  itemContainer: { alignItems: "center", margin: 5, backgroundColor: "#333", padding: 5, borderRadius: 8, borderWidth: 1 },
  itemImage: { width: 48, height: 48, borderRadius: 4, borderWidth: 2 },
  itemName: { marginTop: 4, fontSize: 12, textAlign: "center", height: 32 },
  itemPrice: { color: "#ffcc00", fontSize: 10, marginTop: 3 },
  loadingText: { marginTop: 10, fontSize: 16, textAlign: "center", color: "#ffcc00" },
  errorText: { marginTop: 10, fontSize: 16, textAlign: "center", color: "#ff4444" },
  detailsContainer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#1e1e1e", borderTopWidth: 1, borderTopColor: "#666", maxHeight: "60%", borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  detailsContent: { padding: 15, alignItems: "center" },
  detailsImage: { width: 80, height: 80, borderRadius: 8, alignSelf: "center", borderWidth: 2, borderColor: "#ffcc00" },
  detailsTitle: { fontSize: 18, fontWeight: "bold", color: "#ffcc00", marginTop: 10, textAlign: "center" },
  detailsPrice: { fontSize: 14, color: "#ffcc00", marginTop: 4, textAlign: "center" },
  detailsCategory: { fontSize: 14, color: "#fff", marginTop: 6, textAlign: "center" },
  detailsRarity: { fontSize: 14, color: "#fff", marginTop: 2, textAlign: "center" },
  detailsDescription: { fontSize: 14, color: "#fff", marginTop: 8, textAlign: "left", lineHeight: 20 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 15, borderTopWidth: 1, borderTopColor: "#444" },
  addButton: { backgroundColor: "#00ffff", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, width: "40%", alignItems: "center" },
  addButtonText: { color: "#000", fontWeight: "bold" },
  closeButton: { backgroundColor: "#ff4444", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, width: "40%", alignItems: "center" },
  closeButtonText: { color: "#fff", fontWeight: "bold" },
});

export default ItemSelectionScreen;