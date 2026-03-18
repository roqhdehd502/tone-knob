import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Crown, Zap, Check, Loader2, AlertCircle, Calendar } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { useAuth } from "~/lib/auth";
import { api } from "~/lib/api";

export function meta() {
  return [{ title: "구독 관리 - Tone Knob" }, { name: "description", content: "구독 플랜 관리" }];
}

interface PlanInfo {
  plan: string;
  priceMonthly: number;
  features: string[];
}

interface CurrentSub {
  id: string;
  plan: string;
  status: string;
  priceMonthly: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Zap className="h-6 w-6 text-gray-400" />,
  premium: <Crown className="h-6 w-6 text-amber-500" />,
  pro: <Crown className="h-6 w-6 text-miami-500" />,
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  premium: "Premium",
  pro: "Pro",
};

function formatPrice(price: number): string {
  if (price === 0) return "무료";
  return price.toLocaleString("ko-KR") + "원/월";
}

export default function SubscriptionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [currentSub, setCurrentSub] = useState<CurrentSub | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.subscriptions.getPlans(), api.subscriptions.getCurrent().catch(() => null)])
      .then(([planData, subData]) => {
        setPlans(planData);
        setCurrentSub(subData);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSubscribe = async (plan: string) => {
    setError(null);
    setSubscribing(plan);
    try {
      // 실제 결제 연동 시 externalPaymentId를 전달
      await api.subscriptions.subscribe(plan);
      const sub = await api.subscriptions.getCurrent().catch(() => null);
      setCurrentSub(sub);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "구독 처리 중 오류가 발생했습니다";
      setError(msg);
    } finally {
      setSubscribing(null);
    }
  };

  const handleCancel = async () => {
    setError(null);
    setCancelling(true);
    try {
      await api.subscriptions.cancel();
      setCurrentSub(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "취소 처리 중 오류가 발생했습니다";
      setError(msg);
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading || !user || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-miami-600" />
      </div>
    );
  }

  const activePlan = currentSub?.plan || "free";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">구독 관리</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          플랜을 선택하여 더 많은 기능을 이용하세요
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {currentSub && (
        <Card className="border-miami-200 bg-miami-50/50 p-5 dark:border-miami-800 dark:bg-miami-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {PLAN_ICONS[currentSub.plan]}
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  현재 플랜: {PLAN_LABELS[currentSub.plan] || currentSub.plan}
                </p>
                <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3 w-3" />
                  {new Date(currentSub.currentPeriodEnd).toLocaleDateString("ko-KR")} 까지
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : "구독 취소"}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = activePlan === plan.plan;
          const isHighlighted = plan.plan === "premium";

          return (
            <Card
              key={plan.plan}
              className={`relative p-6 ${
                isHighlighted
                  ? "border-miami-400 shadow-lg shadow-miami-500/10 dark:border-miami-600"
                  : ""
              }`}
            >
              {isHighlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-miami-600 px-3 py-0.5 text-xs font-medium text-white">
                  인기
                </span>
              )}

              <div className="mb-4 flex items-center gap-2">
                {PLAN_ICONS[plan.plan]}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {PLAN_LABELS[plan.plan] || plan.plan}
                </h3>
              </div>

              <p className="mb-5 text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(plan.priceMonthly)}
              </p>

              <ul className="mb-6 space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"
                  >
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              {plan.plan === "free" ? (
                <Button variant="outline" className="w-full" disabled={isCurrent}>
                  {isCurrent ? "현재 플랜" : "무료"}
                </Button>
              ) : (
                <Button
                  className={`w-full ${isHighlighted ? "bg-miami-600 hover:bg-miami-700" : ""}`}
                  disabled={isCurrent || subscribing !== null}
                  onClick={() => handleSubscribe(plan.plan)}
                >
                  {subscribing === plan.plan ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    "현재 플랜"
                  ) : (
                    "구독하기"
                  )}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
