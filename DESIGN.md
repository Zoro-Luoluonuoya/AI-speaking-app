---
name: AI Speaking Practice
description: Professional AI English speaking practice tool with editorial blue-black aesthetic
colors:
  editorial-navy: "#1e293b"
  editorial-blue: "#2563eb"
  editorial-blue-deep: "#1d4ed8"
  surface-paper: "#f8fafc"
  surface-white: "#ffffff"
  ink-primary: "#0f172a"
  ink-secondary: "#334155"
  ink-muted: "#64748b"
  ink-placeholder: "#94a3b8"
  border-subtle: "#e2e8f0"
  border-muted: "#cbd5e1"
  success-emerald: "#059669"
  warning-amber: "#d97706"
  error-red: "#dc2626"
  error-surface: "#fef2f2"
  error-border: "#fecaca"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.editorial-navy}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  button-primary-hover:
    backgroundColor: "#334155"
  action-primary:
    backgroundColor: "{colors.editorial-blue}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.full}"
    padding: "16px"
  action-primary-hover:
    backgroundColor: "{colors.editorial-blue-deep}"
  chip-active:
    backgroundColor: "{colors.editorial-navy}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  chip-inactive:
    textColor: "{colors.ink-muted}"
    padding: "8px 16px"
  bubble-user:
    backgroundColor: "{colors.editorial-blue}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  bubble-assistant:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
---

# Design System: AI Speaking Practice

## 1. Overview

**Creative North Star: "The Bloomberg Terminal for English Fluency"**

A precision-built interface that treats English speaking practice with the same seriousness Bloomberg brings to financial data. The blue-black color system conveys authority without coldness; whitespace is generous but purposeful, letting each element breathe without wasting the user's attention. Every pixel on screen either helps the user speak, shows them how they performed, or gets them out of the way.

This system rejects the saturated AI SaaS template: no indigo gradients, no frosted glass cards, no hero metrics with gradient accents, no dashboard-style widget grids. It also rejects the Duolingo playbook: no gamification, no playful illustrations, no streak counters. The interface is a tool, not a toy.

**Key Characteristics:**
- Blue-black editorial palette: navy backgrounds for primary actions, electric blue for interactive elements, cool-toned neutrals everywhere else
- Generous whitespace as a design device, not emptiness
- Typography does the hierarchy work: weight and size contrast, never color for body text emphasis
- Minimal decorative elements; function dominates form

## 2. Colors: The Editorial Blue-Black Palette

A cool-toned system anchored by slate-navy (#0f172a family) and electric blue (#2563eb). The palette avoids warm neutrals entirely: no cream, no sand, no amber-tinted grays. Every gray in the system has a blue undertone.

### Primary
- **Editorial Blue** (#2563eb): The interactive accent. Used for user message bubbles, the recording button, links, and primary action triggers. Applied sparingly to maintain its signal value.
- **Editorial Navy** (#1e293b): The authority color. Used for active tab state, the "End Practice" button, and primary dark fills. Reads as premium, not corporate.

### Neutral
- **Ink Primary** (#0f172a): Main body text and headings. Near-black with a blue undertone, not pure #000.
- **Ink Secondary** (#334155): Supporting text, descriptions, secondary information.
- **Ink Muted** (#64748b): Placeholder text, inactive labels, timestamps. Must maintain 4.5:1 contrast against surface backgrounds.
- **Surface Paper** (#f8fafc): The main page background. A cool near-white, distinctly not warm.
- **Surface White** (#ffffff): Cards, message bubbles (assistant side), header, footer, modals.
- **Border Subtle** (#e2e8f0): Default borders between surfaces. Light but visible.
- **Border Muted** (#cbd5e1): Stronger borders for focus states or active elements.

### Functional
- **Success Emerald** (#059669): High pronunciation scores (>=80). Score rings, badges, positive indicators.
- **Warning Amber** (#d97706): Mid pronunciation scores (60-79). Use with sufficient contrast; not as a background fill.
- **Error Red** (#dc2626): Low scores (<60), grammar correction highlights, recording state indicator.

### Named Rules
**The No-Warm-Neutral Rule.** Every neutral in the system carries a cool (blue/slate) undertone. No cream, no beige, no warm-gray backgrounds. The "warm, friendly" feeling comes from the copy and interaction design, not from tinted backgrounds.

**The Functional Color Rule.** Emerald, amber, and red are exclusively functional: they communicate score quality and error state. Never use them as decorative accents, brand colors, or section backgrounds.

## 3. Typography

**Display Font:** Inter (with system-ui, -apple-system fallback)
**Body Font:** Inter (same stack)

**Character:** Clean, geometric sans-serif with optical size adjustments. Inter's tabular numerals are essential for the score display: numbers must align vertically across different digit counts.

### Hierarchy
- **Display** (700, 18px / 1.125rem, line-height 1.3): Page title in header. Only one per screen.
- **Title** (600, 14px / 0.875rem, line-height 1.4): Scenario tab labels, modal section headings, score labels inside rings.
- **Body** (400, 14px / 0.875rem, line-height 1.625): Message content, report paragraphs, primary reading text. Max line length 65ch.
- **Label** (500, 12px / 0.75rem, line-height 1.3): Button labels, hint text, "Avg Score" prefix, grammar tip toggle. Used for UI chrome, not content.
- **Caption** (400, 11px / 0.6875rem, line-height 1.3): Mic hint, scenario description, modal footer. Lightest weight, reserved for secondary instructions.

### Named Rules
**The Tabular Nums Rule.** All numeric displays (score values, averages, ring centers) must use `tabular-nums` font feature. Misaligned numbers in a data-driven tool look amateur.

**The Weight-Hierarchy Rule.** Hierarchy comes from weight (400 → 500 → 600 → 700) and size contrast, never from using gray body text for emphasis. If text matters, it gets heavier or bigger, not colored.

## 4. Elevation

A flat-by-default system. Background surfaces are distinguished by color value (paper #f8fafc vs white #ffffff), not by shadow. Shadows appear only as interactive feedback: a state change, not a resting decoration.

### Shadow Vocabulary
- **shadow-sm** (`0 1px 2px 0 rgb(0 0 0 / 0.05)`): Resting state of elevated surfaces (header, footer, assistant message bubbles). Subtle, barely visible.
- **shadow-md** (`0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): Recording button at rest. Signals interactivity.
- **shadow-lg + color glow** (`0 10px 15px -3px rgb(0 0 0 / 0.1)` + `shadow-red-500/40`): Active recording state. The red glow signals "live" without ambiguity.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadow only appears as a response to state (hover, elevation, focus). If a surface has a shadow when nothing is happening to it, the shadow is wrong.

## 5. Components

### Buttons
- **Shape:** Rounded corners (8px / `rounded-lg` for primary actions, full round for the mic button).
- **Primary (End Practice):** Navy (#1e293b) background, white text, 6px 12px padding, text-xs font-medium. Hover lightens to #334155.
- **Language Toggle:** White background, subtle border (#e2e8f0), muted text (#64748b). Hover: gray-100 surface.
- **Mic Button (Action):** Blue (#2563eb) circle, 64px diameter. Hover: blue-700. Recording state: red-500 with scale-110 transform and red glow shadow + pulse animation.

### Chips (Scenario Tabs)
- **Active:** Navy (#1e293b) fill, white text, 8px 16px padding, rounded-lg.
- **Inactive:** No background, muted text (#64748b), hover adds gray-100 fill and darkens text.
- **Disabled (session active, not selected):** 40% opacity, cursor-not-allowed.

### Message Bubbles
- **User (right-aligned):** Blue (#2563eb) fill, white text, rounded-2xl with smaller bottom-right radius (rounded-br-md). Max-width 85%.
- **Assistant (left-aligned):** White fill, dark ink text (#0f172a), thin border (#e2e8f0), rounded-2xl with smaller bottom-left radius (rounded-bl-md), subtle shadow.

### Cards (Summary Modal)
- **Container:** White background, rounded-2xl (16px), shadow-xl, max-width 32rem. Header with title + close button, scrollable body, fixed footer with action.
- **Score Ring:** SVG circle progress, 130px diameter. Stroke width 8px. Colors follow functional palette (emerald/amber/red).
- **Loading State:** Dual-ring spinner (gray track + blue animated ring), pulse text.

### Inputs / Fields
Not currently used in this project. When added, follow: white background, border-subtle (#e2e8f0), rounded-lg, blue glow on focus.

## 6. Do's and Don'ts

### Do:
- **Do** use navy (#1e293b) for primary action fills and active tab states; it conveys authority without the generic blue-button fatigue.
- **Do** keep the recording button as the most visually prominent element on screen: it's the core interaction.
- **Do** use `tabular-nums` on all numeric displays to prevent layout shifts between "8" and "80".
- **Do** use functional colors (emerald/amber/red) exclusively for score communication, never for decoration.
- **Do** maintain 4.5:1 contrast ratio for all body text against its background.
- **Do** use Inter's weight range (400-700) for hierarchy before reaching for color.

### Don't:
- **Don't** use warm-tinted neutrals (cream, sand, beige, ivory). PRODUCT.md specifies "专业+高效+精英"; warm neutrals signal comfort, not precision.
- **Don't** use indigo gradients, frosted glass cards, or SaaS-template hero sections. This is explicitly listed as an anti-reference in PRODUCT.md.
- **Don't** add gamification elements (streaks, coins, badges, animated characters). PRODUCT.md explicitly rejects the Duolingo playbook.
- **Don't** use decorative shadows or elevated resting states. Flat by default; shadow is feedback, not decoration.
- **Don't** use gray body text for emphasis. If content matters, increase weight or size.
- **Don't** nest cards inside cards. One level of container hierarchy maximum.
- **Don't** use gradient text (`background-clip: text` with gradients). Solid colors only.
