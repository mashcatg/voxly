"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Check, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed' | 'cancelled'>('pending');
  const [error, setError] = useState<string>('');
  const [creditsAllocated, setCreditsAllocated] = useState(false);
  const [dodoSubscriptionId, setDodoSubscriptionId] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleSubscription = async () => {
      try {
        // Get all subscription IDs and find the Dodo one
        const subscriptionIds = searchParams.getAll('subscription_id');
        console.log('All subscription IDs:', subscriptionIds);

        // Find the subscription ID that starts with 'sub_'
        const foundDodoId = subscriptionIds.find(id => id?.startsWith('sub_'));
        console.log('Found Dodo subscription ID:', foundDodoId);

        if (!foundDodoId) {
          setError('No valid subscription ID found');
          setLoading(false);
          return;
        }

        setDodoSubscriptionId(foundDodoId);
        console.log('Using Dodo subscription ID:', foundDodoId);

        // Check for already allocated credits
        const allocatedKey = `credits_allocated_${foundDodoId}`;
        if (localStorage.getItem(allocatedKey) === 'true') {
          setCreditsAllocated(true);
          setPaymentStatus('success');
          setLoading(false);
          return;
        }

        // Verify subscription with Dodo Payments
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Please sign in to continue');
          setLoading(false);
          return;
        }

        console.log('Sending verification request with subscription ID:', foundDodoId);
        
        const response = await fetch('/api/payments/verify-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ subscriptionId: foundDodoId })
        });

        const data = await response.json();
        console.log('Verification response:', data);
        
        if (data.success) {
          setPaymentStatus('success');
          if (!creditsAllocated) {
            // Get plan type from subscription details
            let planType;
            const amount = data.subscription.recurring_pre_tax_amount;
            
            // Map amount to plan type
            console.log('Determining plan type from amount:', amount);
            // Convert the amount to number if it's a string
            const numAmount = typeof amount === 'string' ? parseInt(amount, 10) : amount;
            
            // Starter: $9 (900 cents) = 60 credits
            // Plus: $19 (1900 cents) = 180 credits
            // Pro: $39 (3900 cents) = 450 credits
            if (numAmount === 900) planType = 'starter';
            else if (numAmount === 1900) planType = 'plus';
            else if (numAmount === 3900) planType = 'pro';
            else {
              console.error('Unknown subscription amount:', amount, typeof amount);
              setError('Unknown subscription plan - Expected 900, 1900, or 3900 cents');
              return;
            }
            
            console.log('Selected plan type:', planType, '(will allocate credits based on plan)');

            // Now allocate credits with the determined plan type
            const allocateResponse = await fetch('/api/payments/allocate-credits', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({ 
                subscriptionId: foundDodoId,
                planType: planType
              })
            });

            const allocateResult = await allocateResponse.json();
            if (allocateResult.success) {
              setCreditsAllocated(true);
              localStorage.setItem(allocatedKey, 'true');
              localStorage.setItem(`${allocatedKey}_timestamp`, Date.now().toString());
              toast.success('Credits allocated successfully!');
            }
          }
        } else if (data.status === 'cancelled') {
          setPaymentStatus('cancelled');
        } else if (data.status === 'failed') {
          setPaymentStatus('failed');
        } else {
          setPaymentStatus('pending');
        }

        setLoading(false);
      } catch (error) {
        console.error('Error processing subscription:', error);
        setError('Failed to process subscription');
        setLoading(false);
      }
    };

    handleSubscription();
  }, [searchParams, creditsAllocated, supabase]);

  const handleGoHome = () => {
    router.push('/');
  };

  const handleRetry = () => {
    router.push('/pricing');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#171717]">
        <Card className="w-full max-w-md shadow-lg border border-border">
          <CardContent className="flex flex-col items-center justify-center p-8 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <h2 className="text-xl font-bold mb-1">Processing Payment</h2>
            <p className="text-muted-foreground text-center text-base">
              Please wait while we confirm your payment...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#171717] p-4">
      <Card className="w-full max-w-lg shadow-lg border border-border">
        <CardHeader className="text-center pb-6">
          {paymentStatus === 'success' && (
            <>
              <Check className="h-10 w-10 text-green-800 bg-green-200 p-2 rounded-md mx-auto mb-2" />
              <CardTitle className="text-2xl font-bold text-green-800 dark:text-green-200 mb-1">
                Payment Successful!
              </CardTitle>
              <CardDescription className="text-base text-green-600 dark:text-green-400 mb-2">
                Welcome to Voxly! Your subscription is now active.
              </CardDescription>
            </>
          )}
          {paymentStatus === 'failed' && (
            <>
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
              <CardTitle className="text-xl font-bold text-destructive mb-1">Payment Failed</CardTitle>
              <CardDescription className="text-base text-destructive">
                We couldn't process your payment. Please try again.
              </CardDescription>
            </>
          )}
          {paymentStatus === 'cancelled' && (
            <>
              <XCircle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
              <CardTitle className="text-xl font-bold text-yellow-600 mb-1">Payment Cancelled</CardTitle>
              <CardDescription className="text-base text-yellow-600">
                Your payment was cancelled. No charges were made.
              </CardDescription>
            </>
          )}
          {paymentStatus === 'pending' && (
            <>
              <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-2" />
              <CardTitle className="text-xl font-bold text-blue-600 mb-1">Payment Processing</CardTitle>
              <CardDescription className="text-base text-blue-600">
                Your payment is being processed. Please wait a moment.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {paymentStatus === 'success' ? (
              <>
                <Button onClick={handleGoHome} className="w-full bg-green-600 hover:bg-green-700 text-white">
                  <Zap className="w-4 h-4 mr-2" />
                  Start Creating
                </Button>
                <Button variant="outline" onClick={handleGoHome} className="w-full">
                  Back to Home
                </Button>
              </>
            ) : (
              <>
                <Button onClick={handleRetry} className="w-full">
                  Try Again
                </Button>
                <Button variant="ghost" onClick={handleGoHome} className="w-full">
                  Back to Home
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen p-4">
        <Card>
          <CardHeader className="text-center">
            <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-2" />
            <CardTitle className="text-xl font-bold text-blue-600 mb-1">Loading...</CardTitle>
            <CardDescription className="text-base text-blue-600">
              Please wait while we load your checkout details.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
