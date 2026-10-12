import { useCallback, useEffect, useState } from "react";
import { ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppIcon, Card, Text, useAppDialog } from "@shared/components/ui";
import { Colors } from "@shared/theme";
import { withAlpha } from "@shared/utils/colorUtils";
import type { MomentKind } from "@shared/db";
import {
  createActivity,
  createMoment,
  createTask,
  deleteActivity,
  deleteMoment,
  deleteTask,
  listActivities,
  listMoments,
  listTasks,
  updateActivity,
  updateMoment,
  updateTask,
} from "@features/catalog";
import type { CatalogActivity, CatalogMoment, CatalogTask } from "@features/catalog";
import {
  createReward,
  deleteReward,
  listRewards,
  updateReward,
  type CatalogReward,
} from "@features/rewards";

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim().length > 0 ? error.message : fallback;
}

type CatalogSectionErrors = {
  moments: string | null;
  activities: string | null;
  tasks: string | null;
  rewards: string | null;
};

const EMPTY_CATALOG_SECTION_ERRORS: CatalogSectionErrors = {
  moments: null,
  activities: null,
  tasks: null,
  rewards: null,
};

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <Text
      style={{
        color: withAlpha(Colors.black, 0.56),
        textTransform: "uppercase",
        letterSpacing: 1.2,
        fontSize: 11,
        fontFamily: "Fredoka_600SemiBold",
        marginBottom: 4,
      }}
    >
      {icon} {label}
    </Text>
  );
}

function CatalogSection<T extends { id: string; name: string }>({
  title,
  icon,
  items,
  onAdd,
  onUpdate,
  onDelete,
  placeholder,
  loadError,
  onError,
}: {
  title: string;
  icon: string;
  items: T[];
  onAdd: (name: string) => Promise<void>;
  onUpdate: (id: string, name: string) => Promise<void>;
  onDelete: (item: T) => void;
  placeholder: string;
  loadError: string | null;
  onError: (message: string) => void;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      await onAdd(trimmed);
      setNewName("");
    } catch (error) {
      onError(toErrorMessage(error, "Impossible d'ajouter cet élément."));
    } finally {
      setAdding(false);
    }
  }

  async function handleUpdate() {
    if (!editingId) return;
    const trimmed = editingName.trim();
    if (!trimmed) return;
    try {
      await onUpdate(editingId, trimmed);
      setEditingId(null);
      setEditingName("");
    } catch (error) {
      onError(toErrorMessage(error, "Impossible de mettre à jour cet élément."));
    }
  }

  return (
    <Card className="p-4 gap-3">
      <SectionHeader icon={icon} label={title} />
      {loadError ? (
        <Text style={{ color: Colors.error, fontSize: 12, lineHeight: 16 }}>
          Chargement indisponible : {loadError}
        </Text>
      ) : null}
      {items.map((item) => (
        <View
          key={item.id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: Colors.white,
            borderWidth: 1,
            borderColor: editingId === item.id ? Colors.primary : withAlpha(Colors.grey, 0.7),
          }}
        >
          {editingId === item.id ? (
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TextInput
                value={editingName}
                onChangeText={setEditingName}
                autoFocus
                onSubmitEditing={handleUpdate}
                style={{
                  flex: 1,
                  height: 28,
                  fontSize: 14,
                  color: Colors.black,
                  fontFamily: "Fredoka_600SemiBold",
                  paddingVertical: 0,
                  paddingHorizontal: 0,
                }}
              />
              <TouchableOpacity onPress={handleUpdate}>
                <Text style={{ fontSize: 14, color: Colors.success }}>OK</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setEditingId(null);
                  setEditingName("");
                }}
              >
                <AppIcon name="close" size={16} tintColor={withAlpha(Colors.black, 0.56)} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => {
                  setEditingId(item.id);
                  setEditingName(item.name);
                }}
              >
                <Text
                  style={{ fontSize: 14, color: Colors.black, fontFamily: "Fredoka_600SemiBold" }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingId(item.id);
                    setEditingName(item.name);
                  }}
                >
                  <AppIcon name="edit" size={16} tintColor={withAlpha(Colors.black, 0.72)} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(item)}>
                  <AppIcon name="trash" size={16} tintColor={Colors.error} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      ))}
      {items.length === 0 && !loadError ? (
        <Text
          style={{
            color: withAlpha(Colors.black, 0.56),
            fontSize: 12,
            textAlign: "center",
            paddingVertical: 8,
          }}
        >
          Aucun élément
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder={placeholder}
          placeholderTextColor={withAlpha(Colors.black, 0.56)}
          style={{
            flex: 1,
            height: 38,
            borderRadius: 10,
            paddingHorizontal: 12,
            backgroundColor: Colors.white,
            borderWidth: 1,
            borderColor: Colors.grey,
            fontSize: 13,
            fontFamily: "Fredoka_400Regular",
            color: Colors.black,
          }}
        />
        <TouchableOpacity
          onPress={handleAdd}
          disabled={adding || !newName.trim()}
          style={{
            height: 38,
            paddingHorizontal: 14,
            borderRadius: 10,
            backgroundColor: newName.trim() ? Colors.primary : Colors.grey,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppIcon name="plus" size={18} tintColor={Colors.white} />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

export default function CatalogScreen() {
  const appDialog = useAppDialog();
  const [moments, setMoments] = useState<CatalogMoment[]>([]);
  const [activities, setActivities] = useState<CatalogActivity[]>([]);
  const [tasks, setTasks] = useState<CatalogTask[]>([]);
  const [rewards, setRewards] = useState<CatalogReward[]>([]);
  const [catalogErrors, setCatalogErrors] = useState<CatalogSectionErrors>(
    EMPTY_CATALOG_SECTION_ERRORS
  );

  const loadCatalog = useCallback(async () => {
    const [m, a, t, r] = await Promise.allSettled([
      listMoments(),
      listActivities(),
      listTasks(),
      listRewards(),
    ]);

    if (m.status === "fulfilled") {
      setMoments(m.value);
    }
    if (a.status === "fulfilled") {
      setActivities(a.value);
    }
    if (t.status === "fulfilled") {
      setTasks(t.value);
    }
    if (r.status === "fulfilled") {
      setRewards(r.value);
    }

    setCatalogErrors({
      moments:
        m.status === "rejected"
          ? toErrorMessage(m.reason, "Impossible de charger les moments.")
          : null,
      activities:
        a.status === "rejected"
          ? toErrorMessage(a.reason, "Impossible de charger les activités.")
          : null,
      tasks:
        t.status === "rejected"
          ? toErrorMessage(t.reason, "Impossible de charger les tâches.")
          : null,
      rewards:
        r.status === "rejected"
          ? toErrorMessage(r.reason, "Impossible de charger les récompenses.")
          : null,
    });
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  async function handleAddMoment(name: string) {
    await createMoment({ name, kind: "morning" as MomentKind });
    await loadCatalog();
  }

  async function handleAddActivity(name: string) {
    await createActivity({ name });
    await loadCatalog();
  }

  async function handleAddTask(name: string) {
    await createTask({ name });
    await loadCatalog();
  }

  async function handleAddReward(name: string) {
    await createReward({ name });
    await loadCatalog();
  }

  async function handleUpdateMoment(id: string, name: string) {
    await updateMoment(id, { name });
    await loadCatalog();
  }

  async function handleUpdateActivity(id: string, name: string) {
    await updateActivity(id, { name });
    await loadCatalog();
  }

  async function handleUpdateTask(id: string, name: string) {
    await updateTask(id, { name });
    await loadCatalog();
  }

  async function handleUpdateReward(id: string, name: string) {
    await updateReward(id, { name });
    await loadCatalog();
  }

  function handleDeleteMoment(item: CatalogMoment) {
    appDialog.confirmDialog({
      title: "Supprimer ?",
      message: `Supprimer le moment "${item.name}" ?`,
      confirmLabel: "Supprimer",
      variant: "danger",
      onConfirm: () => {
        void deleteMoment(item.id)
          .then(loadCatalog)
          .catch((error: unknown) =>
            appDialog.showError(toErrorMessage(error, "Impossible de supprimer ce moment."))
          );
      },
    });
  }

  function handleDeleteActivity(item: CatalogActivity) {
    appDialog.confirmDialog({
      title: "Supprimer ?",
      message: `Supprimer l'activité "${item.name}" ?`,
      confirmLabel: "Supprimer",
      variant: "danger",
      onConfirm: () => {
        void deleteActivity(item.id)
          .then(loadCatalog)
          .catch((error: unknown) =>
            appDialog.showError(toErrorMessage(error, "Impossible de supprimer cette activité."))
          );
      },
    });
  }

  function handleDeleteTask(item: CatalogTask) {
    appDialog.confirmDialog({
      title: "Supprimer ?",
      message: `Supprimer la tâche "${item.name}" ?`,
      confirmLabel: "Supprimer",
      variant: "danger",
      onConfirm: () => {
        void deleteTask(item.id)
          .then(loadCatalog)
          .catch((error: unknown) =>
            appDialog.showError(toErrorMessage(error, "Impossible de supprimer cette tâche."))
          );
      },
    });
  }

  function handleDeleteReward(item: CatalogReward) {
    appDialog.confirmDialog({
      title: "Supprimer ?",
      message: `Supprimer la récompense "${item.name}" ?`,
      confirmLabel: "Supprimer",
      variant: "danger",
      onConfirm: () => {
        void deleteReward(item.id)
          .then(loadCatalog)
          .catch((error: unknown) =>
            appDialog.showError(toErrorMessage(error, "Impossible de supprimer cette récompense."))
          );
      },
    });
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
          <Text style={{ fontSize: 12, color: withAlpha(Colors.black, 0.56) }}>
            Gère le catalogue d'actions utilisé par les routines et les récompenses des enfants.
          </Text>
        </View>

        <CatalogSection
          title="Moments"
          icon="🕐"
          items={moments}
          onAdd={handleAddMoment}
          onUpdate={handleUpdateMoment}
          onDelete={handleDeleteMoment}
          placeholder="Nouveau moment…"
          loadError={catalogErrors.moments}
          onError={appDialog.showError}
        />
        <CatalogSection
          title="Activités"
          icon="📋"
          items={activities}
          onAdd={handleAddActivity}
          onUpdate={handleUpdateActivity}
          onDelete={handleDeleteActivity}
          placeholder="Nouvelle activité…"
          loadError={catalogErrors.activities}
          onError={appDialog.showError}
        />
        <CatalogSection
          title="Tâches"
          icon="✅"
          items={tasks}
          onAdd={handleAddTask}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          placeholder="Nouvelle tâche…"
          loadError={catalogErrors.tasks}
          onError={appDialog.showError}
        />
        <CatalogSection
          title="Récompenses"
          icon="🎁"
          items={rewards}
          onAdd={handleAddReward}
          onUpdate={handleUpdateReward}
          onDelete={handleDeleteReward}
          placeholder="Nouvelle récompense…"
          loadError={catalogErrors.rewards}
          onError={appDialog.showError}
        />
      </ScrollView>
      {appDialog.dialog}
    </SafeAreaView>
  );
}
