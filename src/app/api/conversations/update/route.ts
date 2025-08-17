import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function generateTitle(transcript: Array<{ role: string, text: string }>) {
  const firstExchange = transcript.slice(0, 2).map(t => t.text).join(' ');
  
  try {
    const response = await fetch('https://api.gemini.google.com/v2/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Based on this conversation start, generate a short, concise title (max 50 chars): "${firstExchange}"`
          }]
        }]
      }),
    });

    const data = await response.json();
    return data.contents[0].parts[0].text || 'New Conversation';
  } catch (error) {
    console.error('Error generating title:', error);
    return 'New Conversation';
  }
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { vapi_call_id } = await req.json();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    // Update conversation
    const { error } = await supabase
      .from('conversations')
      .update({
        updated_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      })
      .eq('vapi_call_id', vapi_call_id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating conversation:', error);
      return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500 });
    }

    return NextResponse.json({ success: true, title });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
