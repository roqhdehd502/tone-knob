import { Users } from "lucide-react";

export function meta() {
  return [
    { title: "커뮤니티 - Tone Knob" },
    { name: "description", content: "커뮤니티" },
  ];
}

export default function Community() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Users className="h-16 w-16 text-gray-300 dark:text-gray-700" />
      <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
        커뮤니티
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        뮤지션들의 타브를 탐색하고 공유하는 커뮤니티가 곧 제공됩니다.
      </p>
    </div>
  );
}
