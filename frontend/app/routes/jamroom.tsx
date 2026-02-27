import { Radio } from "lucide-react";

export function meta() {
  return [
    { title: "합주방 - Tone Knob" },
    { name: "description", content: "실시간 온라인 합주방" },
  ];
}

export default function Jamroom() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Radio className="h-16 w-16 text-gray-300 dark:text-gray-700" />
      <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
        합주방
      </h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        실시간 온라인 합주 기능이 곧 제공됩니다.
      </p>
    </div>
  );
}
