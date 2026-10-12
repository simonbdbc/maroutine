import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { AppIcon, Text, Button, Card, useAppDialog } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import { useAppHeaderControls } from "@navigation/appHeader";
import { StickerImage } from "@features/stickers/components/StickerImage";
import { DEFAULT_STICKER_KEY } from "@features/stickers/registry";
import { StickerPicker } from "@features/profiles/components/StickerPicker";
import { useRoutineBuilder } from "../hooks/useRoutineBuilder";
import type {
  BuilderActivityVm,
  BuilderTaskVm,
  CatalogMoment,
  CatalogActivity,
  CatalogTask,
} from "../types";
import type { BuilderValidationError } from "../services/builderValidation";

const DEFAULT_ACTIVITY_STICKER = DEFAULT_STICKER_KEY;
const HEADER_ACTION_SIZE = 34;

type ActivityStickerPickerCtx = {
  momentLinkId: string;
  activityLinkId: string;
};

// ─── Catalog picker modal ─────────────────────────────────────────────────────
function CatalogPicker<T extends { id: string; name: string }>({
  visible,
  title,
  items,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  items: T[];
  onPick: (item: T) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: Colors.white, padding: 20 }}>
        <View className="flex-row items-center justify-between mb-4">
          <Text variant="h4">{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <AppIcon name="close" tintColor={Colors.black} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ gap: 8 }}>
          {items.length === 0 && (
            <Text style={{ color: withAlpha(Colors.black, 0.56), textAlign: "center", paddingVertical: 20 }}>
              Aucun élément dans le catalogue
            </Text>
          )}
          {items.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => { onPick(item); onClose(); }}
              style={{
                padding: 14, borderRadius: 12, backgroundColor: Colors.white,
                borderWidth: 1, borderColor: Colors.grey,
              }}
            >
              <Text style={{ fontFamily: "Fredoka_600SemiBold", fontSize: 15, color: Colors.black }}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Move buttons ─────────────────────────────────────────────────────────────
function MoveButtons({ onUp, onDown }: { onUp: () => void; onDown: () => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      <TouchableOpacity onPress={onUp} style={chipStyle}>
        <AppIcon name="arrow-up" size={14} tintColor={withAlpha(Colors.black, 0.72)} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDown} style={chipStyle}>
        <AppIcon name="arrow-down" size={14} tintColor={withAlpha(Colors.black, 0.72)} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Stars input ──────────────────────────────────────────────────────────────
function StarsInput({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <AppIcon name="star" size={12} tintColor={Colors.black} />
      <TextInput
        value={String(value)}
        editable={!disabled}
        onChangeText={(t) => {
          if (disabled) return;
          const n = parseInt(t, 10);
          if (!isNaN(n) && n >= 0) onChange(n);
          if (t === "") onChange(0);
        }}
        keyboardType="numeric"
        style={{
          width: 40, height: 28, borderRadius: 8,
          borderWidth: 1, borderColor: Colors.grey,
          textAlign: "center", fontSize: 13, fontFamily: "Fredoka_600SemiBold",
          backgroundColor: disabled ? Colors.white : Colors.white,
          color: disabled ? withAlpha(Colors.black, 0.56) : Colors.black,
        }}
      />
    </View>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────
function TaskItem({
  task, errors, onRemove, onMove, onUpdateStars,
}: {
  task: BuilderTaskVm;
  errors: string[];
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onUpdateStars: (stars: number) => void;
}) {
  const hasErrors = errors.length > 0;
  return (
    <View style={{ gap: 4 }}>
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 8,
        paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
        backgroundColor: hasErrors ? withAlpha(Colors.error, 0.08) : Colors.white,
        borderWidth: 1,
        borderColor: hasErrors ? withAlpha(Colors.error, 0.35) : Colors.grey,
      }}>
        <Text
          style={{
            flex: 1,
            fontSize: 13,
            color: hasErrors ? Colors.error : withAlpha(Colors.black, 0.72),
            fontFamily: "Fredoka_600SemiBold",
          }}
          numberOfLines={1}
        >
          {task.taskName}
        </Text>
        <StarsInput value={task.stars} onChange={onUpdateStars} />
        <MoveButtons onUp={() => onMove(-1)} onDown={() => onMove(1)} />
        <TouchableOpacity onPress={onRemove}>
          <AppIcon name="trash" size={16} tintColor={Colors.error} />
        </TouchableOpacity>
      </View>

      {hasErrors && (
        <Text style={{ color: Colors.error, fontSize: 11, fontFamily: "Fredoka_600SemiBold", paddingHorizontal: 6 }}>
          {errors[0]}
        </Text>
      )}
    </View>
  );
}

// ─── Activity section ─────────────────────────────────────────────────────────
function ActivityItem({
  activity,
  activityErrors,
  taskErrorsByTaskLinkId,
  onRemove,
  onMove,
  onEditSticker,
  onUpdateStars,
  onAddTask, onRemoveTask, onMoveTask, onUpdateTaskStars,
}: {
  activity: BuilderActivityVm;
  activityErrors: string[];
  taskErrorsByTaskLinkId: Map<string, string[]>;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  onEditSticker: () => void;
  onUpdateStars: (stars: number) => void;
  onAddTask: () => void;
  onRemoveTask: (taskLinkId: string) => void;
  onMoveTask: (taskLinkId: string, dir: -1 | 1) => void;
  onUpdateTaskStars: (taskLinkId: string, stars: number) => void;
}) {
  const canEditActivityStars = activity.tasks.length === 0;
  const hasTaskErrors = Array.from(taskErrorsByTaskLinkId.values()).some((errors) => errors.length > 0);
  const hasActivityErrors = activityErrors.length > 0;
  const hasValidationErrors = hasTaskErrors || hasActivityErrors;

  return (
    <View style={{
      borderRadius: 14, backgroundColor: Colors.white,
      borderWidth: 1, borderColor: hasValidationErrors ? withAlpha(Colors.error, 0.45) : Colors.grey, overflow: "hidden",
    }}>
      {/* Activity header */}
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 8,
        padding: 12, borderBottomWidth: 1, borderBottomColor: hasValidationErrors ? withAlpha(Colors.error, 0.35) : Colors.grey,
        backgroundColor: hasValidationErrors ? withAlpha(Colors.error, 0.08) : Colors.white,
      }}>
        {/* <Text style={{ fontSize: 16 }}>{activity.activityIcon ? "📋" : "📋"}</Text> */}
        <StickerImage
            stickerKey={activity.stickerKey}
            size={20}
          />
        <Text style={{ flex: 1, fontFamily: "Fredoka_700Bold", fontSize: 14, color: Colors.black }} numberOfLines={1}>
          {activity.activityName}
        </Text>
        <TouchableOpacity
          onPress={onEditSticker}
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors.white,
            borderWidth: 1,
            borderColor: Colors.grey,
          }}
        >
          <StickerImage
            stickerKey={activity.stickerKey}
            size={20}
          />
        </TouchableOpacity>
        <StarsInput value={activity.stars} onChange={onUpdateStars} disabled={!canEditActivityStars} />
        <MoveButtons onUp={() => onMove(-1)} onDown={() => onMove(1)} />
        <TouchableOpacity onPress={onRemove}>
          <AppIcon name="trash" size={16} tintColor={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* Tasks */}
      <View style={{ padding: 8, gap: 6 }}>
        {hasActivityErrors && (
          <Text style={{ color: Colors.error, fontSize: 11, fontFamily: "Fredoka_600SemiBold", paddingHorizontal: 6 }}>
            {activityErrors[0]}
          </Text>
        )}
        {activity.tasks.map((task) => (
          <TaskItem
            key={task.linkId}
            task={task}
            errors={taskErrorsByTaskLinkId.get(task.linkId) ?? []}
            onRemove={() => onRemoveTask(task.linkId)}
            onMove={(dir) => onMoveTask(task.linkId, dir)}
            onUpdateStars={(stars) => onUpdateTaskStars(task.linkId, stars)}
          />
        ))}
        <TouchableOpacity
          onPress={onAddTask}
          style={{
            paddingVertical: 8, borderRadius: 10, alignItems: "center",
            borderWidth: 1, borderStyle: "dashed", borderColor: Colors.grey,
          }}
        >
          <Text style={{ fontSize: 12, color: withAlpha(Colors.black, 0.56), fontFamily: "Fredoka_600SemiBold" }}>
            + Ajouter une tâche
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
interface RoutineBuilderScreenProps {
  profileId: string;
  profileName: string;
  primaryColor: string;
  onClose: () => void;
}

export function RoutineBuilderScreen({
  profileId,
  profileName,
  primaryColor,
  onClose,
}: RoutineBuilderScreenProps) {
  const builder = useRoutineBuilder(profileId);
  const appDialog = useAppDialog();
  const [pickerType, setPickerType] = useState<"moment" | "activity" | "task" | null>(null);
  const [pickerContext, setPickerContext] = useState<{ momentLinkId?: string; activityLinkId?: string }>({});
  const [stickerPickerCtx, setStickerPickerCtx] = useState<ActivityStickerPickerCtx | null>(null);
  const [stickerDraftKey, setStickerDraftKey] = useState(DEFAULT_ACTIVITY_STICKER);

  useFocusEffect(
    useCallback(() => {
      void builder.refreshCatalog();
    }, [builder.refreshCatalog])
  );

  const headerLeft = useMemo(
    () => (
      <TouchableOpacity
        accessibilityLabel="Retour aux enfants"
        accessibilityRole="button"
        onPress={onClose}
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
    [onClose, primaryColor],
  );

  const headerSecondary = useMemo(
    () =>
      builder.dirty ? (
        <Text style={{ fontSize: 10, color: Colors.warning, fontFamily: "Fredoka_600SemiBold", textAlign: "center" }}>
          Modifications non enregistrées
        </Text>
      ) : null,
    [builder.dirty],
  );

  useAppHeaderControls({
    left: headerLeft,
    title: `Routine de ${profileName}`,
    secondary: headerSecondary,
  });

  if (builder.loading || !builder.draft) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.white }}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={{ marginTop: 8, color: withAlpha(Colors.black, 0.56) }}>Chargement…</Text>
      </View>
    );
  }

  const { draft } = builder;

  function openPicker(type: "moment" | "activity" | "task", ctx: typeof pickerContext = {}) {
    void builder.refreshCatalog();
    setPickerContext(ctx);
    setPickerType(type);
  }

  function openStickerPicker(momentLinkId: string, activity: BuilderActivityVm) {
    setStickerPickerCtx({ momentLinkId, activityLinkId: activity.linkId });
    setStickerDraftKey(activity.stickerKey);
  }

  function closeStickerPicker() {
    setStickerPickerCtx(null);
  }

  function applyStickerPicker() {
    if (!stickerPickerCtx) return;
    builder.updateActivitySticker(
      stickerPickerCtx.momentLinkId,
      stickerPickerCtx.activityLinkId,
      stickerDraftKey
    );
    closeStickerPicker();
  }

  function handlePick(item: CatalogMoment | CatalogActivity | CatalogTask) {
    if (pickerType === "moment") {
      builder.addMoment(item as CatalogMoment);
    } else if (pickerType === "activity" && pickerContext.momentLinkId) {
      builder.addActivity(pickerContext.momentLinkId, item as CatalogActivity);
    } else if (pickerType === "task" && pickerContext.momentLinkId && pickerContext.activityLinkId) {
      builder.addTask(pickerContext.momentLinkId, pickerContext.activityLinkId, item as CatalogTask);
    }
  }

  async function handleSave() {
    const ok = await builder.save();
    if (ok) {
      appDialog.showSuccess("Enregistré", "La routine a été sauvegardée.");
    }
  }

  const pickerItems =
    pickerType === "moment" ? draft.catalog.moments :
    pickerType === "activity" ? draft.catalog.activities :
    pickerType === "task" ? draft.catalog.tasks : [];

  const pickerTitle =
    pickerType === "moment" ? "Ajouter un moment" :
    pickerType === "activity" ? "Ajouter une activité" :
    "Ajouter une tâche";

  function getActivityErrors(
    activityLinkId: string
  ): string[] {
    return builder.validationErrors
      .filter((error) => error.activityLinkId === activityLinkId && !error.taskLinkId)
      .map((error) => error.message);
  }

  function getTaskErrorsByTaskLinkId(
    activityLinkId: string
  ): Map<string, string[]> {
    const map = new Map<string, string[]>();

    for (const error of builder.validationErrors as BuilderValidationError[]) {
      if (error.activityLinkId !== activityLinkId || !error.taskLinkId) continue;
      const bucket = map.get(error.taskLinkId) ?? [];
      bucket.push(error.message);
      map.set(error.taskLinkId, bucket);
    }

    return map;
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.white }}>
      {/* ── Error ──────────────────────────────────────────── */}
      {builder.error && (
        <View style={{ marginHorizontal: 20, marginTop: 8, padding: 10, backgroundColor: withAlpha(Colors.error, 0.08), borderRadius: 10 }}>
          <Text style={{ color: Colors.error, fontSize: 12 }}>{builder.error}</Text>
        </View>
      )}

      {/* ── Content ────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {draft.moments.map((moment) => (
          <Card key={moment.linkId} className="overflow-hidden">
            {/* Moment header */}
            <View style={{
              flexDirection: "row", alignItems: "center", gap: 8,
              padding: 12, backgroundColor: primaryColor,
            }}>
              <Text style={{ flex: 1, fontFamily: "Fredoka_700Bold", fontSize: 16, color: Colors.white }}>
                {moment.momentName}
              </Text>
              <MoveButtons
                onUp={() => builder.moveMoment(moment.linkId, -1)}
                onDown={() => builder.moveMoment(moment.linkId, 1)}
              />
              <TouchableOpacity
                onPress={() =>
                  appDialog.confirmDialog({
                    title: "Supprimer",
                    message: `Supprimer "${moment.momentName}" ?`,
                    confirmLabel: "Supprimer",
                    variant: "danger",
                    onConfirm: () => builder.removeMoment(moment.linkId),
                  })
                }
              >
                <AppIcon name="trash" size={16} tintColor={Colors.white} />
              </TouchableOpacity>
            </View>

            {/* Activities within moment */}
            <View style={{ padding: 10, gap: 10 }}>
              {moment.activities.map((activity) => {
                const activityErrors = getActivityErrors(activity.linkId);
                const taskErrorsByTaskLinkId = getTaskErrorsByTaskLinkId(activity.linkId);
                return (
                  <ActivityItem
                    key={activity.linkId}
                    activity={activity}
                    activityErrors={activityErrors}
                    taskErrorsByTaskLinkId={taskErrorsByTaskLinkId}
                    onRemove={() =>
                      appDialog.confirmDialog({
                        title: "Supprimer",
                        message: `Supprimer "${activity.activityName}" ?`,
                        confirmLabel: "Supprimer",
                        variant: "danger",
                        onConfirm: () => builder.removeActivity(moment.linkId, activity.linkId),
                      })
                    }
                    onMove={(dir) => builder.moveActivity(moment.linkId, activity.linkId, dir)}
                    onEditSticker={() => openStickerPicker(moment.linkId, activity)}
                    onUpdateStars={(stars) => builder.updateActivityStars(moment.linkId, activity.linkId, stars)}
                    onAddTask={() => openPicker("task", { momentLinkId: moment.linkId, activityLinkId: activity.linkId })}
                    onRemoveTask={(tId) => builder.removeTask(moment.linkId, activity.linkId, tId)}
                    onMoveTask={(tId, dir) => builder.moveTask(moment.linkId, activity.linkId, tId, dir)}
                    onUpdateTaskStars={(tId, stars) => builder.updateTaskStars(moment.linkId, activity.linkId, tId, stars)}
                  />
                );
              })}

              {/* Add activity button */}
              <TouchableOpacity
                onPress={() => openPicker("activity", { momentLinkId: moment.linkId })}
                style={{
                  paddingVertical: 10, borderRadius: 12, alignItems: "center",
                  borderWidth: 1.5, borderStyle: "dashed", borderColor: withAlpha(primaryColor, 0.251),
                  backgroundColor: withAlpha(primaryColor, 0.031),
                }}
              >
                <Text style={{ fontSize: 13, color: primaryColor, fontFamily: "Fredoka_600SemiBold" }}>
                  + Ajouter une activité
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        {/* Add moment button */}
        <TouchableOpacity
          onPress={() => openPicker("moment")}
          style={{
            paddingVertical: 16, borderRadius: 20, alignItems: "center",
            borderWidth: 2, borderStyle: "dashed", borderColor: Colors.grey,
          }}
        >
          <AppIcon name="plus" size={24} tintColor={withAlpha(Colors.black, 0.56)} />
          <Text style={{ fontSize: 13, color: withAlpha(Colors.black, 0.56), fontFamily: "Fredoka_600SemiBold" }}>
            Ajouter un moment
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Save bar ───────────────────────────────────────── */}
      <View style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        padding: 16, backgroundColor: withAlpha(Colors.white, 0.95),
        borderTopWidth: 1, borderTopColor: Colors.grey,
      }}>
        <Button
          label={builder.saving ? "Enregistrement…" : "Enregistrer la routine"}
          variant="primary"
          loading={builder.saving}
          disabled={!builder.dirty}
          onPress={handleSave}
          style={{ backgroundColor: builder.dirty ? primaryColor : Colors.grey }}
        />
      </View>

      {/* ── Catalog picker ─────────────────────────────────── */}
      <CatalogPicker
        visible={pickerType !== null}
        title={pickerTitle}
        items={pickerItems}
        onPick={handlePick}
        onClose={() => setPickerType(null)}
      />

      {/* ── Activity sticker picker ───────────────────────── */}
      <Modal
        visible={stickerPickerCtx !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeStickerPicker}
      >
        <View style={{ flex: 1, backgroundColor: Colors.white, padding: 20 }}>
          <View className="flex-row items-center justify-between mb-4">
            <Text variant="h4">Sticker activité</Text>
            <TouchableOpacity onPress={closeStickerPicker}>
              <AppIcon name="close" tintColor={Colors.black} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 20 }}>
            <StickerPicker
              selected={stickerDraftKey}
              primaryColor={primaryColor}
              label="Choisis le sticker de cette activité"
              onChange={setStickerDraftKey}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <Button
                label="Appliquer"
                variant="primary"
                onPress={applyStickerPicker}
                style={{ flex: 1, backgroundColor: primaryColor }}
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
      {appDialog.dialog}
    </View>
  );
}

const chipStyle = {
  width: 26, height: 26, borderRadius: 8,
  backgroundColor: Colors.white, alignItems: "center" as const, justifyContent: "center" as const,
  borderWidth: 1, borderColor: Colors.grey,
};
