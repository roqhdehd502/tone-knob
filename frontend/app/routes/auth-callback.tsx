import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "~/lib/auth";

export function meta() {
  return [{ title: "로그인 중... - Tone Knob" }];
}

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSocialTokens } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      setSocialTokens(accessToken, refreshToken);
      navigate("/", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate, setSocialTokens]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-miami-500" />
        <p className="text-sm text-gray-500 dark:text-gray-400">로그인 처리 중...</p>
      </div>
    </div>
  );
}
