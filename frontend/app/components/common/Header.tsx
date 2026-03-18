import { Link } from "react-router";
import { Bell, Search, Menu, LogOut } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { ThemeToggle } from "~/components/common/ThemeToggle";
import { useAuth } from "~/lib/auth";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl dark:border-gray-800/60 dark:bg-gray-950/80">
      <div className="flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuToggle}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/logo-48.png" alt="Tone Knob" className="h-8 w-8 rounded-lg" />
            <span className="text-base font-bold">
              <span className="text-miami-500">tone</span>{" "}
              <span className="text-rosewood-600 dark:text-rosewood-400">knob</span>
            </span>
          </Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-sm mx-6">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-miami-500" />
            <input
              type="text"
              placeholder="타브, 아티스트 검색..."
              className="h-8 w-full rounded-lg border border-gray-200 bg-gray-50/80 pl-8.5 pr-3 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-miami-400 focus:bg-white focus:ring-2 focus:ring-miami-500/10 dark:border-gray-700/80 dark:bg-gray-900/50 dark:text-gray-100 dark:focus:border-miami-500 dark:focus:bg-gray-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {user ? (
            <>
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-950" />
              </Button>
              <Link to="/profile">
                <Avatar className="h-7 w-7 cursor-pointer ring-2 ring-transparent transition-all hover:ring-miami-500/30">
                  <AvatarImage src={user.avatarUrl || ""} alt={user.displayName || ""} />
                  <AvatarFallback className="bg-miami-100 text-[10px] font-semibold text-miami-700 dark:bg-miami-900 dark:text-miami-300">
                    {(user.displayName || user.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="로그아웃"
                className="h-8 w-8"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                <Link to="/login">로그인</Link>
              </Button>
              <Button size="sm" asChild className="h-8 text-xs">
                <Link to="/register">회원가입</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
