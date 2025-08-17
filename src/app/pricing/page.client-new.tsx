'use client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CheckIcon, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { dodoPayments } from "@/lib/dodo-payments"
import { SubscriptionPlan } from "@/types/subscription"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { FadeInUp, FadeInStagger, FadeInStaggerItem } from '@/components/ui/fade-in-up'

interface PricingProps {
  searchParams?: {
    status?: string;
  };
}

export default function PricingClientPage({ searchParams }: PricingProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success' | null; message: string } | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function loadPlans() {
      const { data: plans } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price');

      if (plans) {
        setPlans(plans);
      }
    }
    loadPlans();
  }, [supabase]);

  useEffect(() => {
    if (!searchParams?.status) return;

    switch (searchParams.status) {
      case "error":
        setStatusMessage({ type: "error", message: "Payment failed. Please try again." });
        break;
      case "cancelled":
        setStatusMessage({ type: "error", message: "Payment was cancelled." });
        break;
      case "success":
        setStatusMessage({ type: "success", message: "Your payment is being processed. We'll update you once it's complete." });
        break;
    }
  }, [searchParams?.status]);

  const handleSubscribe = async (planId: string) => {
    try {
      setLoading(planId);
      setStatusMessage(null);
      
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.user) {
        router.push('/login');
        return;
      }

      const session = await dodoPayments.createCheckoutSession(planId);
      if (session?.url) {
        router.push(session.url);
      } else {
        setStatusMessage({ 
          type: 'error', 
          message: 'Could not create checkout session. Please try again.' 
        });
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      setStatusMessage({ 
        type: 'error', 
        message: error.message || 'Something went wrong. Please try again.' 
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <FadeInUp>
      <div className="container mx-auto py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground">Choose the plan that works best for you</p>
          {statusMessage && (
            <FadeInUp>
              <div className={cn(
                "mt-4 p-4 rounded-lg",
                statusMessage.type === "error" 
                  ? "bg-destructive/15 text-destructive" 
                  : "bg-green-500/15 text-green-600"
              )}>
                {statusMessage.message}
              </div>
            </FadeInUp>
          )}
        </div>

        <FadeInStagger>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <FadeInStaggerItem key={plan.id}>
                <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-baseline mb-4">
                      <div className="text-4xl font-bold">${plan.price}</div>
                      <p className="text-sm text-muted-foreground ml-2">per month</p>
                    </div>
                    <ul className="mt-4 space-y-3">
                      {(plan.features as string[]).map((feature, i) => (
                        <li key={i} className="flex items-center gap-3">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <CheckIcon className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={loading === plan.id}
                    >
                      {loading === plan.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Please wait
                        </>
                      ) : (
                        'Subscribe'
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </FadeInStaggerItem>
            ))}
          </div>
        </FadeInStagger>
      </div>
    </FadeInUp>
  );
}
