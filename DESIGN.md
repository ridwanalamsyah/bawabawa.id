# DESIGN.md: Bawabawa.id Editorial Culinary & Dispatch System

## Design Read
Reading this as: Editorial Culinary & Personal Shopper Commerce for Bandung Raya, West Java/Jakarta, and Samarinda buyers, in a Warm Artisanal Bakehouse & Dispatch Ledger visual language, dial `ENERGY 3 / RHYTHM 3 / MOTION 2`.

## Identity & Character
- **Product:** Bawabawa.id (Personal Shopper & Curated Delivery from Bandung to Bandung Raya, West Java/Jakarta, and Samarinda).
- **Personality:** Warm, tactile, punctual, honest, artisanal. Feels like an independent Bandung bakehouse combined with a Swiss train dispatch board.
- **Identity Motif:** **Bakehouse Thermal Receipt & Dispatch Timetable**. Dashed 1px receipt dividers (`1px dashed`), tabular-nums price ledgers, stamped batch times (`07:30 WIB`, `08:30 WIB`, `14:00 WIB`), and borderless editorial food photography on warm flour paper.

## Dials
- `Dial: ENERGY 3 / RHYTHM 3 / MOTION 2`
- **ENERGY 3 (Bold Editorial):** Large high-contrast headline paired with a tactile Bakehouse Receipt calculator and an above-the-fold editorial photography strip peeking at the bottom of the hero.
- **RHYTHM 3 (Asymmetric, Mixed Compositions):** Every section uses a distinct structural composition:
  1. **Asymmetric 7:5 Split Hero + Thermal Receipt Calculator + Editorial Photo Peek Strip**
  2. **Borderless Editorial Lookbook Grid** (4-column culinary gallery on warm paper without boxed card frames)
  3. **Swiss Horizontal Timetable Ledger** (Left sticky heading + right horizontal dispatch rows for the 9 Bandung stores)
  4. **Full-Bleed High-Contrast Spotlight Band (`#1C2016`)** (Dark olive band dedicated to Ready Stock at Hub Samarinda + `BAWASMD` voucher)
  5. **Swiss Tariff Spec-Sheet & 4-Step Inline Ledger** (Tabular route comparison + inline horizontal process strip)
- **MOTION 2 (Purposeful Transitions):** Crisp state transitions on receipt calculator tabs, subtle image scale on lookbook hover, and reduced-motion compliance (`prefers-reduced-motion: reduce`).

## Color Palette (3 Core + 1 Accent, Verified WCAG AA/AAA)
1. **Warm Flour Paper (`#FAF6EE` / `40 46% 96%`):** Primary canvas background inspired by unbleached bakery packaging paper.
2. **Deep Olive Ink (`#1C2016` / `84 19% 11%`):** Primary typography and full-bleed spotlight surface (`15.26:1` contrast against `#FAF6EE`).
3. **Muted Olive Slate (`#4E5346` / `83 8% 30%`):** Secondary body copy and metadata (`7.18:1` contrast against `#FAF6EE`).
4. **Matcha Olive Brand (`#4A5828` / `78 38% 25%`):** Primary interactive control surface from the official Bawabawa.id brand board (`7.43:1` contrast against `#FFFFFF`).
5. **Baked Terracotta Accent (`#B84435`):** Used sparingly at key moments (limited batch / error states).

## Typography & Radius Scale
- **Font Family:** `Plus Jakarta Sans` for UI and display headlines (chosen for its clean geometric proportions and high legibility in Indonesian commerce copy and tabular numbers); `JetBrains Mono` strictly for receipt codes, timestamps, and tabular ledger figures.
- **Radius Scale (R-11):**
  - Buttons, inputs, tags, and receipt controls: `6px` (`rounded-md`)
  - Editorial photography and receipt paper: `8px` (`rounded-lg`)
  - Never pill-shape (`rounded-full`) every element on the page.

## Written Reasons for Major Decisions (R-31)
- **Why `#FAF6EE` Warm Flour Paper instead of pure white?** Pure white feels like a sterile SaaS template; warm flour paper matches Bawabawa.id's official logo board and makes sourdough, pastry, and coffee photography look appetizing.
- **Why the Thermal Receipt motif for the calculator?** Jastip buyers care most about honest store prices plus transparent fee breakdowns; a bakehouse receipt communicates price honesty immediately.
- **Why borderless Lookbook items instead of boxed cards?** Removing card boxes around every product lets the food photography breathe like an editorial magazine and avoids the repetitive AI card-grid look (R-14).
- **Why a horizontal Timetable for Bandung stores?** Queue times (`07:30 WIB`, `08:30 WIB`, `14:00 WIB`) are chronological dispatch data; a timetable row is faster to scan than 9 identical cards (R-05).
- **Why a dark `#1C2016` band for Hub Samarinda?** Ready stock in Samarinda is a distinct fulfillment model (no PO wait) from Bandung PO items; flipping the surface contrast separates the two mental models immediately.
