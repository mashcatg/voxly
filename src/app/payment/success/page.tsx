import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <div className="container mx-auto py-20">
      <Card className="max-w-md mx-auto p-6 text-center">
        <div className="mb-6">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-muted-foreground mb-6">
          Thank you for your subscription. Your credits have been added to your account.
        </p>
        <Button asChild>
          <Link href="/chat">Start Chatting</Link>
        </Button>
      </Card>
    </div>
  );
}
