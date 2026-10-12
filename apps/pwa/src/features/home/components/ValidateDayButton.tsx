import { View, TouchableOpacity } from "react-native";
import { Text, useAppDialog } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha, type ProfileColorSet } from "@shared/utils/colorUtils";
import {
  HOME_LAYOUT_METRICS,
  resolveCompactMetric,
} from "@features/home/utils/homeLayoutMetrics";

interface ValidateDayButtonProps {
  colors: ProfileColorSet;
  compact?: boolean;
  isDayValidated: boolean;
  validatingDay?: boolean;
  todayStars: number;
  progressPercent: number;
  onValidate: () => Promise<void> | void;
}

/**
 * Bouton sticky "Valider la journée!" en bas de l'écran.
 * Utilise primaryBase du profil.
 */
export function ValidateDayButton({
  colors,
  compact = false,
  isDayValidated,
  validatingDay = false,
  todayStars,
  progressPercent,
  onValidate,
}: ValidateDayButtonProps) {
  const appDialog = useAppDialog();
  const containerPaddingHorizontal = resolveCompactMetric(
    HOME_LAYOUT_METRICS.validateButton.containerPaddingHorizontal,
    compact,
  );
  const containerPaddingVertical = resolveCompactMetric(
    HOME_LAYOUT_METRICS.validateButton.containerPaddingVertical,
    compact,
  );
  const buttonPaddingVertical = resolveCompactMetric(
    HOME_LAYOUT_METRICS.validateButton.buttonPaddingVertical,
    compact,
  );
  const buttonRadius = resolveCompactMetric(HOME_LAYOUT_METRICS.validateButton.buttonRadius, compact);
  const buttonLabelFontSize = resolveCompactMetric(
    HOME_LAYOUT_METRICS.validateButton.buttonLabelFontSize,
    compact,
  );
  const buttonEmojiSize = resolveCompactMetric(
    HOME_LAYOUT_METRICS.validateButton.buttonEmojiSize,
    compact,
  );
  const buttonGap = resolveCompactMetric(HOME_LAYOUT_METRICS.validateButton.buttonGap, compact);
  const successEmojiSize = resolveCompactMetric(
    HOME_LAYOUT_METRICS.validateButton.successEmojiSize,
    compact,
  );
  const successLabelSize = resolveCompactMetric(
    HOME_LAYOUT_METRICS.validateButton.successLabelSize,
    compact,
  );
  const minButtonHeight = resolveCompactMetric(
    HOME_LAYOUT_METRICS.validateButton.minButtonHeight,
    compact,
  );

  if (isDayValidated) {
    return (
      <View
        style={{
          paddingHorizontal: containerPaddingHorizontal,
          paddingVertical: containerPaddingVertical,
          backgroundColor: withAlpha(Colors.white, 0.95),
          borderTopWidth: 1,
          borderTopColor: Colors.grey,
        }}
      >
        <View
          style={{
            paddingVertical: buttonPaddingVertical,
            borderRadius: buttonRadius,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: buttonGap,
            backgroundColor: withAlpha(Colors.success, 0.16),
          }}
        >
          <Text style={{ fontSize: successEmojiSize }}>🎉</Text>
          <Text
            style={{
              color: Colors.success,
              fontFamily: "Fredoka_700Bold",
              fontSize: successLabelSize,
            }}
          >
            Journée validée !
          </Text>
        </View>
      </View>
    );
  }

  function handlePress() {
    if (validatingDay) return;

    const starsLabel = `${todayStars} étoile${todayStars > 1 ? "s" : ""}`;
    const starsMessage = todayStars > 0
      ? `Tu vas gagner ${starsLabel}.`
      : "Tu ne gagneras pas d'étoile aujourd'hui.";
    const message = `${starsMessage}\nProgression: ${progressPercent}%\nCette action est définitive pour aujourd'hui.`;

    appDialog.confirmDialog({
      title: "Valider la journée ?",
      message,
      confirmLabel: "Valider !",
      onConfirm: () => void onValidate(),
    });
  }

  return (
    <>
      <View
        style={{
          paddingHorizontal: containerPaddingHorizontal,
          paddingVertical: containerPaddingVertical,
          backgroundColor: withAlpha(Colors.white, 0.95),
          borderTopWidth: 1,
          borderTopColor: Colors.grey,
        }}
      >
        <TouchableOpacity
          onPress={handlePress}
          disabled={validatingDay}
          activeOpacity={0.85}
          style={{
            minHeight: minButtonHeight,
            paddingVertical: buttonPaddingVertical,
            borderRadius: buttonRadius,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: buttonGap,
            backgroundColor: colors.primaryBase,
            shadowColor: colors.primaryBase,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 8,
            opacity: validatingDay ? 0.75 : 1,
          }}
        >
          <Text
            style={{
              color: Colors.white,
              fontFamily: "Fredoka_700Bold",
              fontSize: buttonLabelFontSize,
            }}
          >
            {validatingDay ? "Validation..." : "Valider la journée!"}
          </Text>
          <Text style={{ fontSize: buttonEmojiSize }}>{validatingDay ? "⏳" : "✅"}</Text>
        </TouchableOpacity>
      </View>
      {appDialog.dialog}
    </>
  );
}
