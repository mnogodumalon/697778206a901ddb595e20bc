# Design Brief: Gewohnheitstracker

## 1. App Analysis

### What This App Does
Gewohnheitstracker is a daily habit tracking app that allows users to manage personal habits (Gewohnheiten), perform daily check-ins to mark which habits they completed, and log individual daily entries per habit with time invested and completion status. The three connected entities form a clear workflow: define habits once, then log daily progress via check-ins or individual entries.

### Who Uses This
German-speaking individuals focused on personal development and self-discipline — people who want to build consistent routines, track their progress, and see momentum over time. They open the app daily, often in the morning or evening, to log their achievements and reflect on their consistency.

### The ONE Thing Users Care About Most
**Today's habit completion status** — which habits have been done today, which are still pending. This is the first thing a user wants to see when opening the app. Followed closely by streak/consistency trends across the past days.

### Primary Actions (IMPORTANT!)
1. **"Eintrag hinzufügen"** — Log that a habit was completed today (create TaeglicheEintraege record) → Primary Action
2. **Check-In durchführen** — Perform a daily check-in (which habits done + total time) → Secondary
3. **View habits list** — See which habits exist and their target times → Tertiary

---

## 2. What Makes This Design Distinctive

### Visual Identity
Warm sage-green accents on a creamy off-white background evoke the calm, earthy feeling of a wellness journal — sustainable, grounded, and encouraging rather than aggressive. Unlike fitness apps that use electric blue or neon green, this app uses a muted botanical palette: soft sage (`oklch(0.62 0.09 155)`) against warm cream (`oklch(0.98 0.008 80)`). The combination feels like a paper planner brought to life digitally. Typography uses **Nunito Sans** — rounded, friendly, highly legible — reinforcing the approachable, habit-building (not punishing) tone. Progress is shown through **circular progress rings** per habit, giving users an at-a-glance feeling of "how am I doing today" that feels game-like and rewarding.

### Layout Strategy
**Asymmetric layout on desktop:** Left column (60%) is the primary workspace — the interactive habit checklist for today. Right column (40%) contains KPI summary cards and a 7-day completion bar chart. This asymmetry makes clear: doing is primary, reviewing is secondary. The hero is the daily habit board, not a number. On mobile, the checklist takes the full viewport — KPIs are compact horizontal pills that scroll.

**Visual interest** comes from: the circular progress rings per habit (not uniform cards), a prominent today's date header that acts as a greeting, and a colored completion ratio bar (green fill animates on load).

### Unique Element
Each habit in the daily checklist is shown as a **rounded panel with a circular progress ring** on the right showing percentage of target time reached today. When a habit is marked done, the ring fills with sage-green and the panel gets a subtle left border highlight. This visual feedback is the "game-like" reward that makes the app feel alive. Habits not yet done show an unfilled ring in muted gray.

---

## 3. Theme & Colors

### Font
- **Family:** Nunito Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700;800&display=swap`
- **Why this font:** Rounded letterforms create warmth and approachability. The range from 300 (light labels) to 800 (hero numbers) creates strong hierarchy. Perfectly suited for a wellness/habit app where encouragement matters.

### Color Palette
All colors as oklch() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `oklch(0.98 0.008 80)` | `--background` |
| Main text | `oklch(0.22 0.01 260)` | `--foreground` |
| Card background | `oklch(1.0 0.0 0)` | `--card` |
| Card text | `oklch(0.22 0.01 260)` | `--card-foreground` |
| Borders | `oklch(0.90 0.008 80)` | `--border` |
| Primary action (sage green) | `oklch(0.55 0.10 155)` | `--primary` |
| Text on primary | `oklch(0.99 0.0 0)` | `--primary-foreground` |
| Accent highlight | `oklch(0.94 0.04 155)` | `--accent` |
| Muted background | `oklch(0.96 0.006 80)` | `--muted` |
| Muted text | `oklch(0.52 0.01 260)` | `--muted-foreground` |
| Success/positive | `oklch(0.62 0.12 155)` | (component use) |
| Error/negative | `oklch(0.55 0.18 25)` | `--destructive` |

### Why These Colors
Warm cream background (`oklch(0.98 0.008 80)`) with slight yellow undertone feels like quality paper — calming and familiar. The sage-green primary (`oklch(0.55 0.10 155)`) is botanical, not techno-green — it signals growth, consistency, nature. Together they evoke a premium wellness journal or a Moleskine habit tracker. The contrast ratios are strong enough for WCAG AA compliance.

### Background Treatment
Warm off-white with slight cream undertone — NOT pure white. The cream warmth prevents visual fatigue during daily use. No gradients or textures on the main background — the whitespace itself is intentional.

### Sidebar Colors
```css
--sidebar: oklch(0.18 0.02 155);
--sidebar-foreground: oklch(0.95 0.01 80);
--sidebar-border: oklch(0.25 0.02 155);
--sidebar-accent: oklch(0.28 0.03 155);
--sidebar-accent-foreground: oklch(0.95 0.01 80);
--sidebar-primary: oklch(0.55 0.10 155);
--sidebar-primary-foreground: oklch(0.99 0.0 0);
```
Dark forest-green sidebar creates a strong visual anchor — the sidebar feels like a hardcover journal spine.

---

## 4. Mobile Layout (Phone)

### Layout Approach
Single-column vertical flow. The greeting + today's date is the first fold anchor. Habit checklist takes center stage. KPI pills scroll horizontally beneath the header. No bottom navigation — the primary action FAB floats at bottom-right.

### What Users See (Top to Bottom)

**Header:**
Greeting text ("Guten Morgen" / "Guten Abend" depending on time) + today's date in large friendly format: "Samstag, 21. Februar". Below: 3 KPI pills in a horizontal scroll row (Gewohnheiten aktiv, Heute erledigt, Streak).

**Hero Section (The FIRST thing users see):**
The habit checklist for today. Each habit = a white rounded card (border-radius 16px) with:
- Habit name in 16px font-weight-700
- Beschreibung in 13px muted text (1 line truncated)
- Zielzeit badge (e.g. "30 Min Ziel")
- A circular SVG progress ring (44px diameter) showing % of target reached today
- A checkbox-style toggle button (tap to mark done / undo)
- When done: left border turns sage-green 4px, ring fills green
Cards have 12px gap, subtle box shadow.
This section takes ~70% of viewport height via scrollable list.

**Section 2: 7-Tage-Verlauf**
Compact bar chart (height: 140px on mobile) showing past 7 days. Each bar = number of habits completed that day. X-axis shows Mo/Di/Mi etc. Y-axis suppressed. Bars colored: today = sage-green, past = muted gray-green.

**Section 3: Schnell-Eintrag**
A card with "Eintrag hinzufügen" button and recent entries list (last 3). Compact style.

**Bottom Navigation / Action:**
Floating Action Button (FAB) bottom-right: `+` with label "Eintrag" — fixed position. Opens inline form/dialog to create TaeglicheEintraege.

### Mobile-Specific Adaptations
- KPI pills: `overflow-x-auto` horizontal scroll, no wrapping
- Circular progress rings shrink to 40px on mobile
- Chart bars reduced height: 120px container
- No sidebar (handled by Layout.tsx)

### Touch Targets
All habit cards minimum 56px tall for comfortable tap. FAB is 56px × 56px. Toggle checkbox area is 44px × 44px.

### Interactive Elements
Tapping a habit card row (not the toggle button) shows a subtle highlight and expands to show full Beschreibung. Toggle button marks/unmarks done.

---

## 5. Desktop Layout

### Overall Structure
Two-column layout: **Left 60% (primary workspace)** | **Right 40% (analytics + quick-add)**

Left column: greeting header → today's habit board (the core interactive component)
Right column: KPI cards (stacked) → 7-day bar chart → recent entries feed

Eye movement: Left column first (action) → Right column (reflection). Classic F-pattern.

Visual interest: The left column is airy with large habit cards; the right column is denser with compact KPI cards and a chart. This density contrast creates visual rhythm.

### Section Layout

**Top area (full width above columns):**
Greeting h1 "Guten Morgen, [today's date]" in 28px Nunito Sans 700. Muted subtitle showing weekday + date. This anchors the user in time.

**Left Column (60%) — Primary Workspace:**
- Section title: "Heute" with a badge showing "N / M erledigt"
- Habit cards list (scrollable if many habits)
  - Each card: white background, 16px border-radius, subtle shadow
  - Left 4px accent border when completed (sage-green)
  - Content: habit name (18px 700), beschreibung (14px muted), zielzeit badge
  - Right: circular progress ring (56px) + toggle button
  - Hover: slight shadow lift (`shadow-md`), cursor pointer on toggle

**Right Column (40%) — Analytics:**
- 3 KPI cards: "Aktive Gewohnheiten", "Heute erledigt", "Gesamte Check-ins"
- Styled differently from habit cards: lighter muted-background, no shadow, compact
- 7-Tage Bar Chart card (recharts BarChart, 180px height)
- "Letzte Einträge" list card: last 5 TaeglicheEintraege with date + habit name + status badge

**Top of right column:** "Eintrag hinzufügen" button (full width of right column, primary color)

### What Appears on Hover
- Habit cards: subtle `shadow-md` elevation + toggle button becomes slightly larger
- Entries in recent list: background highlight (`hover:bg-muted`)
- KPI cards: no hover (they're informational only)

### Clickable/Interactive Areas
- Toggle button on habit card: marks habit done for today (creates TaeglicheEintraege)
- "Eintrag hinzufügen" button: opens dialog to log an entry with habit selector + time + date
- "Neuer Check-in" (link in right column): opens TaeglicherCheckIn dialog

---

## 6. Components

### Core Interactive Component — Daily Habit Board

**What it is:** An interactive daily habit checklist where each habit appears as a card with a circular progress ring. Users can toggle habits as done directly on the dashboard.

**Why this paradigm:** Habit tracking is fundamentally a daily checklist task — the natural mental model is "which items have I checked off today?" A kanban or table would be wrong here. The checklist-with-progress paradigm mirrors paper habit trackers and gives the satisfying "check off" interaction that makes habit apps engaging. The progress ring adds quantitative context (time invested vs target).

**Data source(s):** `GewohnheitenVerwaltung` (habit definitions) + `TaeglicheEintraege` (today's completion records)

**What users see:**
- A card per habit from GewohnheitenVerwaltung
- Each card shows: name, beschreibung, zielzeit_minuten as goal
- A circular SVG ring: filled % = (investierte_zeit_minuten / zielzeit_minuten * 100), capped at 100%
- If a TaeglicheEintraege record exists for this habit today with `ausgefuehrt: true`, the card shows as "done"
- "Done" state: sage-green left border, green ring, checkmark icon, muted habit name

**Create interaction:**
- Click the toggle/checkbox on an undone habit → creates a TaeglicheEintraege entry with `{datum: today, gewohnheit: habitUrl, ausgefuehrt: true, investierte_zeit_minuten: habit.zielzeit_minuten}` (pre-fills with target time)
- "Eintrag hinzufügen" button → opens dialog with all fields (habit select, date, done checkbox, time)

**Edit interaction:**
- Click on an already-done habit's ring/card → opens edit dialog (change time invested, toggle ausgefuehrt)

**Delete interaction:**
- In the edit dialog: a "Löschen" button with red destructive styling → removes the entry (habit reverts to undone)

**Screen space:** Takes the entire left 60% on desktop, full width on mobile. Dominant element.

**Mobile adaptation:** Same card layout, single column. Toggle button is the full right edge of the card for easy thumb reach.

---

### Hero KPI
- **Title:** Heutige Fortschritt
- **Data source:** TaeglicheEintraege (filtered to today)
- **Calculation:** Count of today's entries with `ausgefuehrt === true` / total GewohnheitenVerwaltung count
- **Display:** "N / M" in large 36px 800-weight text with label "Heute erledigt". E.g. "3 / 5"
- **Context shown:** Progress bar below showing percentage filled in sage-green
- **Why this is the hero:** This one number answers "how am I doing today?" instantly

### Secondary KPIs

**Aktive Gewohnheiten**
- Source: GewohnheitenVerwaltung
- Calculation: total count
- Format: integer
- Display: Compact stat card in right column

**Gesamte Check-ins**
- Source: TaeglicherCheckIn
- Calculation: total count of all check-in records
- Format: integer
- Display: Compact stat card in right column

**Gesamte Einträge**
- Source: TaeglicheEintraege
- Calculation: total count
- Format: integer
- Display: Compact stat card in right column

### Chart
- **Type:** BarChart — shows discrete daily totals, perfect for habit tracking (how many habits done each day)
- **Title:** "Letzte 7 Tage"
- **What question it answers:** "Am I being consistent?" — shows daily completion counts over the past week
- **Data source:** TaeglicheEintraege grouped by `datum`, counting `ausgefuehrt === true`
- **X-axis:** Date label (Mo, Di, Mi... format)
- **Y-axis:** Count of completed habits (hidden on mobile, shown on desktop)
- **Mobile simplification:** Height reduced to 120px, no Y-axis, no tooltip on small screens

### Lists/Tables

**Letzte Einträge**
- Purpose: Recent activity feed — confirms entries were saved, quick review
- Source: TaeglicheEintraege
- Fields shown: datum, habit name (resolved from GewohnheitenVerwaltung lookup), ausgefuehrt badge, investierte_zeit_minuten
- Mobile style: compact cards with date + habit name + green/gray dot
- Desktop style: clean list in right column, 5 items max
- Sort: By createdat descending
- Limit: 5 items

### Primary Action Button (REQUIRED!)

- **Label:** "Eintrag hinzufügen"
- **Action:** Opens inline dialog to create TaeglicheEintraege record
- **Target app:** TaeglicheEintraege
- **What data:** datum (date picker, default today), gewohnheit (select from GewohnheitenVerwaltung), ausgefuehrt (checkbox, default true), investierte_zeit_minuten (number input)
- **Mobile position:** FAB bottom-right (fixed, `bottom-6 right-6`)
- **Desktop position:** Top of right column (full-width button)
- **Why this action:** Logging a habit entry is the single most frequent daily action — it should be 1-tap accessible at all times

---

## 7. Visual Details

### Border Radius
Rounded — 12px for cards, 8px for buttons, 20px for pills/badges. The rounded corners reinforce the friendly, approachable tone.

### Shadows
Subtle — cards: `shadow-sm` by default, `shadow-md` on hover. No harsh shadows. The lift effect on hover is the key interactive feedback.

### Spacing
Spacious — 24px gap between columns, 16px gap between cards, 20px card padding. The whitespace creates a calm, uncluttered feeling.

### Animations
- **Page load:** Stagger fade-in: header → habit cards (each card animates in with 50ms delay)
- **Hover effects:** Shadow lift on habit cards + button scale (1.02)
- **Tap feedback:** Brief background flash on toggle
- **Ring fill:** CSS transition on SVG stroke-dashoffset for smooth progress ring fill
- **Done state:** The left border color transition when a habit is marked done (0.3s ease)

---

## 8. CSS Variables (Copy Exactly!)

```css
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,300;6..12,400;6..12,600;6..12,700;6..12,800&display=swap');

:root {
  --background: oklch(0.98 0.008 80);
  --foreground: oklch(0.22 0.01 260);
  --card: oklch(1.0 0.0 0);
  --card-foreground: oklch(0.22 0.01 260);
  --popover: oklch(1.0 0.0 0);
  --popover-foreground: oklch(0.22 0.01 260);
  --primary: oklch(0.55 0.10 155);
  --primary-foreground: oklch(0.99 0.0 0);
  --secondary: oklch(0.94 0.04 155);
  --secondary-foreground: oklch(0.30 0.07 155);
  --muted: oklch(0.96 0.006 80);
  --muted-foreground: oklch(0.52 0.01 260);
  --accent: oklch(0.94 0.04 155);
  --accent-foreground: oklch(0.30 0.07 155);
  --destructive: oklch(0.55 0.18 25);
  --border: oklch(0.90 0.008 80);
  --input: oklch(0.90 0.008 80);
  --ring: oklch(0.55 0.10 155);
  --radius: 0.75rem;

  /* Sidebar — dark forest green */
  --sidebar: oklch(0.20 0.025 155);
  --sidebar-foreground: oklch(0.93 0.01 80);
  --sidebar-border: oklch(0.27 0.025 155);
  --sidebar-accent: oklch(0.27 0.03 155);
  --sidebar-accent-foreground: oklch(0.93 0.01 80);
  --sidebar-primary: oklch(0.55 0.10 155);
  --sidebar-primary-foreground: oklch(0.99 0.0 0);
  --sidebar-ring: oklch(0.55 0.10 155);

  /* Custom tokens */
  --gradient-primary: linear-gradient(135deg, oklch(0.55 0.10 155), oklch(0.62 0.12 155));
  --gradient-subtle: linear-gradient(160deg, oklch(0.98 0.008 80), oklch(0.95 0.015 155));
  --shadow-elegant: 0 4px 20px -4px oklch(0.22 0.01 260 / 0.12);
  --shadow-card: 0 1px 4px oklch(0.22 0.01 260 / 0.08);
  --color-success: oklch(0.62 0.12 155);
  --color-success-bg: oklch(0.94 0.04 155);
}
```

### Font Family Application
In CSS after the variables:
```css
body {
  font-family: 'Nunito Sans', sans-serif;
}
```

---

## 9. Implementation Checklist

Verify during implementation:
- [x] Font loaded from URL above (Nunito Sans)
- [x] All CSS variables copied exactly
- [x] Mobile layout matches Section 4
- [x] Desktop layout matches Section 5
- [x] Hero element (today's progress N/M) is prominent
- [x] Colors create warm botanical mood described in Section 2
- [x] Dashboard feels custom-designed for habit tracking (NOT generic)
- [x] Daily habit board is interactive: toggle to mark done, edit dialog, delete
- [x] Primary action FAB on mobile, button on desktop
- [x] 7-day bar chart for consistency view
- [x] Recent entries list with habit name resolved from lookup
