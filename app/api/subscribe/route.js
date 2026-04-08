// This file runs on the SERVER
// When a user clicks "subscribe", it saves their email + chosen topics to Supabase
// You can then see all signups in your Supabase dashboard

import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { email, topics } = await request.json()

    // Validate
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Invalid email' }, { status: 400 })
    }

    // Connect to Supabase using your project credentials
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Insert the subscriber into the "subscribers" table
    const { data, error } = await supabase
      .from('subscribers')
      .upsert(
        { email, topics, subscribed_at: new Date().toISOString() },
        { onConflict: 'email' }  // if same email signs up again, just update their topics
      )

    if (error) {
      console.error('Supabase error:', error)
      return Response.json({ error: 'Failed to save' }, { status: 500 })
    }

    return Response.json({ success: true })

  } catch (err) {
    console.error('Subscribe error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
