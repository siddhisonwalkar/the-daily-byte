'use client'
// ☝️ This tells Next.js: "this file runs in the BROWSER, not the server"
// We need this because we use useState, useEffect, onClick etc.

import { useState, useEffect } from 'react'

// ─── TOPIC OPTIONS ───
const TOPICS = [
  { id: 'ai_trends', label: 'AI Trends', icon: '✦', desc: "what's moving rn" },
  { id: 'startup_funding', label: 'Who Got Funded', icon: '❋', desc: 'the money moves' },
  { id: 'new_terms', label: 'Learn a Term', icon: '✿', desc: 'one concept, zero jargon' },
  { id: 'tech_gossip', label: 'Tech Tea', icon: '☕', desc: 'the drama & takes' },
]

// ─── SMALL COMPONENTS ───

function Sparkle({ size = 16, color = '#70020F', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
    </svg>
  )
}

function ScallopBorder({ color = '#70020F', height = 12 }) {
  const w = 24, count = 30
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w * count} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {Array.from({ length: count }).map((_, i) => (
        <ellipse key={i} cx={w * i + w / 2} cy={0} rx={w / 2} ry={height} fill={color} />
      ))}
    </svg>
  )
}

function Loader() {
  const msgs = ['spilling the tea ☕', 'checking our sources ✦', 'curating the good stuff ❋', 'almost ready ✿']
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % msgs.length), 1600)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <div style={{ width: 40, height: 40, margin: '0 auto 20px', border: '3px solid #FFDEE2', borderTopColor: '#70020F', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ color: '#70020F', fontSize: 14, fontWeight: 600, letterSpacing: 0.5 }}>{msgs[idx]}</p>
    </div>
  )
}

function VibeTag({ vibe }) {
  const isHot = vibe === 'the tea is hot' || vibe === 'game changer'
  return (
    <span style={{
      display: 'inline-block', background: isHot ? '#70020F' : '#FFDEE2',
      color: isHot ? '#fff' : '#70020F', padding: '3px 10px', borderRadius: 20,
      fontSize: 10, fontWeight: 700, textTransform: 'lowercase', letterSpacing: 0.6, whiteSpace: 'nowrap'
    }}>{vibe}</span>
  )
}

function ResultCard({ topic, index }) {
  return (
    <div style={{
      background: '#FFF9F7', border: '2px solid #70020F', borderRadius: 20,
      overflow: 'hidden', animation: `fadeUp 0.4s ease ${index * 100}ms both`
    }}>
      <div style={{ background: '#70020F', padding: '10px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontFamily: "var(--display)", fontSize: 17, fontWeight: 400, color: '#FFF9F7', margin: 0, lineHeight: 1.3, fontStyle: 'italic' }}>{topic.headline}</h3>
        <VibeTag vibe={topic.vibe} />
      </div>
      <div style={{ padding: '16px 18px 18px' }}>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: '#3d2020', margin: '0 0 14px' }}>{topic.the_tea}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ padding: '10px 14px', background: '#FFDEE2', borderRadius: 12, borderLeft: '3px solid #70020F' }}>
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: '#70020F', display: 'block', marginBottom: 3 }}>so what</span>
            <span style={{ fontSize: 13, color: '#5a2a2a', lineHeight: 1.5 }}>{topic.so_what}</span>
          </div>
          <div style={{ padding: '10px 14px', background: '#f5eeeb', borderRadius: 12, borderLeft: '3px solid #c48a5a' }}>
            <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: '#c48a5a', display: 'block', marginBottom: 3 }}>what&apos;s next</span>
            <span style={{ fontSize: 13, color: '#5a4a3a', lineHeight: 1.5 }}>{topic.whats_next}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN APP ───

export default function Home() {
  const [email, setEmail] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [step, setStep] = useState('landing')   // landing → topics → loading → results → subscribed
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const toggle = (id) => {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  // ─── GENERATE CONTENT ───
  // Calls YOUR backend (/api/generate), which calls Claude securely
  const generate = async () => {
    if (selected.size === 0) return
    setStep('loading')
    setError(null)

    const names = TOPICS.filter(t => selected.has(t.id)).map(t => t.label).join(', ')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics: names })
      })
      const data = await res.json()

      if (data.error) throw new Error(data.error)
      setResults(data.topics)
      setStep('results')
    } catch (err) {
      console.error(err)
      setError('something broke. try again? ✦')
      setStep('topics')
    }
  }

  // ─── SUBSCRIBE ───
  // Saves email + topics to Supabase via /api/subscribe
  const subscribe = async () => {
    try {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          topics: [...selected]
        })
      })
    } catch (err) {
      console.error('Subscribe error:', err)
    }
    setStep('subscribed')
  }

  const validEmail = email.includes('@') && email.includes('.')

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* ─── HEADER ─── */}
      <header style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#70020F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontFamily: 'var(--display)', fontStyle: 'italic', fontWeight: 700 }}>b</div>
          <span style={{ fontFamily: 'var(--display)', fontSize: 17, color: '#3d2020', fontStyle: 'italic' }}>the daily byte</span>
        </div>
        {step === 'results' && <span style={{ background: '#70020F', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✦ day 1</span>}
      </header>

      <main style={{ maxWidth: 520, margin: '0 auto', padding: '0 20px 50px' }}>

        {/* ═══ LANDING ═══ */}
        {step === 'landing' && (
          <div style={{ animation: 'fadeIn 0.5s ease', paddingTop: 20 }}>
            {/* Hero */}
            <div style={{ background: '#70020F', borderRadius: 24, overflow: 'hidden', position: 'relative', marginBottom: 24 }}>
              <Sparkle size={18} color="#ffffff40" style={{ position: 'absolute', top: 18, left: 20 }} />
              <Sparkle size={12} color="#ffffff30" style={{ position: 'absolute', top: 30, right: 40 }} />
              <Sparkle size={22} color="#ffffff35" style={{ position: 'absolute', bottom: 50, right: 20 }} />
              <Sparkle size={10} color="#ffffff25" style={{ position: 'absolute', top: 60, left: 50 }} />
              <div style={{ padding: '40px 28px 18px', textAlign: 'center' }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#ffffff90', fontWeight: 700, marginBottom: 14 }}>stay sharp, not overwhelmed</p>
                <h1 style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 400, color: '#FFF9F7', lineHeight: 1.2, marginBottom: 8 }}>AI is moving fast.</h1>
                <h1 style={{ fontFamily: 'var(--display)', fontSize: 36, fontWeight: 400, color: '#FFDEE2', lineHeight: 1.2, fontStyle: 'italic', marginBottom: 20 }}>this keeps you<br />in the loop.</h1>
                <p style={{ fontSize: 14, color: '#ffffff95', lineHeight: 1.6, maxWidth: 320, margin: '0 auto 8px' }}>one email. just the stuff that actually matters in AI & startups. no jargon. no 47-tab spirals.</p>
              </div>
              <ScallopBorder color="#FFF3EE" height={14} />
            </div>

            {/* Email card */}
            <div style={{ background: '#FFF9F7', border: '2px solid #FFDEE2', borderRadius: 20, padding: '28px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#70020F', fontWeight: 700, letterSpacing: 0.3, marginBottom: 16 }}>✦ enter your email & get your first byte ✦</p>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
                style={{ width: '100%', padding: '13px 16px', border: '2px solid #FFDEE2', borderRadius: 14, fontSize: 15, fontFamily: 'var(--body)', background: '#fff', color: '#3d2020', outline: 'none', marginBottom: 12 }} />
              <button onClick={() => validEmail && setStep('topics')} disabled={!validEmail}
                style={{ width: '100%', padding: '13px', background: validEmail ? '#70020F' : '#f5e0e5', color: validEmail ? '#fff' : '#c4a0a8', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, fontFamily: 'var(--body)', cursor: validEmail ? 'pointer' : 'default', letterSpacing: 0.5 }}>
                get started →
              </button>
            </div>

            {/* Trust badges */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
              {['2 min read', 'zero jargon', 'just the signal'].map((t, i) => (
                <span key={i} style={{ fontSize: 11, color: '#70020F', fontWeight: 600, background: '#FFDEE2', padding: '5px 12px', borderRadius: 20 }}>✦ {t}</span>
              ))}
            </div>
          </div>
        )}

        {/* ═══ TOPICS ═══ */}
        {step === 'topics' && (
          <div style={{ animation: 'fadeIn 0.4s ease', paddingTop: 16 }}>
            <button onClick={() => setStep('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#c4a0a8', padding: 0, marginBottom: 18, fontWeight: 600, fontFamily: 'var(--body)' }}>← back</button>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 26, fontWeight: 400, color: '#3d2020', marginBottom: 4, fontStyle: 'italic' }}>what&apos;s your vibe? ✦</h2>
            <p style={{ fontSize: 12, color: '#70020F', marginBottom: 20, fontWeight: 600 }}>pick your topics. we&apos;ll curate accordingly.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {TOPICS.map(t => {
                const on = selected.has(t.id)
                return (
                  <button key={t.id} onClick={() => toggle(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: on ? '#FFF9F7' : '#fff', border: on ? '2px solid #70020F' : '2px solid #FFDEE2', borderRadius: 16, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', fontFamily: 'var(--body)' }}>
                    <span style={{ fontSize: 18, width: 36, height: 36, borderRadius: 10, background: on ? '#70020F' : '#FFDEE2', color: on ? '#fff' : '#70020F', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 700 }}>{t.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#3d2020', marginBottom: 1 }}>{t.label}</div>
                      <div style={{ fontSize: 11, color: '#b89090' }}>{t.desc}</div>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: 18, flexShrink: 0, border: on ? 'none' : '2px solid #d4b8b8', background: on ? '#70020F' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {on && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>}
                    </div>
                  </button>
                )
              })}
            </div>

            {error && <p style={{ fontSize: 12, color: '#70020F', marginBottom: 10, textAlign: 'center' }}>{error}</p>}
            <button onClick={generate} disabled={selected.size === 0} style={{ width: '100%', padding: '14px', background: selected.size > 0 ? '#70020F' : '#f5e0e5', color: selected.size > 0 ? '#fff' : '#c4a0a8', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, fontFamily: 'var(--body)', cursor: selected.size > 0 ? 'pointer' : 'default', letterSpacing: 0.5 }}>
              show me today&apos;s byte ✦
            </button>
          </div>
        )}

        {/* ═══ LOADING ═══ */}
        {step === 'loading' && <Loader />}

        {/* ═══ RESULTS ═══ */}
        {step === 'results' && results && (
          <div style={{ animation: 'fadeIn 0.4s ease', paddingTop: 16 }}>
            <div style={{ textAlign: 'center', marginBottom: 22 }}>
              <Sparkle size={14} color="#70020F" style={{ margin: '0 auto 8px', display: 'block', animation: 'float 2s ease-in-out infinite' }} />
              <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#70020F', fontWeight: 700, marginBottom: 6 }}>your byte for today</p>
              <h2 style={{ fontFamily: 'var(--display)', fontSize: 24, fontWeight: 400, color: '#3d2020', fontStyle: 'italic' }}>here&apos;s what matters rn ✦</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              {results.map((t, i) => <ResultCard key={t.id || i} topic={t} index={i} />)}
            </div>

            {/* Subscribe CTA */}
            <div style={{ background: '#70020F', borderRadius: 20, overflow: 'hidden', position: 'relative', textAlign: 'center' }}>
              <Sparkle size={14} color="#ffffff30" style={{ position: 'absolute', top: 12, left: 16 }} />
              <Sparkle size={10} color="#ffffff20" style={{ position: 'absolute', top: 20, right: 24 }} />
              <div style={{ padding: '24px 22px 10px' }}>
                <p style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#FFF9F7', fontStyle: 'italic', marginBottom: 4 }}>want this in your inbox every morning?</p>
                <p style={{ fontSize: 11, color: '#ffffff80', marginBottom: 14 }}>signed up as <strong style={{ color: '#FFDEE2' }}>{email}</strong></p>
                <button onClick={subscribe} style={{ padding: '11px 28px', background: '#FFF9F7', color: '#70020F', border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 700, fontFamily: 'var(--body)', cursor: 'pointer' }}>
                  yes please ✿
                </button>
              </div>
              <ScallopBorder color="#FFF3EE" height={12} />
            </div>
            <button onClick={() => { setResults(null); setStep('topics') }} style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: '#c4a0a8', fontWeight: 600, fontFamily: 'var(--body)' }}>← change topics</button>
          </div>
        )}

        {/* ═══ SUBSCRIBED ═══ */}
        {step === 'subscribed' && (
          <div style={{ animation: 'fadeIn 0.5s ease', paddingTop: 50, textAlign: 'center' }}>
            <div style={{ width: 70, height: 70, borderRadius: 20, background: '#70020F', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'float 2s ease-in-out infinite' }}>
              <span style={{ fontSize: 32 }}>💌</span>
            </div>
            <h2 style={{ fontFamily: 'var(--display)', fontSize: 28, fontWeight: 400, color: '#3d2020', fontStyle: 'italic', marginBottom: 10 }}>you&apos;re in the loop.</h2>
            <p style={{ fontSize: 14, color: '#8a5a5a', lineHeight: 1.6, maxWidth: 300, margin: '0 auto 24px' }}>your daily byte drops every morning.<br />short. simple. just the signal.</p>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#70020F', color: '#fff', padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✦ streak starts tomorrow</span>
            <div style={{ marginTop: 24 }}>
              <button onClick={() => { setStep('landing'); setEmail(''); setSelected(new Set()); setResults(null) }} style={{ padding: '10px 22px', background: '#FFF9F7', border: '2px solid #FFDEE2', borderRadius: 14, cursor: 'pointer', fontFamily: 'var(--body)', fontSize: 12, color: '#8a5a5a', fontWeight: 600 }}>back to home</button>
            </div>
          </div>
        )}
      </main>

      {/* ─── FOOTER ─── */}
      <footer style={{ textAlign: 'center', padding: '12px 20px 24px' }}>
        <div style={{ color: '#70020F', fontSize: 10, letterSpacing: 4, marginBottom: 6 }}>✦ ❋ ✿ ☕ ✦</div>
        <p style={{ fontSize: 10, color: '#c4a0a8', letterSpacing: 0.3 }}>built by siddhi · because AI shouldn&apos;t feel overwhelming</p>
      </footer>
    </div>
  )
}
