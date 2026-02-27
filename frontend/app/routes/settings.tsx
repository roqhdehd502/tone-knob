import { Settings as SettingsIcon } from "lucide-react";

export function meta() {
  return [
    { title: "설정 - Tone Knob" },
    { name: "description", content: "설정" },
  ];
}

export default function Settings() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <SettingsIcon className="h-16 w-16 text-gray-300 dark:text-gray-700" />
      <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
        설정
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        계정 및 앱 설정 기능이 곧 제공됩니다.
      </p>
    </div>
  );
}
