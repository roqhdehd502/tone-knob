import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { AlertCircle, Calendar, Check, Crown, Loader2, Zap } from "lucide-react";

import { PageLoader } from "~/components/common/PageLoader";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { useI18n } from "~/context/i18n";
import { api } from "~/lib/api";
import { useAuth } from "~/lib/auth";
import { requestSubscriptionPayment } from "~/lib/portone";

export function meta() {
  return [
    { title: "Subscription - Tone Knob" },
    { name: "description", content: "Manage subscription plan" },
  ];
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

export default function SubscriptionPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, dateLocale } = useI18n();
  const [plans, setPlans] = useState<PlanInfo[]>([]);
  const [currentSub, setCurrentSub] = useState<CurrentSub | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function formatPrice(price: number): string {
    if (price === 0) return t("subscription.priceFree");
    return t("subscription.priceMonthly", { price: price.toLocaleString("ko-KR") });
  }

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

  const handleSubscribe = async (plan: PlanInfo) => {
    if (!user) return;
    setError(null);
    setSubscribing(plan.plan);

    try {
      if (plan.priceMonthly === 0) {
        await api.subscriptions.subscribe(plan.plan);
      } else {
        const { paymentId } = await requestSubscriptionPayment({
          orderName: `Tone Knob ${PLAN_LABELS[plan.plan] ?? plan.plan} 구독`,
          amount: plan.priceMonthly,
          customerId: user.id,
          customerName: user.displayName ?? user.username,
          customerEmail: user.email,
        });

        await api.subscriptions.subscribe(plan.plan, paymentId);
      }

      const sub = await api.subscriptions.getCurrent().catch(() => null);
      setCurrentSub(sub);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("subscription.errorSubscribe");
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
      const msg = err instanceof Error ? err.message : t("subscription.errorCancel");
      setError(msg);
    } finally {
      setCancelling(false);
    }
  };

  if (authLoading || !user || loading) {
    return <PageLoader />;
  }

  const activePlan = currentSub?.plan || "free";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("subscription.heading")}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("subscription.subtitle")}
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
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
                  {t("subscription.currentPlan", {
                    plan: PLAN_LABELS[currentSub.plan] || currentSub.plan,
                  })}
                </p>
                <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3 w-3" />
                  {t("subscription.currentUntil", {
                    date: new Date(currentSub.currentPeriodEnd).toLocaleDateString(dateLocale),
                  })}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : t("subscription.cancel")}
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
                  {t("subscription.popular")}
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
                  {isCurrent ? t("subscription.currentPlanLabel") : t("subscription.free")}
                </Button>
              ) : (
                <Button
                  className={`w-full ${isHighlighted ? "bg-miami-600 hover:bg-miami-700" : ""}`}
                  disabled={isCurrent || subscribing !== null}
                  onClick={() => handleSubscribe(plan)}
                >
                  {subscribing === plan.plan ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    t("subscription.currentPlanLabel")
                  ) : (
                    t("subscription.subscribe")
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
