// Generates content for ALL 4 topics in one Claude call and saves to Supabase.
// Called once per day via Vercel cron — zero per-user cost.

import { createClient } from '@supabase/supabase-js'

export const maxDuration = 60

const ALL_TOPICS = 'AI Trends, Who Got Funded, Learn a Term, Tech Tea'

const SYSTEM_PROMPT = `You are writing a gossip-style AI & tech newsletter. Think: a group chat where your smartest friend drops the hottest tech takes. NOT a newsletter. NOT educational. Just the tea.

IMPORTANT: Only cover things that happened in the last 24-48 hours. Search for the most current news. Be trending.

Rules:
1. "the_tea" must be 1-2 sentences MAX. Punchy, casual, dramatic. Like texting a friend.
2. "so_what" is ONE sentence — why this matters to a normal person.
3. "whats_next" is ONE sentence prediction.
4. "vibe" must be exactly one of: the tea is hot / honestly mid / sleeper hit / overhyped / game changer
5. Simple english. No jargon without explanation.
6. Be honest. If something is mid, say it's mid.

Respond ONLY in valid JSON. No markdown, no backticks:

{
  "AI Trends": [{"id":"...","headline":"...","the_tea":"...","so_what":"...","whats_next":"...","vibe":"..."}],
  "Who Got Funded": [{"id":"...","headline":"...","the_tea":"...","so_what":"...","whats_next":"...","vibe":"..."}],
  "Learn a Term": [{"id":"...","headline":"...","the_tea":"...","so_what":"...","whats_next":"...","vibe":"..."}],
  "Tech Tea": [{"id":"...","headline":"...","the_tea":"...","so_what":"...","whats_next":"...","vibe":"..."}]
}`

export async function GET(request) {
  // Allow manual trigger but also protect from unauthorized calls in production
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Call Claude with web search for all 4 topics at once
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Generate today's content for these 4 topics: ${ALL_TOPICS}. Search for what's trending RIGHT NOW — last 24-48 hours only. Return JSON only.`
        }],
        tools: [{ type: 'web_search_20250305', name: 'web_search' }]
      }),
    })

    const data = await response.json()
    if (data.error) {
      return Response.json({ error: data.error.message }, { status: 500 })
    }

    // Extract the JSON text block from Claude's response
    const textBlocks = (data.content || []).filter(b => b.type === 'text')
    let jsonText = ''
    for (const block of textBlocks) {
      const cleaned = (block.text || '').replace(/```json|```/g, '').trim()
      if (cleaned.startsWith('{')) { jsonText = cleaned; break }
    }
    if (!jsonText) {
      const allText = textBlocks.map(b => b.text || '').join('')
      const match = allText.match(/\{[\s\S]*\}/)
      if (match) jsonText = match[0]
    }
    if (!jsonText) {
      return Response.json({ error: 'Could not parse Claude response' }, { status: 500 })
    }

    // Strip <cite> tags from web search
    const stripped = jsonText.replace(/<cite[^>]*>(.*?)<\/cite>/gs, '$1')
    const topics_data = JSON.parse(stripped)

    // Save to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    const { error: dbError } = await supabase
      .from('daily_content')
      .insert({ topics_data, generated_at: new Date().toISOString() })

    if (dbError) {
      console.error('Supabase error:', dbError)
      return Response.json({ error: 'Failed to save to database' }, { status: 500 })
    }

    return Response.json({ success: true, generated_at: new Date().toISOString() })

  } catch (err) {
    console.error('Refresh error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
