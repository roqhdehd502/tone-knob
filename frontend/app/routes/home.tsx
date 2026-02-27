import { Link } from "react-router";
import { FileMusic, Radio, Users, TrendingUp, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";

export function meta() {
  return [
    { title: "Tone Knob - 타브 제작 & 실시간 합주 플랫폼" },
    {
      name: "description",
      content:
        "음악을 사랑하는 사람들을 위한 타브 제작 및 실시간 온라인 합주 플랫폼",
    },
  ];
}

const stats = [
  { label: "제작된 타브", value: "0", icon: FileMusic },
  { label: "활성 합주방", value: "0", icon: Radio },
  { label: "커뮤니티 멤버", value: "0", icon: Users },
  { label: "이번 주 활동", value: "0", icon: TrendingUp },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            대시보드
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tone Knob에 오신 것을 환영합니다
          </p>
        </div>
        <Button asChild>
          <Link to="/editor/new" className="gap-2">
            <Plus className="h-4 w-4" />새 타브
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950">
                <stat.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            내 타브
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            아직 제작한 타브가 없습니다. 새 타브를 만들어보세요!
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/editor/new">타브 만들기</Link>
          </Button>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            인기 합주방
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            현재 활성화된 합주방이 없습니다. 새 합주방을 열어보세요!
          </p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/jamroom">합주방 둘러보기</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          빠른 시작
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            to="/editor/new"
            className="group flex flex-col items-center rounded-lg border border-gray-200 p-6 text-center transition-colors hover:border-violet-300 hover:bg-violet-50 dark:border-gray-700 dark:hover:border-violet-700 dark:hover:bg-violet-950"
          >
            <FileMusic className="h-8 w-8 text-gray-400 transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400" />
            <h3 className="mt-3 font-medium text-gray-900 dark:text-white">
              타브 만들기
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              드래그 앤 드롭으로 쉽게 타브를 제작하세요
            </p>
          </Link>

          <Link
            to="/jamroom"
            className="group flex flex-col items-center rounded-lg border border-gray-200 p-6 text-center transition-colors hover:border-violet-300 hover:bg-violet-50 dark:border-gray-700 dark:hover:border-violet-700 dark:hover:bg-violet-950"
          >
            <Radio className="h-8 w-8 text-gray-400 transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400" />
            <h3 className="mt-3 font-medium text-gray-900 dark:text-white">
              합주 시작
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              친구들과 실시간으로 합주를 즐기세요
            </p>
          </Link>

          <Link
            to="/community"
            className="group flex flex-col items-center rounded-lg border border-gray-200 p-6 text-center transition-colors hover:border-violet-300 hover:bg-violet-50 dark:border-gray-700 dark:hover:border-violet-700 dark:hover:bg-violet-950"
          >
            <Users className="h-8 w-8 text-gray-400 transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400" />
            <h3 className="mt-3 font-medium text-gray-900 dark:text-white">
              커뮤니티
            </h3>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              다른 뮤지션들의 타브를 탐색하세요
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
