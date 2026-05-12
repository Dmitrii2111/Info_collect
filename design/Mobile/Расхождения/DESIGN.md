---
name: Field Utility System
colors:
  surface: '#fbf8ff'
  surface-dim: '#dad9e3'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2fc'
  surface-container: '#eeedf7'
  surface-container-high: '#e8e7f1'
  surface-container-highest: '#e3e1eb'
  on-surface: '#1a1b22'
  on-surface-variant: '#444653'
  inverse-surface: '#2f3037'
  inverse-on-surface: '#f1f0fa'
  outline: '#757684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3755c3'
  primary: '#00288e'
  on-primary: '#ffffff'
  primary-container: '#1e40af'
  on-primary-container: '#a8b8ff'
  inverse-primary: '#b8c4ff'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#611e00'
  on-tertiary: '#ffffff'
  tertiary-container: '#872d00'
  on-tertiary-container: '#ffa583'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001453'
  on-primary-fixed-variant: '#173bab'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#ffdbce'
  tertiary-fixed-dim: '#ffb59a'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#802a00'
  background: '#fbf8ff'
  on-background: '#1a1b22'
  surface-variant: '#e3e1eb'
typography:
  h1-bold:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  h2-bold:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  data-compact:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.02em
  button-text:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  margin-mobile: 16px
  gutter: 12px
  touch-target-min: 48px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 24px
---

## Brand & Style
The design system is engineered for high-stakes enterprise environments where speed and accuracy are paramount. The brand personality is rooted in reliability and functional clarity, evoking a sense of calm efficiency for field workers. 

The aesthetic follows a **Corporate Modern** approach. It prioritizes utility over decoration, utilizing a structured layout that reduces cognitive load during equipment inspections. Every visual element serves a purpose: guiding the user’s eye to critical status indicators and facilitating rapid data entry. The interface feels like a professional tool—rugged enough for the field, yet refined enough for executive reporting.

## Colors
The palette is dominated by a "Calm Blue" primary and "Slate" secondary to establish a professional, trustworthy atmosphere. The background uses a soft gray base to reduce screen glare during outdoor use.

Semantic colors are strictly reserved for status communication:
- **Success (Green):** Indicates completed inspections or functional equipment.
- **Warning (Amber):** Signals in-progress tasks or non-critical maintenance needs.
- **Critical (Red):** Flags urgent conflicts, failed inspections, or safety hazards.

Neutral grays are used for borders and subtle background divisions to maintain high contrast between the background and active UI elements.

## Typography
This design system utilizes **Inter** for its exceptional legibility in digital interfaces and robust support for Cyrillic characters. The typographic hierarchy is optimized for the Russian language, which often requires more horizontal space than English.

- **Strong Titles:** Used for screen headings and equipment names (e.g., "Осмотр ТП-104").
- **Medium Labels:** Used for form fields and metadata headers to ensure clear categorization.
- **Compact Data Rows:** Designed with slightly tighter line-heights and letter-spacing to maximize information density on mobile screens without sacrificing readability.

## Layout & Spacing
The layout follows a **Fluid Grid** model optimized for mobile-first PWA constraints. It employs an 8px rhythmic scale for all margins, padding, and vertical stacking.

On mobile devices, a standard 16px side margin is maintained. Key interactive elements, such as "Start Inspection" or "Submit," are placed in the "Thumb Zone" (lower third of the screen) to facilitate one-handed use. Data rows utilize a 12px gutter to separate attributes while maintaining a compact vertical profile. Touch targets are strictly enforced at a minimum of 48px to accommodate use in varied field conditions.

## Elevation & Depth
Visual hierarchy is conveyed through **Tonal Layers** and **Ambient Shadows**. This design system avoids heavy drop shadows to maintain a clean, professional look.

- **Background:** The lowest layer, using the soft gray base.
- **Cards:** Elevated slightly using a subtle, diffused shadow (0px 2px 4px rgba(0,0,0,0.05)) to separate inspection items from the background.
- **Modals/Drawers:** These use a higher elevation with a more pronounced shadow and a dimming backdrop to focus the user’s attention on critical entry tasks.
- **Active States:** Subtle inset shadows or color shifts are used to provide immediate tactile feedback upon interaction.

## Shapes
The shape language is defined by **Rounded** geometry (Level 2). Standard UI components like input fields and primary buttons utilize a 0.5rem (8px) radius. 

Larger containers, such as equipment cards, use the `rounded-lg` (1rem / 16px) setting to create a friendly, modern appearance that feels approachable. This consistent rounding helps to soften the "industrial" nature of the content, making the tool feel more like a modern consumer app while retaining professional rigor.

## Components

### Buttons
- **Primary:** Solid Calm Blue with white text. High-contrast, full-width on mobile for primary actions (e.g., "Сохранить").
- **Secondary:** Light gray or outline style for less critical actions like "Отмена."

### Cards
- Equipment and inspection cards use the `rounded-lg` shape with a subtle border (#E2E8F0).
- Content is grouped logically: ID and Title at the top, Status Chip in the top-right, and summary data rows in the body.

### Status Chips
- Small, rounded pills with semantic background colors at 15% opacity and 100% opacity text for high legibility (e.g., "В работе", "Завершено").

### Progress Bars
- Slim, 4px height bars used within cards to show inspection completion percentages. Uses the primary blue for active progress.

### Form Inputs
- Large 48px height fields with persistent labels. Support for Russian placeholder text and clear error states using the Critical Red color.

### Iconography
- Simple, geometric line icons (24px) for navigation and equipment types. Avoid any illustrative or decorative icons; stick to functional metaphors (e.g., camera icon for photo evidence).