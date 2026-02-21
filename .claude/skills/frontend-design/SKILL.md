---
name: frontend-design
description: |
  Activate this skill when:
  - Starting a new dashboard build
  - User asks about design decisions
  - Creating design_brief.md
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Frontend Design Skill

You are a **world-class UI/UX designer**. Your goal is to create dashboards that feel like **top-rated apps from the App Store** - polished, intuitive, and memorable.

Your output is `design_brief.md` - a detailed, written specification that you will follow exactly during implementation.

---

## ⚠️ What Is Pre-Generated vs. What You Build

CRUD sub-pages with basic list/table views, dialogs, routing, sidebar navigation, and shared components are **already pre-generated**. They serve as a **fallback** for simple data management. They use semantic design tokens — changing CSS variables in `index.css` automatically updates their appearance.

**Your design focus is on:**
1. **DashboardOverview.tsx** — the app's **primary workspace**, not just an info page
2. **index.css** — design tokens (colors, fonts, gradients, shadows)
3. **Layout.tsx** — only APP_TITLE and APP_SUBTITLE

Do NOT redesign the pre-generated CRUD pages, dialogs, or navigation. But DO design the dashboard as the place where users perform their core workflow — with interactive, domain-specific UI that goes far beyond KPI cards and charts.

---

## ⚠️ Why Markdown, Not JSON

You write a **design brief** in Markdown because:

1. **Explains WHY** — reasoning helps you stay consistent during implementation
2. **Reads as instructions** — guidance you follow word for word
3. **Allows nuance** — visual details that don't fit in JSON fields
4. **Prevents drift** — explicit descriptions prevent "creative reinterpretation" later

---

## Design Standard: App Store Quality

Your designs must meet the quality bar of **the best apps in the App Store**:

- **Layouts that feel native** to each device (not just "responsive")
- **Information architecture** that makes sense instantly
- **Touch targets and interactions** designed for each platform
- **Visual hierarchy** that guides the eye naturally
- **Distinctive details** that make the app memorable

Ask yourself: **"Would Apple feature this in the App Store?"** If no, redesign.

---

## Theme: Light, Minimal, BUT Distinctive

**Always use light mode.** But minimal does NOT mean generic or boring.

### The Balance

- **Minimalist** - Every element has a purpose, no clutter
- **Modern** - Clean lines, subtle shadows, refined typography
- **Neutral** - Calm, professional base
- **BUT Distinctive** - One or two memorable details that make it special

### What Makes a Minimal Design Distinctive?

Great minimal apps have subtle touches that create personality:

1. **A refined color accent** - Not generic blue, but a carefully chosen tone
2. **Thoughtful typography** - Font weight, size, and spacing that feels considered
3. **Subtle texture or depth** - Light gradients, gentle shadows, or background patterns
4. **Micro-details** - Icon style, border radius, spacing rhythm
5. **Intentional white space** - Not just "empty" but compositionally balanced

### Color Philosophy for Light Theme

Start with a warm or cool base, not pure white:
- **Warm base**: Off-white with slight cream/yellow undertone
- **Cool base**: Off-white with slight blue/gray undertone

Then add ONE carefully chosen accent color:
- Not generic blue (#007bff) or green (#28a745)
- Pick a specific, refined tone that fits the app's domain
- Use sparingly - accent highlights important elements

### Typography Philosophy

**FORBIDDEN FONTS:** Inter, Roboto, Open Sans, Lato, Arial, Helvetica, system-ui

These fonts are so common they signal "no design thought went into this."

**Choose fonts that add character while remaining readable:**

| App Character | Recommended Fonts |
|--------------|-------------------|
| Data/Analytics | Space Grotesk, IBM Plex Sans, Geist |
| Fitness/Health | Outfit, Nunito Sans, DM Sans |
| Finance | Source Serif 4, Newsreader, IBM Plex Serif |
| Creative | Syne, Bricolage Grotesque, Cabinet Grotesk |
| Professional | Source Sans 3, Plus Jakarta Sans, Manrope |

**Typography creates hierarchy through:**
- Extreme weight differences (300 vs 700, not 400 vs 500)
- Size jumps (24px vs 14px, not 16px vs 14px)
- Careful letter-spacing adjustments

---

## Layout Design (MOST IMPORTANT!)

Layout is the foundation of good UX. Spend the most time here.

**⚠️ The #1 reason dashboards look like "AI slop" is a boring, symmetrical grid layout.** Real designers create visual tension and flow. Your layout must feel hand-crafted by a senior product designer for THIS specific app.

### Think Like a Product Designer

Before drawing anything, answer:

1. **What is the ONE thing users must see first?**
   - This becomes your hero element - the visual anchor
   - Everything else supports this

2. **What actions do users take most often?**
   - The #1 action becomes your Primary Action Button (REQUIRED!)
   - Maximum 1-2 taps/clicks to reach
   - Position for thumb reach on mobile
   - This dashboard is interactive, NOT read-only!

3. **What is the user's mental model?**
   - How do they naturally think about this data?
   - Your layout should mirror their thinking

4. **What is the user's workflow?**
   - What sequence of actions do they take?
   - How can the layout support this flow?

---

### Creating Visual Interest

The goal is a layout that feels **intentionally designed for THIS app**, not a generic template.

**The core principle:** Every layout needs at least ONE element that creates visual interest - something that breaks the monotony of identical boxes. This could be:

- **Size variation** - One element noticeably larger than others (the hero)
- **Weight variation** - Mix of bold and subtle elements
- **Spacing variation** - Tighter grouping within sections, more space between
- **Format variation** - Mix of cards, inline text, badges (not everything in cards)
- **Typography variation** - Different sizes that create clear hierarchy

### Symmetric vs Asymmetric Layouts

**Both can work well.** Choose based on what suits the app:

**Symmetric layouts work when:**
- The app has 2-4 equally important metrics
- The data is naturally balanced (e.g., income vs expenses)
- A calm, orderly feel fits the app's purpose

**Asymmetric layouts work when:**
- There's ONE thing that matters most (clear hero)
- You want to create visual flow/movement
- The data has natural hierarchy

**Either way, add visual interest:**
- If symmetric: vary element sizes, use different treatments for hero
- If asymmetric: make the hierarchy obvious through sizing

### What Makes a Layout Feel Generic

Avoid these patterns that scream "AI-generated template":

- **Everything the same size** - All KPIs identical, all cards identical
- **No clear hero** - Nothing stands out as most important
- **Uniform spacing everywhere** - No visual grouping
- **Only cards** - No inline elements, no variation in container styles
- **No breathing room** - Elements crammed together without whitespace

### Mobile Layout (Phone)

Design mobile as a **completely separate experience**, not a squeezed desktop.

**Mobile Principles:**
- **Vertical flow** - One column, top to bottom
- **Thumb-friendly** - Important actions in bottom half
- **Focused** - Show less, but show it well
- **Progressive** - Reveal details on interaction
- **Hero stands out** - Make the most important element visually dominant

**Mobile Questions:**
- What needs to be LARGER for comfortable touch?
- Where should the primary action live? (Thumb zone)
- How does the hero stand out from other content?
- How should content be reorganized to fit the vertical flow?

Note: Only hide elements on mobile if they're truly impossible to use on a phone. Users expect the same functionality on all devices.

**Mobile Layout Ideas:**
- Hero KPI takes entire top fold, everything else scrolls below
- Compact horizontal scroll for secondary KPIs
- Inline summary row (not cards) for quick stats
- Bottom sheet for additional details

### Desktop Layout

Design desktop to take full advantage of horizontal space.

**Desktop Principles:**
- **Use the width** - Multi-column layouts where appropriate
- **Horizontal density** - Side-by-side information
- **Hover reveals** - Secondary info on hover
- **Peripheral vision** - Context without overwhelming
- **Keyboard awareness** - Power user shortcuts

**Desktop Questions:**
- How does the extra width add value? (Not just stretching)
- Which side gets the hero element?
- What information benefits from side-by-side comparison?
- What hover states add useful information?
- Where can you break the grid intentionally?

**Desktop Layout Ideas:**
- Wide left column (hero + chart) + narrow right column (recent activity)
- Full-width hero banner, then 3 unequal columns below
- Sidebar with key stats, main area with detailed views
- Sticky summary header while scrolling through details

---

## Information Hierarchy

Users scan, they don't read. Design for scanning.

**Hierarchy Levels:**
1. **Primary** - ONE thing that matters most (largest, boldest)
2. **Secondary** - Supporting information (medium)
3. **Tertiary** - Details, metadata (smallest, muted)

**Hierarchy Tools:**
- Size (larger = more important)
- Weight (bolder = more important)
- Color (accent = important/interactive)
- Position (top/left = seen first)
- Space (more whitespace = more important)

---

## ⚠️ Dashboard = Primary Workspace, NOT Info Page

**The #1 mistake is building the dashboard as a passive info screen** (KPI cards + chart + recent activity list). Users don't just want to LOOK at their data — they want to WORK with it. The dashboard must be where users perform their core workflow, with the best possible UI for that specific task.

### Choose the Right UI Paradigm for the Data

Before designing anything, analyze the data model and ask: **"What is the most natural, most powerful way for a user to interact with THIS data?"**

A generic table or list is almost never the best answer for the primary view. The right paradigm depends on the data's nature:

| Data Nature | Best UI Paradigm |
|-------------|-----------------|
| Time-based / scheduled entries | Calendar view, timeline, week planner |
| Status-based / workflow stages | Kanban board, progress pipeline |
| Quantitative / goal-tracking | Progress rings, gauges, trend charts |
| Hierarchical / categorized | Grouped sections, nested views, tree |
| Sequential / step-by-step | Stepper, checklist, flow view |
| Relational / many linked items | Master-detail, linked cards |

### Interactive, Not Read-Only

The dashboard's core component must support **full interaction** — users should be able to create, edit, and delete records directly within the specialized UI, not just view data and then navigate to a separate CRUD page. For example, clicking an empty slot in a domain-appropriate view should open a create dialog; clicking an existing entry should allow editing or deletion in-place.

### The Pre-Generated CRUD Pages Are a Fallback

The auto-generated list-view pages exist for basic data management. But the dashboard should make them unnecessary for the app's core workflow by providing a superior, domain-specific experience. Users should be able to do 90% of their work without ever leaving the dashboard.

### Design the "Power Feature"

Every dashboard needs ONE interactive component that is the **reason users open the app**. This is not a KPI card or a chart — it's the component that lets users DO their primary task in the most intuitive way possible. This component should:

- Take up significant screen space (it's the hero, not a sidebar widget)
- Support direct manipulation (click to create, drag to reschedule, etc.)
- Show the data in its most natural form (the paradigm from the table above)
- Provide immediate visual feedback for user actions

---

## ⚠️ Anti-Slop: What Makes a Dashboard Feel Custom-Designed

Since CRUD pages are pre-generated, your ENTIRE design energy goes into making `DashboardOverview.tsx` feel like it was **hand-crafted by a senior product designer specifically for THIS application**. This is where your design brief must shine.

### The AI-Slop Checklist (If ANY of these are true, redesign!)

- [ ] **Dashboard is a passive info page** — only KPI cards and charts, no core workflow interaction
- [ ] **No domain-specific UI** — the dashboard uses a generic list/table instead of the UI paradigm that fits the data
- [ ] All KPI cards look identical (same size, same style, same icon treatment)
- [ ] The layout is a boring 2x2 or 3x3 grid with no visual hierarchy
- [ ] There's no hero element — nothing stands out as THE most important thing
- [ ] Colors are generic blue/green/red without connection to the app's domain
- [ ] The dashboard could be for ANY app — nothing ties it to THIS specific data
- [ ] Chart is a generic line/bar chart without thoughtful axis labels or context
- [ ] Font is from the forbidden list or feels like a system default
- [ ] Every section is wrapped in identical cards with no variation
- [ ] The design brief is shorter than ~200 lines

### What Makes It Feel Custom

Think about the app's **domain**. A fitness tracker dashboard should FEEL different from a financial dashboard, which should FEEL different from a project management dashboard. This difference comes from:

1. **Domain-appropriate metaphors** — A fitness app might use progress rings, a finance app might use trend arrows, a cooking app might use warm earthy tones
2. **Data-specific hero** — The hero KPI must reflect what THIS user cares about most (not a generic "Total Records")
3. **Contextual visualizations** — Charts that answer THIS user's specific question, not "here's a chart because dashboards have charts"
4. **Purposeful typography** — Font choice that matches the app's character (see Typography Philosophy)
5. **Intentional color story** — Colors that evoke the domain (warm terracotta for wellness, cool slate for analytics, vibrant coral for creative)

### The "Tell Me About Your App" Test

Your design brief should pass this test: If someone reads ONLY Section 2 (What Makes This Design Distinctive), they should be able to guess what kind of app this dashboard is for. If the description could apply to any dashboard, it's too generic.

---

## Your Output: design_brief.md

Write a detailed design brief in Markdown. You will follow this EXACTLY during implementation.

**Be explicit. Be detailed. Explain WHY. A thorough design brief = a distinctive dashboard.**

### Template Structure:

```markdown
# Design Brief: [App Name]

## 1. App Analysis

### What This App Does
[One paragraph explaining the app's purpose]

### Who Uses This
[Describe the typical user]

### The ONE Thing Users Care About Most
[What do they want to see immediately when opening the app?]

### Primary Actions (IMPORTANT!)
[What do users DO most often? The #1 action becomes the Primary Action Button.
This dashboard is NOT read-only - users must be able to interact!
List actions in priority order, e.g.:
1. Log a workout → Primary Action Button
2. Add a meal
3. Record weight]

---

## 2. What Makes This Design Distinctive

[This section is CRITICAL. Describe what makes this design feel custom-designed for THIS app, NOT a generic template.]

### Visual Identity
[One paragraph explaining what makes this design special and memorable.
NOT generic descriptions like "clean and modern" - be specific!
Example: "The warm cream background with terracotta accents creates a grounded, earthy feel that suits a fitness app focused on sustainable habits."]

### Layout Strategy
[Describe your layout approach:
- How is the hero element emphasized? (size, position, whitespace)
- Is the layout symmetric or asymmetric? Why does this suit the app?
- What creates visual interest? (size variation, typography, spacing)
- How do secondary elements support without competing?]

### Unique Element
[Describe ONE specific design element that sets this apart:
- A distinctive card style
- An unusual color accent placement
- A unique way of displaying data
- A layout break that creates interest
Example: "The progress ring around the hero KPI uses a thick 8px stroke with rounded caps and a subtle glow effect, making the weekly goal feel almost game-like."]

---

## 3. Theme & Colors

### Font
- **Family:** [Font name from Google Fonts]
- **URL:** `https://fonts.googleapis.com/css2?family=...`
- **Why this font:** [Explain why it fits this app]

### Color Palette
All colors as oklch() functions (NOT hsl!):

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `oklch(L C H)` | `--background` |
| Main text | `oklch(L C H)` | `--foreground` |
| Card background | `oklch(L C H)` | `--card` |
| Card text | `oklch(L C H)` | `--card-foreground` |
| Borders | `oklch(L C H)` | `--border` |
| Primary action | `oklch(L C H)` | `--primary` |
| Text on primary | `oklch(L C H)` | `--primary-foreground` |
| Accent highlight | `oklch(L C H)` | `--accent` |
| Muted background | `oklch(L C H)` | `--muted` |
| Muted text | `oklch(L C H)` | `--muted-foreground` |
| Success/positive | `oklch(L C H)` | (component use) |
| Error/negative | `oklch(L C H)` | `--destructive` |

### Why These Colors
[Explain the color choices - what mood/feeling do they create?]

### Background Treatment
[Is the background plain white? A subtle gradient? A light texture?
Describe exactly what makes it interesting, or explain why plain is intentional.]

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### Layout Approach
[Describe how you're creating visual hierarchy on mobile:
- Does the hero dominate the first viewport?
- What creates visual interest? (size variation, typography, etc.)]

### What Users See (Top to Bottom)

**Header:**
[Describe exactly what's in the header - title, actions, etc.]

**Hero Section (The FIRST thing users see):**
[Describe the most important element in detail:
- What is it? (number, chart, status?)
- How big is it? (give relative sizes - e.g., "takes 60% of viewport height")
- Styling that makes it dominant (large font, color, whitespace)
- Why is this the hero? (explain the user need it answers)]

**Section 2: [Name]**
[Describe this section - what it contains, why it's here, how it contrasts with hero]

**Section 3: [Name]**
[Continue for each section]

**Bottom Navigation / Action:**
[What's at the bottom? Fixed action button? Nav tabs? Nothing?]

### Mobile-Specific Adaptations
[Describe how content is reorganized for mobile - stacking, scrolling, etc.
Only hide elements if they're truly impossible to use on a phone.]

### Touch Targets
[Any specific notes about button sizes, tap areas?]

### Interactive Elements (if applicable)
[If any elements should be tappable to reveal more details, note them here.
Only add drill-down where there's actually more information to show.]

---

## 5. Desktop Layout

### Overall Structure
[Describe the layout:
- How many columns? What proportions?
- Where does the eye go first, second, third?
- What creates visual interest in this layout?]

### Section Layout
[Describe what goes where:
- Top area: [what content]
- Main content area: [what content]
- Supporting areas: [what content]
Include proportions if using multi-column layout.]

### What Appears on Hover
[What extra information is revealed when hovering over elements?]

### Clickable/Interactive Areas (if applicable)
[If any elements should open detail views when clicked, note them here.
Only add where it provides additional useful information.]

---

## 6. Components

### Core Interactive Component (REQUIRED — the "Power Feature")

**⚠️ This is the most important part of the dashboard.** It is the interactive, domain-specific component that lets users perform their core workflow directly — NOT a passive display.

Analyze the data model and choose the UI paradigm that fits best (see "Dashboard = Primary Workspace" section). This component is the REASON users open the app.

- **What it is:** [Describe the component — e.g., week planner, progress board, interactive timeline, grouped card view...]
- **Why this paradigm:** [Why is this the best way to interact with THIS data? How does it match the user's mental model?]
- **Data source(s):** [Which app(s) to query]
- **What users see:** [Describe the visual structure — slots, columns, rows, groups, etc.]
- **Create interaction:** [How does the user create a new record? E.g., click empty slot → dialog opens, click "+" in a group, drag to create...]
- **Edit interaction:** [How does the user edit? E.g., click existing entry → edit dialog, inline editing...]
- **Delete interaction:** [How does the user delete? E.g., context menu, swipe, click delete icon → confirmation]
- **Screen space:** [How much of the dashboard does this take up? It should be the dominant element.]
- **Mobile adaptation:** [How does this work on mobile? Simplified view, swipe gestures, etc.]

### Hero KPI
The MOST important metric that users see first.

- **Title:** [Name]
- **Data source:** [Which app to query]
- **Calculation:** [How to calculate: sum, count, latest, etc.]
- **Display:** [How it looks - large number? With icon? Progress ring?]
- **Context shown:** [What comparison? Goal progress? Trend?]
- **Why this is the hero:** [Explain why this matters most to users]

### Secondary KPIs
[For each secondary KPI:]

**[KPI Name]**
- Source: [App]
- Calculation: [How]
- Format: [number/currency/percent]
- Display: [Card? Inline? Size?]

### Chart (if applicable)
- **Type:** [line/bar/area - and WHY this type]
- **Title:** [Chart title]
- **What question it answers:** [Why does the user need this chart?]
- **Data source:** [App]
- **X-axis:** [Field, label]
- **Y-axis:** [Field, label]
- **Mobile simplification:** [How is it simplified for small screens?]

### Lists/Tables (if applicable)
[For each list:]

**[Section Name]**
- Purpose: [Why users need this]
- Source: [App]
- Fields shown: [Which fields]
- Mobile style: [cards/simple list]
- Desktop style: [table/cards]
- Sort: [By what field]
- Limit: [How many items]

### Primary Action Button (REQUIRED!)

**⚠️ Every dashboard MUST have a primary action.** This is NOT a read-only view!

The primary action should be the quickest path to creating a new entry in the core workflow. It complements the Core Interactive Component — if the component already provides inline creation (e.g., clicking an empty slot), the primary action button serves as an always-visible shortcut.

- **Label:** [Action-oriented text, e.g. "Workout starten", "Mahlzeit hinzufügen"]
- **Action:** [add_record | navigate - specify which]
- **Target app:** [Which Living Apps app receives the data]
- **What data:** [What fields will the form contain]
- **Mobile position:** [bottom_fixed (recommended) | header | fab]
- **Desktop position:** [header | sidebar | inline]
- **Why this action:** [Why is this the most important thing users do?]

---

## 7. Visual Details

### Border Radius
[sharp (4px) / rounded (8px) / pill (16px+)]

### Shadows
[none / subtle / elevated - describe the shadow style]

### Spacing
[compact / normal / spacious - how much breathing room?]

### Animations
- **Page load:** [none / fade / stagger]
- **Hover effects:** [What happens on hover?]
- **Tap feedback:** [What happens on tap?]

---

## 8. CSS Variables (Copy Exactly!)

Copy these values exactly into `index.css` using **Edit** (NEVER Write — the file is pre-generated with correct import order).

Use `oklch()` format and `@theme inline` syntax:

```css
:root {
  --background: oklch(...);
  --foreground: oklch(...);
  --card: oklch(...);
  --card-foreground: oklch(...);
  --popover: oklch(...);
  --popover-foreground: oklch(...);
  --primary: oklch(...);
  --primary-foreground: oklch(...);
  --secondary: oklch(...);
  --secondary-foreground: oklch(...);
  --muted: oklch(...);
  --muted-foreground: oklch(...);
  --accent: oklch(...);
  --accent-foreground: oklch(...);
  --destructive: oklch(...);
  --border: oklch(...);
  --input: oklch(...);
  --ring: oklch(...);

  /* Custom tokens for gradients, shadows, transitions */
  --gradient-primary: linear-gradient(135deg, oklch(...), oklch(...));
  --gradient-subtle: linear-gradient(160deg, oklch(...), oklch(...));
  --shadow-elegant: 0 10px 30px -10px oklch(... / 0.3);
}
```

---

## 9. Implementation Checklist

Verify during implementation:
- [ ] Font loaded from URL above
- [ ] All CSS variables copied exactly
- [ ] Mobile layout matches Section 4
- [ ] Desktop layout matches Section 5
- [ ] Hero element is prominent as described
- [ ] Colors create the mood described in Section 2
- [ ] Dashboard feels custom-designed for THIS app, not a generic template
```

---

## ⚠️ How Colors Are Applied (Critical!)

Your colors are mapped to CSS variables. The implementation agent uses them directly.

**Color Mapping:**

| Your design_brief color | CSS Variable |
|-------------------------|--------------|
| `background` | `--background` |
| `foreground` | `--foreground` |
| `card` | `--card` |
| `card_foreground` | `--card-foreground` |
| `primary` | `--primary` |
| `primary_foreground` | `--primary-foreground` |
| `accent` | `--accent` |
| `muted` | `--muted` |
| `muted_foreground` | `--muted-foreground` |
| `border` | `--border` |
| `negative` | `--destructive` |

**Light Theme Contrast Rules (oklch):**
- `foreground` L < 0.3 (dark, readable on light backgrounds)
- `card` L > 0.95 (white or slightly off-white)
- `card_foreground` L < 0.3 (dark)
- `primary` needs sufficient contrast for buttons (L between 0.4-0.65 typically)

**All colors MUST be complete oklch() functions:**
```
--background: oklch(0.98 0.005 80);   // ✅ Complete function
--background: 0.98 0.005 80;          // ❌ Will break!
```

---

## Quality Checklist

Before finalizing design_brief.md:

### Distinctiveness
- [ ] Would a designer recognize this as intentionally designed (not default)?
- [ ] Is there at least ONE memorable visual detail?
- [ ] Is the font choice appropriate and NOT from forbidden list?
- [ ] Does the color accent feel considered, not generic?

### Layout & UX (CRITICAL FOR AVOIDING AI SLOP!)
- [ ] Is there ONE clear hero element that stands out?
- [ ] Is there visual interest? (size variation, typography hierarchy, spacing variation)
- [ ] NOT everything the same size - some variation exists
- [ ] Is mobile designed FOR mobile (not just smaller)?
- [ ] Does desktop use horizontal space meaningfully?
- [ ] Would this get featured in the App Store?

### Interactivity & Core Workflow
- [ ] Is there a Core Interactive Component that enables the app's primary workflow?
- [ ] Does the Core Interactive Component support create, edit, and delete directly?
- [ ] Is the UI paradigm appropriate for the data (not just a generic list)?
- [ ] Is the primary action clearly defined?
- [ ] Can users do 90% of their work without leaving the dashboard?

### Information
- [ ] Is the visual hierarchy clear?
- [ ] Are all relevant KPIs included?

### Clarity
- [ ] Is every section detailed enough that someone else could implement it?
- [ ] Are there WHY explanations for major decisions?
- [ ] Are the CSS variables complete and ready to copy?
- [ ] Is the Layout Strategy section filled out with specific proportions?

### Technical
- [ ] Are all colors complete hsl() functions?
- [ ] Is contrast sufficient for readability?
- [ ] Are all required colors defined?

---

## Remember

1. **You ARE the implementer** — you will follow your own words, so be precise
2. **Explain WHY** — reasoning prevents drift during implementation
3. **Be specific** — "Large number" is vague, "48px font-weight-700 oklch(0.25 0.01 260)" is actionable
4. **Minimal ≠ Generic** — minimal can be highly distinctive
5. **Layout is everything** — 80% of design time on DashboardOverview layout
6. **Visual interest is required** — vary sizes, weights, formats; not everything identical
7. **Mobile ≠ Small Desktop** — separate experiences, not squeezed
8. **One memorable detail** — what makes someone say "this was designed for MY app"?
9. **App Store quality** — would Apple feature this?
10. **CRUD is done** — spend ZERO time designing pages, dialogs, or navigation
11. **A longer brief = a better dashboard** — don't rush the design phase; thoroughness here saves implementation time
