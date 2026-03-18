import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, type Theme } from "~/lib/theme";
import { cn } from "~/lib/utils";

const options: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: "light", icon: Sun, label: "라이트" },
  { value: "dark", icon: Moon, label: "다크" },
  { value: "system", icon: Monitor, label: "시스템" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          title={opt.label}
          className={cn(
            "rounded-md p-1.5 transition-colors",
            theme === opt.value
              ? "bg-miami-100 text-miami-700 dark:bg-miami-900 dark:text-miami-300"
              : "text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300",
          )}
        >
          <opt.icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
