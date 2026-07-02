# Markium — AI Productivity Playbook for Social Media

The social media warming plan requires producing 12-15 pieces of content per week across 4 platforms. Doing this manually is impossible for a small team. AI cuts this workload by ~70% if you use it right.

This document maps every step of the content production pipeline to the AI tool that accelerates it.

---

## The Core Insight

AI doesn't replace you — it removes the blank page. Your job becomes **editing, curating, and adding authentic voice**, not starting from zero. A good workflow looks like:

1. AI generates a rough draft (5 seconds)
2. You inject the Markium voice, Darija expressions, and local context (2 minutes)
3. AI polishes the final version (5 seconds)
4. You post

What used to take 2 hours per piece now takes 15 minutes.

---

## The Content Pipeline — AI at Every Step

```
IDEATION → SCRIPT → VISUALS → VIDEO → CAPTION → POST → ENGAGE → ANALYZE
   ↓         ↓         ↓        ↓        ↓        ↓       ↓         ↓
  AI       AI       AI       AI       AI       AI      AI        AI
```

Let's break down each stage.

---

## Stage 1: Ideation — Never Run Out of Topics

### The problem
Coming up with 12+ content ideas per week is exhausting. You'll burn out in week 2.

### The AI solution
Use **ChatGPT / Claude** as an idea generation machine.

**Prompt template:**
```
You are a content strategist for Markium, an e-commerce platform for Algerian merchants.
Markium features: [paste markium-features-overview.md]
Audience: Facebook/TikTok ad merchants, solo operators, COD-based, Darija-speaking.
Content pillars: Education (40%), Insight (20%), Story (15%), BTS (15%), Community (10%).

Generate 30 content ideas for this week across these pillars.
For each idea, give:
- Hook (Darija-friendly, attention-grabbing)
- Format (TikTok / Reel / Carousel / Long post)
- Pillar
- Key feature of Markium to showcase (if any)
```

### Pro tip
Feed the AI your **previous winning content** every week. Say: "Here are the 3 posts that got the most engagement last week. Generate 10 more ideas in that style."

### Tools to use
- **Claude / ChatGPT** — best for strategic ideation
- **Perplexity** — for trend research ("What are Algerian e-commerce merchants talking about this week?")
- **AnswerThePublic** — for SEO topic discovery (free questions merchants are asking)

---

## Stage 2: Script Writing — Darija + Hook + Structure

### The problem
Writing compelling hooks in Darija is hard. Most AI models don't speak Darija natively — they'll produce stiff MSA (formal Arabic).

### The AI solution
Use AI for the **structure**, then translate/adapt to Darija yourself. Or use a hybrid: write the hook in Darija yourself (or find examples from competitors), then let AI generate the rest.

**Prompt template for scripts:**
```
Write a 45-second TikTok script for Markium.
Angle: "The Wasted Ad Budget" — merchant doesn't know which campaigns are profitable
Structure:
- Hook (0-3s): short, direct, creates curiosity
- Problem (3-15s): show the pain visually
- Solution (15-35s): Markium Campaign ROI dashboard
- Payoff (35-45s): merchant sees which campaign is losing money, pauses it

Give me the script in French first, then I'll translate to Darija.
Include: on-screen text, voiceover, suggested visuals for each second.
```

### Darija adaptation trick
Keep a running **Darija phrase bank** in a text file. Common expressions merchants use:
- "خسرت فلوس" (I lost money)
- "ما تعرفش" (you don't know)
- "واش درت؟" (what did you do?)
- "المشكل" (the problem)
- "الحل" (the solution)
- "جربها" (try it)

Paste this bank into every prompt so AI uses these expressions naturally.

### Tools
- **Claude** — best for long-form, structured scripts
- **ChatGPT with custom GPT** — create a "Markium Script Writer" custom GPT with your voice and context pre-loaded
- **DeepL** — for French → Darija translation starting point

---

## Stage 3: Visual Content — Graphics, Carousels, Thumbnails

### The problem
Creating visual content for 12 posts per week manually in Canva = full-time job.

### The AI solution

#### For static graphics and carousels:
- **Canva AI (Magic Studio)** — generates full carousel templates from a text prompt. "Create a 5-slide carousel explaining Facebook Pixel setup."
- **Canva Magic Resize** — one design auto-adapts to FB post, IG post, TikTok cover, Story format
- **ChatGPT + DALL-E / Midjourney** — for custom illustrations, mockups, scene generation

#### For screen recordings with callouts:
- **Loom AI** — records your screen AND auto-generates captions, titles, summaries
- **Screen Studio** (Mac) — produces polished screen recordings with auto-zoom on clicks

#### For UI mockups in content:
- **v0.dev** or **Framer AI** — generate fake dashboard screens for visual storytelling (if you want to avoid showing real merchant data)

#### For thumbnails:
- **Canva AI + text prompts** — "YouTube thumbnail, Algerian man looking shocked at laptop, bright red background, bold Arabic text"
- **ThumbnailAI** — generates YouTube thumbnails optimized for click-through

### Workflow example (5-slide carousel in 10 minutes)
1. ChatGPT: write carousel text outline (2 min)
2. Canva AI: "Create 5-slide carousel with this content, Arabic/French bilingual, Markium brand colors" (3 min)
3. Manual tweaks: adjust typography, add Darija hooks (5 min)
4. Export and schedule

---

## Stage 4: Video Production — The Biggest Time Saver

### The problem
Video is the highest-performing format but the most time-consuming to produce.

### The AI solution — massive productivity gains

#### A. AI Voiceover (for no-face videos)
- **ElevenLabs** — realistic Arabic/French voiceovers. Clone your own voice once, then generate unlimited voiceovers from text.
- **Murf.ai** — alternative with good Arabic support

**Workflow**: Write script → ElevenLabs generates voiceover in 10 seconds → drop into CapCut with screen recording → done in 5 minutes.

#### B. Auto-Captions
- **CapCut** (free) — auto-generates captions from video in Arabic/French, fully styled
- **Submagic** — premium alternative, better styling
- **Opus Clip** — paste a long video, it generates multiple short clips with captions and hooks automatically

#### C. Auto-Editing
- **Descript** — edits video by editing text (like a Google Doc). Remove filler words, cut silences, change words — all by editing text.
- **CapCut Magic Tools** — auto-cut, auto-color, auto-music

#### D. Long Video → Multiple Shorts
- **Opus Clip** or **Vizard** — record one 30-minute tutorial, AI automatically cuts it into 15-20 short clips with hooks and captions.
- **This is the single biggest leverage point** — record 1 webinar per week, get 15 short clips for TikTok/Reels/Shorts.

#### E. AI-Generated B-Roll
- **Runway ML** or **Kling AI** — generate stock footage from text prompts when you need visual variety
- **Pexels/Pixabay AI search** — find relevant stock footage faster

### Killer workflow
```
Record 1 long video (30 min tutorial in Darija)
    ↓
Opus Clip auto-extracts 15 short clips
    ↓
CapCut adds captions + Markium branding
    ↓
Schedule 15 posts across platforms in 30 minutes
```

**One recording session = two weeks of content.** This alone solves your production bottleneck.

---

## Stage 5: Captions, Hooks, Hashtags

### The problem
Every post needs a caption, hashtags, and CTA. Writing fresh ones each time kills productivity.

### The AI solution

**Prompt template:**
```
Write 3 variations of a TikTok caption for this video:
[paste video description]

Requirements:
- First line is a hook in Darija (attention-grabbing)
- Max 2 short sentences
- End with a question to drive comments
- Include 8-12 hashtags: 4 broad (e.g. #ecommerce #algerie), 4 niche (e.g. #markium #tijara_dz), 4 trending
- Tone: direct, friendly, merchant-to-merchant
```

### Tools
- **ChatGPT / Claude** — caption variations, hashtag research
- **RiteTag** — real-time hashtag performance data
- **Metricool AI** — platform-specific caption generation

---

## Stage 6: Scheduling & Posting

### The problem
Manually posting on 4 platforms at different optimal times is a daily time sink.

### The AI solution

#### Scheduling tools with AI features:
- **Metricool** — schedules across FB, IG, TikTok, YouTube with AI-suggested best posting times
- **Meta Business Suite** (free) — FB + IG scheduling with insights
- **Buffer AI** — caption variations + scheduling
- **Later** — good Instagram-first scheduling

#### AI-powered optimization:
- These tools learn when *your specific audience* is most active and suggest posting times that beat generic advice.
- They also suggest the best format based on what's working for you.

### Pro tip
Schedule posts **1 week ahead**. Use Sundays to batch-create and schedule everything. Weekdays are for engagement only, not production.

---

## Stage 7: Engagement — Comments, DMs, Community

### The problem
The first hour after posting is critical for algorithmic reach. You need to respond to every comment fast. Plus DMs pile up.

### The AI solution

#### Comment response AI:
- **ChatGPT + custom prompt** — feed it your brand voice and let it draft comment responses. You review and send.
  ```
  You are the Markium community manager. Respond to this comment in the same language
  the commenter used (Darija/French). Be friendly, helpful, and invite more conversation.
  Comment: "[paste comment]"
  ```

#### DM automation:
- **ManyChat** — AI-powered chatbot for Facebook/Instagram DMs. Handles common questions (pricing, features, signup) automatically.
- **Chatfuel** — alternative with strong Arabic support

#### Community listening:
- **Brand24** or **Mention** — AI monitors mentions of "Markium" across the web and alerts you
- **Google Alerts** (free) — basic version of the above

### Workflow
- ManyChat handles 80% of DMs automatically (FAQ, pricing, signup link)
- You respond personally to 20% (complex questions, complaints, opportunities)
- ChatGPT drafts comment replies, you approve in bulk

---

## Stage 8: Analytics & Optimization

### The problem
Tracking what works across 4 platforms and iterating is data-heavy.

### The AI solution

#### AI-powered analytics:
- **Metricool AI Insights** — summarizes which posts worked and why
- **Hootsuite Insights** — AI-generated performance reports
- **Claude / ChatGPT** — paste raw analytics data, ask: "What patterns do you see? What should I do more of next week?"

**Prompt template:**
```
Here's last week's social media analytics:
[paste data]

Analyze:
1. Which posts performed best and why
2. Patterns in timing, format, topic
3. What I should do more of next week
4. What I should stop doing
Be direct and data-driven.
```

### Competitor intelligence:
- **SocialBlade** — track competitors' growth
- **ChatGPT with browsing** — "Analyze these 5 competitor accounts and summarize their content strategy: [urls]"

---

## The Full AI Stack for Markium (Monthly Cost Estimate)

| Tool | Purpose | Cost/month |
|------|---------|-----------|
| **Claude Pro / ChatGPT Plus** | Ideation, scripts, captions, analysis | ~2,500 DA |
| **Canva Pro** | Visual production with AI | ~1,500 DA |
| **CapCut** | Video editing + auto-captions | Free |
| **ElevenLabs** (Starter) | AI voiceovers in Arabic/French | ~1,500 DA |
| **Opus Clip** or **Vizard** | Long video → shorts automation | ~2,500 DA |
| **ManyChat** (Pro) | DM/comment automation | ~2,000 DA |
| **Metricool** (Starter) | Scheduling + AI insights | ~2,000 DA |
| **Total** | | **~12,000 DA/month** |

Compare this to hiring a social media manager (60,000-100,000 DA/month) — AI gives you 70% of the output at 15% of the cost.

Start with just the **free tools** (CapCut, Meta Business Suite, ChatGPT free) and add paid tools as you validate what works.

---

## The Weekly AI-Powered Workflow

Here's what a sustainable weekly rhythm looks like with AI:

### Sunday: Production Day (3-4 hours)
1. **Ideation** (30 min) — Claude generates 30 ideas, you pick 12-15
2. **Scripts** (1 hour) — AI drafts scripts, you adapt to Darija
3. **Video recording** (1 hour) — record 1-2 long tutorials + a few short clips
4. **AI video processing** (30 min) — Opus Clip cuts longs into shorts, CapCut adds captions
5. **Visual content** (30 min) — Canva AI generates carousels
6. **Captions + scheduling** (30 min) — ChatGPT writes captions, Metricool schedules everything

### Monday-Saturday: Engagement Mode (30 min/day)
1. Respond to comments (AI-assisted)
2. Engage in Facebook groups (manual — authenticity matters)
3. Check DMs (ManyChat handles most)
4. Monitor analytics briefly

### Saturday: Analytics Review (1 hour)
1. Paste weekly data into Claude
2. Get AI-generated insights and recommendations
3. Adjust next week's content plan

**Total time per week: ~7-8 hours** (vs 25-30 hours without AI)

---

## The 5 Most Important AI Habits

1. **Always feed AI your context.** Paste markium-features-overview.md, your brand voice, past winners. Generic prompts = generic outputs.

2. **Use AI for drafts, never final versions.** Your human judgment on Darija, cultural nuance, and brand voice is irreplaceable.

3. **Build a prompt library.** Save your best prompts as templates. Don't rewrite them every time. Reuse and iterate.

4. **Batch AI work.** AI loves batch processing. "Generate 30 ideas" beats 30 separate "generate 1 idea" requests.

5. **Close the loop with analytics.** Every week, feed your performance data back to AI so it learns what works for *your* specific audience.

---

## Getting Started — Week 1 AI Setup Checklist

- [ ] Create a "Markium Voice" document (brand tone, Darija phrases, do/don't words)
- [ ] Set up a ChatGPT or Claude Project with Markium context loaded
- [ ] Save 5-10 reusable prompts in a notes file
- [ ] Install CapCut (free) on phone and computer
- [ ] Create Canva account and set up brand kit (colors, fonts, logo)
- [ ] Sign up for ElevenLabs free tier, clone your voice
- [ ] Install Metricool free tier for scheduling
- [ ] Record your first long video (30 min tutorial) and run it through Opus Clip
- [ ] Draft 10 pieces of content using the pipeline
- [ ] Track time spent — compare against non-AI baseline

After week 1, you'll know which tools matter for your workflow and which are noise. Keep the winners, drop the rest.
