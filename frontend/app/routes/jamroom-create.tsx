import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import type { TabListResponse } from "~/types/tab";

export function meta() {
  return [
    { title: "합주방 만들기 - Tone Knob" },
    { name: "description", content: "새로운 합주방 만들기" },
  ];
}

export default function JamroomCreate() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
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
      setMyTabs(response.data);
    } catch (error) {
      console.error("Failed to load tabs:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

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
      navigate(`/jamroom/${room.id}`);
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("합주방 생성에 실패했습니다.");
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
        합주방 목록으로
      </button>

      <Card>
        <CardHeader>
          <CardTitle>합주방 만들기</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">합주방 이름 *</Label>
              <Input
                id="name"
                type="text"
                required
                maxLength={100}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 주말 밴드 연습"
              />
            </div>

            <div>
              <Label htmlFor="description">설명</Label>
              <textarea
                id="description"
                className="h-20 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-miami-500 focus:ring-2 focus:ring-miami-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="합주방에 대한 간단한 설명을 입력하세요"
              />
            </div>

            <div>
              <Label htmlFor="tabId">연주할 타브 (선택)</Label>
              <select
                id="tabId"
                className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm outline-none focus:border-miami-500 focus:ring-2 focus:ring-miami-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                value={formData.tabId}
                onChange={(e) => setFormData({ ...formData, tabId: e.target.value })}
              >
                <option value="">타브 선택 안 함</option>
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
                <Label htmlFor="maxParticipants">최대 인원</Label>
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
                  비공개 합주방 (비밀번호 필요)
                </span>
              </label>
            </div>

            {formData.isPrivate && (
              <div>
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  maxLength={50}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="비밀번호를 입력하세요"
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
                취소
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "생성 중..." : "합주방 만들기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
