import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppIcon, Button, Card, Text } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import {
  listBalanceHistory,
  groupBalanceHistoryByProfile,
  resolveHistoryPeriod,
  shiftHistoryPeriod,
  type BalanceHistoryEntry,
  type HistoryPeriod,
  type HistoryPeriodMode,
} from "@features/rewards";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sourceLabel(source: BalanceHistoryEntry["source"]): string {
  switch (source) {
    case "daily_validation":
      return "Gain";
    case "manual_adjustment":
      return "Ajustement";
    case "reward_redemption":
      return "Récompense";
  }
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim().length > 0 ? error.message : fallback;
}

export default function HistoryScreen() {
  const [period, setPeriod] = useState<HistoryPeriod>(() => resolveHistoryPeriod("week"));
  const [entries, setEntries] = useState<BalanceHistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const entriesByProfile = useMemo(() => {
    return groupBalanceHistoryByProfile(entries);
  }, [entries]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await listBalanceHistory({ start: period.start, end: period.end }));
    } catch (loadError) {
      setEntries([]);
      setError(toErrorMessage(loadError, "Impossible de charger l'historique."));
    } finally {
      setLoading(false);
    }
  }, [period.end, period.start]);

  useEffect(() => {
    void load();
  }, [load]);

  function setMode(mode: HistoryPeriodMode) {
    setPeriod(resolveHistoryPeriod(mode, period.start));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.white }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 60,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ gap: 4 }}>
          <Text style={{ color: withAlpha(Colors.black, 0.56), fontSize: 12 }}>
            Permet de suivre l'historique des ajouts et retraits d'étoiles pour chaque enfant.
          </Text>
        </View>

        <Card className="p-3 gap-3">
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["week", "month"] as HistoryPeriodMode[]).map((mode) => {
              const selected = period.mode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setMode(mode)}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: selected ? Colors.primary : Colors.grey,
                    backgroundColor: selected ? withAlpha(Colors.primary, 0.1) : Colors.white,
                  }}
                >
                  <Text
                    style={{
                      color: selected ? Colors.primary : Colors.black,
                      fontFamily: "Fredoka_700Bold",
                      fontSize: 13,
                    }}
                  >
                    {mode === "week" ? "Semaine" : "Mois"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TouchableOpacity
              onPress={() => setPeriod((current) => shiftHistoryPeriod(current, -1))}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: Colors.grey,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon name="chevron-left" tintColor={Colors.black} />
            </TouchableOpacity>
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                textAlign: "center",
                color: Colors.black,
                fontFamily: "Fredoka_700Bold",
                fontSize: 14,
              }}
            >
              {period.label}
            </Text>
            <TouchableOpacity
              onPress={() => setPeriod((current) => shiftHistoryPeriod(current, 1))}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: Colors.grey,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppIcon name="chevron-right" tintColor={Colors.black} />
            </TouchableOpacity>
          </View>
        </Card>

        {loading ? (
          <Text style={{ color: withAlpha(Colors.black, 0.56), fontSize: 13 }}>Chargement…</Text>
        ) : error ? (
          <Card className="p-4 gap-3">
            <Text style={{ color: Colors.error, textAlign: "center", fontSize: 13 }}>{error}</Text>
            <Button label="Réessayer" variant="outline" onPress={() => void load()} />
          </Card>
        ) : entries.length === 0 ? (
          <Card className="p-4">
            <Text
              style={{ color: withAlpha(Colors.black, 0.56), textAlign: "center", fontSize: 13 }}
            >
              Aucun mouvement sur cette période.
            </Text>
          </Card>
        ) : (
          entriesByProfile.map((group) => (
            <View key={group.profileId} style={{ gap: 8 }}>
              <Text style={{ color: Colors.black, fontFamily: "Fredoka_700Bold", fontSize: 16 }}>
                {group.profileName}
              </Text>
              {group.entries.map((entry) => {
                const positive = entry.deltaStars > 0;
                return (
                  <Card key={entry.id} className="p-4 gap-2">
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text
                          style={{
                            color: Colors.black,
                            fontFamily: "Fredoka_700Bold",
                            fontSize: 14,
                          }}
                        >
                          {entry.description}
                        </Text>
                        <Text style={{ color: withAlpha(Colors.black, 0.56), fontSize: 12 }}>
                          {sourceLabel(entry.source)} · {formatDateTime(entry.occurredAt)}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 2 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <Text
                            style={{
                              color: positive ? Colors.success : Colors.error,
                              fontFamily: "Fredoka_700Bold",
                              fontSize: 15,
                            }}
                          >
                            {positive ? "+" : ""}
                            {entry.deltaStars}
                          </Text>
                          <AppIcon name="star" size={14} tintColor={Colors.white} />
                        </View>
                        <Text style={{ color: withAlpha(Colors.black, 0.56), fontSize: 11 }}>
                          Solde {entry.balanceAfter}
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
