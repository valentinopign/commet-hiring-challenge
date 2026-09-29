# Commet Challenge

Commet is the platform where a company configures how it charges its customers. This exercise is an interface inside the Commet dashboard. You don't need to follow Commet's design system: typography, color, layout and components are your call. We evaluate your design judgment as much as your code.

Nimbus is a customer of Commet: it generates images, copy and video with AI, and charges for it in credits. `data/catalog.ts` holds their entire pricing — 12 features, 5 plans, 9 plan versions, 105 feature configurations — and how many customers are subscribed to each version.

The people using it are the Nimbus team: technical people shipping their own product and changing its pricing often. Not Nimbus end customers.

## Objective

1. **Present complex data.** Someone at Nimbus opens the interface and understands how they are charging their customers.
2. **Create a new plan.** A flow that takes them from nothing to a published plan, understanding what each decision means before making it.

## Questions to start from

Starting points, not a checklist. You don't need to answer every one.

**Presenting**

- What does someone need to see first, and what can wait?
- What separates one plan from the next?
- How do you show a plan whose customers are spread across versions, and what changed between them?
- Who is affected if the price of a feature changes?

**Creating**

- Where does the new plan fit among the existing ones, and how does the person see that while creating it?
- What do you ask first, and what can wait?
- What does the person need to see before publishing?
- How do they notice a plan that doesn't make sense next to the others?

## Data model

Nimbus charges in credits: every plan includes an amount per period, and every action in the product consumes a different amount.

| Entity | Description |
| --- | --- |
| `organization` | The company doing the charging |
| `feature` | Everything the product offers. Defined once, in a catalog |
| `plan` | What a customer subscribes to. `isPublic` marks whether it is offered openly or sold privately |
| `PlanPrice` | A plan billed monthly or yearly, each with its own included credits |
| `PlanRelease` | A version of a plan. Changing its features publishes a new version |
| `ReleaseFeature` | A catalog feature as configured inside one version of one plan |
| `creditPack` | Loose credits a customer buys when they run short, without changing plan |
| `subscriptionsByRelease` | How many customers are on each version of each plan. Live state, not configuration |

| Field | Values |
| --- | --- |
| `feature.type: "credit"` | Spends credits. `creditsPerUnit` sets how many per unit: in Growth's published version a generation costs 5, an API call 1, a video render 30 |
| `feature.type: "capacity"` | Does not spend credits. Includes an amount and, past it, either bills per unit (`overage: billed`) or cuts off (`overage: blocked`). Seats, storage, workspaces |
| `feature.type: "boolean"` | On or off. SSO, audit log, priority support |
| `pricing.type` | `free`, or `standard` with monthly and yearly prices |
| `exhaustionPolicy` | What happens once a customer spends every credit: `block` cuts off the service, `bill_overage` keeps it running and bills the excess at `pricePer1000Credits` |
| `release.status` | `published` is what new customers get, `retired` is an old version that still has customers on it, `building` is a draft |

Amounts are in cents: `9900` is $99.00.

### How the entities relate

The credit chain: the `PlanPrice` sets a budget (`includedCredits`), consumption features spend it (`creditsPerUnit` × usage), the `exhaustionPolicy` decides what happens when it runs out, and a `creditPack` buys more without changing plan.

- A plan has several versions. `currentReleaseVersion` is the published one, but customers stay on the version they subscribed to. A plan can have customers spread across versions, and the published one is not always where most of them are.
- Only features are versioned. Price, included credits and `exhaustionPolicy` belong to the plan, not to a version: changing them reaches every customer on every version at their next renewal.
- A `ReleaseFeature` configures, by `code`, a feature that already exists in the catalog. The same feature is configured differently in every version of every plan.
- `subscriptionsByRelease` joins the plans on `planCode` + `version`.

## Scope

One page or several, laid out however presents the information best. Nothing has to persist — faking the save is fine. What matters is what you choose to show, in what order, and what you leave out, and that the experience makes clear what each field means before it is set.

The data is organized for storage, not for display. The interface doesn't have to follow its structure, and you can reshape it if it gets in the way. Tell us what you changed.

You can use AI agents. The code you hand in is yours and we will read it.

## Delivering

Create a public repository from this template with "Use this template", work there, and email the link to decker@commet.co with a few lines on what you left out and why.

## Running

```bash
pnpm install
pnpm dev
```
