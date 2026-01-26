# Design Brief: Gewohnheitstracker

## 1. App Analysis

### What This App Does
This is a habit tracking application ("Gewohnheitstracker") that helps users define habits, track daily completion, and monitor time invested. Users manage their habits through three interconnected apps: habit definitions with target times, daily entries tracking execution and time spent, and daily check-ins for quick habit confirmation.

### Who Uses This
German-speaking individuals who want to build positive routines. They're likely self-improvement focused, wanting clear visibility into their consistency and progress. They need motivation through visible streaks and completion rates, not just raw data.

### The ONE Thing Users Care About Most
**Today's progress** - Did I complete my habits today? How close am I to my daily goals? This immediate feedback loop is crucial for habit building psychology.

### Primary Actions (IMPORTANT!)
1. **Eintrag hinzufügen** (Add Entry) → Primary Action Button - Users need to quickly log that they've completed a habit and how much time they spent
2. View habit performance over time
3. Add new habits to track

---

## 2. What Makes This Design Distinctive

### Visual Identity
A **calm, focused aesthetic** with warm, earthy tones that evoke growth and rootedness. The design uses a soft sage green accent that feels organic and encouraging rather than aggressive or gamified. The overall mood is serene productivity - the app should feel like a quiet companion, not a demanding taskmaster.

### Layout Strategy
- **Asymmetric hero-first layout**: The hero (today's completion rate) dominates the visual hierarchy with a large circular progress indicator
- **Size variation creates interest**: The hero is visually 3x larger than secondary KPIs
- **Grouped secondary metrics**: Time spent and streak information sit together as supporting context
- **Chart spans full width below**: Creates breathing room and shows progress over time
- **Recent activity list**: Grounds abstract metrics with concrete entries

### Unique Element
The **circular progress ring** for today's completion rate uses a thick 12px stroke with rounded caps and a subtle inner shadow, creating depth. The ring fills with the sage green accent color as habits are completed, with a gentle pulse animation when at 100%. Inside the ring, the percentage is displayed in an oversized, light-weight font (48px, weight 300).

---

## 3. Theme & Colors

### Font
- **Family:** Plus Jakarta Sans
- **URL:** `https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap`
- **Why this font:** Geometric yet warm, with excellent readability at small sizes and beautiful thin weights for large display numbers. Professional but approachable - perfect for a personal productivity tool.

### Color Palette
All colors as complete hsl() functions:

| Purpose | Color | CSS Variable |
|---------|-------|--------------|
| Page background | `hsl(45 30% 98%)` | `--background` |
| Main text | `hsl(220 20% 20%)` | `--foreground` |
| Card background | `hsl(0 0% 100%)` | `--card` |
| Card text | `hsl(220 20% 20%)` | `--card-foreground` |
| Borders | `hsl(45 20% 90%)` | `--border` |
| Primary action | `hsl(152 35% 45%)` | `--primary` |
| Text on primary | `hsl(0 0% 100%)` | `--primary-foreground` |
| Accent highlight | `hsl(152 30% 92%)` | `--accent` |
| Muted background | `hsl(45 20% 96%)` | `--muted` |
| Muted text | `hsl(220 10% 50%)` | `--muted-foreground` |
| Success/positive | `hsl(152 50% 40%)` | (component use) |
| Error/negative | `hsl(0 65% 55%)` | `--destructive` |

### Why These Colors
The warm off-white background (`hsl(45 30% 98%)`) creates a paper-like, calm canvas. The sage green primary (`hsl(152 35% 45%)`) evokes growth, nature, and positive progress without the aggressive energy of bright green. The dark blue-gray text (`hsl(220 20% 20%)`) is softer than pure black, reducing visual harshness. Together, they create a grounded, encouraging atmosphere.

### Background Treatment
Soft warm off-white (`hsl(45 30% 98%)`) - a cream undertone that feels inviting like a journal page, not clinical like pure white.

---

## 4. Mobile Layout (Phone)

Design mobile as a COMPLETELY SEPARATE experience, not squeezed desktop.

### Layout Approach
The hero dominates the first viewport with the circular progress ring. Visual hierarchy is created through extreme size contrast - the progress ring takes center stage while supporting stats are compact inline elements below it.

### What Users See (Top to Bottom)

**Header:**
- Left: App title "Gewohnheitstracker" (18px, weight 600)
- Right: Settings icon (ghost button)
- Clean, minimal, 56px height with 16px horizontal padding

**Hero Section (The FIRST thing users see):**
- **Circular progress ring** showing today's habit completion percentage
- Ring takes up ~200px diameter, centered
- Inside ring: Large percentage number (48px, weight 300) with label "Heute erledigt" (14px, muted)
- Below ring: Current date displayed as "Mo, 26. Januar" (16px, weight 500)
- **Why this is the hero:** Users open the app to see their progress TODAY. This answers their immediate question and provides motivation.
- Generous padding (32px top/bottom) to give the hero breathing room

**Section 2: Quick Stats Row**
- Horizontal row of 2 compact stat badges (not cards)
- Left badge: Time invested today "45 Min heute" with clock icon
- Right badge: Current streak "7 Tage Streak" with flame icon
- Badges use accent background with muted text
- Row is scrollable horizontally if needed, but designed to fit

**Section 3: Weekly Progress Chart**
- Card with title "Diese Woche" (16px, weight 600)
- Simple bar chart showing last 7 days
- X-axis: Day abbreviations (Mo, Di, Mi, Do, Fr, Sa, So)
- Y-axis: Hidden on mobile, bars represent completion percentage
- Bars use primary color, rounded tops (4px radius)
- Completed days (100%) have subtle glow
- Chart height: 140px
- 16px padding inside card

**Section 4: Gewohnheiten Liste**
- Section title "Deine Gewohnheiten" (16px, weight 600)
- List of habit cards, each showing:
  - Habit name (16px, weight 500)
  - Target time in muted text "Ziel: 30 Min/Tag"
  - Checkbox on right side showing today's completion status
  - Progress bar below showing weekly completion rate
- Cards are compact (72px height) with 8px gap between
- Maximum 5 habits shown, scrollable

**Bottom Navigation / Action:**
- Fixed bottom button bar with primary action
- **"+ Eintrag hinzufügen"** button (full width minus padding)
- Button uses primary color, 48px height, 12px border radius
- 16px padding from edges, 8px from bottom (safe area aware)

### Mobile-Specific Adaptations
- Chart simplified to bar chart (no line chart on mobile)
- Stats shown as compact inline badges, not cards
- Habit list shows progress bars instead of detailed numbers
- Primary action fixed to bottom for thumb reach

### Touch Targets
- All interactive elements minimum 44px touch target
- Checkbox hitbox extends to full habit card height
- Bottom action button has generous padding

### Interactive Elements
- Tapping a habit card opens a bottom sheet with:
  - Detailed stats for that habit
  - Quick "Mark as done" toggle
  - Time input slider
  - History for this specific habit

---

## 5. Desktop Layout

### Overall Structure
Three-column layout with the hero in the left column, chart in the center spanning most width, and recent activity on the right. The eye flows: Hero (left) → Stats bar (below hero) → Chart (center) → Activity (right).

**Proportions:** 280px left sidebar | flex-1 center content | 320px right sidebar

### Section Layout

**Header (full width, 72px height):**
- Left: App title "Gewohnheitstracker" (24px, weight 600)
- Right: Primary action button "+ Eintrag hinzufügen" and settings icon
- 32px horizontal padding

**Left Column (280px, sticky top):**
- Hero circular progress ring (180px diameter)
- "Heute erledigt" label and percentage
- Current date below
- Gap of 24px
- Quick stats stacked vertically:
  - Time card: "Zeit heute" with large number "45 Min"
  - Streak card: "Aktuelle Serie" with "7 Tage"
- Both stat cards use card background with subtle shadow

**Center Column (flex-1):**
- Chart card spanning full width
- Title "Wochenübersicht" with tab options (Diese Woche | Dieser Monat)
- Area chart showing daily completion rates
- X-axis: Full day names
- Y-axis: 0-100%
- Tooltip on hover showing exact percentage and completed habits
- 24px padding inside card, 16px gap from header

**Right Column (320px):**
- Section title "Letzte Einträge" (18px, weight 600)
- List of recent entries (timestamp + habit name + time spent)
- Each entry shows:
  - Time ago ("Vor 2 Stunden")
  - Habit name (truncated if long)
  - Duration badge ("30 Min")
  - Checkmark if completed
- Subtle separator between entries
- "Alle anzeigen" link at bottom

**Below fold (full width):**
- "Deine Gewohnheiten" section
- Grid of habit cards (3 columns)
- Each card shows:
  - Habit name
  - Description (truncated)
  - Target time
  - Weekly completion percentage as progress ring
  - This week's daily dots (7 dots, filled = completed)

### What Appears on Hover
- Habit cards: Subtle lift (translateY -2px) and shadow increase
- Chart bars/area: Tooltip with exact values
- Recent entries: Background highlight (accent color)
- Stats cards: No hover effect (they're informational)

### Clickable/Interactive Areas
- Habit cards → Open detail modal with full statistics
- Recent entries → Navigate to that day's entries
- Chart data points → Show detailed breakdown for that day

---

## 6. Components

### Hero KPI
The MOST important metric that users see first.

- **Title:** Heute erledigt
- **Data source:** TaeglicheEintraege (filtered to today's date)
- **Calculation:** Count entries where `ausgefuehrt === true` for today / total habits count × 100
- **Display:** Large circular progress ring with percentage inside. Ring uses primary color with 12px stroke width, rounded caps. Inside shows percentage (48px, weight 300) and label (14px, muted)
- **Context shown:** Current date displayed below the ring
- **Why this is the hero:** Immediate feedback on today's progress drives habit consistency. Users need to see "Am I doing well today?" at a glance.

### Secondary KPIs

**Zeit heute (Time Today)**
- Source: TaeglicheEintraege (filtered to today)
- Calculation: Sum of `investierte_zeit_minuten` for today's entries
- Format: Number + "Min" suffix
- Display: Compact stat card with clock icon, number in 24px weight 600

**Aktuelle Serie (Current Streak)**
- Source: TaeglicheEintraege
- Calculation: Count consecutive days (going backwards from today) where at least one entry has `ausgefuehrt === true`
- Format: Number + "Tage" suffix
- Display: Compact stat card with flame icon, number in 24px weight 600

### Chart
- **Type:** Bar chart on mobile, Area chart on desktop - bars are clearer at small sizes, area shows flow better at large sizes
- **Title:** Diese Woche / Wochenübersicht
- **What question it answers:** "Am I being consistent this week?" - shows pattern of completion
- **Data source:** TaeglicheEintraege (last 7 days)
- **X-axis:** Day of week (Mo-So on mobile, full names on desktop)
- **Y-axis:** Completion percentage (0-100%)
- **Data calculation:** For each day, count `ausgefuehrt === true` entries / total habits × 100
- **Mobile simplification:** Bar chart with hidden Y-axis, compact labels, 140px height
- **Colors:** Primary color for fill, lighter primary for area gradient

### Lists/Tables

**Deine Gewohnheiten (Your Habits)**
- Purpose: Show all tracked habits with their current status
- Source: GewohnheitenVerwaltung (all habits) + TaeglicheEintraege (for completion status)
- Fields shown: habit name, target time, today's completion checkbox, weekly progress
- Mobile style: Vertical list of compact cards with progress bar
- Desktop style: Grid of cards (3 columns) with progress ring
- Sort: Alphabetical by habit name
- Limit: Show all habits

**Letzte Einträge (Recent Entries) - Desktop only**
- Purpose: Quick view of recent activity for accountability
- Source: TaeglicheEintraege (most recent)
- Fields shown: timestamp (relative), habit name (via lookup), time spent, completion status
- Desktop style: Simple list with subtle separators
- Sort: By creation date, descending
- Limit: 8 entries with "show all" link

### Primary Action Button (REQUIRED!)

- **Label:** "+ Eintrag hinzufügen"
- **Action:** add_record
- **Target app:** TaeglicheEintraege (app_id: 6977780f2a7f74f1d8d9089e)
- **What data:**
  - datum: Today's date (auto-filled as YYYY-MM-DD)
  - gewohnheit: Dropdown select from GewohnheitenVerwaltung records
  - ausgefuehrt: Checkbox (default: true)
  - investierte_zeit_minuten: Number input with common presets (15, 30, 45, 60)
- **Mobile position:** bottom_fixed - Fixed button bar at bottom for thumb access
- **Desktop position:** header - In the top right header area for easy access
- **Why this action:** The core loop of habit tracking is logging completions. Making this one-tap accessible encourages consistent tracking.

---

## 7. Visual Details

### Border Radius
Rounded (8px) - Soft but not childish, matches the calm aesthetic

### Shadows
Subtle - Cards use `0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)` for gentle lift. Hover states increase to `0 4px 12px rgba(0,0,0,0.1)`.

### Spacing
Spacious - Generous whitespace creates calm. 24px gaps between major sections, 16px between related elements, 8px between list items.

### Animations
- **Page load:** Stagger fade-in for cards (each card delayed 50ms)
- **Hover effects:** Subtle lift (translateY -2px) with 200ms ease transition
- **Tap feedback:** Scale down to 0.98 on press, spring back on release
- **Progress ring:** Animated fill on load (1s ease-out)

---

## 8. CSS Variables (Copy Exactly!)

The implementer MUST copy these values exactly into `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');

:root {
  --radius: 0.5rem;
  --background: hsl(45 30% 98%);
  --foreground: hsl(220 20% 20%);
  --card: hsl(0 0% 100%);
  --card-foreground: hsl(220 20% 20%);
  --popover: hsl(0 0% 100%);
  --popover-foreground: hsl(220 20% 20%);
  --primary: hsl(152 35% 45%);
  --primary-foreground: hsl(0 0% 100%);
  --secondary: hsl(45 20% 96%);
  --secondary-foreground: hsl(220 20% 20%);
  --muted: hsl(45 20% 96%);
  --muted-foreground: hsl(220 10% 50%);
  --accent: hsl(152 30% 92%);
  --accent-foreground: hsl(220 20% 20%);
  --destructive: hsl(0 65% 55%);
  --border: hsl(45 20% 90%);
  --input: hsl(45 20% 90%);
  --ring: hsl(152 35% 45%);
  --chart-1: hsl(152 35% 45%);
  --chart-2: hsl(152 30% 60%);
  --chart-3: hsl(45 40% 70%);
  --chart-4: hsl(220 20% 60%);
  --chart-5: hsl(0 50% 60%);
}

body {
  font-family: 'Plus Jakarta Sans', sans-serif;
}
```

---

## 9. Implementation Checklist

The implementer should verify:
- [ ] Font loaded from Google Fonts URL above
- [ ] All CSS variables copied exactly (replacing existing :root)
- [ ] Mobile layout matches Section 4 - single column, hero first, fixed bottom button
- [ ] Desktop layout matches Section 5 - three columns with specified widths
- [ ] Hero progress ring is prominent with 12px stroke and percentage inside
- [ ] Colors create warm, calm, encouraging mood
- [ ] Primary action button is bottom-fixed on mobile, in header on desktop
- [ ] Chart uses bar on mobile, area on desktop
- [ ] Habit cards show completion checkbox and progress
- [ ] Recent entries list appears on desktop right sidebar
- [ ] Spacing is generous (24px section gaps)
- [ ] Animations are subtle and smooth
