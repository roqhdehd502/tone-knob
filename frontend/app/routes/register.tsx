import { useState } from "react";
import { Link, useNavigate } from "react-router";

import { Eye, EyeOff, Guitar, Headphones, Loader2, Mic2 } from "lucide-react";

import { ThemeToggle } from "~/components/common/ThemeToggle";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useI18n } from "~/context/i18n";
import { useAuth } from "~/lib/auth";

export function meta() {
  return [
    { title: "Sign up - Tone Knob" },
    { name: "description", content: "Sign up for Tone Knob" },
  ];
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
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
      setError(t("register.errorPasswordMismatch"));
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
      setError(err instanceof Error ? err.message : t("register.errorGeneric"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-linear-to-br from-miami-600 via-miami-600 to-rosewood-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Link to="/" className="flex items-center gap-3">
            <img src="/images/logo-48.png" alt="Tone Knob" className="h-10 w-10 rounded-xl" />
            <span className="text-xl font-bold">Tone Knob</span>
          </Link>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold leading-tight whitespace-pre-line">
                {t("register.brandHeading")}
              </h2>
              <p className="mt-4 text-lg text-white/80 whitespace-pre-line">
                {t("register.brandSubtitle")}
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                <Guitar className="h-5 w-5 text-miami-200" />
                <span className="text-sm text-white/90">{t("register.feature1")}</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                <Headphones className="h-5 w-5 text-miami-200" />
                <span className="text-sm text-white/90">{t("register.feature2")}</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-white/10 p-3 backdrop-blur-sm">
                <Mic2 className="h-5 w-5 text-miami-200" />
                <span className="text-sm text-white/90">{t("register.feature3")}</span>
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
                <img
                  src="/images/logo-48.png"
                  alt="Tone Knob"
                  className="h-11 w-11 rounded-xl shadow-lg shadow-miami-500/25"
                />
              </Link>
              <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white lg:mt-0">
                {t("register.title")}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t("register.subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/50 dark:text-red-400">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t("register.email")}</Label>
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
                  <Label htmlFor="username">{t("register.username")}</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder={t("register.usernamePlaceholder")}
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">{t("register.displayName")}</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    type="text"
                    placeholder={t("register.displayNamePlaceholder")}
                    value={formData.displayName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("register.password")}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("register.passwordPlaceholder")}
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
                <Label htmlFor="confirmPassword">{t("register.confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder={t("register.confirmPasswordPlaceholder")}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("register.submit")}
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              {t("register.hasAccount")}{" "}
              <Link
                to="/login"
                className="font-medium text-miami-600 hover:underline dark:text-miami-400"
              >
                {t("register.login")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
