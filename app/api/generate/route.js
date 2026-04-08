// Serves cached content from Supabase — never calls Claude directly.
// Content is pre-generated once per day by /api/refresh.

import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { topics } = await request.json()

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Fetch the most recently generated content
    const { data, error } = await supabase
      .from('daily_content')
      .select('topics_data')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      return Response.json({ error: 'No content available yet. Try again soon.' }, { status: 503 })
    }

    // Filter to only the topics the user selected
    // topics is a comma-separated string like "AI Trends, Tech Tea"
    const requested = topics.split(',').map(t => t.trim())
    const filtered = []
    for (const topic of requested) {
      const items = data.topics_data[topic]
      if (items) filtered.push(...items)
    }

    if (filtered.length === 0) {
      return Response.json({ error: 'No content found for selected topics.' }, { status: 404 })
    }

    return Response.json({ topics: filtered })

  } catch (err) {
    console.error('Generate error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
