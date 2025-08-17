import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch invoice PDF from Dodo
    const response = await fetch(
      `https://test.dodopayments.com/invoices/payments/${params.paymentId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.DODO_SECRET_KEY}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch invoice')
    }

    const pdfBuffer = await response.arrayBuffer()
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${params.paymentId}.pdf"`
      }
    })

  } catch (error) {
    console.error('Error downloading invoice:', error)
    return NextResponse.json({ error: 'Failed to download invoice' }, { status: 500 })
  }
}