import React, { useEffect, useState, useContext, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Alert,
  FlatList,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../context/AuthContext";
import { getBuilds, updateBuild, deleteBuild } from "../api/api";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ChampionDetailScreen = ({ route }) => {
  const champion = route.params?.champion;
  const { token } = useContext(AuthContext);
  const [currentVersion, setCurrentVersion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedBuilds, setSavedBuilds] = useState([]);
  const [championLevel, setChampionLevel] = useState(1);
  const [selectedBuildId, setSelectedBuildId] = useState(null);
  const [itemsData, setItemsData] = useState({});
  const [skins, setSkins] = useState([]);
  const [currentSkinIndex, setCurrentSkinIndex] = useState(0);
  const flatListRef = useRef(null);
  const navigation = useNavigation();

  if (!champion) {
    return <Text style={styles.errorText}>Champion non spécifié</Text>;
  }

  const calculateStat = (base, perLevel, level) => base + perLevel * (level - 1);

  const calculateBuildStats = () => {
    if (!selectedBuildId || !itemsData) return {};
    const selectedBuild = savedBuilds.find((build) => build.id === selectedBuildId);
    if (!selectedBuild || !Array.isArray(JSON.parse(selectedBuild.items))) return {};

    const items = JSON.parse(selectedBuild.items);
    let bonuses = {
      hp: 0,
      mp: 0,
      armor: 0,
      spellblock: 0,
      attackDamage: 0,
      attackSpeed: 0,
      hpRegen: 0,
      mpRegen: 0,
      crit: 0,
      abilityPower: 0,
    };

    items.forEach((itemId) => {
      const item = itemsData[itemId];
      if (item && item.stats) {
        const stats = item.stats;
        bonuses.hp += stats.FlatHPPoolMod || 0;
        bonuses.mp += stats.FlatMPPoolMod || 0;
        bonuses.armor += stats.FlatArmorMod || 0;
        bonuses.spellblock += stats.FlatSpellBlockMod || 0;
        bonuses.attackDamage += stats.FlatPhysicalDamageMod || 0;
        bonuses.attackSpeed += stats.PercentAttackSpeedMod || 0;
        bonuses.hpRegen += stats.FlatHPRegenMod || 0;
        bonuses.mpRegen += stats.FlatMPRegenMod || 0;
        bonuses.crit += (stats.FlatCritChanceMod || 0) * 100;
        bonuses.abilityPower += stats.FlatMagicDamageMod || 0;
      }
    });

    return bonuses;
  };

  const buildBonuses = calculateBuildStats();

  const baseAttackSpeed = champion.stats.attackspeed;
  const hp = calculateStat(champion.stats.hp, champion.stats.hpperlevel, championLevel) + (buildBonuses.hp || 0);
  const mp = calculateStat(champion.stats.mp, champion.stats.mpperlevel, championLevel) + (buildBonuses.mp || 0);
  const armor = calculateStat(champion.stats.armor, champion.stats.armorperlevel, championLevel) + (buildBonuses.armor || 0);
  const spellblock = calculateStat(champion.stats.spellblock, champion.stats.spellblockperlevel, championLevel) + (buildBonuses.spellblock || 0);
  const attackDamage = calculateStat(champion.stats.attackdamage, champion.stats.attackdamageperlevel, championLevel) + (buildBonuses.attackDamage || 0);
  const attackSpeed = calculateStat(baseAttackSpeed, champion.stats.attackspeedperlevel, championLevel) * (1 + (buildBonuses.attackSpeed || 0));
  const moveSpeed = champion.stats.movespeed;
  const attackRange = champion.stats.attackrange;
  const hpRegen = calculateStat(champion.stats.hpregen, champion.stats.hpregenperlevel, championLevel) + (buildBonuses.hpRegen || 0);
  const mpRegen = calculateStat(champion.stats.mpregen, champion.stats.mpregenperlevel, championLevel) + (buildBonuses.mpRegen || 0);
  const crit = calculateStat(champion.stats.crit, champion.stats.critperlevel, championLevel) + (buildBonuses.crit || 0);
  const abilityPower = 0 + (buildBonuses.abilityPower || 0);

  useEffect(() => {
    const fetchChampionData = async () => {
      try {
        const versionResponse = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
        const versions = await versionResponse.json();
        setCurrentVersion(versions[0]);

        const itemsResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${versions[0]}/data/en_US/item.json`);
        const itemsJson = await itemsResponse.json();
        setItemsData(itemsJson.data);

        const championResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${versions[0]}/data/en_US/champion/${champion.id}.json`);
        const championData = await championResponse.json();
        setSkins(championData.data[champion.id].skins);

        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    const fetchBuildsData = async () => {
      if (!token) return;
      try {
        const buildsResponse = await getBuilds(token, champion.id);
        setSavedBuilds(Array.isArray(buildsResponse.data) ? buildsResponse.data : []);
      } catch (err) {
        console.error("Erreur lors de la récupération des builds:", err);
        setSavedBuilds([]);
      }
    };

    const loadData = async () => {
      await fetchChampionData();
      await fetchBuildsData();
    };

    loadData();
  }, [champion.id, token]);

  useEffect(() => {
    if (!skins || skins.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSkinIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % skins.length;
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 6000);

    return () => clearInterval(timer);
  }, [skins]);

  const refreshBuilds = async () => {
    if (!token) return;
    try {
      const buildsResponse = await getBuilds(token, champion.id);
      setSavedBuilds(Array.isArray(buildsResponse.data) ? buildsResponse.data : []);
    } catch (err) {
      console.error("Erreur lors du rafraîchissement des builds:", err);
      setSavedBuilds([]);
    }
  };

  const handleEditBuild = async (buildId, newItems) => {
    if (!token) {
      Alert.alert("Erreur", "Vous devez être connecté pour modifier un build.");
      return;
    }
    try {
      const itemsString = JSON.stringify(newItems);
      await updateBuild(token, buildId, itemsString);
      await refreshBuilds();
      Alert.alert("Succès", "Build mis à jour avec succès.");
    } catch (err) {
      console.error("Erreur lors de la modification:", err);
      Alert.alert("Erreur", "Impossible de modifier le build. Veuillez réessayer.");
    }
  };

  const handleDeleteBuild = async (buildId) => {
    if (!token) {
      Alert.alert("Erreur", "Vous devez être connecté pour supprimer un build.");
      return;
    }
    try {
      await deleteBuild(token, buildId);
      await refreshBuilds();
      if (selectedBuildId === buildId) setSelectedBuildId(null);
    } catch (err) {
      Alert.alert("Erreur", `Impossible de supprimer le build: ${err.response?.data?.error || err.message}`);
    }
  };

  const toggleBuildSelection = (buildId) => {
    setSelectedBuildId(selectedBuildId === buildId ? null : buildId);
  };

  const formatChampionId = (id) => {
    return id.charAt(0).toUpperCase() + id.slice(1).toLowerCase();
  };

  const renderSkinSlider = () => (
      <FlatList
          ref={flatListRef}
          data={skins}
          horizontal
          pagingEnabled
          snapToAlignment="center"
          snapToInterval={screenWidth}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => {
            const formattedChampionId = formatChampionId(champion.id);
            const skinUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${formattedChampionId}_${item.num}.jpg`;
            return (
                <View style={styles.skinContainer}>
                  <Image
                      source={{ uri: skinUrl }}
                      style={styles.skinBackground}
                      resizeMode="cover"
                      onError={(e) => console.log(`Erreur chargement ${skinUrl}:`, e.nativeEvent.error)}
                      onLoad={() => console.log(`Image chargée: ${skinUrl}`)}
                  />
                </View>
            );
          }}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
              });
            });
          }}
          initialScrollIndex={currentSkinIndex}
          getItemLayout={(data, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          style={styles.sliderContainer}
      />
  );

  const renderStats = () => {
    if (loading || !itemsData) {
      return <Text style={styles.loadingText}>Chargement des données...</Text>;
    }
    return (
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}><Text style={styles.statText}>HP: {hp}{buildBonuses.hp ? ` (${buildBonuses.hp} d'items)` : ''}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>MP: {mp}{buildBonuses.mp ? ` (${buildBonuses.mp} d'items)` : ''}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>Armor: {armor}{buildBonuses.armor ? ` (${buildBonuses.armor} d'items)` : ''}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>MR: {spellblock}{buildBonuses.spellblock ? ` (${buildBonuses.spellblock} d'items)` : ''}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>AD: {attackDamage}{buildBonuses.attackDamage ? ` (${buildBonuses.attackDamage} d'items)` : ''}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>AS: {attackSpeed.toFixed(2)}{buildBonuses.attackSpeed ? ` (${buildBonuses.attackSpeed.toFixed(2)} d'items)` : ''}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>Move Speed: {moveSpeed}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>Range: {attackRange}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>HP Regen: {hpRegen}{buildBonuses.hpRegen ? ` (${buildBonuses.hpRegen} d'items)` : ''}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>MP Regen: {mpRegen}{buildBonuses.mpRegen ? ` (${buildBonuses.mpRegen} d'items)` : ''}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>Crit: {crit}%{buildBonuses.crit ? ` (${buildBonuses.crit} d'items)` : ''}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>AP: {abilityPower}{buildBonuses.abilityPower ? ` (${buildBonuses.abilityPower} d'items)` : ''}</Text></View>
          </View>
        </View>
    );
  };

  const renderLevelControl = () => (
      <View style={styles.levelContainer}>
        <Text style={styles.levelText}>Niveau: {championLevel}</Text>
        <View style={styles.levelButtonsContainer}>
          <Pressable
              style={styles.levelButton}
              onPress={() => setChampionLevel((prevLevel) => Math.max(1, prevLevel - 1))}
          >
            <Text style={styles.levelButtonText}>-</Text>
          </Pressable>
          <Pressable
              style={styles.levelButton}
              onPress={() => setChampionLevel((prevLevel) => Math.min(18, prevLevel + 1))}
          >
            <Text style={styles.levelButtonText}>+</Text>
          </Pressable>
        </View>
      </View>
  );

  const renderPassive = () => (
      champion.passive && (
          <View style={styles.spellContainer}>
            <Text style={styles.spellName}>Passif - {champion.passive.name}</Text>
            <Image
                source={{ uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/passive/${champion.passive.image.full}` }}
                style={styles.spellIcon}
            />
            <Text style={styles.spellDescription}>{champion.passive.description}</Text>
          </View>
      )
  );

  const renderSpells = () => (
      Array.isArray(champion.spells) ? (
          champion.spells.map((spell, index) => (
              <View key={index} style={styles.spellContainer}>
                <Text style={styles.spellName}>{["Q", "W", "E", "R"][index]} - {spell.name}</Text>
                <Image
                    source={{ uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/spell/${spell.image.full}` }}
                    style={styles.spellIcon}
                />
                <Text style={styles.spellDescription}>{spell.description}</Text>
              </View>
          ))
      ) : (
          <Text style={styles.errorText}>Aucun sort disponible</Text>
      )
  );

  const renderBuilds = () => (
      <View style={styles.buildsContainer}>
        <Text style={styles.subTitle}>Vos builds :</Text>
        {savedBuilds.length > 0 ? (
            savedBuilds.map((build, index) => (
                <View key={build.id} style={styles.buildContainer}>
                  <View style={styles.buildHeader}>
                    <Text style={styles.buildTitle}>Build #{index + 1}</Text>
                    <Pressable
                        style={styles.checkboxContainer}
                        onPress={() => toggleBuildSelection(build.id)}
                    >
                      <View style={[
                        styles.checkbox,
                        selectedBuildId === build.id && styles.checkboxChecked,
                      ]}>
                        {selectedBuildId === build.id && <View style={styles.checkboxInner} />}
                      </View>
                      {selectedBuildId === build.id && <Text style={styles.selectedText}>(Sélectionné)</Text>}
                    </Pressable>
                  </View>
                  <View style={styles.buildItemsContainer}>
                    {Array.isArray(JSON.parse(build.items)) ? (
                        JSON.parse(build.items).map((itemId, idx) => (
                            <Image
                                key={idx}
                                source={{ uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${itemId}.png` }}
                                style={styles.buildItemImage}
                            />
                        ))
                    ) : (
                        <Text style={styles.errorText}>Items invalides</Text>
                    )}
                  </View>
                  <View style={styles.buildButtonsContainer}>
                    <Pressable
                        style={({ pressed }) => [
                          styles.editButton,
                          { backgroundColor: pressed ? "#e6b800" : "#ffcc00" },
                        ]}
                        onPress={() =>
                            navigation.navigate("ItemSelectionScreen", {
                              championId: champion.id,
                              buildId: build.id,
                              initialItems: JSON.parse(build.items),
                              onSaveBuild: (newItems) => handleEditBuild(build.id, newItems),
                            })
                        }
                    >
                      <Text style={styles.editButtonText}>Modifier</Text>
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [
                          styles.deleteButton,
                          { backgroundColor: pressed ? "#cc0000" : "#ff4444" },
                        ]}
                        onPress={() => handleDeleteBuild(build.id)}
                    >
                      <Text style={styles.deleteButtonText}>Supprimer</Text>
                    </Pressable>
                  </View>
                </View>
            ))
        ) : (
            <Text style={styles.errorText}>Aucun build disponible</Text>
        )}
        <Pressable
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: pressed ? "#e6b800" : "#ffcc00" },
            ]}
            onPress={() =>
                navigation.navigate("ItemSelectionScreen", {
                  championId: champion.id,
                  onSaveBuild: () => refreshBuilds(),
                })
            }
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>
  );

  return (
      <View style={styles.fullContainer}>
        {renderSkinSlider()}
        <ScrollView style={styles.contentContainer} contentContainerStyle={styles.contentPadding}>
          {loading || !itemsData ? (
              <Text style={styles.loadingText}>Chargement des données...</Text>
          ) : (
              <>
                <Text style={styles.title}>{champion.name}</Text>
                <Image
                    source={{ uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/champion/${champion.id}.png` }}
                    style={styles.championImage}
                />
                <Text style={styles.role}>Rôle: {champion.tags.join(", ")}</Text>
                <Text style={styles.description}>{champion.blurb}</Text>
                <Text style={styles.subTitle}>Statistiques de base :</Text>
                {renderStats()}
                {renderLevelControl()}
                <Text style={styles.subTitle}>Sorts :</Text>
                {renderPassive()}
                {renderSpells()}
                {renderBuilds()}
              </>
          )}
        </ScrollView>
      </View>
  );
};

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  sliderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: screenHeight,
    zIndex: -1,
  },
  skinContainer: {
    width: screenWidth,
    height: screenHeight,
  },
  skinBackground: {
    width: screenWidth,
    height: screenHeight,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  contentPadding: {
    padding: 20,
  },
  loadingText: {
    color: "#ffcc00",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#ffcc00",
    textShadowColor: "#ffcc00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  championImage: {
    width: 250,
    height: 250,
    alignSelf: "center",
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 4,
    borderColor: "#ffcc00",
  },
  role: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
    color: "#fff",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#fff",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  subTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#ffcc00",
    textShadowColor: "#333",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  statsContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statItem: {
    width: "48%",
    marginBottom: 8,
  },
  statText: {
    fontSize: 16,
    color: "#fff",
    backgroundColor: "transparent",
  },
  spellContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffcc00",
  },
  spellName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffcc00",
    marginBottom: 5,
    backgroundColor: "transparent",
  },
  spellIcon: {
    width: 50,
    height: 50,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#ffcc00",
    marginVertical: 10,
  },
  spellDescription: {
    fontSize: 16,
    color: "#fff",
    backgroundColor: "transparent",
  },
  buildsContainer: {
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  buildContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffcc00",
  },
  buildHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ffcc00",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    borderWidth: 3,
    backgroundColor: "rgba(255, 204, 0, 0.2)",
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ffcc00",
  },
  selectedText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#ffcc00",
    fontWeight: "bold",
    backgroundColor: "transparent",
  },
  buildTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffcc00",
    backgroundColor: "transparent",
  },
  buildItemsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
    backgroundColor: "transparent",
  },
  buildItemImage: {
    width: 40,
    height: 40,
    marginRight: 5,
    marginBottom: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ffcc00",
  },
  buildButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  editButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  editButtonText: {
    fontSize: 16,
    color: "#1e1e1e",
    fontWeight: "bold",
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  deleteButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 10,
  },
  addButtonText: {
    fontSize: 30,
    color: "#1e1e1e",
    fontWeight: "bold",
  },
  levelContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  levelText: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
    backgroundColor: "transparent",
  },
  levelButtonsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  levelButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffcc00",
  },
  levelButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e1e1e",
  },
});

export default ChampionDetailScreen;