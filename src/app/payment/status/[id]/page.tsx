"use client";
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function PaymentStatusPage() {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`https://${process.env.NODE_ENV === 'development' ? 'test' : 'live'}.checkout.dodopayments.com/status/${id}`);
        const data = await response.json();
        
        if (data.status === 'succeeded') {
          // Payment succeeded, redirect to success page with subscription ID
          router.push(`/payment/success?subscription_id=${data.subscription_id}&status=success`);
        } else if (data.status === 'failed') {
          router.push('/pricing?status=failed');
        } else if (data.status === 'cancelled') {
          router.push('/pricing?status=cancelled');
        }
        // For pending status, we stay on this page and it will auto-refresh
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    };

    // Check status immediately
    checkStatus();

    // Then check every 3 seconds
    const interval = setInterval(checkStatus, 3000);

    return () => clearInterval(interval);
  }, [id, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <h1 className="text-2xl font-bold mb-2">Processing Payment</h1>
      <p className="text-gray-600">Please wait while we confirm your payment...</p>
    </div>
  );
}
