import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { ArrowLeft } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useI18n } from "~/context/i18n";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import type { TabListResponse } from "~/types/tab";

export function meta() {
  return [
    { title: "Create Jam Room - Tone Knob" },
    { name: "description", content: "Create a new jam room" },
  ];
}

export default function JamroomCreate() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [myTabs, setMyTabs] = useState<TabListResponse["data"]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tabId: "",
    maxParticipants: 4,
    isPrivate: false,
    password: "",
    bpm: 120,
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    loadMyTabs();
  }, [user, authLoading, navigate]);

  const loadMyTabs = async () => {
    try {
      const response = await api.tabs.my({ limit: 50 });
      console.log("[DEBUG] myTabs response:", JSON.stringify(response.data?.slice(0, 2)));
      setMyTabs(response.data);
    } catch (error) {
      console.error("Failed to load tabs:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    console.log("[DEBUG] formData.tabId:", JSON.stringify(formData.tabId));

    setLoading(true);
    try {
      const room = await api.jamRooms.create({
        name: formData.name,
        description: formData.description || undefined,
        tabId: formData.tabId || undefined,
        maxParticipants: formData.maxParticipants,
        isPrivate: formData.isPrivate,
        password: formData.isPrivate ? formData.password : undefined,
        bpm: formData.bpm,
      });
      if (!room?.id) {
        throw new Error(t("jamroomCreate.errorInvalidResponse"));
      }
      navigate(`/jamroom/${room.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("jamroomCreate.errorGeneric");
      console.error("Failed to create room:", error);
      alert(t("jamroomCreate.errorAlert", { message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <button
        type="button"
        onClick={() => navigate("/jamroom")}
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-miami-500 dark:text-gray-500"
      >
        <ArrowLeft className="h-3 w-3" />
        {t("jamroomCreate.backToList")}
      </button>

      <Card>
        <CardHeader>
          <CardTitle>{t("jamroomCreate.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">{t("jamroomCreate.nameLabel")}</Label>
              <Input
                id="name"
                type="text"
                required
                maxLength={100}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("jamroomCreate.namePlaceholder")}
              />
            </div>

            <div>
              <Label htmlFor="description">{t("jamroomCreate.descriptionLabel")}</Label>
              <textarea
                id="description"
                className="h-20 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-miami-500 focus:ring-2 focus:ring-miami-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("jamroomCreate.descriptionPlaceholder")}
              />
            </div>

            <div>
              <Label htmlFor="tabId">{t("jamroomCreate.tabLabel")}</Label>
              <select
                id="tabId"
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-miami-500 focus:ring-2 focus:ring-miami-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                value={formData.tabId}
                onChange={(e) => setFormData({ ...formData, tabId: e.target.value })}
              >
                <option value="">{t("jamroomCreate.tabNone")}</option>
                {myTabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.title}
                    {tab.artist ? ` - ${tab.artist}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxParticipants">{t("jamroomCreate.maxParticipantsLabel")}</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min={2}
                  max={10}
                  required
                  value={formData.maxParticipants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxParticipants: parseInt(e.target.value, 10),
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="bpm">BPM</Label>
                <Input
                  id="bpm"
                  type="number"
                  min={40}
                  max={300}
                  required
                  value={formData.bpm}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bpm: parseInt(e.target.value, 10),
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-miami-600 focus:ring-miami-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t("jamroomCreate.isPrivateLabel")}
                </span>
              </label>
            </div>

            {formData.isPrivate && (
              <div>
                <Label htmlFor="password">{t("jamroomCreate.passwordLabel")}</Label>
                <Input
                  id="password"
                  type="password"
                  maxLength={50}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t("jamroomCreate.passwordPlaceholder")}
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/jamroom")}
                className="flex-1"
              >
                {t("jamroomCreate.cancel")}
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? t("jamroomCreate.creating") : t("jamroomCreate.create")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
