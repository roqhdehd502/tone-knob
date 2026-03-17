import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { Radio, Plus, Users, Lock, Music } from "lucide-react";
import { Button } from "~/components/ui/button";
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
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            합주방
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            실시간으로 함께 연주하세요
          </p>
        </div>
        <Button onClick={handleCreateRoom}>
          <Plus className="mr-2 h-4 w-4" />
          합주방 만들기
        </Button>
      </div>

      {rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-20 text-center dark:border-gray-800 dark:bg-gray-900">
          <Radio className="h-16 w-16 text-gray-300 dark:text-gray-700" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            활성화된 합주방이 없습니다
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            새로운 합주방을 만들어 친구들과 함께 연주해보세요
          </p>
          <Button className="mt-4" onClick={handleCreateRoom}>
            <Plus className="mr-2 h-4 w-4" />
            합주방 만들기
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link
              key={room.id}
              to={`/jamroom/${room.id}`}
              className="group rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-violet-500 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 dark:text-white dark:group-hover:text-violet-400">
                    {room.name}
                  </h3>
                  {room.description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {room.description}
                    </p>
                  )}
                </div>
                {room.isPrivate && (
                  <Lock className="ml-2 h-4 w-4 text-gray-400" />
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>
                    {room.currentParticipants}/{room.maxParticipants}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Music className="h-4 w-4" />
                  <span>{room.bpm} BPM</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-violet-100 dark:bg-violet-900/30" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
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
