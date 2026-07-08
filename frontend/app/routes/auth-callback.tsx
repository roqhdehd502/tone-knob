import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { Loader2 } from "lucide-react";

import { useI18n } from "~/context/i18n";
import { useAuth } from "~/lib/auth";

export function meta() {
  return [{ title: "Signing in... - Tone Knob" }];
}

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSocialTokens } = useAuth();
  const { t } = useI18n();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (!accessToken || !refreshToken) {
      navigate("/login", { replace: true });
      return;
    }

    const handle = async () => {
      await setSocialTokens(accessToken, refreshToken);
      // refreshUser가 실패하면 토큰을 지우므로 결과를 여기서 감지한다.
      if (!localStorage.getItem("accessToken")) {
        navigate("/login?error=auth_failed", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    };

    void handle();
  }, [searchParams, navigate, setSocialTokens]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-miami-500" />
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("auth.loading")}</p>
      </div>
    </div>
  );
}
