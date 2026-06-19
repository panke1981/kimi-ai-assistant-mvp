# Design Document

## 1. Profile Baseline Declaration

- **Profile selection**: `profiles/strategic.md`
- **Selection rationale**: This is a product showcase / pitch deck for an AI-powered business analytics product, targeting decision-makers (investors, partners, enterprise clients). The strategic profile fits the "persuasion-driven, data-backed, grand vision" requirement.
- **Referenced dimensions**: Design philosophy (grand vision, clear storyline, key points prominent), information density (medium-high), color guidance (steady, premium, powerful), font guidance (sans-serif bold titles), content expression (big numbers, timeline roadmap), narrative framework (Problem → Solution → Vision)
- **Deviation notes**: 
  - Color: Using deep purple instead of navy/dark green to align with the product's existing brand identity
  - Density: Slightly lower than typical strategic reports since this is a product showcase rather than a detailed business plan, allowing more breathing room for visual impact

## 2. Style Baseline Declaration

- **Style anchor selection**: 
  - Primary anchor: McKinsey / BCG strategic report style — referenced for information architecture, data-forward layouts, and professional authority
  - Secondary anchor: Apple product keynote — referenced for dramatic dark backgrounds, large typography, and clean visual impact on cover/chapter pages
- **Referenced dimension explanation**: From McKinsey, we reference the structured content layout (argument-per-page, data prominence). From Apple, we reference the dark-mode hero design for cover and chapter pages, creating visual drama. The overall color temperature is cool-neutral with purple undertones.

## 3. Style Details

### 3.1 Color Design Principles

- **Overall tendency**: In between (steady foundation + local highlights)
- **Temperature**: Cool-neutral, with a sophisticated purple undertone
- **Primary color**: Deep purple `#7C3AED` — aligns with the product brand, conveys intelligence and innovation without being cliché
- **Background**: Dark `#0A0A0F` for cover/chapter/final pages; warm dark gray `#141419` for content pages
- **Text colors**: White `#F0F0F5` for primary text on dark backgrounds; muted `#8B8B9A` for secondary text
- **Secondary color**: Cool gray `#2A2A35` for cards, containers, subtle separations
- **Accent color**: Gold amber `#D4A843` — used sparingly for key numbers, highlights, CTAs. Conveys premium feel and strategic value

### 3.2 Font Usage Principles

- **Title font (EN)**: Liter — modern, clean, tech-forward
- **Title font (CN)**: alimamashuheiti — geometric, strong commercial feel, structured
- **Body font**: MiSans — excellent screen rendering, clean and modern
- **Font size hierarchy**:
  - Cover title: 48-52px
  - Chapter title: 40-44px
  - Page title: 28-32px
  - Body text: 20px (moderate density)
  - Big numbers: 52-60px
  - Annotations/labels: 14-16px

### 3.3 Text Box and Container Styles

- Content separation: Primarily whitespace + font size differences; cards used sparingly for data groupings
- Cards: Sharp-cornered rectangles with subtle border (`#2A2A35`), no rounded corners to maintain strategic authority
- Decorative elements: Thin horizontal lines (`#7C3AED` or `#D4A843`) as section dividers; subtle geometric shapes as accents

### 3.4 Image Style

- **Icons**: Outline style, used sparingly, restrained usage
- **Tables**: Minimal style, dark header with primary color, subtle borders
- **Charts**: Minimal/dark style, primary color series with accent highlights
- **Illustrations**: High-quality tech/business themed images for cover and chapter pages; dark, sophisticated aesthetic

## 4. Layout System

### 4.1 Global Layout Characteristics

- **Canvas size**: 1280x720 (16:9)
- **Page margins**: 60px left/right, 50px top/bottom
- **Unified elements**: 
  - Bottom-right page indicator: small text showing section name
  - Thin accent line at bottom of content pages (y=680, width=full)
- **Grid alignment**: All content aligned to a consistent grid

### 4.2 Special Page Layouts

- **Cover**: Hero design — full dark background + centered large title + subtitle below + subtle decorative elements
- **Table of contents**: Grid layout — 3 equal-width columns for chapters, each with number + title + brief description
- **Chapter pages**: Hero design — large chapter number (semi-transparent) + chapter title + subtitle, dark background with gradient accent
- **Final page**: Centered layout — large brand name + tagline + subtle decorative elements

### 4.3 Content Page Layout Patterns

- **Pattern A (Data highlight)**: Top title + 3-column big numbers + body text below
- **Pattern B (Left-right split)**: Left side text content + right side visual (chart/image)
- **Pattern C (Card grid)**: Top title + 2-3 column card layout with icons
- **Pattern D (Timeline)**: Horizontal timeline with milestones

## 5. Style Usage Rules

- `title` style: Cover title, chapter titles — large, impactful
- `heading` style: Page titles on content pages — clear, authoritative
- `body` style: Main body text — readable, comfortable
- `subtitle` style: Subtitles, labels — smaller, muted
- `bigNumber` style: Key statistics, KPIs — large, accent colored
- Primary color (`#7C3AED`): Titles on light pages, decorative lines, icon fills
- Accent color (`#D4A843`): Key numbers, highlights, sparingly used
- Background (`#0A0A0F` / `#141419`): Page backgrounds
- Secondary (`#2A2A35`): Cards, containers, subtle elements

## 6. Risk Prohibitions

- [ ] Do NOT use blue/cyan as primary — purple is the brand color
- [ ] Do NOT use rounded rectangles — sharp corners only for strategic authority
- [ ] Do NOT use gradient backgrounds — solid dark only
- [ ] Do NOT use more than 3 colors (purple, gold, gray scale)
- [ ] Body font must NOT go below 18px
- [ ] Annotation font must NOT go below 12px
- [ ] Do NOT use `&&` in JSX conditions (already fixed)
- [ ] Do NOT pile data without insights — each page needs a clear argument
- [ ] Do NOT use cliché stock photos — search for high-quality, dark-themed tech/business images

## 7. Theme Definition

```yaml
theme:
  colors:
    primary: "#7C3AED"
    secondary: "#2A2A35"
    accent: "#D4A843"
    background: "#0A0A0F"
    bgContent: "#141419"
    text: "#F0F0F5"
    textMuted: "#8B8B9A"
    textDisabled: "#5A5A6A"
    cardBg: "#1E1E28"
    cardBorder: "#2A2A35"
  textStyles:
    title:
      fontSize: 48
      color: "$text"
      fontFamily: "Liter, alimamashuheiti"
      letterSpacing: 2
    chapterTitle:
      fontSize: 42
      color: "$text"
      fontFamily: "Liter, alimamashuheiti"
      letterSpacing: 2
    heading:
      fontSize: 30
      color: "$text"
      fontFamily: "Liter, alimamashuheiti"
      lineHeight: 1.3
    body:
      fontSize: 20
      color: "$text"
      fontFamily: "Liter, MiSans"
      lineHeight: 1.6
    subtitle:
      fontSize: 18
      color: "$textMuted"
      fontFamily: "Liter, MiSans"
      lineHeight: 1.5
    label:
      fontSize: 14
      color: "$textMuted"
      fontFamily: "Liter, MiSans"
      letterSpacing: 1
    bigNumber:
      fontSize: 56
      color: "$accent"
      fontFamily: "Liter, alimamashuheiti"
      letterSpacing: 1
  tableStyles:
    default:
      headerFill: "$primary"
      headerColor: "#FFFFFF"
      headerBold: true
      bodyFill: ["#141419", "#1A1A24"]
      bodyColor: "$text"
      border:
        style: solid
        width: 1
        color: "#2A2A35"
```
