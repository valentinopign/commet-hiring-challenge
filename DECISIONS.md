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
- Vitest 5 declares a peer dependency on `@types/node >= 22`, while the template ships `@types/node ^20`. Tests, typecheck and build all pass; the types package was left untouched rather than bumped without asking.

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
