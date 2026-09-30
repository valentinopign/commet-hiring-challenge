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
- **No dark mode.** It is an internal tool used in short sessions; a second theme doubles the contrast checks for every token. Because every colour goes through a token, it can be added later by redefining the tokens only.
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
