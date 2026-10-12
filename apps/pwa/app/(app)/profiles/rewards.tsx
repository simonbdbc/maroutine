import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { AppIcon, Button, Card, Text, useAppDialog } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { useAppHeaderControls } from "@navigation/appHeader";
import {
  createProfileReward,
  deleteProfileReward,
  listProfileRewards,
  listRewards,
  parsePositiveIntegerDraft,
  updateProfileReward,
  type CatalogReward,
  type ProfileReward,
} from "@features/rewards";

const HEADER_ACTION_SIZE = 34;

function paramString(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default function ProfileRewardsManagementScreen() {
  const params = useLocalSearchParams();
  const profileId = paramString(params.profileId);
  const profileName = paramString(params.profileName) || "Enfant";
  const primaryColor = paramString(params.primaryColor) || Colors.primary;
  const appDialog = useAppDialog();

  const [catalogRewards, setCatalogRewards] = useState<CatalogReward[]>([]);
  const [profileRewards, setProfileRewards] = useState<ProfileReward[]>([]);
  const [selectedRewardId, setSelectedRewardId] = useState("");
  const [durationDraft, setDurationDraft] = useState("");
  const [costDraft, setCostDraft] = useState("");
  const [editingReward, setEditingReward] = useState<ProfileReward | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const usedRewardIds = useMemo(
    () => new Set(profileRewards.map((reward) => reward.rewardId)),
    [profileRewards]
  );

  const selectableRewards = useMemo(
    () => catalogRewards.filter((reward) => editingReward?.rewardId === reward.id || !usedRewardIds.has(reward.id)),
    [catalogRewards, editingReward, usedRewardIds]
  );

  const load = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const [catalog, childRewards] = await Promise.all([
        listRewards(),
        listProfileRewards(profileId),
      ]);
      setCatalogRewards(catalog);
      setProfileRewards(childRewards);
      setSelectedRewardId((current) => current || (catalog.find((reward) => !childRewards.some((item) => item.rewardId === reward.id))?.id ?? ""));
    } catch (error) {
      appDialog.showError(error instanceof Error ? error.message : "Impossible de charger les récompenses.");
    } finally {
      setLoading(false);
    }
  }, [appDialog.showError, profileId]);

  useEffect(() => {
    void load();
  }, [load]);

  const headerLeft = useMemo(
    () => (
      <TouchableOpacity
        accessibilityLabel="Retour aux enfants"
        accessibilityRole="button"
        onPress={() => router.replace("/(app)/profiles")}
        style={{
          width: HEADER_ACTION_SIZE,
          height: HEADER_ACTION_SIZE,
          borderRadius: 21,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: withAlpha(primaryColor, 0.09),
          borderWidth: 1,
          borderColor: withAlpha(primaryColor, 0.25),
        }}
      >
        <AppIcon name="back" tintColor={primaryColor} />
      </TouchableOpacity>
    ),
    [primaryColor],
  );

  useAppHeaderControls({ left: headerLeft, title: "Récompenses" });

  function resetForm() {
    setEditingReward(null);
    setDurationDraft("");
    setCostDraft("");
    const nextReward = catalogRewards.find((reward) => !profileRewards.some((item) => item.rewardId === reward.id));
    setSelectedRewardId(nextReward?.id ?? "");
  }

  function startEdit(reward: ProfileReward) {
    setEditingReward(reward);
    setSelectedRewardId(reward.rewardId);
    setDurationDraft(String(reward.durationMinutes));
    setCostDraft(String(reward.costStars));
  }

  async function handleSubmit() {
    if (!profileId) return;
    const durationMinutes = parsePositiveIntegerDraft(durationDraft);
    const costStars = parsePositiveIntegerDraft(costDraft);
    if (!selectedRewardId) {
      appDialog.showError("Choisis une récompense du catalogue.");
      return;
    }
    if (durationMinutes == null) {
      appDialog.showError("Entre un temps d'utilisation entier supérieur à 0.");
      return;
    }
    if (costStars == null) {
      appDialog.showError("Entre un coût en étoiles entier supérieur à 0.");
      return;
    }

    setSaving(true);
    try {
      if (editingReward) {
        await updateProfileReward(editingReward.id, {
          rewardId: selectedRewardId,
          durationMinutes,
          costStars,
        });
      } else {
        await createProfileReward({
          profileId,
          rewardId: selectedRewardId,
          durationMinutes,
          costStars,
        });
      }
      resetForm();
      await load();
    } catch (error) {
      appDialog.showError(error instanceof Error ? error.message : "Impossible d'enregistrer cette récompense.");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(reward: ProfileReward) {
    appDialog.confirmDialog({
      title: "Supprimer cette récompense ?",
      message: reward.rewardName,
      confirmLabel: "Supprimer",
      variant: "danger",
      onConfirm: () => {
        void deleteProfileReward(reward.id)
          .then(load)
          .catch((error: unknown) =>
            appDialog.showError(error instanceof Error ? error.message : "Impossible de supprimer cette récompense.")
          );
      },
    });
  }

  if (!profileId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}>
          <Text variant="h4">Profil introuvable</Text>
          <Button label="Retour" variant="outline" onPress={() => router.replace("/(app)/profiles")} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 60, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 4 }}>
          <Text style={{ fontSize: 13, color: withAlpha(Colors.black, 0.64), fontFamily: "Fredoka_600SemiBold" }}>
            {profileName}
          </Text>
        </View>

        <Card className="p-4 gap-4">
          <Text style={{ fontSize: 16, fontFamily: "Fredoka_700Bold", color: Colors.black }}>
            {editingReward ? "Modifier une récompense" : "Ajouter une récompense"}
          </Text>

          {catalogRewards.length === 0 ? (
            <TouchableOpacity
              onPress={() => router.push("/(app)/catalog" as never)}
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: withAlpha(Colors.primary, 0.3),
                backgroundColor: withAlpha(Colors.primary, 0.08),
                padding: 12,
              }}
            >
              <Text style={{ color: Colors.primary, fontFamily: "Fredoka_700Bold", fontSize: 13 }}>
                Ajouter des récompenses dans le catalogue
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {selectableRewards.map((reward) => {
                const selected = selectedRewardId === reward.id;
                return (
                  <TouchableOpacity
                    key={reward.id}
                    onPress={() => setSelectedRewardId(reward.id)}
                    style={{
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: selected ? primaryColor : Colors.grey,
                      backgroundColor: selected ? withAlpha(primaryColor, 0.12) : Colors.white,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ color: selected ? primaryColor : Colors.black, fontFamily: "Fredoka_700Bold", fontSize: 13 }}>
                      {reward.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {selectableRewards.length === 0 ? (
                <Text style={{ color: withAlpha(Colors.black, 0.56), fontSize: 13 }}>
                  Toutes les récompenses du catalogue sont déjà liées à cet enfant.
                </Text>
              ) : null}
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 8 }}>
            <TextInput
              value={durationDraft}
              onChangeText={setDurationDraft}
              keyboardType="numeric"
              placeholder="Minutes"
              placeholderTextColor={withAlpha(Colors.black, 0.56)}
              style={{
                flex: 1,
                height: 42,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: Colors.grey,
                paddingHorizontal: 12,
                fontSize: 14,
                color: Colors.black,
                fontFamily: "Fredoka_600SemiBold",
              }}
            />
            <TextInput
              value={costDraft}
              onChangeText={setCostDraft}
              keyboardType="numeric"
              placeholder="Coût"
              placeholderTextColor={withAlpha(Colors.black, 0.56)}
              style={{
                flex: 1,
                height: 42,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: Colors.grey,
                paddingHorizontal: 12,
                fontSize: 14,
                color: Colors.black,
                fontFamily: "Fredoka_600SemiBold",
              }}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {editingReward ? (
              <Button label="Annuler" variant="outline" onPress={resetForm} className="flex-1" />
            ) : null}
            <Button
              label={editingReward ? "Enregistrer" : "Ajouter"}
              loading={saving}
              disabled={saving || selectableRewards.length === 0}
              onPress={handleSubmit}
              className="flex-1"
            />
          </View>
        </Card>

        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 16, fontFamily: "Fredoka_700Bold", color: Colors.black }}>
            Récompenses de {profileName}
          </Text>
          {loading ? (
            <Text style={{ color: withAlpha(Colors.black, 0.56), fontSize: 13 }}>Chargement…</Text>
          ) : profileRewards.length === 0 ? (
            <Card className="p-4">
              <Text style={{ color: withAlpha(Colors.black, 0.56), textAlign: "center", fontSize: 13 }}>
                Aucune récompense configurée.
              </Text>
            </Card>
          ) : (
            profileRewards.map((reward) => (
              <Card key={reward.id} className="p-4 gap-3">
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontSize: 15, fontFamily: "Fredoka_700Bold", color: Colors.black }}>
                      {reward.rewardName}
                    </Text>
                    <Text style={{ fontSize: 12, color: withAlpha(Colors.black, 0.64), fontFamily: "Fredoka_600SemiBold" }}>
                      {reward.durationMinutes} min · {reward.costStars} étoiles
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  <TouchableOpacity
                    onPress={() => startEdit(reward)}
                    style={{
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: Colors.grey,
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontFamily: "Fredoka_700Bold", color: withAlpha(Colors.black, 0.72) }}>
                      Modifier
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(reward)}
                    style={{
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: withAlpha(Colors.error, 0.35),
                      backgroundColor: withAlpha(Colors.error, 0.08),
                      paddingHorizontal: 10,
                      paddingVertical: 7,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontFamily: "Fredoka_700Bold", color: Colors.error }}>
                      Supprimer
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
      {appDialog.dialog}
    </SafeAreaView>
  );
}
