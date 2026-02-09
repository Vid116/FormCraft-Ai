# FormCraft AI — Project Plan & Context

## What This Is
A SaaS form builder (Typeform competitor) with AI-powered form generation, conditional logic, and response insights. Built for a solo indie developer aiming for full-time income.

## Tech Stack
- **Frontend + API**: Next.js 16.1.6, React 19, TypeScript, Tailwind CSS v4, App Router
- **Database + Auth**: Supabase (Postgres, Auth, RLS, Realtime)
- **AI (Dev)**: Claude Code CLI via `child_process.spawn("claude", ["--print"], { shell: true })` — pipes prompt via stdin. Uses the user's Claude Code subscription, no API key needed.
- **AI (Prod)**: Anthropic API with `claude-haiku-4-5-20251001`. Swappable via `AI_PROVIDER` env var ("sdk" or "api")
- **Hosting plan**: Vercel (frontend) + Supabase (backend)
- **Payments**: Stripe (not yet implemented)

## Supabase Project
- **Project ID**: `bqgegynmistmydlzmnei`
- **Region**: eu-central-1
- **Organization ID**: `rvgyrjkgegpaufmdimtd`
- **URL**: https://bqgegynmistmydlzmnei.supabase.co
- **Anon Key**: in `.env.local` (already configured)
- **Note**: "the-makers" project was paused to free a slot for this one

## Database Schema
Two tables in `public` schema with RLS enabled:

### `forms`
- `id` UUID PK
- `user_id` UUID FK → auth.users
- `title` TEXT
- `description` TEXT
- `fields` JSONB (array of FormField objects, includes conditions)
- `settings` JSONB (FormSettings: theme_color, show_branding, submit_message, welcome_title, welcome_description)
- `is_published` BOOLEAN
- `response_count` INTEGER
- `created_at`, `updated_at` TIMESTAMPTZ

### `responses`
- `id` UUID PK
- `form_id` UUID FK → forms
- `answers` JSONB (keyed by field_id; rating answers are `{score: number, comment?: string}`)
- `submitted_at` TIMESTAMPTZ
- `metadata` JSONB

### RLS Policies
- Forms: owners CRUD, anon can SELECT published forms
- Responses: owners can SELECT, anon+authenticated can INSERT to published forms

### Functions
- `increment_response_count(form_id_input UUID)` — SECURITY DEFINER, search_path set
- `update_updated_at()` trigger on forms

## File Structure
```
src/
├── app/
│   ├── page.tsx                              # Landing page (hero, pricing, how-it-works)
│   ├── layout.tsx                            # Root layout (Geist fonts, metadata)
│   ├── globals.css                           # Tailwind import + CSS vars
│   ├── (auth)/
│   │   ├── login/page.tsx                    # Email+password login
│   │   └── signup/page.tsx                   # Email+password signup
│   ├── (dashboard)/dashboard/
│   │   ├── layout.tsx                        # Dashboard nav, auth guard (server component)
│   │   ├── page.tsx                          # Form listing grid + empty state
│   │   └── forms/
│   │       ├── new/page.tsx                  # AI form generator → editor with welcome/completion screen editing
│   │       └── [id]/page.tsx                 # Form detail: responses table + AI summary + publish toggle
│   ├── f/[id]/page.tsx                       # Public form page (server: fetches form, renders client component)
│   └── api/
│       ├── ai/generate-form/route.ts         # POST: generates form fields + welcome text via AI
│       ├── ai/summarize/route.ts             # POST: AI summary of responses
│       └── auth/callback/route.ts            # OAuth callback
├── components/
│   ├── dashboard/
│   │   ├── form-card.tsx                     # Form grid card
│   │   ├── form-responses-view.tsx           # Responses table + AI summary button (handles rating {score,comment} display)
│   │   ├── logout-button.tsx                 # Client component
│   │   └── publish-toggle.tsx                # Publish/unpublish button
│   └── forms/
│       ├── form-editor.tsx                   # Drag-to-reorder fields, edit labels/types/options, rating min/max, CONDITION BUILDER UI
│       └── public-form-renderer.tsx          # ANIMATED step-by-step form (Typeform-style)
├── lib/
│   ├── ai/
│   │   ├── provider.ts                       # AI abstraction: ClaudeCLIProvider (dev) / AnthropicAPIProvider (prod)
│   │   └── prompts.ts                        # System prompts for form generation + response summarization
│   ├── conditions.ts                         # evaluateCondition() + getVisibleFields() — conditional logic engine
│   ├── supabase/
│   │   ├── client.ts                         # Browser Supabase client
│   │   └── server.ts                         # Server Supabase client (cookies)
│   └── types/
│       └── form.ts                           # All TypeScript types (FormField, Form, FormSettings, FieldCondition, etc.)
├── middleware.ts                              # Auth routing: protect /dashboard/*, redirect authed from /login
```

## Key Types (src/lib/types/form.ts)
```typescript
FieldType = "short_text" | "long_text" | "email" | "number" | "phone" | "url" | "multiple_choice" | "checkbox" | "dropdown" | "rating" | "date" | "file_upload"
ConditionOperator = "equals" | "not_equals" | "less_than" | "greater_than" | "contains"
FieldCondition = { field_id: string; operator: ConditionOperator; value: string | number }
FormField = { id, type, label, description?, required, placeholder?, options?, validation?, condition?, order }
FormSettings = { theme_color, show_branding, submit_message, welcome_title, welcome_description, redirect_url?, notifications_email? }
```

## Public Form Renderer Features (Already Built)
- Step-by-step, one question at a time (like Typeform)
- Morphing gradient background that shifts color as user progresses
- Floating ambient particles
- Rainbow progress bar at top
- Welcome screen with customizable title + description (AI-generated, editable)
- Smooth slide transitions (forward/back) with CSS keyframes
- Keyboard: Enter to advance, Arrow keys to go back
- Shake animation on required field skip
- Multiple choice: card-style with letter badges (A, B, C), auto-advance on select
- Checkbox: multi-select cards with check animation
- Rating: custom slider with large value display + optional "tell us why" comment textarea (appears after scoring)
- Rating answers stored as `{score: number, comment?: string}`
- Confetti celebration + check-draw animation on submit
- Conditional logic: `getVisibleFields()` dynamically shows/hides fields based on answers
- Branding: "Powered by FormCraft AI" (toggleable)

## AI Provider Details
- The `generateFormFromDescription()` function returns `{ title, welcome_title, welcome_description, submit_message, fields[] }`
- AI auto-generates conditional follow-up fields after rating questions (empathetic "what went wrong?" for low scores)
- Fields in the response can have `condition` property already wired up
- The prompt explicitly tells AI to generate conditions with correct field_id references

## What's DONE ✅
1. ✅ Project scaffolding (Next.js + deps)
2. ✅ AI abstraction layer (Claude CLI for dev, Anthropic API for prod)
3. ✅ Supabase project + database schema + RLS
4. ✅ Auth flow (signup, login, logout, middleware protection)
5. ✅ Dashboard layout + form listing + empty states
6. ✅ AI form generation (describe → fields + welcome text)
7. ✅ Form editor (drag reorder, edit types, options, rating config)
8. ✅ Public form renderer (animated step-by-step, all field types)
9. ✅ Form publishing + shareable link (/f/[id])
10. ✅ Response collection + response table view
11. ✅ AI response summarization
12. ✅ Conditional logic engine + editor UI
13. ✅ AI-generated follow-up questions for ratings
14. ✅ Rating comment "tell us why" field
15. ✅ Editable welcome screen + completion screen text

## What's LEFT TO BUILD 🔨
Priority order:

### 1. localStorage Auto-Save (Task #8)
Save respondent progress to localStorage as they answer. Resume if they close/reopen the form. Key: `formcraft_progress_{form_id}`. Clear on submit.

### 2. Mobile UX Polish (Task #9)
- Touch swipe gestures (swipe up = next, swipe down = back)
- Larger tap targets (48px minimum)
- Thumb-friendly button placement (bottom of screen)
- Test all field types on mobile viewports
- Primary audience is PHONE users — design mobile-first

### 3. Live Response Dashboard (Task #10)
Use Supabase realtime subscriptions on the `responses` table. New responses appear instantly in the form detail page without refresh. Show a subtle notification animation when a new one arrives.

### 4. Email Notifications (Task #11)
Notify form owner when a new response comes in. Options: Supabase Edge Function triggered by database webhook, or use Resend API. The `notifications_email` field already exists in FormSettings.

### 5. CSV Export (Task #12)
Button on the form detail page. Generate CSV client-side from the responses data. Columns = field labels, rows = responses. Handle rating objects ({score, comment}) properly.

### 6. QR Code Generation (Task #13)
Generate QR code for the public form URL. Downloadable as PNG. Can use a lightweight library like `qrcode` or generate SVG server-side. Show on the form detail page next to the share link.

### 7. Duplicate Form (Task #14)
One-click clone: copy all fields, settings, conditions to a new form with " (Copy)" appended to title. Published = false. Add button to form card or form detail page.

### 8. Stripe Billing (Phase 3 — not yet started)
- Free: 3 forms, 100 responses/mo
- Pro $19/mo: Unlimited forms, 1K responses/mo, full AI, custom branding
- Business $49/mo: 10K responses/mo, team seats, integrations
- Need: Stripe checkout, webhooks, portal, usage tracking middleware

### 9. Landing Page Polish
Current landing page works but could use more personality. Consider using the `frontend-design` skill for a redesign.

## Important Notes
- The user is on a tight budget — using Claude Code subscription for dev AI, will switch to API keys for production
- Windows environment (paths use C:\, shell: true needed for child_process)
- The `middleware.ts` file triggers a Next.js 16 deprecation warning about "proxy" — not breaking, just a warning
- `.env.local` already has Supabase keys configured
- `.env*` is in .gitignore
- The npm package `@anthropic-ai/claude-code` is installed but it's the CLI binary, NOT an importable SDK. AI calls use `child_process.spawn("claude", ["--print"])` with stdin pipe.

## Dev Commands
```bash
cd C:\everything\formcraft-ai
npm run dev          # Start dev server
npm run build        # Production build (verify no errors)
npm run lint         # ESLint
```
