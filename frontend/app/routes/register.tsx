import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Music, Eye, EyeOff, Loader2, Guitar, Headphones, Mic2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ThemeToggle } from "~/components/common/ThemeToggle";
import { useAuth } from "~/lib/auth";

export function meta() {
  return [
    { title: "회원가입 - Tone Knob" },
    { name: "description", content: "Tone Knob 회원가입" },
  ];
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    displayName: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setIsSubmitting(true);
    try {
      await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
        displayName: formData.displayName || undefined,
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-linear-to-br from-violet-600 via-indigo-600 to-purple-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Music className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">Tone Knob</span>
          </Link>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold leading-tight">
                당신의 음악,
                <br />
                여기서 시작됩니다
              </h2>
              <p className="mt-4 text-lg text-white/80">
                무료로 가입하고 타브 제작,
                <br />
                합주, 커뮤니티를 경험하세요.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                <Guitar className="h-5 w-5 text-violet-200" />
                <span className="text-sm text-white/90">직관적인 타브 에디터로 쉽게 악보 제작</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                <Headphones className="h-5 w-5 text-violet-200" />
                <span className="text-sm text-white/90">실시간 온라인 합주로 어디서든 함께</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                <Mic2 className="h-5 w-5 text-violet-200" />
                <span className="text-sm text-white/90">AI 기반 타브 자동 생성 및 분석</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/50">© 2026 Tone Knob. All rights reserved.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full flex-col lg:w-1/2">
        <div className="flex justify-end p-4">
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm animate-fade-in space-y-6">
            <div className="flex flex-col items-center lg:items-start">
              <Link to="/" className="flex items-center gap-2 lg:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
                  <Music className="h-6 w-6 text-white" />
                </div>
              </Link>
              <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white lg:mt-0">
                회원가입
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                음악의 새로운 세계에 참여하세요
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="username">사용자 이름</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="영문, 숫자 (3-20자)"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">표시 이름</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    type="text"
                    placeholder="닉네임"
                    value={formData.displayName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="8자 이상의 비밀번호"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "회원가입"}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              이미 계정이 있으신가요?{" "}
              <Link
                to="/login"
                className="font-medium text-violet-600 hover:underline dark:text-violet-400"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
