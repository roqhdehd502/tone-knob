import { FileMusic } from "lucide-react";

export function meta() {
  return [
    { title: "새 타브 만들기 - Tone Knob" },
    { name: "description", content: "새 타브 만들기" },
  ];
}

export default function EditorNew() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <FileMusic className="h-16 w-16 text-gray-300 dark:text-gray-700" />
      <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
        새 타브 만들기
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        드래그 앤 드롭으로 직관적인 타브 편집 기능이 곧 제공됩니다.
      </p>
    </div>
  );
}
