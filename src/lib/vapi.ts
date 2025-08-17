'use client';

import Vapi from '@vapi-ai/web';
import { VapiClient } from "@vapi-ai/server-sdk";
import type { CallAnalysis } from "@vapi-ai/server-sdk/types";

const VAPI_TOKEN = process.env.VAPI_SERVER_TOKEN;

export async function getCallAnalysis(callId: string): Promise<CallAnalysis | null> {
  try {
    if (!VAPI_TOKEN) {
      throw new Error('VAPI server token not found');
    }

    const client = new VapiClient({ token: VAPI_TOKEN });
    const call = await client.calls.get(callId);

    return call.analysis || null;
  } catch (error) {
    console.error('Error getting call analysis:', error);
    return null;
  }
}

export interface VapiConfig {
  apiKey: string;
  conversationId?: string;
  assistant?: string;
  mode?: string;
  onError?: (error: any) => void;
  onDisconnected?: () => void;
}

export function createVapiInstance(config: VapiConfig): Vapi {
  try {
    // VAPI constructor takes the API key as a string
    const vapi = new Vapi(config.apiKey);
    
    // Add event handlers if provided
    if (typeof vapi.on === 'function') {
      if (config.onError && typeof config.onError === 'function') {
        vapi.on('error' as any, (error: any) => {
          console.error('VAPI Error:', error);
          config.onError!(error);
        });
      }

      if (config.onDisconnected) {
        vapi.on('disconnect' as any, config.onDisconnected);
      }
    }
    
    return vapi;
  } catch (err) {
    console.error('Error creating VAPI instance:', err);
    throw err;
  }
}

export async function callVapiMethod(vapi: Vapi, method: string, assistantId?: string): Promise<any> {
  const methodsMap: Record<string, string[]> = {
    start: ['start', 'connect', 'join'],
    stop: ['stop', 'disconnect', 'leave', 'endCall'],
  };

  const possibleMethods = methodsMap[method] || [method];

  for (const methodName of possibleMethods) {
    if (typeof (vapi as any)[methodName] === 'function') {
      if (method === 'start' && assistantId) {
        return (vapi as any)[methodName](assistantId);
      } else {
        return (vapi as any)[methodName]();
      }
    }
  }

  throw new Error(`No compatible method found for ${method}`);
}


