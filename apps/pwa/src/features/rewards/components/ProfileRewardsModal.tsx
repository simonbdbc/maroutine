import { useCallback, useEffect, useState } from "react";
import { Modal, ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppIcon, Button, Card, Text, useAppDialog } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { getProfile } from "@features/profiles/services/profileRepo";
import type { ChildProfile } from "@features/profiles/types";
import { canRedeemReward } from "../services/rewardValidation";
import { listProfileRewards, redeemProfileReward } from "../services/rewardRepo";
import type { ProfileReward, RedeemProfileRewardResult } from "../types";

interface ProfileRewardsModalProps {
  visible: boolean;
  profileId: string | null;
  initialProfileName?: string | undefined;
  onClose: () => void;
  onRedeemed?: (result: RedeemProfileRewardResult) => void;
}

export function ProfileRewardsModal({
  visible,
  profileId,
  initialProfileName,
  onClose,
  onRedeemed,
}: ProfileRewardsModalProps) {
  const appDialog = useAppDialog();
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [rewards, setRewards] = useState<ProfileReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profileId) return;
    setLoading(true);
    try {
      const [profileData, rewardData] = await Promise.all([
        getProfile(profileId),
        listProfileRewards(profileId),
      ]);
      setProfile(profileData);
      setRewards(rewardData);
    } catch (error) {
      appDialog.showError(
        error instanceof Error ? error.message : "Impossible de charger les récompenses."
      );
    } finally {
      setLoading(false);
    }
  }, [appDialog.showError, profileId]);

  useEffect(() => {
    if (!visible) {
      setRedeemingId(null);
      return;
    }
    setProfile(null);
    setRewards([]);
    void load();
  }, [load, visible]);

  async function performRedeem(reward: ProfileReward) {
    if (redeemingId) return;
    setRedeemingId(reward.id);
    try {
      const result = await redeemProfileReward(reward.id);
      setProfile((current) => (current ? { ...current, balance: result.newBalance } : current));
      onRedeemed?.(result);
    } catch (error) {
      appDialog.showError(
        error instanceof Error ? error.message : "Impossible d'échanger cette récompense."
      );
      await load();
    } finally {
      setRedeemingId(null);
    }
  }

  function handleRedeem(reward: ProfileReward) {
    appDialog.confirmDialog({
      title: "Échanger cette récompense ?",
      message: `${reward.rewardName}\nCoût: ${reward.costStars} étoiles`,
      confirmLabel: "Échanger",
      onConfirm: () => void performRedeem(reward),
    });
  }

  const profileName = (profile?.name ?? initialProfileName) || "Enfant";
  const balance = profile?.balance ?? 0;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
          <View
            className="flex-row items-center justify-between px-5 pb-4 pt-5"
            style={{ borderBottomWidth: 1, borderBottomColor: Colors.grey }}
          >
            <TouchableOpacity
              accessibilityLabel="Fermer"
              accessibilityRole="button"
              onPress={onClose}
              className="h-10 w-10 items-center justify-center"
            >
              <AppIcon name="close" tintColor={Colors.black} />
            </TouchableOpacity>

            <Text variant="title">Récompenses</Text>

            <View style={{ width: 40, height: 40 }} />
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 24,
              paddingBottom: 60,
              gap: 16,
            }}
            showsVerticalScrollIndicator={false}
          >
            {!profileId ? (
              <View
                style={{ alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}
              >
                <Text variant="h4">Profil introuvable</Text>
                <Button label="Retour" variant="outline" onPress={onClose} />
              </View>
            ) : (
              <>
                <View style={{ gap: 8 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      color: withAlpha(Colors.black, 0.64),
                      fontFamily: "Fredoka_600SemiBold",
                    }}
                  >
                    {profileName}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text
                      style={{ color: Colors.black, fontFamily: "Fredoka_700Bold", fontSize: 14 }}
                    >
                      Tirelire : {balance}
                    </Text>
                    <AppIcon name="star" size={15} tintColor={Colors.black} />
                  </View>
                </View>

                {loading ? (
                  <Text style={{ color: withAlpha(Colors.black, 0.56), fontSize: 13 }}>
                    Chargement…
                  </Text>
                ) : rewards.length === 0 ? (
                  <Card className="gap-3 p-4">
                    <Text
                      style={{
                        color: withAlpha(Colors.black, 0.56),
                        textAlign: "center",
                        fontSize: 13,
                      }}
                    >
                      Aucune récompense disponible pour {profileName}.
                    </Text>
                  </Card>
                ) : (
                  rewards.map((reward) => {
                    const available = canRedeemReward(balance, reward.costStars);
                    const redeeming = redeemingId === reward.id;
                    return (
                      <Card key={reward.id} className="gap-3 p-4">
                        <View style={{ gap: 3 }}>
                          <Text
                            style={{
                              fontSize: 17,
                              fontFamily: "Fredoka_700Bold",
                              color: Colors.black,
                            }}
                          >
                            {reward.rewardName}
                          </Text>
                          <Text
                            style={{
                              fontSize: 13,
                              color: withAlpha(Colors.black, 0.64),
                              fontFamily: "Fredoka_600SemiBold",
                            }}
                          >
                            {reward.durationMinutes} minutes · {reward.costStars} étoiles
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRedeem(reward)}
                          disabled={!available || redeemingId !== null}
                          style={{
                            minHeight: 44,
                            borderRadius: 12,
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: available ? Colors.primary : Colors.grey,
                            opacity: redeemingId !== null && !redeeming ? 0.5 : 1,
                          }}
                        >
                          <Text
                            style={{
                              color: Colors.white,
                              fontFamily: "Fredoka_700Bold",
                              fontSize: 13,
                            }}
                          >
                            {redeeming ? "Échange…" : `Échanger contre ${reward.costStars} étoiles`}
                          </Text>
                        </TouchableOpacity>
                      </Card>
                    );
                  })
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
      {appDialog.dialog}
    </>
  );
}
