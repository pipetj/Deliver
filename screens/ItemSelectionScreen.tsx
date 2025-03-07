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
import { AuthContext } from "@/context/AuthContext";
import { createBuild, updateBuild } from "@/api/api";

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
  route: {
    params?: {
      championId?: string;
      buildId?: string;
      initialItems?: string[];
      onSaveBuild?: (items: string[]) => void;
    };
  };
}

// Constantes
const MAX_ITEMS = 6;
const EXCLUDED_ITEMS = ["3070", "3040"];
const CATEGORIES = [
  { name: "Attaque Physique", color: "#FF4444", icon: "⚔️" },
  { name: "Magie", color: "#9370DB", icon: "✨" },
  { name: "Défensif/AD", color: "#FF8C00", icon: "🛡️⚔️" },
  { name: "Défensif/AP", color: "#00CED1", icon: "🛡️✨" },
  { name: "Tank", color: "#4682B4", icon: "🛡️" },
  { name: "Starter", color: "#90EE90", icon: "🌟" },
  { name: "Bottes", color: "#8A2BE2", icon: "👢" },
  { name: "Consommables", color: "#32CD32", icon: "🍷" },
];
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
  const [categories] = useState(CATEGORIES);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [addedItems, setAddedItems] = useState<string[]>(initialItems || []);
  const [isSaving, setIsSaving] = useState(false);
  const [pulseAnimation] = useState(new Animated.Value(1));

  const screenWidth = Dimensions.get("window").width;
  const itemWidth = screenWidth < 400 ? (screenWidth - 60) / 3 : 100;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnimation]);

  const getItemCategory = useCallback((item: Item): string => {
    // Priorité 1 : Vérification explicite des bottes (tier 2 et tier 3)
    const bootIds = [
      "1001", // Bottes de vitesse (tier 1)
      "3006", // Jambières du berserker
      "3009", // Bottes de rapidité
      "3020", // Chaussures du sorcier
      "3047", // Coques en acier (probablement "Jambières de métal")
      "3111", // Sandales de Mercure
      "3117", // Bottes de mobilité
      "3158", // Bottes de lucidité
      "2422", // Bottes légèrement magiques (si applicable dans votre version)
    ];
  
    if (item.tags?.includes("Boots") || bootIds.includes(item.id)) {
      return "Bottes";
    }
  
    // Vérification des évolutions de bottes via "from"
    if (item.from && item.from.some((fromId) => bootIds.includes(fromId))) {
      return "Bottes"; // Si l'item est construit à partir d'une botte, c'est une botte
    }
  
    // Priorité 2 : Autres catégories fixes
    if (item.tags?.includes("Consumable")) return "Consommables";
    if (item.gold.total < 500 && (!item.from || item.from.length === 0)) return "Starter";
  
    // Détection des stats et tags
    const hasAD = item.stats?.FlatPhysicalDamageMod || item.tags?.includes("Damage") || item.tags?.includes("CriticalStrike") || item.tags?.includes("AttackSpeed");
    const hasAP = item.stats?.FlatMagicDamageMod || item.tags?.includes("SpellDamage");
    const hasDefense = item.tags?.includes("Armor") || item.tags?.includes("SpellBlock") || item.tags?.includes("Health") || item.stats?.FlatHPPoolMod;
  
    // Priorité 3 : Classification basée sur les stats
    if (hasAP && !hasAD && !hasDefense) return "Magie"; // Ex. Coiffe de Rabadon
    if (hasAP && hasAD && !hasDefense) return "Magie"; // Ex. Dent de Nashor
    if (hasAP && hasDefense && !hasAD) return "Défensif/AP"; // Ex. Zhonya
  
    if (hasAD && !hasAP && !hasDefense) return "Attaque Physique"; // Ex. Lame d'infini
    if (hasAD && hasDefense && !hasAP) return "Défensif/AD"; // Ex. Gage de Sterak
    if (hasDefense && !hasAD && !hasAP) return "Tank"; // Ex. Warmog
  
    // Par défaut
    return "Attaque Physique";
  }, []);

  const getItemRarity = useCallback((item: Item): string => {
    if (item.from && item.from.length > 0 && (!item.into || item.into.length === 0))
      return "LEGENDARY";
    if (item.from && item.from.length > 0 && item.into && item.into.length > 0)
      return "EPIC";
    if ((!item.from || item.from.length === 0) && item.into && item.into.length > 0)
      return "BASIC";
    if (item.gold?.base < 500 && item.gold?.total < 500) return "STARTER";
    return "BASIC";
  }, []);

  const isItemIncompatible = useCallback(
    (item: Item): boolean => {
      if (
        (item.tags?.includes("Boots") || item.id === "3006") &&
        addedItems.some((id) => {
          const addedItem = items.find((i) => i.id === id);
          return addedItem?.tags?.includes("Boots") || addedItem?.id === "3006";
        })
      ) {
        return true;
      }

      const hasUniqueTag =
        item.description?.includes("<unique>") || item.description?.includes("UNIQUE");
      if (hasUniqueTag) {
        for (const addedItemId of addedItems) {
          const addedItem = items.find((i) => i.id === addedItemId);
          if (
            addedItem &&
            addedItem.description?.includes("<unique>") &&
            (item.name.includes(addedItem.name.split(" ")[0]) ||
              (addedItem.from &&
                item.from &&
                JSON.stringify(addedItem.from) === JSON.stringify(item.from)))
          ) {
            return true;
          }
        }
      }
      return false;
    },
    [addedItems, items]
  );

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
          const isNotSpecialItem =
            !item.tags?.includes("Trinket") && !item.requiredChampion && !item.requiredAlly;
          const hasValidData = item.description && item.image && item.image.full && item.name;

          if (availableOnSR && isPurchasable && isNotSpecialItem && hasValidData) {
            const normalizedName = item.name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "");
            if (!uniqueItems.has(normalizedName) || uniqueItems.get(normalizedName)!.id < id) {
              const itemCategory = getItemCategory({ ...item, id });
              const itemWithRarity: Item = {
                ...item,
                id,
                rarity: getItemRarity(item),
                category: itemCategory,
              };
              uniqueItems.set(normalizedName, itemWithRarity);
            }
          }
        });

        const sortedItems = Array.from(uniqueItems.values()).sort((a, b) => {
          if (selectedCategory === "all") {
            const rarityComparison =
              RARITY_ORDER.indexOf(a.rarity!) - RARITY_ORDER.indexOf(b.rarity!);
            if (rarityComparison !== 0) return rarityComparison;
            return b.gold.total - a.gold.total; // Plus cher au moins cher
          }
          const categoryComparison =
            CATEGORIES.findIndex((c) => c.name === a.category) -
            CATEGORIES.findIndex((c) => c.name === b.category);
          if (categoryComparison !== 0) return categoryComparison;
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
  }, [getItemCategory, getItemRarity, selectedCategory]);

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

  const getRarityColor = (rarity: string): string => {
    switch (rarity) {
      case "LEGENDARY":
        return "#FFD700";
      case "EPIC":
        return "#C931DB";
      case "BASIC":
        return "#87CEEB";
      case "STARTER":
        return "#90EE90";
      default:
        return "#FFFFFF";
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
      setAddedItems(addedItems.filter((id) => id !== itemId));
    } else {
      if (addedItems.length >= MAX_ITEMS) {
        Alert.alert("Limite atteinte", "Vous ne pouvez pas avoir plus de 6 items dans votre build.");
        return;
      }
      const item = items.find((i) => i.id === itemId);
      if (item && isItemIncompatible(item)) {
        Alert.alert(
          "Item incompatible",
          "Cet item ne peut pas être ajouté car il est incompatible avec votre build actuel."
        );
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
        const itemA = items.find((i) => i.id === a);
        const itemB = items.find((i) => i.id === b);
        return (
          RARITY_ORDER.indexOf(itemA?.rarity || "") - RARITY_ORDER.indexOf(itemB?.rarity || "")
        );
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
    } catch (err: any) {
      console.error("Erreur lors de la sauvegarde:", err.response?.data || err.message);
      Alert.alert("Erreur", "Impossible de sauvegarder le build. Veuillez réessayer.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderItemDetails = () => {
    if (!selectedItem) return null;
    const rarityLabel = {
      LEGENDARY: "Légendaire",
      EPIC: "Épique",
      BASIC: "Basique",
      STARTER: "Débutant",
    }[selectedItem.rarity!] || "Inconnu";
    const categoryColor = CATEGORIES.find((c) => c.name === selectedItem.category)?.color || "#FFFFFF";

    const descriptionWithBreaks = stripHtmlTags(selectedItem.description);
    const descriptionLines = descriptionWithBreaks.split("\n").filter((line) => line.trim() !== "");
    const isAdded = addedItems.includes(selectedItem.id);

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
            <Text style={[styles.detailsCategory, { color: categoryColor }]}>
              {selectedItem.category}
            </Text>
            <Text style={styles.detailsRarity}>
              Rareté: <Text style={{ color: getRarityColor(selectedItem.rarity!) }}>{rarityLabel}</Text>
            </Text>
            {descriptionLines.map((line, index) => (
              <Text key={index} style={styles.detailsDescription}>
                {line}
              </Text>
            ))}
          </View>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.addButton, isAdded && styles.removeButton]}
            onPress={() => handleToggleItem(selectedItem.id)}
          >
            <Text style={[styles.addButtonText, isAdded && styles.removeButtonText]}>
              {isAdded ? "Retirer" : "Ajouter"}
            </Text>
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
      const itemA = items.find((i) => i.id === a);
      const itemB = items.find((i) => i.id === b);
      return (
        RARITY_ORDER.indexOf(itemA?.rarity || "") - RARITY_ORDER.indexOf(itemB?.rarity || "")
      );
    });

    return (
      <View style={styles.buildPanel}>
        <View style={styles.buildPanelHeader}>
          <Text style={styles.buildPanelTitle}>Build ({addedItems.length}/{MAX_ITEMS})</Text>
          <Pressable style={styles.saveButton} onPress={handleSaveBuild} disabled={isSaving}>
            <Text style={styles.saveButtonText}>{isSaving ? "Sauvegarde..." : "Sauvegarder"}</Text>
          </Pressable>
        </View>
        <View style={styles.buildItemsContainer}>
          {Array(MAX_ITEMS)
            .fill(0)
            .map((_, index) => {
              const itemId = sortedAddedItems[index];
              const item = itemId ? items.find((i) => i.id === itemId) : null;
              return (
                <Pressable
                  key={index}
                  style={styles.buildItemSlot}
                  onPress={() => item && handleToggleItem(itemId)}
                >
                  {item ? (
                    <Image
                      source={{
                        uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${item.image.full}`,
                      }}
                      style={[styles.buildItemImage, { borderColor: getRarityColor(item.rarity!) }]}
                    />
                  ) : (
                    <Animated.View style={[styles.emptySlot, { transform: [{ scale: pulseAnimation }] }]}>
                      <Text style={styles.emptySlotText}>+</Text>
                    </Animated.View>
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFCC00" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
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
          <Pressable
            style={[styles.categoryFilter, selectedCategory === "all" && styles.categoryFilterSelected]}
            onPress={() => setSelectedCategory("all")}
          >
            <Text
              style={[styles.categoryFilterText, selectedCategory === "all" && styles.categoryFilterTextSelected]}
            >
              Tous
            </Text>
          </Pressable>
          {categories.map((category) => (
            <Pressable
              key={category.name}
              style={[
                styles.categoryFilter,
                selectedCategory === category.name && styles.categoryFilterSelected,
                { backgroundColor: category.color + "33" },
              ]}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Text
                style={[
                  styles.categoryFilterText,
                  selectedCategory === category.name && styles.categoryFilterTextSelected,
                  { color: category.color },
                ]}
              >
                {category.icon} {category.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <ScrollView style={styles.itemsScrollView}>
        <Text style={styles.title}>
          {selectedCategory === "all" ? "Tous les items" : selectedCategory} ({filteredItems.length})
        </Text>
        <View style={styles.itemsContainer}>
          {filteredItems.map((item) => (
            <Pressable key={item.id} onPress={() => handleItemPress(item)}>
              <View style={[styles.itemContainer, { width: itemWidth }]}>
                {addedItems.includes(item.id) ? (
                  <Animated.View style={[styles.selectedItemBorder, { transform: [{ scale: pulseAnimation }] }]}>
                    <Image
                      source={{
                        uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${item.image.full}`,
                      }}
                      style={[styles.itemImage, { borderColor: getRarityColor(item.rarity!) }]}
                    />
                  </Animated.View>
                ) : (
                  <Image
                    source={{
                      uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${item.image.full}`,
                    }}
                    style={[styles.itemImage, { borderColor: getRarityColor(item.rarity!) }]}
                  />
                )}
                <Text style={[styles.itemName, { color: getRarityColor(item.rarity!) }]} numberOfLines={2}>
                  {item.name}
                </Text>
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

// Styles (inchangés)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#121212" },
  buildPanel: { padding: 15, backgroundColor: "#1E1E1E", borderBottomWidth: 1, borderBottomColor: "#333", elevation: 5 },
  buildPanelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  buildPanelTitle: { fontSize: 18, fontWeight: "bold", color: "#FFCC00" },
  saveButton: { backgroundColor: "#4CAF50", paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, elevation: 2 },
  saveButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 14 },
  buildItemsContainer: { flexDirection: "row", justifyContent: "space-around" },
  buildItemSlot: { width: 50, height: 50, justifyContent: "center", alignItems: "center", margin: 3 },
  buildItemImage: { width: 46, height: 46, borderRadius: 8, borderWidth: 2 },
  emptySlot: {
    width: 46,
    height: 46,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFCC00",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
  },
  emptySlotText: { color: "#FFCC00", fontSize: 24 },
  filtersContainer: { padding: 15, backgroundColor: "#1E1E1E" },
  searchBar: {
    backgroundColor: "#2A2A2A",
    color: "#FFF",
    padding: 10,
    borderRadius: 25,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#FFCC00",
    fontSize: 16,
    elevation: 2,
  },
  categoryFiltersContainer: { flexDirection: "row" },
  categoryFilter: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#444",
    elevation: 2,
  },
  categoryFilterSelected: { borderColor: "#FFCC00", elevation: 4 },
  categoryFilterText: { fontSize: 14, fontWeight: "bold" },
  categoryFilterTextSelected: { color: "#FFF" },
  itemsScrollView: { flex: 1, padding: 15 },
  title: { fontSize: 20, fontWeight: "bold", color: "#FFCC00", marginBottom: 15 },
  itemsContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  itemContainer: {
    alignItems: "center",
    margin: 5,
    backgroundColor: "#2A2A2A",
    padding: 8,
    borderRadius: 12,
    elevation: 3,
  },
  itemImage: { width: 50, height: 50, borderRadius: 8, borderWidth: 2 },
  selectedItemBorder: {
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#00FFFF",
    padding: 2,
    backgroundColor: "rgba(0, 255, 255, 0.2)",
  },
  itemName: { marginTop: 5, fontSize: 12, textAlign: "center", height: 32, fontWeight: "600" },
  itemPrice: { color: "#FFCC00", fontSize: 11, marginTop: 3 },
  loadingText: { marginTop: 10, fontSize: 16, color: "#FFCC00" },
  errorText: { fontSize: 16, color: "#FF4444" },
  detailsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1E1E1E",
    borderTopWidth: 1,
    borderTopColor: "#FFCC00",
    maxHeight: "70%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
  },
  detailsContent: { padding: 20, alignItems: "center" },
  detailsImage: { width: 90, height: 90, borderRadius: 12, borderWidth: 3, borderColor: "#FFCC00" },
  detailsTitle: { fontSize: 20, fontWeight: "bold", color: "#FFCC00", marginTop: 10, textAlign: "center" },
  detailsPrice: { fontSize: 16, color: "#FFCC00", marginTop: 5 },
  detailsCategory: { fontSize: 16, fontWeight: "bold", marginTop: 8 },
  detailsRarity: { fontSize: 14, color: "#FFF", marginTop: 5 },
  detailsDescription: { fontSize: 14, color: "#DDD", marginTop: 8, textAlign: "left", lineHeight: 20 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 15, borderTopWidth: 1, borderTopColor: "#333" },
  addButton: {
    backgroundColor: "#00FFFF",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    width: "40%",
    alignItems: "center",
    elevation: 2,
  },
  addButtonText: { color: "#000", fontWeight: "bold", fontSize: 16 },
  removeButton: { backgroundColor: "#FF4444" },
  removeButtonText: { color: "#FFF" },
  closeButton: {
    backgroundColor: "#333",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    width: "40%",
    alignItems: "center",
    elevation: 2,
  },
  closeButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});

export default ItemSelectionScreen;