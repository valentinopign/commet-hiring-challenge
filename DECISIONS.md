# Decisions

I use this document to explain my current implementation choices, their trade-offs and the limits of the prototype. I keep final decisions here rather than a history of discarded designs.

## Data model and derivation

- **Pure display logic.** I keep the supplied Catalog and source data unchanged. I derive summaries, comparisons, alerts and draft checks in lib/derive without React or side effects, so overview, detail and creation reuse the same rules.
- **Explicit availability.** I resolve every catalog feature in catalog order. I treat an absent release feature as not included, with the same clarity as a boolean set to false.
- **Pricing scope.** I keep prices, included credits and exhaustion policy on the plan, and explain that changes affect all its customers at renewal. I keep features on releases and preserve the version each customer subscribed to.
- **Independent periods.** I read monthly and yearly prices and credits separately, never deriving one from the other. I treat Free's allowance as monthly because its pricing has no interval, and show no yearly period for it.
- **Amounts and formatting.** I store money in cents, keep fractional cents in comparisons until display and format through lib/format. I omit .00 for whole amounts and use English, en-US and UTC to keep server/client output consistent.
- **Customer impact.** I classify availability changes as added/removed and changes to an available feature as changed. I reuse compareFeatureValues for version diffs and checks: lower credit cost, more capacity and gaining access are better. I label opposing capacity/overage changes as a trade-off instead of inventing an objective winner.
- **Defensive totals.** I count subscription rows only when they join to an existing release and surface orphan rows as data problems. I use the largest remainder method so nonempty whole-percentage distributions total 100%.
- **Neighbours and warnings.** I include private plans in comparisons, label them private and place equal-price neighbours below the draft. I define most customers on retired versions as strictly more than half across all retired releases. I omit credit-price savings against Free.
- **No invented metrics.** I omit revenue, MRR and trends because billing intervals per customer and historical data are missing. I show capacity overage per unit without inventing a period, and infer replacement from the next published release because retirement dates are absent.

### Data observations

- I noticed that Growth has 352 of 398 customers on retired versions and only 46 on v3. I show the real split rather than assuming the current release represents most customers.
- I noticed that Growth v3 matches Scale v1 on boolean features and image-generation credit cost. I present the remaining differences without implying every feature improves at every price step.
- I noticed that Enterprise is private and described as negotiated, but the catalog still supplies fixed prices. I show those values without inventing contracts.
- I noticed that larger packs are only slightly cheaper than overage and also expire. I show the saving and expiry without calling packs universally better.
- I noticed that Free blocks at exhaustion and offers no pack. I explain upgrading as its only configured way to continue rather than modifying the source data.
- I noticed a common 10× yearly-price / 12× credits pattern. I use it as an optional reference, never an automatic derivation.
- I distinguish the default plan from a price's default interval despite both using isDefault. I validate release/subscription consistency rather than assuming the sample is always valid.

## Dashboard shell and visual system

- **Internal dashboard.** I design for the Nimbus team managing pricing, not its end customers. I use a sidebar, top bar and content sheet; Plans links directly to each plan and New plan rather than a duplicate index.
- **Identity and controls.** I use a Nimbus admin placeholder because authentication is outside the exercise. I paint the Commet mark through an ink-token mask and omit controls without implemented functions, including search, settings and sidebar collapse.
- **Native interactions.** I use dialog for mobile navigation, the Popover API for alerts and details for the Plans group. I label them and handle focus, Escape, dismissal and link navigation while the shell remains mounted.
- **Alerts in context.** I count warning/data-problem alerts in the bell and place flags/explanations next to the affected plans and data. I do not repeat them in a separate overview alerts section.
- **Tokens and typography.** I replace Tailwind's default colour/radius palettes with semantic tokens. I use IBM Plex Sans through next/font, tabular figures and decorative SVG icons without an icon library.
- **Dark first, optional light.** I override the same tokens for light, apply the stored choice before first paint and keep server-rendered controls independent of storage. I suppress unrelated colour transitions during theme changes.
- **Depth and accessibility.** I separate sheet, card body and header surfaces. I pair status colours with text/icons, stripe retired versions and supply text legends for decorative bars. I retain semantic headings, labels, visible focus and touch targets.
- **Restrained polish.** I use concentric radii, optical icon padding and press feedback that excludes disabled controls/reduced motion. I animate the small sidebar disclosure's height because the following link must move with it; unsupported browsers open it instantly.
- **Route titles.** I derive top-bar breadcrumbs from routes/catalog names, keep semantic page headings visually hidden and mark animated titles decorative. I show the first title whole for hydration and omit subtitles that merely repeat it.
- **Attention without repetition.** I ring the bell once per browser session when warnings exist, not on every navigation. I keep theme-icon and organization-switcher feedback short and reduce positional movement when requested.

## Overview

- **Customer context first.** I put distribution inside the wider Customers stat instead of a separate section. I derive the context from the largest segment, followed by Paid customers and On retired versions; those two cards share a row below Customers on phones.
- **Paid is a domain classification.** I count pricing types other than free, including private Enterprise. I do not infer this from the monthly price or claim the count represents collected revenue.
- **Neutral distribution palette.** I use theme-specific grey ramps instead of giving unrelated meanings to plan colours. I hide the decorative bar from assistive technology and list every plan's count/share in a text legend, so interpretation does not depend on colour contrast alone.
- **Small segments remain visible.** I keep a 2px segment minimum and show <1% for nonzero counts that round to zero. I spread paid plans across available ramp steps; additional plans can share a step because the legend identifies them.
- **Comparable plan cards.** I use an ordered list with six aligned CSS subgrid rows and labelled values. I stack cards on phones and scroll the card row inside its container when necessary. I keep one stretched name link and one focus stop per card.
- **Monthly overview, yearly detail.** I focus the ladder on monthly pricing and show independent yearly values on detail pages. I show price/credit differences and per-credit savings against the cheaper paid plan, omitting savings when credit prices cannot be compared.
- **Warnings and packs.** I highlight affected cards with a warning border/header while retaining the icon/text explanation. I explicitly say less than overage and keep the comparison together when wrapping. I give packs their own route, with expiry and plan-specific comparisons, instead of a duplicate overview table.
- **Tests.** I cover distribution, empty/invalid subscription joins, paid totals, ramp mapping and per-credit savings with pure tests alongside the existing derive coverage.

## Plan detail

- **Scope before values.** I show pricing first and explain renewal impact above prices, credits and exhaustion. I place alerts beside their relevant pricing/version information.
- **Versions with changes.** I show the timeline and consecutive diffs newest first, with dates, customer counts, availability and labelled impact. I provide an explicit empty comparison state for a single version.
- **Feature tables.** I group credit, capacity and access into semantic tables, show not included as clearly as included and avoid invented overage for unlimited capacity. I show today's value beside differences on an older version.
- **Shareable selection.** I use version query links and keep the page server-rendered. I fall back to the current release for invalid versions and return a 404 for unknown plans. I use separate impact tokens rather than overloading current-version/data-problem colours.
- **Shared wording and tests.** I reuse pack/exhaustion descriptions and test single versions, absent features, capacity policies and invalid version selection.

## Create plan

- **One draft.** I keep state in CreatePlanFlow with a reducer over DraftPlan; steps, checks and ladder share it. The page stays a Server Component and passes catalog/base selection.
- **Missing is not zero.** I track pending fields separately from domain placeholders, preserve unfinished input and avoid treating an empty price as intentional zero. I validate forward navigation, allow backward navigation and focus the first invalid field after its error renders.
- **Step navigation.** I use history.pushState and a step query parameter so browser Back moves through the flow without a server round trip. I clamp requests to the first incomplete step and start fresh after reload because persistence is not implemented.
- **Identity and bases.** I generate the code from the name until manually edited, validating format/uniqueness. Clearing the code returns subsequent name edits to automatic generation. I copy a base's pricing, policy and current features, not its identity, and ask before overwriting edits. I omit base selection for empty catalogs.
- **Yearly and comparisons.** I make yearly billing opt-in with separate price/credits. I offer a ratio suggestion only when existing plans agree, compare with real neighbours and wait for completed numeric inputs before sanity checks.
- **Exhaustion and packs.** I explain the customer experience before each policy choice and start scratch drafts without a choice. I choose packs in that step because they change the meaning of running out. I suggest shared neighbour packs, or the other's when one has none, until manually overridden; restoring the suggestion is explicit.
- **Configuration, not pack management.** I do not create/edit packs; publishing would associate chosen packs with the plan. I list all features by type with explicit inclusion, credit cost and capacity policy, reuse neighbour/impact rules and validate incomplete feature numbers.
- **Live ladder.** I show it beside the form on wide screens and as a collapsible summary on phones. I debounce placement by 350ms, leave an unpriced paid draft unplaced and animate reordering with cancelable FLIP transforms. I announce placement once.
- **Review and honest simulation.** I group checks by severity, link to their steps and summarize decisions with Edit actions. I block only for blocking checks and explain customer impact. Standalone publication explicitly persists nothing and offers another draft or the overview.
- **Purposeful motion.** I reuse the emphasized easing for short step transitions, measured-height reveals and ladder changes. I keep manual numeric edits/readable comparisons still, clean up interrupted animations and use gentler reduced-motion variants.
- **Tests and dependencies.** I use Vitest for pure derivation, reducer, validation, route titles and amount parsing. I upgraded @types/node to meet its peer requirement and add no runtime animation/UI dependency.
