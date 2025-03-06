import React, { useEffect, useState, useContext } from "react";
import { ScrollView, View, Text, StyleSheet, Image, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from '../context/AuthContext';
import { getBuilds, updateBuild, deleteBuild } from '../api/api';

const ChampionDetailScreen = ({ route }) => {
  const champion = route.params?.champion;
  const { token } = useContext(AuthContext);
  const [currentVersion, setCurrentVersion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedBuilds, setSavedBuilds] = useState([]);
  const [championLevel, setChampionLevel] = useState(1);
  const navigation = useNavigation();

  if (!champion) {
    return <Text style={styles.errorText}>Champion non spécifié</Text>;
  }

  const calculateStat = (base, perLevel, level) => base + perLevel * (level - 1);

  const hp = calculateStat(champion.stats.hp, champion.stats.hpperlevel, championLevel);
  const mp = calculateStat(champion.stats.mp, champion.stats.mpperlevel, championLevel);
  const armor = calculateStat(champion.stats.armor, champion.stats.armorperlevel, championLevel);
  const spellblock = calculateStat(champion.stats.spellblock, champion.stats.spellblockperlevel, championLevel);
  const attackDamage = calculateStat(champion.stats.attackdamage, champion.stats.attackdamageperlevel, championLevel);
  const attackSpeed = champion.stats.attackspeed + champion.stats.attackspeedperlevel * (championLevel - 1);
  const moveSpeed = champion.stats.movespeed;
  const attackRange = champion.stats.attackrange;
  const hpRegen = calculateStat(champion.stats.hpregen, champion.stats.hpregenperlevel, championLevel);
  const mpRegen = calculateStat(champion.stats.mpregen, champion.stats.mpregenperlevel, championLevel);
  const crit = champion.stats.crit + champion.stats.critperlevel * (championLevel - 1);
  const abilityPower = 0;

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const versionResponse = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
        const versions = await versionResponse.json();
        setCurrentVersion(versions[0]);
        if (token) {
          const buildsResponse = await getBuilds(token, champion.id);
          console.log("Builds récupérés :", buildsResponse.data); // Log
          setSavedBuilds(buildsResponse.data);
        }
        setLoading(false);
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [champion.id, token]);

  const refreshBuilds = async () => {
    try {
      if (token) {
        const buildsResponse = await getBuilds(token, champion.id);
        setSavedBuilds(buildsResponse.data);
      }
    } catch (err) {
      console.error("Erreur lors du rafraîchissement des builds:", err);
      setError(err.message);
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
    console.log("Début de handleDeleteBuild, buildId :", buildId, "token :", token); // Log
    if (!token) {
      Alert.alert("Erreur", "Vous devez être connecté pour supprimer un build.");
      return;
    }

    Alert.alert(
      "Confirmation",
      "Voulez-vous vraiment supprimer ce build ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Tentative de suppression, buildId :", buildId); // Log
              const response = await deleteBuild(token, buildId);
              console.log("Réponse de deleteBuild :", response.data); // Log
              await refreshBuilds();
              Alert.alert("Succès", "Build supprimé avec succès.");
            } catch (err) {
              console.error("Erreur lors de la suppression :", err.response?.data || err.message); // Log détaillé
              Alert.alert("Erreur", `Impossible de supprimer le build : ${err.response?.data?.error || err.message}`);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Erreur: {error}</Text>
      </View>
    );
  }

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}><Text style={styles.statText}>HP: {hp}</Text></View>
        <View style={styles.statItem}><Text style={styles.statText}>MP: {mp}</Text></View>
        <View style={styles.statItem}><Text style={styles.statText}>Armor: {armor}</Text></View>
        <View style={styles.statItem}><Text style={styles.statText}>MR: {spellblock}</Text></View>
        <View style={styles.statItem}><Text style={styles.statText}>AD: {attackDamage}</Text></View>
        <View style={styles.statItem}><Text style={styles.statText}>AS: {attackSpeed.toFixed(2)}</Text></View>
        <View style={styles.statItem}><Text style={styles.statText}>Move Speed: {moveSpeed}</Text></View>
        <View style={styles.statItem}><Text style={styles.statText}>Range: {attackRange}</Text></View>
        <View style={styles.statItem}><Text style={styles.statText}>HP Regen: {hpRegen}</Text></View>
        <View style={styles.statItem}><Text style={styles.statText}>MP Regen: {mpRegen}</Text></View>
        <View style={styles.statItem}><Text style={styles.statText}>Crit: {crit}%</Text></View>
        <View style={styles.statItem}><Text style={styles.statText}>AP: {abilityPower}</Text></View>
      </View>
    </View>
  );

  const renderLevelControl = () => (
    <View style={styles.levelContainer}>
      <Text style={styles.levelText}>Niveau: {championLevel}</Text>
      <View style={styles.levelButtonsContainer}>
        <Pressable
          style={styles.levelButton}
          onPress={() => setChampionLevel(prevLevel => Math.max(1, prevLevel - 1))}
        >
          <Text style={styles.levelButtonText}>-</Text>
        </Pressable>
        <Pressable
          style={styles.levelButton}
          onPress={() => setChampionLevel(prevLevel => Math.min(18, prevLevel + 1))}
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
    champion.spells.map((spell, index) => (
      <View key={index} style={styles.spellContainer}>
        <Text style={styles.spellName}>{['Q', 'W', 'E', 'R'][index]} - {spell.name}</Text>
        <Image
          source={{ uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/spell/${spell.image.full}` }}
          style={styles.spellIcon}
        />
        <Text style={styles.spellDescription}>{spell.description}</Text>
      </View>
    ))
  );

  const renderBuilds = () => (
    <View style={styles.buildsContainer}>
      <Text style={styles.subTitle}>Vos builds :</Text>
      {savedBuilds.map((build, index) => (
        <View key={build.id} style={styles.buildContainer}>
          <Text style={styles.buildTitle}>Build #{index + 1}</Text>
          <View style={styles.buildItemsContainer}>
            {JSON.parse(build.items).map((itemId, idx) => (
              <Image
                key={idx}
                source={{ uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/item/${itemId}.png` }}
                style={styles.buildItemImage}
              />
            ))}
          </View>
          <View style={styles.buildButtonsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.editButton,
                { backgroundColor: pressed ? "#e6b800" : "#ffcc00" }
              ]}
              onPress={() => navigation.navigate("ItemSelectionScreen", { 
                championId: champion.id, 
                buildId: build.id, 
                initialItems: JSON.parse(build.items),
                onSaveBuild: (newItems) => handleEditBuild(build.id, newItems)
              })}
            >
              <Text style={styles.editButtonText}>Modifier</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                { backgroundColor: pressed ? "#cc0000" : "#ff4444" }
              ]}
              onPress={() => handleDeleteBuild(build.id)}
            >
              <Text style={styles.deleteButtonText}>Supprimer</Text>
            </Pressable>
          </View>
        </View>
      ))}
      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          { backgroundColor: pressed ? "#e6b800" : "#ffcc00" }
        ]}
        onPress={() => navigation.navigate("ItemSelectionScreen", { 
          championId: champion.id, 
          onSaveBuild: () => refreshBuilds()
        })}
      >
        <Text style={styles.addButtonText}>+</Text>
      </Pressable>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
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
    </ScrollView>
  );
};

// Styles inchangés
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#1e1e1e",
  },
  loadingText: {
    color: "#ffcc00",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
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
    color: "#999",
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#ccc",
  },
  subTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#ffcc00",
    textShadowColor: "#333",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  statsContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#2c2c2c",
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
    color: "#ccc",
  },
  spellContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#2c2c2c",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffcc00",
  },
  spellName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffcc00",
    marginBottom: 5,
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
    color: "#ccc",
  },
  buildsContainer: {
    marginBottom: 20,
  },
  buildContainer: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#2c2c2c",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffcc00",
  },
  buildTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffcc00",
    marginBottom: 10,
  },
  buildItemsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
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
    backgroundColor: "#ffcc00",
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
    backgroundColor: "#ff4444",
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
    backgroundColor: "#ffcc00",
  },
  addButtonText: {
    fontSize: 30,
    color: "#1e1e1e",
    fontWeight: "bold",
  },
  levelContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#2c2c2c",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  levelText: {
    fontSize: 18,
    color: "#ccc",
    marginBottom: 10,
    textAlign: "center",
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