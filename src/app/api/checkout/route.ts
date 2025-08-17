import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const generateCheckoutUrl = async (plan: any, user: any, checkoutRecord: any) => {
  if (!plan.dodo_product_id) {
    throw new Error('Missing dodo_product_id in plan');
  }
  
  // Build URL with query parameters for redirection
  const dodoBaseUrl = `https://test.checkout.dodopayments.com/buy/${plan.dodo_product_id}`;
  console.log('Generated Dodo base URL:', dodoBaseUrl);
  
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('Missing NEXT_PUBLIC_APP_URL environment variable');
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  console.log('Using app base URL:', baseUrl);

  // Construct redirect URL back to our site
  const redirectUrl = `${baseUrl}/checkout?subscription_id=${checkoutRecord.id}&success=true&subscription_type=active`;
  console.log('Redirect URL:', redirectUrl);

  // Add redirect_url parameter to Dodo checkout URL
  // This will ensure user is redirected back to our site after payment
  const finalUrl = `${dodoBaseUrl}?redirect_url=${encodeURIComponent(redirectUrl)}`;

  // Log the final checkout URL
  console.log('Final checkout URL:', finalUrl);
  
  console.log('Using checkout URL with success URL:', finalUrl);
  return finalUrl;
};

export async function POST(req: NextRequest) {
  console.log('Starting checkout process...');
  let supabase;
  
  try {
    // Parse request body
    const body = await req.json();
    console.log('Request body:', body);
    
    const { planId } = body;
    if (!planId) {
      console.error('Missing planId in request');
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.error('Missing NEXT_PUBLIC_APP_URL environment variable');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Initialize Supabase client
    console.log('Initializing Supabase client...');
    try {
      const cookieStore = cookies();
      supabase = createServerComponentClient({
        cookies: () => cookieStore
      });
      console.log('Supabase client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Supabase client:', error);
      return NextResponse.json({ error: 'Authentication service error' }, { status: 500 });
    }    // Check authentication
    console.log('Checking authentication...');
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    if (!session?.user) {
      console.error('No user session found');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Get plan details
    console.log('Fetching plan details for ID:', planId);
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (planError) {
      console.error('Plan fetch error:', planError);
      return NextResponse.json({ error: 'Failed to fetch plan details: ' + planError.message }, { status: 500 });
    }
    
    if (!plan) {
      console.error('Plan not found for ID:', planId);
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (!plan.dodo_product_id) {
      console.error('Plan missing dodo_product_id:', plan);
      return NextResponse.json({ error: 'Invalid plan configuration' }, { status: 500 });
    }

    // Create a record in the checkouts table first
    console.log('Creating checkout record...');
    let checkoutRecord;
    
    try {
      // First check if the table exists
      const { error: tableCheckError } = await supabase
        .from('checkouts')
        .select('count')
        .limit(1);

      if (tableCheckError) {
        console.error('Error checking checkouts table:', tableCheckError);
        return NextResponse.json(
          { error: 'Database table not found: checkouts. Please ensure the table exists.' },
          { status: 500 }
        );
      }

      // Log the data we're about to insert
      const checkoutData = {
        user_id: session.user.id,
        plan_id: plan.id,
        amount: plan.price,
        metadata: {
          credits: plan.credits,
          plan_type: plan.name.toLowerCase(),
          dodo_product_id: plan.dodo_product_id,
          customer_email: session.user.email,
          returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/status`,
          created_at: new Date().toISOString()
        },
        status: 'pending'
      };
      console.log('Checkout data to insert:', JSON.stringify(checkoutData, null, 2));

      const { data: record, error: insertError } = await supabase
        .from('checkouts')
        .insert([checkoutData])
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create checkout record:', insertError);
        return NextResponse.json(
          { error: 'Failed to create checkout record: ' + insertError.message },
          { status: 500 }
        );
      }

      if (!record) {
        console.error('No checkout record returned after insert');
        return NextResponse.json(
          { error: 'Failed to create checkout record: No record returned' },
          { status: 500 }
        );
      }

      checkoutRecord = record;
      console.log('Successfully created checkout record:', JSON.stringify(checkoutRecord, null, 2));
    } catch (error) {
      console.error('Error in checkout record creation:', error);
      return NextResponse.json(
        { error: 'Unexpected error creating checkout record' },
        { status: 500 }
      );
    }

    // Now generate the checkout URL with the record
    console.log('Generating checkout URL...');
    try {
      const checkoutUrl = await generateCheckoutUrl(plan, session.user, checkoutRecord);
      
      if (!checkoutUrl) {
        console.error('Failed to generate checkout URL');
        return NextResponse.json({ error: 'Failed to generate checkout URL' }, { status: 500 });
      }

      console.log('Checkout URL generated successfully');
      return NextResponse.json({ url: checkoutUrl });
    } catch (urlError) {
      console.error('Error generating checkout URL:', urlError);
      const errorMessage = urlError instanceof Error ? urlError.message : 'Unknown error';
      return NextResponse.json({ error: 'Failed to generate checkout URL: ' + errorMessage }, { status: 500 });
    }

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate checkout' },
      { status: 500 }
    );
  }
}
