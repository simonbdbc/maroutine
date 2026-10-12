import { useCallback, useMemo, useState } from "react";
import { Modal, Pressable, TouchableOpacity, View } from "react-native";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { Text } from "./Text";

type AppDialogVariant = "default" | "danger" | "success" | "error";

type AppDialogConfig = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  variant?: AppDialogVariant;
  onConfirm?: () => void;
};

type AppDialogRequest = Omit<AppDialogConfig, "showCancel">;

function variantColor(variant: AppDialogVariant): string {
  if (variant === "danger" || variant === "error") return Colors.error;
  if (variant === "success") return Colors.success;
  return Colors.primary;
}

function AppDialogModal({
  config,
  onClose,
}: {
  config: AppDialogConfig | null;
  onClose: () => void;
}) {
  const visible = config !== null;
  const variant = config?.variant ?? "default";
  const accent = variantColor(variant);
  const confirmLabel = config?.confirmLabel ?? (config?.showCancel ? "Confirmer" : "OK");
  const cancelLabel = config?.cancelLabel ?? "Annuler";

  function handleConfirm() {
    const onConfirm = config?.onConfirm;
    onClose();
    onConfirm?.();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: withAlpha(Colors.black, 0.45),
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 20,
        }}
      >
        <Pressable
          accessibilityLabel="Fermer la fenêtre"
          onPress={onClose}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View
          style={{
            width: "100%",
            maxWidth: 420,
            backgroundColor: Colors.white,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: Colors.grey,
            padding: 16,
            gap: 12,
          }}
        >
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 17, fontFamily: "Fredoka_700Bold", color: Colors.black }}>
              {config?.title ?? ""}
            </Text>
            {config?.message ? (
              <Text style={{ fontSize: 13, lineHeight: 18, color: withAlpha(Colors.black, 0.72), fontFamily: "Fredoka_600SemiBold" }}>
                {config.message}
              </Text>
            ) : null}
          </View>

          <View style={{ flexDirection: "row", gap: 8 }}>
            {config?.showCancel ? (
              <TouchableOpacity
                onPress={onClose}
                style={{
                  flex: 1,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: Colors.grey,
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 42,
                  backgroundColor: Colors.white,
                }}
              >
                <Text style={{ color: withAlpha(Colors.black, 0.72), fontFamily: "Fredoka_700Bold", fontSize: 13 }}>
                  {cancelLabel}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={handleConfirm}
              style={{
                flex: 1,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                minHeight: 42,
                backgroundColor: accent,
              }}
            >
              <Text style={{ color: Colors.white, fontFamily: "Fredoka_700Bold", fontSize: 13 }}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function useAppDialog() {
  const [config, setConfig] = useState<AppDialogConfig | null>(null);

  const closeDialog = useCallback(() => {
    setConfig(null);
  }, []);

  const showDialog = useCallback((nextConfig: AppDialogRequest) => {
    setConfig({
      ...nextConfig,
      showCancel: false,
    });
  }, []);

  const confirmDialog = useCallback((nextConfig: AppDialogRequest) => {
    setConfig({
      ...nextConfig,
      showCancel: true,
    });
  }, []);

  const showError = useCallback(
    (message: string, title = "Erreur") => {
      showDialog({ title, message, variant: "error" });
    },
    [showDialog],
  );

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      showDialog(message ? { title, message, variant: "success" } : { title, variant: "success" });
    },
    [showDialog],
  );

  const dialog = useMemo(
    () => <AppDialogModal config={config} onClose={closeDialog} />,
    [closeDialog, config],
  );

  return {
    confirmDialog,
    dialog,
    showDialog,
    showError,
    showSuccess,
  };
}
