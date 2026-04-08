// This file runs on the SERVER (not in the browser)
// It keeps your Anthropic API key secret
// The browser calls this route, this route calls Claude, and sends back the result

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export const maxDuration = 60

function getCacheKey(topics) {
  const date = new Date().toISOString().slice(0, 10) // "2025-04-07"
  const normalized = topics.trim().toLowerCase().split(',').map(t => t.trim()).sort().join(',')
  return join('/tmp', `daily-byte-${date}-${normalized.replace(/[^a-z0-9,]/g, '_')}.json`)
}

function readCache(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

export async function POST(request) {
  try {
    // Read what the user selected from the request
    const { topics } = await request.json()

    // Check cache — return today's result if it exists
    const cachePath = getCacheKey(topics)
    const cached = readCache(cachePath)
    if (cached) return Response.json(cached)

    // This is the prompt that tells Claude HOW to write the content
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
  "topics": [
    {
      "id": "topic_id",
      "headline": "5-8 word punchy headline",
      "the_tea": "1-2 sentence gossip-style summary",
      "so_what": "one sentence takeaway",
      "whats_next": "one sentence prediction",
      "vibe": "the tea is hot"
    }
  ]
}`

    // Call the Anthropic API from the server (API key stays hidden)
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,       // <-- your secret key, stored in Vercel
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Today's topics: ${topics}. Search for what's trending RIGHT NOW in AI — last 24-48 hours only. JSON only.`
        }],
        tools: [{ type: 'web_search_20250305', name: 'web_search' }]
      }),
    })

    const data = await response.json()

    // If Anthropic returned an error
    if (data.error) {
      return Response.json({ error: data.error.message }, { status: 500 })
    }

    // Extract the JSON from Claude's response
    // Claude returns multiple "content blocks" — we need the text ones
    const textBlocks = (data.content || []).filter(item => item.type === 'text')

    let jsonText = ''

    // Look for a block that starts with { (that's our JSON)
    for (const block of textBlocks) {
      const cleaned = (block.text || '').replace(/```json|```/g, '').trim()
      if (cleaned.startsWith('{')) {
        jsonText = cleaned
        break
      }
    }

    // Fallback: search all text for the JSON object
    if (!jsonText) {
      const allText = textBlocks.map(b => b.text || '').join('')
      const match = allText.match(/\{[\s\S]*"topics"[\s\S]*\}/)
      if (match) jsonText = match[0]
    }

    if (!jsonText) {
      return Response.json({ error: 'Could not generate content' }, { status: 500 })
    }

    // Strip <cite ...>...</cite> tags injected by web search
    const stripped = jsonText.replace(/<cite[^>]*>(.*?)<\/cite>/gs, '$1')

    // Parse and cache the result for the rest of the day
    const parsed = JSON.parse(stripped)
    try { writeFileSync(cachePath, JSON.stringify(parsed)) } catch {}
    return Response.json(parsed)

  } catch (err) {
    console.error('Generate API error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
