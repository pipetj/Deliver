import React, { useEffect, useState, useContext, useRef, useMemo } from "react";
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
import HTML from "react-native-render-html";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ChampionDetailScreen = ({ route }) => {
  const championId = route.params?.champion?.id || null;
  const { token } = useContext(AuthContext);
  const [currentVersion, setCurrentVersion] = useState("");
  const [champion, setChampion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedBuilds, setSavedBuilds] = useState([]);
  const [championLevel, setChampionLevel] = useState(1);
  const [selectedBuildId, setSelectedBuildId] = useState(null);
  const [itemsData, setItemsData] = useState({});
  const [skins, setSkins] = useState([]);
  const [currentSkinIndex, setCurrentSkinIndex] = useState(0);
  const [spellLevels, setSpellLevels] = useState({ Q: 0, W: 0, E: 0, R: 0 });
  const flatListRef = useRef(null);
  const navigation = useNavigation();

  if (!championId) {
    return <Text style={styles.errorText}>Champion non spécifié</Text>;
  }

  const resourceType = useMemo(() => {
    if (!champion) return "Mana";
    const usesEnergy = champion.stats.mpperlevel === 0 && champion.stats.mp > 0;
    const noCost = champion.spells.every((spell) => spell.costBurn === "0");
    const result = usesEnergy ? "Énergie" : noCost ? "Aucune ressource" : "Mana";
    console.log(`resourceType for ${champion.name}:`, {
      mp: champion.stats.mp,
      mpperlevel: champion.stats.mpperlevel,
      costBurns: champion.spells.map((spell) => spell.costBurn),
      result,
    });
    return result;
  }, [champion]);

  const calculateStat = (base = 0, perLevel = 0, level = 1) => base + perLevel * (level - 1);

  const spellBonuses = useMemo(() => {
    if (!champion) return {};
    let bonuses = {
      hp: 0,
      mp: 0,
      armor: 0,
      spellblock: 0,
      attackDamage: 0,
      attackSpeed: 0,
      abilityPower: 0,
      hpRegen: 0,
      mpRegen: 0,
      crit: 0,
    };

    if (champion.passive?.description.toLowerCase().includes("bonus")) {
      bonuses.hp += spellLevels.Q * 5;
      bonuses.attackDamage += spellLevels.W * 2;
    }

    champion.spells.forEach((spell, index) => {
      const spellKey = ["Q", "W", "E", "R"][index];
      const level = spellLevels[spellKey];
      if (spell.description.toLowerCase().includes("bonus attack damage")) {
        bonuses.attackDamage += level * 3;
      } else if (spell.description.toLowerCase().includes("bonus health")) {
        bonuses.hp += level * 10;
      }
    });

    return bonuses;
  }, [champion, spellLevels]);

  const buildBonuses = useMemo(() => {
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
      if (item?.stats) {
        bonuses.hp += item.stats.FlatHPPoolMod || 0;
        bonuses.mp += item.stats.FlatMPPoolMod || 0;
        bonuses.armor += item.stats.FlatArmorMod || 0;
        bonuses.spellblock += item.stats.FlatSpellBlockMod || 0;
        bonuses.attackDamage += item.stats.FlatPhysicalDamageMod || 0;
        bonuses.attackSpeed += item.stats.PercentAttackSpeedMod || 0;
        bonuses.hpRegen += item.stats.FlatHPRegenMod || 0;
        bonuses.mpRegen += item.stats.FlatMPRegenMod || 0;
        bonuses.crit += (item.stats.FlatCritChanceMod || 0) * 100;
        bonuses.abilityPower += item.stats.FlatMagicDamageMod || 0;
      }
    });

    return bonuses;
  }, [selectedBuildId, savedBuilds, itemsData]);

  const stats = useMemo(() => {
    if (!champion) return {};
    const baseAttackSpeed = champion.stats.attackspeed;
    const resType = resourceType;
    return {
      hp: calculateStat(champion.stats.hp, champion.stats.hpperlevel, championLevel) + (buildBonuses.hp || 0) + (spellBonuses.hp || 0),
      mp: resType === "Mana" ? calculateStat(champion.stats.mp, champion.stats.mpperlevel, championLevel) + (buildBonuses.mp || 0) + (spellBonuses.mp || 0) : 0,
      energy: resType === "Énergie" ? 200 + (buildBonuses.mp || 0) : 0,
      armor: calculateStat(champion.stats.armor, champion.stats.armorperlevel, championLevel) + (buildBonuses.armor || 0) + (spellBonuses.armor || 0),
      spellblock: calculateStat(champion.stats.spellblock, champion.stats.spellblockperlevel, championLevel) + (buildBonuses.spellblock || 0) + (spellBonuses.spellblock || 0),
      attackDamage: calculateStat(champion.stats.attackdamage, champion.stats.attackdamageperlevel, championLevel) + (buildBonuses.attackDamage || 0) + (spellBonuses.attackDamage || 0),
      attackSpeed: calculateStat(baseAttackSpeed, champion.stats.attackspeedperlevel, championLevel) * (1 + (buildBonuses.attackSpeed || 0) + (spellBonuses.attackSpeed || 0)),
      moveSpeed: champion.stats.movespeed,
      attackRange: champion.stats.attackrange,
      hpRegen: calculateStat(champion.stats.hpregen, champion.stats.hpregenperlevel, championLevel) + (buildBonuses.hpRegen || 0) + (spellBonuses.hpRegen || 0),
      mpRegen: resType === "Mana" ? calculateStat(champion.stats.mpregen, champion.stats.mpregenperlevel, championLevel) + (buildBonuses.mpRegen || 0) + (spellBonuses.mpRegen || 0) : 0,
      crit: calculateStat(champion.stats.crit, champion.stats.critperlevel, championLevel) + (buildBonuses.crit || 0) + (spellBonuses.crit || 0),
      abilityPower: (buildBonuses.abilityPower || 0) + (spellBonuses.abilityPower || 0),
    };
  }, [champion, championLevel, buildBonuses, spellBonuses, resourceType]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const versionResponse = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
        const versions = await versionResponse.json();
        setCurrentVersion(versions[0]);

        const itemsResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${versions[0]}/data/fr_FR/item.json`);
        const itemsJson = await itemsResponse.json();
        setItemsData(itemsJson.data);

        const ddragonResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${versions[0]}/data/fr_FR/champion/${championId}.json`);
        const ddragonData = await ddragonResponse.json();
        const ddragonChampion = ddragonData.data[championId];

        const cdragonResponse = await fetch(`https://raw.communitydragon.org/latest/game/data/characters/${championId.toLowerCase()}/${championId.toLowerCase()}.bin.json`);
        const cdragonData = await cdragonResponse.json();

        const spellKeys = [
          `Characters/${championId}/Spells/${championId}QAbility/${championId}Q`,
          `Characters/${championId}/Spells/${championId}WAbility/${championId}W`,
          `Characters/${championId}/Spells/${championId}EAbility/${championId}E`,
          `Characters/${championId}/Spells/${championId}RAbility/${championId}R`,
        ];

        const championData = {
          id: ddragonChampion.id,
          name: ddragonChampion.name,
          title: ddragonChampion.title,
          blurb: ddragonChampion.blurb,
          tags: ddragonChampion.tags,
          stats: ddragonChampion.stats,
          passive: ddragonChampion.passive,
          spells: spellKeys.map((key, index) => {
            const cdragonSpell = cdragonData[key]?.mSpell;
            if (!cdragonSpell) {
              console.warn(`Spell ${key} missing in CommunityDragon for ${championId}, using Data Dragon fallback`);
              return {
                ...ddragonChampion.spells[index],
                mSpellCalculations: {},
                mDataValues: [],
              };
            }
            return {
              id: ddragonChampion.spells[index].id,
              name: ddragonChampion.spells[index].name,
              description: ddragonChampion.spells[index].description,
              tooltip: ddragonChampion.spells[index].tooltip,
              cooldownBurn: cdragonSpell.cooldownTime ? cdragonSpell.cooldownTime.join("/") : ddragonChampion.spells[index].cooldownBurn,
              costBurn: cdragonSpell.mana ? cdragonSpell.mana.join("/") : ddragonChampion.spells[index].costBurn,
              image: ddragonChampion.spells[index].image,
              mSpellCalculations: cdragonSpell.mSpellCalculations || {},
              mDataValues: cdragonSpell.mDataValues || [],
            };
          }),
          skins: ddragonChampion.skins,
        };

        console.log("Fetched champion data (Q):", championData.spells[0]);
        setChampion(championData);
        setSkins(championData.skins);

        if (token) {
          const buildsResponse = await getBuilds(token, championId);
          setSavedBuilds(Array.isArray(buildsResponse.data) ? buildsResponse.data : []);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [championId, token]);

  useEffect(() => {
    if (!skins.length) return;

    const timer = setInterval(() => {
      setCurrentSkinIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % skins.length;
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        return nextIndex;
      });
    }, 6000);

    return () => clearInterval(timer);
  }, [skins]);

  const refreshBuilds = async () => {
    if (!token) return;
    try {
      const buildsResponse = await getBuilds(token, championId);
      setSavedBuilds(Array.isArray(buildsResponse.data) ? buildsResponse.data : []);
    } catch (err) {
      console.error("Erreur lors du rafraîchissement des builds:", err);
      setSavedBuilds([]);
    }
  };

  const handleEditBuild = async (buildId, newItems) => {
    if (!token) return Alert.alert("Erreur", "Vous devez être connecté pour modifier un build.");
    try {
      const itemsString = JSON.stringify(newItems);
      await updateBuild(token, buildId, itemsString);
      await refreshBuilds();
      Alert.alert("Succès", "Build mis à jour avec succès.");
    } catch (err) {
      console.error("Erreur lors de la modification:", err);
      Alert.alert("Erreur", "Impossible de modifier le build.");
    }
  };

  const handleDeleteBuild = async (buildId) => {
    if (!token) return Alert.alert("Erreur", "Vous devez être connecté pour supprimer un build.");
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

  const formatChampionId = (id = "") => id.charAt(0).toUpperCase() + id.slice(1).toLowerCase();

  const formatSpellDescription = (description = "", spellLevel = 0, cooldownBurn = "", costBurn = "", resType = resourceType, mSpellCalculations = {}, mDataValues = []) => {
    console.log(`formatSpellDescription for ${description.slice(0, 20)}...:`, {
      description,
      spellLevel,
      cooldownBurn,
      costBurn,
      resType,
      mSpellCalculations: JSON.stringify(mSpellCalculations, null, 2),
      mDataValues: JSON.stringify(mDataValues, null, 2),
    });

    let formattedDescription = description;
    let baseDamageText = "<br><strong>Dégâts de base :</strong> ";
    let hasBaseDamage = false;

    const damageCalcKeys = ["TotalDamage", "SingleFireDamage", "RCalculatedDamage", "Damage"];
    const damageCalc = damageCalcKeys.find((key) => mSpellCalculations[key]) ? mSpellCalculations[damageCalcKeys.find((key) => mSpellCalculations[key])] : null;

    if (damageCalc && damageCalc.mFormulaParts) {
      let baseDamage = 0;

      damageCalc.mFormulaParts.forEach((part) => {
        if (part.__type === "NamedDataValueCalculationPart" && part.mDataValue) {
          const dataValueName = part.mDataValue;
          const dataValue = mDataValues.find((dv) => dv.mName === dataValueName);
          if (dataValue && dataValue.mValues) {
            baseDamage += dataValue.mValues[spellLevel] || 0;
            hasBaseDamage = true;
          }
        }
      });

      if (hasBaseDamage) {
        baseDamageText += `${baseDamage.toFixed(1)}`;
        formattedDescription += baseDamageText;
      }
    }

    if (cooldownBurn) {
      const cooldowns = cooldownBurn.split("/");
      const cooldownAtLevel = cooldowns[spellLevel] || cooldowns[0];
      formattedDescription += `<br><strong>Cooldown :</strong> ${cooldownAtLevel}s`;
    }

    if (costBurn && costBurn !== "0") {
      const costs = costBurn.split("/");
      const costAtLevel = costs[spellLevel] || costs[0];
      formattedDescription += `<br><strong>Coût :</strong> ${costAtLevel} ${resType === "Énergie" ? "énergie" : resType === "Mana" ? "mana" : ""}`;
    }

    console.log("Final formatted description:", formattedDescription);
    return formattedDescription;
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
            const formattedChampionId = formatChampionId(championId);
            const skinUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${formattedChampionId}_${item.num}.jpg`;
            return (
                <View style={styles.skinContainer}>
                  <Image source={{ uri: skinUrl }} style={styles.skinBackground} resizeMode="cover" />
                </View>
            );
          }}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => flatListRef.current?.scrollToIndex({ index: info.index, animated: true }), 500);
          }}
          initialScrollIndex={currentSkinIndex}
          getItemLayout={(data, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
          style={styles.sliderContainer}
      />
  );

  const renderStats = () => {
    if (loading || !itemsData || !champion) return <Text style={styles.loadingText}>Chargement des données...</Text>;
    const resType = resourceType;
    return (
        <View style={styles.statsContainer}>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}><Text style={styles.statText}>HP: {stats.hp.toFixed(1)}{buildBonuses.hp || spellBonuses.hp ? ` (+${buildBonuses.hp || 0} items, +${spellBonuses.hp || 0} sorts)` : ''}</Text></View>
            {resType === "Mana" && (
                <View style={styles.statItem}><Text style={styles.statText}>Mana: {stats.mp.toFixed(1)}{buildBonuses.mp || spellBonuses.mp ? ` (+${buildBonuses.mp || 0} items, +${spellBonuses.mp || 0} sorts)` : ''}</Text></View>
            )}
            {resType === "Énergie" && (
                <View style={styles.statItem}><Text style={styles.statText}>Énergie: {stats.energy.toFixed(1)}{buildBonuses.mp ? ` (+${buildBonuses.mp} items)` : ''}</Text></View>
            )}
            <View style={styles.statItem}><Text style={styles.statText}>Armor: {stats.armor.toFixed(1)}{buildBonuses.armor || spellBonuses.armor ? ` (+${buildBonuses.armor || 0} items, +${spellBonuses.armor || 0} sorts)` : ''}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>MR: {stats.spellblock.toFixed(1)}{buildBonuses.spellblock || spellBonuses.spellblock ? ` (+${buildBonuses.spellblock || 0} items, +${spellBonuses.spellblock || 0} sorts)` : ''}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>AD: {stats.attackDamage.toFixed(1)}{buildBonuses.attackDamage || spellBonuses.attackDamage ? ` (+${buildBonuses.attackDamage || 0} items, +${spellBonuses.attackDamage || 0} sorts)` : ''}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>AS: {stats.attackSpeed.toFixed(2)}{buildBonuses.attackSpeed || spellBonuses.attackSpeed ? ` (+${(buildBonuses.attackSpeed || 0).toFixed(2)} items, +${(spellBonuses.attackSpeed || 0).toFixed(2)} sorts)` : ''}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>Move Speed: {stats.moveSpeed}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>Range: {stats.attackRange}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>HP Regen: {stats.hpRegen.toFixed(1)}{buildBonuses.hpRegen || spellBonuses.hpRegen ? ` (+${buildBonuses.hpRegen || 0} items, +${spellBonuses.hpRegen || 0} sorts)` : ''}</Text></View>
            {resType === "Mana" && (
                <View style={styles.statItem}><Text style={styles.statText}>Mana Regen: {stats.mpRegen.toFixed(1)}{buildBonuses.mpRegen || spellBonuses.mpRegen ? ` (+${buildBonuses.mpRegen || 0} items, +${spellBonuses.mpRegen || 0} sorts)` : ''}</Text></View>
            )}
            <View style={styles.statItem}><Text style={styles.statText}>Crit: {stats.crit.toFixed(1)}%{buildBonuses.crit || spellBonuses.crit ? ` (+${buildBonuses.crit || 0} items, +${spellBonuses.crit || 0} sorts)` : ''}</Text></View>
            <View style={styles.statItem}><Text style={styles.statText}>AP: {stats.abilityPower.toFixed(1)}{buildBonuses.abilityPower || spellBonuses.abilityPower ? ` (+${buildBonuses.abilityPower || 0} items, +${spellBonuses.abilityPower || 0} sorts)` : ''}</Text></View>
          </View>
        </View>
    );
  };

  const renderLevelControl = () => (
      <View style={styles.levelContainer}>
        <Text style={styles.levelText}>Niveau: {championLevel}</Text>
        <View style={styles.levelButtonsContainer}>
          <Pressable style={styles.levelButton} onPress={() => setChampionLevel((prev) => Math.max(1, prev - 1))}>
            <Text style={styles.levelButtonText}>-</Text>
          </Pressable>
          <Pressable style={styles.levelButton} onPress={() => setChampionLevel((prev) => Math.min(18, prev + 1))}>
            <Text style={styles.levelButtonText}>+</Text>
          </Pressable>
        </View>
      </View>
  );

  const renderPassive = () => (
      champion?.passive && (
          <View style={styles.spellContainer}>
            <Text style={styles.spellName}>Passif - {champion.passive.name}</Text>
            <Image
                source={{ uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/passive/${champion.passive.image.full}` }}
                style={styles.spellIcon}
            />
            <HTML
                source={{ html: champion.passive.description }}
                contentWidth={screenWidth - 40}
                baseStyle={styles.spellDescription}
                tagsStyles={{ strong: { color: "#ffcc00", fontWeight: "bold" } }}
            />
          </View>
      )
  );

  const renderSpells = () => (
      Array.isArray(champion?.spells) ? (
          champion.spells.map((spell, index) => {
            const spellKey = ["Q", "W", "E", "R"][index];
            const maxLevel = spellKey === "R" ? 3 : 5;
            const currentLevel = spellLevels[spellKey];
            const formattedDescription = formatSpellDescription(
                spell.description,
                currentLevel,
                spell.cooldownBurn,
                spell.costBurn,
                resourceType,
                spell.mSpellCalculations,
                spell.mDataValues
            );

            return (
                <View key={index} style={styles.spellContainer}>
                  <View style={styles.spellHeader}>
                    <Text style={styles.spellName}>{spellKey} - {spell.name}</Text>
                    <View style={styles.spellLevelControls}>
                      <Pressable
                          style={styles.spellLevelButton}
                          onPress={() => setSpellLevels((prev) => ({ ...prev, [spellKey]: Math.max(0, prev[spellKey] - 1) }))}
                      >
                        <Text style={styles.spellLevelButtonText}>-</Text>
                      </Pressable>
                      <Text style={styles.spellLevelText}>{currentLevel + 1}/{maxLevel}</Text>
                      <Pressable
                          style={styles.spellLevelButton}
                          onPress={() => setSpellLevels((prev) => ({ ...prev, [spellKey]: Math.min(maxLevel - 1, prev[spellKey] + 1) }))}
                      >
                        <Text style={styles.spellLevelButtonText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                  <Image
                      source={{ uri: `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/img/spell/${spell.image.full}` }}
                      style={styles.spellIcon}
                  />
                  <HTML
                      source={{ html: formattedDescription }}
                      contentWidth={screenWidth - 40}
                      baseStyle={styles.spellDescription}
                      tagsStyles={{ strong: { color: "#ffcc00", fontWeight: "bold" } }}
                  />
                </View>
            );
          })
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
                    <Pressable style={styles.checkboxContainer} onPress={() => toggleBuildSelection(build.id)}>
                      <View style={[styles.checkbox, selectedBuildId === build.id && styles.checkboxChecked]}>
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
                        style={({ pressed }) => [styles.editButton, { backgroundColor: pressed ? "#e6b800" : "#ffcc00" }]}
                        onPress={() =>
                            navigation.navigate("ItemSelectionScreen", {
                              championId: championId,
                              buildId: build.id,
                              initialItems: JSON.parse(build.items),
                              onSaveBuild: (newItems) => handleEditBuild(build.id, newItems),
                            })
                        }
                    >
                      <Text style={styles.editButtonText}>Modifier</Text>
                    </Pressable>
                    <Pressable
                        style={({ pressed }) => [styles.deleteButton, { backgroundColor: pressed ? "#cc0000" : "#ff4444" }]}
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
            style={({ pressed }) => [styles.addButton, { backgroundColor: pressed ? "#e6b800" : "#ffcc00" }]}
            onPress={() => navigation.navigate("ItemSelectionScreen", { championId: championId, onSaveBuild: refreshBuilds })}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>
  );

  return (
      <View style={styles.fullContainer}>
        {renderSkinSlider()}
        <ScrollView style={styles.contentContainer} contentContainerStyle={styles.contentPadding}>
          {loading || !champion ? (
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
  spellHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  spellLevelControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  spellLevelButton: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffcc00",
  },
  spellLevelButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e1e1e",
  },
  spellLevelText: {
    fontSize: 14,
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