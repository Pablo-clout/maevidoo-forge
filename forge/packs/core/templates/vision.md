# Vision — {{project}}

> Template → copy to `docs/vision.md`. What this product is and where it is going, in broad lines. **This is your document**: edit it whenever you like. It belongs to the project, not to Forge, and it stays if Forge is removed.
> Agents read it before every plan and every sweep. They never edit it on their own: when they see the code and this document disagree, they show you exactly what they would change and why, and ask (`forge/packs/core/rules/product-docs.md`).
> Write it in your own language: only the field names and fixed words such as `status: confirmed` stay as they are.
> Keep it short: about 120 lines. The detail lives in the documents it cites.
> status: draft — unconfirmed <!-- replaced by "confirmed <date>" once the human has read and accepted it -->

## 1. The product
- **What it is:** <!-- one or two sentences. e.g. "A club management app for amateur football: attendance at training, matches and tournaments, and the statistics that come from them." -->
- **For whom:** <!-- the people who use it, and what each comes to do: coach, parent, player, club secretary -->
- **Inspired by / compared with:** <!-- optional: the products it resembles, and how it differs -->

## 2. The vision
- **Where it is going:** <!-- what the product should be good at in a year; 3 to 5 lines -->
- **What it will not be:** <!-- the things deliberately left out, so nobody builds them by accident -->
- **What matters most:** <!-- the two or three qualities that win when choices conflict: e.g. fast on a phone at the touchline, usable by a volunteer with no training -->

## 3. The features, in broad lines
<!-- 5 to 15 lines, one per big feature: what it lets a user do, and for whom. No screens, no fields: the living detail is in docs/features.md. -->
- **{{Feature}}** — <!-- what it is for -->

## 4. Architecture and technologies
- **Shape:** <!-- e.g. single-page web app + REST API + Postgres; mobile-first web, no native app -->
- **Technologies:** <!-- languages, frameworks, database, hosting, authentication -->
- **Rules that must hold:** <!-- the few architectural decisions nobody may break without a decision: e.g. "every table has row-level security", "no business rule in the UI layer" -->
- **Detail:** <!-- the documents that say more: docs/architecture.md, an ADR folder -->

## 5. The UI and UX direction
- **Feel:** <!-- two or three lines: calm and plain, dense or airy, phone first -->
- **Principles:** <!-- the few rules every screen follows: one main action per screen, every action answered, nothing typed is lost -->
- **Detail:** `docs/ui-canon.md` § Direction, and <!-- a design document, a tokens file -->

## 6. Where the rest lives
| What | Where | Who changes it |
|------|-------|----------------|
| The workflows of the app as it is today | `docs/features.md` | agents propose, you accept |
| The look: scales, patterns, words, screens | `docs/ui-canon.md` | the UX sweep adds, you settle |
| What was decided, and why | `epics/decisions.md` | every closed task |

## History
<!-- one line per accepted change: date · section · what changed · why · who proposed it -->
