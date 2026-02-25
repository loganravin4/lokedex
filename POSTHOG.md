# PostHog & analytics

## Growth accounting / Lifecycle — "no matching events"

**Why it was empty**  
Lifecycle (Growth accounting) needs an **event or action** that has data in the selected date range. If the insight is set to an action that doesn’t exist or has no events, you see "There are no matching events for this query".

**Fix in PostHog**

1. Open the **Lifecycle** (or Growth accounting) insight.
2. Click **Edit**.
3. Set the main **event / action** to **Pageview** (or `$pageview`).  
   If you don’t see it, create an **Action** that matches the `$pageview` event.
4. Remove any filters (e.g. URL or property filters) that might exclude your traffic.
5. Save. After new traffic is sent, the chart should fill in.

**Code**  
A layout-level component sends one `$pageview` on every page load. Scroll/section/time tracking still run only on pages that use `AnalyticsTracker`.

---

## Implemented in code

- **PostHog init**  
  - `capture_pageview: false` — we send `$pageview` via LayoutPageView.  
  - `disable_session_recording: false` — session replay and click maps enabled.  
  - `person_profiles: 'always'` — better retention/lifecycle for anonymous users.

- **Microsoft Clarity (optional heatmaps)**  
  - Add to `.env`: `PUBLIC_CLARITY_PROJECT_ID=your_project_id`.  
  - Get the ID: [clarity.microsoft.com](https://clarity.microsoft.com) → your project → Settings → Setup.  
  - Clarity gives you heatmaps and session recordings; no extra config in code.

---

## PostHog dashboard runbook

Create these in PostHog so you get funnels, retention, paths, and trends without more code.

### 1. Funnel — Contact form

- **Product Analytics** → **New insight** → **Funnel**.
- **Step 1:** Event = `form_interaction`, Property `form_name` = `contact`, Property `event_type` = `started`.
- **Step 2:** Event = `form_interaction`, Property `form_name` = `contact`, Property `event_type` = `submitted`.
- Save (e.g. name: "Contact form funnel").  
- Shows: how many start the form vs submit.

### 2. Funnel — Home → Projects → CTA (optional)

- **New insight** → **Funnel**.
- **Step 1:** Event = `$pageview`, Property `page_name` = `Home` (or path = `/`).
- **Step 2:** Event = `$pageview`, Property `page_name` = `Projects`.
- **Step 3:** Event = `cta_click` (or `project_interaction`).
- Save.  
- Shows: drop-off from home to projects to engagement.

### 3. Retention

- **New insight** → **Retention**.
- **Starting event:** `$pageview` (or "Pageview").
- **Return event:** `$pageview` (same).
- **Retention type:** "Retaining" (came back).
- **Interval:** Week.
- Save (e.g. "7-day return visits").  
- Shows: % of users who had a pageview and came back in a later week.

### 4. Paths / User paths

- **New insight** → **Paths** (or **User paths**).
- **Start point:** Optional (e.g. `$pageview` where `page_name` = `Home`).
- **Path type:** "Paths between events" or "Paths through pages".
- **Events:** Include `$pageview`, `navigation_click`, `cta_click`, `project_interaction`, `form_interaction`.
- Save.  
- Shows: common sequences (e.g. Home → Projects → Contact or external link).

### 5. Trends dashboard

Create a **Dashboard** and add these charts:

| Chart | Type | Event | Breakdown (optional) |
|-------|------|--------|----------------------|
| Pageviews over time | Trends | `$pageview` | — |
| Pageviews by page | Trends | `$pageview` | Property: `page_name` |
| CTA clicks | Trends | `cta_click` | Property: `button_name` or `location` |
| Project engagement | Trends | `project_interaction` | Property: `project_name` or `action` |
| Form interactions | Trends | `form_interaction` | Property: `event_type` or `form_name` |
| Scroll depth | Trends | `scroll_depth` | Property: `depth_percentage` |

- **New dashboard** → Add insight → **Trends**.
- Pick the event and breakdown as above.
- Repeat for each row and save the dashboard.

### 6. Session recordings (click map)

- **Project settings** → **Session replay** (or **Recordings**) — ensure it’s **enabled**.
- In PostHog: **Session recordings** (or **Replay**) to watch sessions and use the built-in **click map** where available.

---

## Quick checklist

- [ ] Lifecycle: event = **Pageview** / `$pageview`, no blocking filters.
- [ ] Funnel: form started → form submitted.
- [ ] (Optional) Funnel: Home → Projects → CTA.
- [ ] Retention: 7-day return, event = Pageview.
- [ ] Paths: include pageview + key events.
- [ ] Trends dashboard: pageviews, CTAs, project clicks, form events, scroll depth.
- [ ] Session replay enabled in PostHog (and optional Clarity via `PUBLIC_CLARITY_PROJECT_ID`).
