# 🔴 The Daily Byte — Deployment Guide

**What you're building:** A website where people enter their email, pick AI topics, and get a personalized AI-generated newsletter preview. Every email gets saved so you can track signups.

**Total cost: $0**
**Total time: ~30 minutes**

---

## HOW THIS APP WORKS (simple version)

```
User visits your site
    ↓
Enters email + picks topics
    ↓
Clicks "show me today's byte"
    ↓
Your website sends a request to YOUR server (Vercel)
    ↓
Your server calls Claude API (your key is hidden here, safe)
    ↓
Claude searches the web for latest AI news + writes it in gossip style
    ↓
Your server sends the result back to the user's browser
    ↓
User sees the content → clicks "subscribe"
    ↓
Email + topics get saved to Supabase (your database)
    ↓
You can see all signups in your Supabase dashboard
```

**Why can't the browser call Claude directly?**
Because your API key would be visible in the browser's source code. Anyone could steal it. The server keeps it secret.

---

## YOUR PROJECT FILES (what each file does)

```
daily-byte/
├── package.json          ← tells the system what libraries to install
├── next.config.js        ← Next.js settings (empty, just needs to exist)
├── .env.example          ← template for your secret keys
├── .gitignore            ← tells Git to NOT upload your secret keys
├── app/
│   ├── layout.js         ← the HTML wrapper (loads fonts)
│   ├── globals.css       ← animations + colors
│   ├── page.js           ← ⭐ THE MAIN APP (everything the user sees)
│   └── api/
│       ├── generate/
│       │   └── route.js  ← ⭐ BACKEND: calls Claude API securely
│       └── subscribe/
│           └── route.js  ← ⭐ BACKEND: saves emails to Supabase
```

---

## STEP 1: CREATE YOUR ACCOUNTS (10 min)

### 1A. GitHub account
**What is GitHub?** It's where your code lives online. Vercel reads your code from here.

1. Go to **github.com**
2. Click **Sign up**
3. Create a free account
4. Done

### 1B. Vercel account
**What is Vercel?** It takes your code and puts it on the internet. It gives you a URL like `the-daily-byte.vercel.app` that anyone can visit.

1. Go to **vercel.com**
2. Click **Sign Up**
3. Choose **Continue with GitHub**
4. Authorize Vercel to access your GitHub
5. Done — no credit card needed

### 1C. Supabase account
**What is Supabase?** It's a free database. Every time someone enters their email on your site, it gets saved here. You can see all signups in a nice table.

1. Go to **supabase.com**
2. Click **Start your project**
3. Sign in with **GitHub**
4. Done

### 1D. Anthropic API key
**What is this?** A password that lets your server talk to Claude. Claude generates the newsletter content.

1. Go to **console.anthropic.com**
2. Sign up or log in
3. Go to **Settings → API Keys**
4. Click **Create Key**
5. Copy the key — it starts with `sk-ant-...`
6. **Save it somewhere safe** (Notes app, etc.) — you can't see it again
7. New accounts get **$5 free credits** (that's hundreds of generations)

---

## STEP 2: SET UP SUPABASE DATABASE (5 min)

You need to create a table where emails will be saved.

1. Go to **supabase.com** → click your dashboard
2. Click **New Project**
   - Name: `daily-byte`
   - Database password: anything you want (save it)
   - Region: pick the closest one to you
   - Click **Create new project** (takes ~1 min to set up)
3. Once it's ready, click **SQL Editor** in the left sidebar
4. Paste this and click **Run**:

```sql
CREATE TABLE subscribers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  topics TEXT[],
  subscribed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow inserts" ON subscribers
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Allow updates" ON subscribers
  FOR UPDATE TO anon
  USING (true)
  WITH CHECK (true);
```

**What did that do?**
- Created a table called `subscribers` with columns: email, topics, and signup date
- Turned on security so only your app can write to it

5. Now get your Supabase credentials:
   - Click **Project Settings** (gear icon, bottom of left sidebar)
   - Click **API**
   - Copy **Project URL** — looks like `https://xxxxx.supabase.co`
   - Copy **anon public** key — starts with `eyJ...`
   - Save both somewhere

---

## STEP 3: UPLOAD CODE TO GITHUB (5 min)

### Option A: Using GitHub's website (easier, no terminal needed)

1. Go to **github.com** → click the **+** icon (top right) → **New repository**
2. Name: `the-daily-byte`
3. Keep it **Public** (Vercel free tier needs this)
4. Click **Create repository**
5. You'll see an empty repo page

Now you need to upload the files. On the repo page:
1. Click **"uploading an existing file"** link
2. Drag ALL the files from the `daily-byte` folder I gave you
   - Make sure you include the `app` folder with all its subfolders
3. Click **Commit changes**

**IMPORTANT:** The folder structure must match exactly. Your repo should look like:
```
package.json
next.config.js
.env.example
.gitignore
app/
  layout.js
  globals.css
  page.js
  api/
    generate/
      route.js
    subscribe/
      route.js
```

### Option B: Using terminal (if you're comfortable)

```bash
cd daily-byte
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/the-daily-byte.git
git push -u origin main
```

---

## STEP 4: DEPLOY ON VERCEL (5 min)

This is the magic step — your site goes live.

1. Go to **vercel.com/new**
2. You'll see your GitHub repos listed
3. Find and click **the-daily-byte**
4. Click **Import**
5. On the next page:
   - **Framework Preset:** should auto-detect as **Next.js** ✓
   - **Root Directory:** leave as `.` (default) ✓
6. **IMPORTANT** — Expand **Environment Variables** and add these three:

   | Name | Value |
   |------|-------|
   | `ANTHROPIC_API_KEY` | `sk-ant-...` (your Anthropic key) |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` (from Step 2) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` (from Step 2) |

7. Click **Deploy**
8. Wait ~1-2 minutes for it to build
9. 🎉 **You'll get a URL like `the-daily-byte.vercel.app`**

**That's it. Your site is live.**

---

## STEP 5: TEST IT (2 min)

1. Open your Vercel URL
2. Enter your own email
3. Pick some topics
4. Click "show me today's byte"
5. Wait ~10-15 seconds (Claude is searching the web + writing)
6. You should see the results!
7. Click "yes please" to subscribe
8. Go to **Supabase dashboard → Table Editor → subscribers**
9. You should see your email saved there! ✦

---

## HOW TO SEE YOUR SIGNUPS

Go to **supabase.com** → your project → **Table Editor** → click **subscribers**

You'll see a spreadsheet-like view with:
- Every email
- What topics they picked
- When they signed up

You can also export this as CSV anytime.

---

## TROUBLESHOOTING

**"Build failed" on Vercel?**
→ Check that your folder structure matches exactly (especially the `app/api` folders)
→ Make sure `package.json` is in the root, not inside a subfolder

**API not working / "something broke" error?**
→ Check Vercel dashboard → your project → **Settings → Environment Variables**
→ Make sure all 3 variables are set correctly (no extra spaces)
→ Check **Logs** tab in Vercel to see the actual error

**Supabase not saving emails?**
→ Make sure you ran the SQL from Step 2
→ Check that your Supabase URL and key are correct in Vercel

**Takes too long / times out?**
→ Claude with web search takes 10-20 seconds. Vercel free tier has a 10-second limit.
→ To fix: go to Vercel → your project → Settings → Functions → change **Max Duration** to 30 seconds
→ Note: if still timing out, you may need to upgrade to Vercel Pro ($0 for hobby, $20/mo for pro)

---

## OPTIONAL: CUSTOM DOMAIN

Want `dailybyte.co` instead of `the-daily-byte.vercel.app`?

1. Buy a domain on **Namecheap** or **Cloudflare** (~$10/year)
2. In Vercel → your project → **Settings → Domains**
3. Add your domain
4. Vercel will tell you what DNS records to add
5. Add them in your domain provider
6. Wait ~10 min → done, your custom domain works

---

## WHAT'S NEXT (future improvements)

- **Actually send daily emails** → Add Resend.com (free 100 emails/day) + a cron job
- **Analytics** → Add Plausible or Vercel Analytics (free)
- **More topics** → Just add more items to the TOPICS array in page.js
- **Share button** → Let users share their byte on social

---

Built by Siddhi ✦ because AI shouldn't feel overwhelming
