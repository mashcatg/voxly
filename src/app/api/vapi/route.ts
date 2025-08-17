import { VapiClient } from "@vapi-ai/server-sdk";
import { NextResponse } from "next/server";

const ASSISTANT_IDS = {
  conversation: "acaef06d-5735-41fa-a88e-93e71ba557a1",
  challenge: "dc7f4b1d-cdae-4d5b-bbee-d0e2a7c5305b"
} as const;

const vapi = new VapiClient({
  token: process.env.NEXT_PRIVATE_VAPI_API_KEY!
});

export async function POST(req: Request) {
  try {
    if (!process.env.NEXT_PRIVATE_VAPI_API_KEY) {
      throw new Error("VAPI API key is not configured");
    }

    const { action, mode = "conversation" } = await req.json();

    if (action === "startCall") {
      const assistantId = ASSISTANT_IDS[mode as keyof typeof ASSISTANT_IDS];
      if (!assistantId) {
        throw new Error(`Invalid mode: ${mode}`);
      }

      // Create the call with the assistant
      const call = await vapi.calls.create({
        assistantId,  // Use assistantId property
        transport: {
          provider: "vapi.websocket"
        }
      } as any);

      return NextResponse.json({ success: true, data: call });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("VAPI API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process VAPI request";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
