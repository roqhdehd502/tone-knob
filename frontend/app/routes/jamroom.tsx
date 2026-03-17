import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Radio, Plus, Users, Lock, Music } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import type { JamRoom } from "~/types/jam-room";

export function meta() {
  return [
    { title: "합주방 - Tone Knob" },
    { name: "description", content: "실시간 온라인 합주방" },
  ];
}

export default function Jamroom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<JamRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const response = await api.jamRooms.list({ isActive: true });
      setRooms(response.data);
    } catch (error) {
      console.error("Failed to load rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    navigate("/jamroom/create");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">합주방</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            실시간으로 함께 연주하세요
          </p>
        </div>
        <Button size="sm" onClick={handleCreateRoom}>
          <Plus className="mr-1.5 h-4 w-4" />
          합주방 만들기
        </Button>
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Radio className="h-10 w-10 text-gray-300 dark:text-gray-700" />
            <h2 className="mt-3 text-base font-semibold text-gray-900 dark:text-white">
              활성화된 합주방이 없습니다
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              새로운 합주방을 만들어 친구들과 함께 연주해보세요
            </p>
            <Button className="mt-4" size="sm" onClick={handleCreateRoom}>
              <Plus className="mr-1.5 h-4 w-4" />
              합주방 만들기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link
              key={room.id}
              to={`/jamroom/${room.id}`}
              className="group rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition-all hover:border-violet-300 hover:shadow-md dark:border-gray-800/80 dark:bg-gray-900 dark:hover:border-violet-700"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-400">
                    {room.name}
                  </h3>
                  {room.description && (
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {room.description}
                    </p>
                  )}
                </div>
                {room.isPrivate && <Lock className="ml-2 h-3.5 w-3.5 text-gray-400" />}
              </div>

              <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {room.currentParticipants}/{room.maxParticipants}
                </span>
                <span className="flex items-center gap-1">
                  <Music className="h-3.5 w-3.5" />
                  {room.bpm} BPM
                </span>
              </div>

              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 text-[9px] font-bold text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
                  {(room.host?.displayName || room.host?.username || "?").charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {room.host?.displayName || room.host?.username}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
