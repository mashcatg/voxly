import { NextResponse } from 'next/server'
import { VapiClient } from '@vapi-ai/server-sdk'

const VAPI_TOKEN = process.env.VAPI_SERVER_TOKEN

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!VAPI_TOKEN) {
      return new NextResponse('VAPI token not found', { status: 500 })
    }

    const client = new VapiClient({ token: VAPI_TOKEN })
    const call = await client.calls.get(params.id)

    return NextResponse.json({
      analysis: call.analysis || null
    })
  } catch (error) {
    console.error('Error getting VAPI analysis:', error)
    return new NextResponse('Failed to get call analysis', { status: 500 })
  }
}
