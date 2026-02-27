import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { FileMusic, Plus, Pencil } from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import type { TabListItem } from "~/types/tab";

export function meta() {
  return [
    { title: "타브 에디터 - Tone Knob" },
    { name: "description", content: "타브 에디터" },
  ];
}

export default function Editor() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myTabs, setMyTabs] = useState<TabListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    api.tabs
      .my({ limit: 20 })
      .then((res) => setMyTabs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            타브 에디터
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            새 타브를 만들거나 기존 타브를 편집하세요
          </p>
        </div>
        <Button asChild>
          <Link to="/editor/new" className="gap-2">
            <Plus className="h-4 w-4" />새 타브
          </Link>
        </Button>
      </div>

      {!user ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileMusic className="h-16 w-16 text-gray-300 dark:text-gray-700" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            로그인하면 저장된 타브를 편집할 수 있습니다.
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/login">로그인</Link>
            </Button>
            <Button asChild>
              <Link to="/editor/new">새 타브 만들기</Link>
            </Button>
          </div>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      ) : myTabs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileMusic className="h-16 w-16 text-gray-300 dark:text-gray-700" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            아직 제작한 타브가 없습니다.
          </p>
          <Button className="mt-4" asChild>
            <Link to="/editor/new">첫 타브 만들기</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {myTabs.map((tab) => (
            <Link
              key={tab.id}
              to={`/editor/${tab.id}`}
              className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-violet-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-violet-700"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950">
                <FileMusic className="h-5 w-5 text-violet-500" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-medium text-gray-900 group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
                  {tab.title}
                </h3>
                {tab.artist && (
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {tab.artist}
                  </p>
                )}
              </div>
              <Pencil className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-violet-500 dark:text-gray-600" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
