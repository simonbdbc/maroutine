import { memo, useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import { Text } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { StickerImage } from "@features/stickers/components/StickerImage";
import {
  HOME_LAYOUT_METRICS,
  resolveCompactMetric,
} from "@features/home/utils/homeLayoutMetrics";

interface StickerSlotProps {
  /** null = slot vide, string = sticker placé */
  stickerKey: string | null;
  /** "task" (petit) ou "activity" (grand) */
  variant?: "task" | "activity";
  /** Mode compact smartphone-only */
  compact?: boolean;
  /** Affichage simple (sans glow/pulse/badge), utile pour l'état pending */
  simple?: boolean;
  /** Couleur du cercle quand un sticker est placé */
  filledColor?: string;
  /** Afficher un check au lieu d'un sticker (pour les tâches) */
  showCheck?: boolean;
  /** Étoiles affichées sur le sticker coché */
  stars?: number;
}

/**
 * Slot pour sticker — cercle dashed vide, image sticker, ou check.
 * EPIC 6 : utilise StickerImage (vraies images) au lieu d'emojis.
 */
export function StickerSlot({
  stickerKey,
  variant = "task",
  compact = false,
  simple = false,
  filledColor = Colors.secondaryPastel,
  showCheck = false,
  stars = 0,
}: StickerSlotProps) {
  const isActivity = variant === "activity";
  const size = isActivity
    ? resolveCompactMetric(HOME_LAYOUT_METRICS.stickerSlot.activitySize, compact)
    : resolveCompactMetric(HOME_LAYOUT_METRICS.stickerSlot.taskSize, compact);
  const isEmpty = !stickerKey && !showCheck;

  // ── Slot vide ──────────────────────────────────────────
  if (isEmpty) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: isActivity ? 2 : 1.5,
          borderStyle: "dashed",
          borderColor: Colors.grey,
          backgroundColor: withAlpha(Colors.white, 0.6),
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    );
  }

  // ── Check (tâche cochée, pas de sticker) ───────────────
  if (showCheck && !stickerKey) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: filledColor,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: Colors.grey,
        }}
      >
        <Text style={{ fontSize: isActivity ? 20 : 16, color: Colors.black }}>✓</Text>
      </View>
    );
  }

  // ── Sticker simple (pending) ────────────────────────────
  if (stickerKey && simple) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: withAlpha(Colors.white, 0.9),
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1.5,
          borderColor: Colors.grey,
          overflow: "hidden",
        }}
      >
        <StickerImage stickerKey={stickerKey} size={size - 4} />
      </View>
    );
  }

  // ── Sticker coché (style v1 : glow + badge + sparkles) ─
  const badgeSize = Math.max(14, Math.round(size * 0.42));
  return (
    <DoneSticker
      stickerKey={stickerKey!}
      size={size}
      badgeSize={badgeSize}
      stars={stars}
      filledColor={filledColor}
    />
  );
}

const Sparkle = memo(function Sparkle({
  x,
  y,
  delay,
  size,
}: {
  x: number;
  y: number;
  delay: number;
  size: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(380),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.4,
            duration: 260,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(700),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, opacity, scale]);

  return (
    <Animated.Text
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontSize: size,
        color: Colors.secondary,
        opacity,
        transform: [{ scale }],
      }}
    >
      ✦
    </Animated.Text>
  );
});

function DoneSticker({
  stickerKey,
  size,
  badgeSize,
  stars,
  filledColor,
}: {
  stickerKey: string;
  size: number;
  badgeSize: number;
  stars: number;
  filledColor: string;
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={{
        width: size,
        height: size,
        transform: [{ scale: pulse }],
      }}
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: Colors.secondary,
          backgroundColor: filledColor,
          shadowColor: Colors.secondary,
          shadowOpacity: 0.85,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 0 },
          elevation: 10,
        }}
      />

      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StickerImage stickerKey={stickerKey} size={size} />
      </View>

      <Sparkle x={-5} y={-7} delay={0} size={size > 44 ? 10 : 7} />
      <Sparkle x={size - 8} y={-5} delay={320} size={size > 44 ? 9 : 6} />
      <Sparkle x={size / 2 - 4} y={-10} delay={660} size={size > 44 ? 8 : 6} />

      {stars > 0 ? (
        <View
          style={{
            position: "absolute",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors.secondary,
            borderWidth: 2,
            borderColor: Colors.black,
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            bottom: -(badgeSize * 0.2),
            right: -(badgeSize * 0.12),
            shadowColor: Colors.black,
            shadowOpacity: 0.16,
            shadowRadius: 4,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          }}
        >
          <Text
            style={{
              color: Colors.warning,
              fontFamily: "Fredoka_700Bold",
              fontSize: size > 44 ? 10 : 9,
              lineHeight: size > 44 ? 11 : 10,
            }}
          >
            +{stars}
          </Text>
        </View>
      ) : null}
    </Animated.View>
  );
}
