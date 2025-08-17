'use client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CheckIcon, Loader2 } from "lucide-react"
import { FadeInUp, FadeInStagger, FadeInStaggerItem } from '@/components/ui/fade-in-up'
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { dodoPayments } from "@/lib/dodo-payments"
import { SubscriptionPlan } from "@/types/subscription"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
        .order('price', { ascending: true });
      
      if (plans) {
        setPlans(plans);
      }
    }

    loadPlans();

    // Handle status messages from redirects
    if (searchParams?.status) {
      switch (searchParams.status) {
        case "error":
          setStatusMessage({ type: "error", message: "There was an error processing your payment. Please try again." });
          break;
        case "cancelled":
          setStatusMessage({ type: "error", message: "Payment was cancelled. Feel free to try again when you're ready." });
          break;
        case "pending":
          setStatusMessage({ type: "success", message: "Your payment is being processed. We'll update you once it's complete." });
          break;
      }
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
                statusMessage.type === "error" ? "bg-destructive/15 text-destructive" : "bg-green-500/15 text-green-600"
              )}>
                {statusMessage.message}
              </div>
            </FadeInUp>
          )}
        </div>
      <FadeInStagger className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <FadeInStaggerItem key={plan.id}>
            <Card 
              className={cn(
                "flex flex-col relative px-2 py-8 pb-6 shadow-none",
                index === 1 && "border-primary"
              )}
            >
              {index === 1 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex items-baseline mb-4">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground ml-2">/month</span>
              </div>
              <div className="text-muted-foreground mb-6">{plan.credits} credits/month</div>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className={cn(
                  "w-full mt-6",
                  index === 1 ? "bg-primary" : "bg-secondary"
                )}
                variant={index === 1 ? "default" : "secondary"}
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id}
              >
                {loading === plan.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                  </>
                ) : (
                  'Get Started'
                )}
              </Button>
            </CardFooter>
          </Card>
          </FadeInStaggerItem>
        ))}
      </FadeInStagger>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto grid gap-6 text-left">
          <div>
            <h3 className="font-semibold mb-2">What are credits?</h3>
            <p className="text-muted-foreground">Credits are used for voice conversations. One credit typically equals one minute of conversation time.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Can I change plans?</h3>
            <p className="text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">What happens if I run out of credits?</h3>
            <p className="text-muted-foreground">You can purchase additional credits at any time, or wait for your monthly credit allowance to reset at the start of your billing cycle.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Is there a free trial?</h3>
            <p className="text-muted-foreground">Yes, all new users get 30 credits to try out the service. No credit card required for the trial.</p>
          </div>
        </div>
      </div>
    </div>
    </FadeInUp>
  );
}