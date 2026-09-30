# Decisions

A log of how the data was reshaped, what was left out and why, and the trade-offs taken.

## Data layer (step 1)

### How the data is reshaped

- **Features are resolved once.** `resolveReleaseFeatures` turns a release's feature list into every catalog feature, in catalog order, with an explicit value. A feature missing from a release becomes `{ kind: "not_included" }`, so the UI never has to infer absence. Releases store features in varying order (Growth, Scale and Enterprise list `seats` before `workspaces`), so catalog order is the display order.
- **Free and paid pricing share one shape** (`PeriodPricing`): a monthly and a yearly period, each read independently from the data. Yearly is never derived from monthly.
- **Price per 1,000 credits keeps fractional cents** (Starter: 828.57¢) and is rounded only when formatted, so comparisons between plans are not distorted by rounding.
- **Version split percentages use the largest remainder method** so a plan's versions always add up to exactly 100%.
- **Alerts and sanity warnings are discriminated unions without text.** `lib/derive` produces data; components own the wording. This keeps derive pure and testable.

### Rules chosen

- **Diff semantics.** A feature going from unavailable (absent, or a boolean set to `false`) to available is `added`; the reverse is `removed`; a change of value while available is `changed`. A feature that stays unavailable is not a change.
- **Customer impact.** A single function, `compareFeatureValues`, decides whether a change is better, worse or neutral for the customer. The version diff and the "feature worse than on a cheaper plan" sanity check both use it:
  - credit features: fewer credits per unit is better;
  - capacity: more included units is better, `unlimited` beats any limit, a `blocked` overage is worse than a `billed` one, and a cheaper billed overage is better;
  - gaining a feature is better, losing it is worse.
  - **Trade-off:** when included capacity and overage move in opposite directions (more units but now blocked, for example) the result is `neutral`. There is no objective winner, and labelling it "better" or "worse" would hide the trade-off. The diff still lists it as `changed`.
- **"Most customers on a retired version"** means strictly more than 50%, counting every retired version together.
- **Neighbouring plans** include private plans (Enterprise), flagged by `isPublic`. A plan with the same monthly price as the draft counts as the one below it.
- **Draft sanity checks** do not compare credit price against the Free plan: its credits cost nothing, so any paid plan would trivially look "more expensive".
- **Totals only count subscription rows that join to an existing release.** Rows pointing to a missing release are raised as a critical alert instead of being silently added.

### Assumptions

- **Free plan credits are monthly.** `pricing: { type: "free" }` has no billing interval; the 500 credits are treated as a monthly allowance, so Free has a $0 monthly period and no yearly one.
- **Capacity overage prices have no stated period** (e.g. storage at 15¢ per GB). They are shown per unit without claiming "per month".
- **UI language is English**, like the data and the README. Formatting uses a fixed `en-US` locale and UTC dates so server and client render identical text.

### Left out

- **No revenue or MRR.** `subscriptionsByRelease` does not say which billing interval (monthly or yearly) each customer pays, so any revenue number would be a guess presented as a fact.
- **No retirement date for versions.** Releases only have `publishedAt`; the timeline says a version was "replaced" on the date the next non-draft version was published.

### Tooling

- **Vitest** (dev dependency) tests `lib/derive` only, with a focus on diffs, alerts and sanity checks. Formatters are not unit-tested one by one.
- Vitest 5 declares a peer dependency on `@types/node >= 22`, while the template ships `@types/node ^20`. `@types/node` was bumped to `^22` in its own commit so the peer dependency is satisfied rather than ignored; tests, typecheck and build pass with it.

### Data observations

Pointed out rather than silently worked around. None of them is "fixed" in code.

1. **Growth: 352 of 398 customers (88%) are on retired versions**: 340 on v2 and 12 on v1. Only 46 are on the published v3. Across the catalog, 456 of 2,345 customers (19%) are on retired versions.
2. **Growth v3 matches Scale v1 on every boolean feature** and on `ai_generation` (5 credits). What separates Growth from Scale now is capacity, credit costs and `custom_models`.
3. **Enterprise is described as "Negotiated contracts" and is private, yet it has a single fixed price.** It also charges `ai_generation` at 4 credits, the same as Scale v2, so it is no better on that feature.
4. **Credit packs are barely cheaper than overage on the higher plans.** Scale: pack of 10k at $8.80 per 1,000 against an $9.00 overage. Enterprise: pack of 250k at $7.80 against an $8.00 overage. On top of that, packs expire. On Starter the gap is large ($8.80 against $12.00).
5. **Free blocks at exhaustion and no credit pack is available to it.** A Free customer who runs out can only upgrade. It looks intentional, so it is shown as an informational alert.
6. **Every paid plan's yearly price is 10× monthly with 12× the credits.** It is not used to derive one from the other, only as a reference: the draft sanity check warns when yearly costs more than 12 months or includes fewer credits.
7. **`isDefault` means two different things:** on a plan (Free), the plan new customers land on; on a price (monthly), the default billing interval.
8. **Consistency checks that pass today:** 105 feature configurations as the README states; each plan has exactly one `published` release, and it matches `currentReleaseVersion`; every subscription row joins to a release; no release is in `building`. These are still validated in code (`getCatalogAlerts`) rather than assumed.

## Overview (step 2)

### Layout and hierarchy

- **Order:** summary numbers, then alerts, then the plan ladder, then credit packs. The alerts come before the ladder because they are the only part of the page that asks for action. Informational alerts are folded in a `<details>` so they do not compete with warnings.
- **Monthly billing only in the ladder.** Yearly prices and credits are set separately (never derived from monthly), and showing both on every row would double the table. They belong on each plan's page; a footnote says so.
- **Each row shows the step from the plan below** ("+$70.00 and +9,000 credits over Starter"): it answers "what separates one plan from the next" without a separate comparison view.
- **Credit packs are compared with overage on each plan's row.** Next to the overage price, the row shows the cheapest pack available on that plan per 1,000 credits and how much cheaper it is ("Packs from $8.80 / 1,000, 27% less"). The saving is shown, not a verdict: packs expire and overage does not. A compact pack table sits at the end of the page.
- **Mobile:** below `md`, the table is replaced by a list with the same content. Both are rendered and one is hidden with `display: none`, which also removes it from the accessibility tree, so nothing is announced twice. The credit pack table scrolls horizontally inside its own box instead of the page.

### Linking rows

- **Only the plan name is a link; the row gets a hover and focus background.** A whole-row link needs a stretched link (`::after` covering the row) with `position: relative` on the `<tr>`, which Safari has historically ignored, and this could not be verified on Safari here. One real link per row also keeps a single, predictable tab stop per plan.

### Visual system

- **Tailwind's default palette is removed** (`--color-*: initial`), so a component can only use colour tokens defined in `app/globals.css`.
- **A single accent, `live` (teal), means "what a new customer gets today"**: the current version in the split bar, and the focus ring. Links are ink and underlined, not accent-coloured. The token is called `live` rather than `current` because `text-current` is already a Tailwind utility (`currentColor`).
- **Retired versions are striped grey**, not just grey, and every bar has a text legend: status is never carried by colour alone. The bar itself is `aria-hidden`; the legend is the accessible version.
- **IBM Plex Sans**, loaded with `next/font/google` (part of Next, not a new dependency): tabular figures for columns of money, and a technical tone for a technical audience.
- **No dark mode** (superseded by the visual redesign below). It is an internal tool used in short sessions; a second theme doubles the contrast checks for every token. Because every colour goes through a token, it can be added later by redefining the tokens only.
- **Icons are inline SVG components**, always decorative and paired with text, instead of adding an icon library.

## Dashboard shell (step 2, revised)

Replaces parts of the overview above: the plan table became cards, the credit pack table moved to its own route, and the page now sits in an app shell.

- **App shell.** This screen lives inside the Commet dashboard, so it gets a sidebar (organisation, user, navigation) and a top bar. The user is a placeholder, "Nimbus admin": authentication is out of scope and no real person is shown. Neither the organisation nor the user opens a menu, because there is nothing behind them.
- **"Plans" is a sidebar group, not a route.** It lists every plan (flagged when it has a pending warning) plus "New plan". A `/plans` index would duplicate the overview's cards.
- **Mobile navigation is a native modal `<dialog>`**, which provides focus trapping, Escape, a backdrop and an inert page without extra code. It closes on backdrop clicks and on link clicks, because client-side navigation keeps the layout mounted.
- **The alerts bell uses the native Popover API**, so the browser handles opening, light dismiss and Escape and the component stays on the server. The one piece of client code closes the popover when a link inside it is used, for the same client-side navigation reason. The badge counts warnings and data problems only; notes are listed but not counted, so the number means "something needs you". The Growth alert stays on the overview: the bell complements it.
- **Plans are cards aligned with CSS subgrid.** Each card spans four rows of the parent grid, so name and price, credits, exhaustion policy and customers line up across all five cards and can be read horizontally. From `md` up each card has a minimum width of 11.5rem. If the cards don't fit, the row scrolls inside its box instead of squeezing the cards or scrolling the page. Below `md` they stack.
- **Cards instead of a `<table>`.** This departs from "real tables for tabular data" on purpose, for a dashboard feel. It is compensated with an ordered list (cheapest first), one `<h3>` per plan and a `<dl>` per section, so a screen reader walks plan by plan with every value labelled.
- **Whole-card link.** The plan name is the only link; its `::after` covers the card, whose `position: relative` sits on an `<li>`, not a `<tr>`, so the Safari concern from the table no longer applies. One tab stop per plan; the card draws the focus ring via `:has(a:focus-visible)`.
- **Credit packs have their own page** (`/credit-packs`), with cards on the same subgrid rules. Each pack lists every plan it is sold on and compares its price per 1,000 credits with that plan's overage. Plans that block at zero get "a pack is the only way to keep going without upgrading" instead of a percentage.
- **Tokens.** Colours are unchanged. Added `--spacing-sidebar` and a single `--shadow-popover`: the popover is the only element that floats, so it is the only one with a shadow. `--container-page` grew to 88rem to fit five cards next to the sidebar.
- **The breadcrumb in the top bar is a static "Pricing" label.** A per-page breadcrumb would need the path on the client or a prop per page; the page's `<h1>` already names it.

### Density pass

- **Target: at 1440×900, every plan card fits on screen, customers row included.** Achieved by tightening vertical spacing, shortening copy (alert detail on one line with the link inline, step "+$70 · +9k credits vs Starter", "Packs from $8.80 / 1,000 (27% less)") and putting the customer count on the label's line.
- **Money drops `.00` by default** (`formatMoney(amount, currency, { zeroCents: "show" })` keeps it when a column needs aligned cents). Fractional amounts still show two decimals, so a column can mix "$8" and "$7.48"; the gain in scannability for prices ("$29 / mo") outweighs it.
- **Prices carry their period** ("$29 / mo", "$0 / mo" for Free) instead of relying on a column header that cards don't have.
- **"—" for Free's price per 1,000 credits**, with "Not applicable" for screen readers: its credits have no price, and "$0" would read as a real, very good rate.
- **Version legend grouped by status** ("current: v3 12%", "retired: v2 85%, v1 3%") so it stays at two lines however many versions a plan has.
- **Sidebar:** organisation on top, user pinned to the bottom. "Plans" is a small muted group title, not a link, and the plan links under it have no icons so they read as items of that group.

## Visual redesign (dark first)

Replaces the colour tokens, the shell layout, the sidebar and the overview's alerts section described above.

### Themes

- **Dark is the default, light is the alternative.** Dark tokens live in `@theme`; light redefines the same semantic tokens under `:root[data-theme="light"]`. Components never change class with the theme, which also supersedes "No dark mode" above.
- **No flash of the wrong theme.** An inline script in `<head>` reads the stored choice and sets `data-theme` before the first paint. `<html>` has `suppressHydrationWarning` because that attribute is written by the script, not React. Without a stored choice the page is dark, even if the system prefers light: dark is the primary theme the design is built and checked against, and light is a choice the person makes.
- **The toggle never needs the theme on the server.** It renders both icons and both labels ("Switch to light/dark theme") and a `light:` custom variant shows the right one, so there is no hydration mismatch. It is the only new client component.
- **Contrast checked for both themes** (WCAG, worst case over every surface; dark figures re-checked after the depth fix below): muted text 6.6 dark / 6.0 light; the `live` accent 8.1 / 5.0; warning 9.2 / 4.9; critical 6.4 / 6.0; info 7.1 / 5.9; alert colour on its own tint ≥ 5.4 / ≥ 4.75; retired stripes against the card body 3.7 / 3.4 (non-text, 3:1 needed).
- **Depth in dark: each layer is lighter than the one below.** Sheet `#0a0a0b`, card body `#131316`, card header `#1b1b1f` (relative luminance roughly doubles at each step). Before, the card body (`#0d0d0f`) was almost the sheet's colour and only the border separated them. The token `surface-sunken` was renamed `surface-card`: the card body sits above the sheet in both themes, so "sunken" described the opposite. Light is unchanged: white cards on a light grey sheet already read as raised.
- **Alerts in dark are a low-opacity tint** (12%, 10% in light) with a stronger border, never solid blocks, and always carry a visible label ("Warning", "Note", "Data problem").
- **Radii are semantic** (`mark` 4px, `control` 8px, `card` 10px, `sheet` 12px) and Tailwind's default radii are removed, like its palette. Shadows: only the popover, and in dark it is nearly invisible, so its border carries the separation.

### Shell

- **The content lives in a sheet with its own tone**; top bar and sidebar share the page background and have no borders. The sheet takes the deeper tone of the pair in both themes (near-black in dark, light grey in light) and the frame around it the other, so the content reads as set into the frame. The first version had it the other way round; swapping only the two token values was enough.
- **Top bar:** Commet logo, a divider, the Nimbus mark (a gradient circle, identity rather than meaning) and name, then the alerts bell, the theme toggle and the user avatar. On phones the Commet logo is hidden so the organisation name, bell, toggle and avatar fit.
- **The Commet mark is a CSS mask painted with the ink token.** The supplied icon (`favicon-dark.svg`) is a white mark on a black tile, which would show as a black square in the light theme. `public/commet-mark.svg` keeps only the mark, with its diagonal cut made transparent, so one file renders light on dark and dark on light.
- **The user appears only as an avatar in the top bar**, with its name as the accessible label and as a tooltip. It was removed from the sidebar: showing it twice added nothing, and neither copy opens a menu.
- **"Plans" in the sidebar is a native `<details>` disclosure**. Plans are indented one step under it with a small dot instead of an icon; the current plan's dot grows and takes the ink colour next to the link's own highlight. Tree lines with elbows were tried first and dropped: they looked heavy for five items. It is a toggle, not a page, so it has a chevron instead of looking like the links around it. No client code; the browser announces expanded/collapsed. It starts open so the warning flag on a plan is visible.
- **The disclosure animates in CSS only**: `::details-content` grows from zero to `auto` height (`interpolate-size`) and fades in, and the chevron rotates, all with the same strong ease-out (`--ease-emphasized`). Browsers without these features open it instantly.
- **Disclosure timing:** height, opacity and chevron share one timing so they stay in sync; opening takes 200ms and closing 150ms, because closing is a system response and should snap. A transition uses the timing of the state it goes to, so the closed rule holds the closing time and the open rule the opening time.
- **Reduced motion means gentler, not none.** The old global rule set every transition to 0s, which also removed colour changes and fades that help comprehension without moving anything. It was replaced by targeted rules: with `prefers-reduced-motion` the chevron no longer rotates and the disclosure changes height at once, keeping only a 150ms fade.
- **Accepted: the disclosure animates `block-size`, a layout property.** The link below has to move down, which a transform cannot do without leaving a gap, and it is six items in the sidebar.
- **The alerts popover lost its "Open overview" link**, since the overview no longer lists alerts.

### Overview

- **"Needs attention" was removed from the overview.** Alerts live in the bell; the plan concerned still shows its warning line on its card and a flag in the sidebar. This supersedes "The Growth alert stays on the overview" above.
- **Stat cards have two layers**: a header strip with icon and label, a body with the figure and a line of real context ("19% of customers", "4 public, 1 private"). No trends: there is no historical data.
- **Plan cards are two-layer widgets** spanning six subgrid rows: header (name, Private badge, arrow to the detail page), description, price, credits, exhaustion policy and customers. The price has its own row so every price starts at the same height; before, Free's price sat lower because it has no step line under it. Prices are larger (24px) and cards have more padding, with a minimum width of 13rem.
- **Empty values use one component** (`NotApplicable`): a visual "—" read as "Not applicable".

### Left out on purpose

- **No element without a function:** no search, no Support or Settings, no "···" menus, no "Customize", no date selectors, no trends, no organisation switcher chevron.
- **No sidebar collapse button.** Collapsed, the sidebar would show only icons, and plans have none of their own; initials would not tell them apart. The sheet already has enough width.
- **No copyright line.** It serves no function, and it is unclear whose it would be (Commet's or Nimbus's).

### UI polish and accessibility pass

Applied:

- **The focus ring no longer forces a radius.** The global `:focus-visible` rule set `border-radius: 4px`, which reshaped 8px buttons and the Plans toggle on keyboard focus. The outline now follows each control's own radius.
- **Theme switches snap.** Elements with a colour transition used to fade while the rest changed instantly, so the switch smeared. The toggle turns every transition off, flips the theme, forces a reflow and restores transitions two frames later.
- **Plan card customers group is valid HTML.** A `<dl>` mixed a `<div>` group with a loose `<dd>`; now one group holds the term and both descriptions (the count and the version split), so screen readers keep them together.
- **44×44 touch targets.** Top-bar and mobile-menu icon buttons stay 32px to the eye but get a 44px hit area on coarse pointers through a pseudo-element; the top-bar gap widens to 12px there so neighbouring areas never overlap.
- **Alerts popover is a labelled dialog** (`role="dialog"` + `aria-labelledby` on its heading): `aria-label` on a role-less `<div>` is ignored.
- **No `<aside>` around the sidebar.** The `<nav>` inside is the landmark; the aside added a redundant "complementary" one.
- **Plan links read "Free plan", "Starter plan"** through a visually hidden word, so they make sense in a screen reader's list of links.

Pending for the final polish pass: concentric radii in the alerts popover, `scale(0.96)` press feedback on buttons, optical padding on "Create plan", and a cross-fade for the theme toggle icon.

## Plan detail (`/plans/[code]`)

### Layout and content

- **Order:** name and description, then the plan's own alerts, then pricing, versions and features. Alerts come first because they are the only part that asks for action; on Growth the retired-majority warning also explains grandfathering (existing customers stay on their version until migrated, new customers join the current one).
- **Pricing is four stat cards** (customers, monthly, yearly, when credits run out) under a note that names the real audience: "apply to all 398 customers, on every version. A change reaches them at their next renewal. Only features are versioned." Monthly and yearly are both shown as the data states them; neither is derived from the other. Free has no yearly period, so its card shows "—" with "No yearly price".
- **Versions: timeline and changes side by side.** The timeline runs newest first (what new customers get is what the team asks about most), with status as a word plus a marker (accent for current, stripes for retired), publication and replacement dates, and customers with their share. The changes widget has one block per consecutive pair, newest first; each change states its kind (Added, Removed, Changed), the before → after values and its impact on customers. A plan with one version says there is nothing to compare yet.
- **Features: one real `<table>` per type** (credits, capacity, access). "Not included" has the same weight as "Included", with an icon, and spans every value column. Unlimited capacity shows "—" under "Past the limit".
- **Viewing an older version** adds a line with its status and customers, and every feature that differs shows the current version's value under its name ("v3 today: 5 credits / generation"). That difference is information, not a warning, so it is muted text rather than warning colour.

### Rules chosen

- **Version selection is a `?version=N` link**, so the page stays a Server Component and a version can be shared by URL. The route becomes dynamic (rendered per request) as a result. Any value that is not a version of the plan (missing, "v2", "2.5", "99") falls back to the current version instead of an error; an unknown plan code is a 404.
- **Impact colours are their own tokens**, `impact-better` and `impact-worse`, because `live` means "current" and `critical` means a data problem. The green is yellow-green (hue ~100°), about 70° away from the teal of `live` (~170°), so "better" never reads as "current". Contrast: better 9.6 dark / 5.4 light, worse 7.2 / 6.0. Each is always paired with an arrow and a label.
- **"Neutral" impact is labelled "Trade-off"**: it only comes out of a capacity change where the included amount and the overage move in opposite directions.
- **The alert on its own plan page has no "View plan" link**, which would point to the page itself.
- **Pack and exhaustion wording moved to one module** (`describe-pack-option.ts`) shared by the overview card and the plan page, so both say it the same way.

### Page title in the top bar

- **Every page title moved to the top bar**, after the organisation, as a breadcrumb (`Nimbus / Growth`). The sheet starts straight with the page's description. Section titles (Pricing, Versions, Features, Plans) stay in the sheet: they orient within a page, not between pages.
- **The title comes from the route** through a pure function (`lib/page-titles.ts`, tested), with plan names from the catalog. An unknown plan or route shows no title.
- **Typewriter on navigation only.** A small client component types the new title (35 ms per character, a caret while typing). The first load shows it whole so server and client markup match; with reduced motion it appears at once.
- **Each page keeps its `<h1>`, visually hidden.** The top-bar title is `aria-hidden`: heading navigation and the skip link still find the `<h1>`, and a screen reader never reads a half-typed word.
- **No page subtitles.** The Overview and Credit packs descriptions and the plan description under the title were removed: the top-bar title already names the page, and a sentence restating it only pushed the content down. A private plan keeps its "Private" badge at the top of the sheet. Section descriptions (such as the pricing scope note) stay, because they carry rules, not restate the title.
- **On a phone the organisation name is visually hidden** (its gradient mark stays) so the page title has the room.

### Verification

- **Edge cases are covered by unit tests and the real data** (single version, not included, blocked and billed overage, unlimited capacity, invalid `?version`).

## Create plan (`/plans/new`)

### State and navigation

- **One client boundary, `CreatePlanFlow`.** Every step and the ladder read the same draft, so the state lives there, in a `useReducer` over the existing `DraftPlan` type. The page stays a Server Component and passes everything already derived (plans to start from, existing codes, currency).
- **Missing values are tracked, not guessed.** The reducer keeps a `pending` list (monthly price, credits, policy, overage price…). The draft holds a placeholder meanwhile so it always has the `DraftPlan` shape, and "not set yet" is never confused with a real $0.
- **The step lives in the URL (`?step=price`) via `history.pushState`.** The browser's Back button moves between steps instead of leaving the flow and losing the draft, and there is no server round trip. Separate routes per step were rejected: each would remount the flow and force the state up into a layout.
- **Forward is validated, back never is.** A step past the first incomplete one (a hand-edited URL, a reload) opens that step instead. "Continue" is never silently disabled: it shows every problem in the step and moves focus to the first field.
- **No persistence.** A reload starts the draft again (from `?from=` if present). Publishing is simulated; nothing is written anywhere.

### Position step

- **The code follows the name** ("Growth Plus" → `growth_plus`) until the person edits it; clearing it hands it back to the name. It is checked as the person types (format and uniqueness); the name only after a first "Continue".
- **The code hint does not claim the code is permanent after publishing**: nothing in the data says so.
- **Starting from a plan copies price, credits, policy and the current version's features**, never the identity. Switching base after editing any of those asks before overwriting. `?from=` preloads a base; an unknown value starts from scratch. The plan detail page links to it with "Create plan from X".
- **Designed for a company without plans:** with no plans the "Start from" choice is not shown and every derived helper accepts an empty ladder (covered by tests).

### Price and credits step

- **Monthly and yearly are edited separately.** Yearly is opt-in ("Offer yearly billing") and has its own price and credits. The existing ratio (every paid plan charges 10× the monthly price and includes 12× the credits) is computed from the data and offered as a suggestion the person applies with a button; nothing is filled in on its own. If the plans stopped sharing one ratio, no suggestion would show.
- **Money is typed in dollars and stored in cents** through `parseAmount` / `formatAmountForInput`; a field keeps what the person types ("49.") while the draft only ever receives a parsed number or "missing".
- **The comparison is the plan just below and just above**, on price, credits and price per 1,000 credits, the numbers that decide where the plan sits.
- **Checks wait for real numbers.** The draft holds a $0 placeholder for a missing price, so the checks of a step only show once its values are all filled in; otherwise "same price as Free" would appear before anything was typed.

### When credits run out step

- **Each option explains, inside the option, what the end customer lives through**, and names the plans that use it today (from the data). The choice starts empty when building from scratch.
- **Overage is compared with the plan's own included credits and with the neighbours' overage.** Credit packs are compared one by one in their own section (below).
- **Credit packs are chosen in the same step**, because they change what running out means: with "Stop the service" and no pack, upgrading is the customer's only way to keep going, and the step says so as soon as that combination is chosen. Each pack shows its credits, price, price per 1,000, expiry, the plans it is sold on today and, with an overage price set, how it compares with this plan's overage.
- **Packs are suggested from the neighbours**: the packs both sell; if one of them sells none (Free, by design), the other's; if neither does, none. A pure intersection would leave a plan between Free and Starter without a suggestion, which is exactly where offering packs makes sense. The suggestion follows the plan's place on the ladder until the person ticks or unticks a pack; from then on the selection is theirs, and "Use the suggestion" restores it. Starting from a plan does not copy its packs, because the place on the ladder decides which packs fit.
- **Choosing packs is not managing them.** No pack is created or edited: packs list the plans they are sold on (`planCodes`), and publishing would add the new plan's code to the selected ones. Like the publish itself, this is simulated. The review lists the chosen packs and says so.
- **`checkDraftPlan` uses the selection**: "no credit packs" is raised only for a blocking plan with no pack selected.

### Features step

- **Every catalog feature is listed, grouped as in the plan page.** Credits: included or not, and the credits per unit. Capacity: not included, limited (amount, then blocked or billed per unit) or unlimited. Access: included or not. Switching a feature on starts from the nearest neighbour's value.
- **Neighbour values sit under each field, and the flags use `compareFeatureValues`**, the same rule as the review: worse than the cheaper plan is marked as worse; better than the pricier plan is only informative, because it can be intended (a promotion).
- **A typed value that is not a number yet blocks "Continue"** on that step, like any other missing value.

### Plan ladder panel

- **Visible through the whole flow**: beside the form on wide screens (sticky), and as a collapsible summary above it on phones ("Plan ladder · Between Growth and Scale"). The draft is dashed and badged "Draft"; its numbers update as the person types.
- **The place waits for the price to settle (350 ms)**, so typing "299" does not move the draft three times; clearing the price takes it off the ladder at once. A paid draft without a price is listed last, "not placed yet", never at $0.
- **The move is a FLIP animation with the Web Animations API, no library.** After React reorders the list, each row that changed place is drawn where it was and slides to its new place (320 ms, `--ease-emphasized`). Positions come from `offsetTop`, which ignores transforms, so a move that starts during another begins from where the row is on screen. With reduced motion nothing slides: the draft fades in at its new place.
- **The new position is announced once** through a polite live region shared by both layouts.

### Review and publish

- **Checks first, grouped by severity** ("Must fix before publishing", "Worth a second look", "Good to know"), each with a link back to the step where it is fixed. Then the summary, one card per step with its own "Edit".
- **"Publish plan" is disabled only by blocking checks**, and the reason is written next to it. With the position step validated, a blocking check can only appear if the catalog changed under the draft, but the review does not assume it.
- **"Who this reaches"** states that a new plan has no customers yet, and how later changes would reach them (price, credits and policy: everyone at renewal; features: a new version for new customers). A future "new version of an existing plan" mode would fill the same section with the real customer counts.
- **The publish is simulated and says so**: the confirmation shows the final ladder, states that nothing was saved, and offers "Create another plan" (a fresh draft, no reload) or "Back to overview".
