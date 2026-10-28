# Design Specification — Spotifast-Inspired Website

## 1. Project Goal

Recreate the visual design and user experience of https://spotifast.rocks/ as closely as practical.

Use the reference website to understand its layout, typography, spacing, colors, navigation, content hierarchy, screenshots, and responsive behavior.

This is a design reconstruction, not a request to copy the original source code.

**Important:** Inspect the existing project before changing anything. Preserve all existing functionality, backend integration, routes, authentication, and API calls.

## 2. Overall Design Philosophy

The design should feel:

- Minimal, modern, and lightweight.
- Clean and easy to navigate.
- Product-focused rather than excessively promotional.
- Technical, trustworthy, and documentation-friendly.
- Well organized, with generous whitespace.
- Consistent across desktop, tablet, and mobile.

Avoid unnecessary gradients, excessive animations, oversized cards, heavy shadows, and decorative elements that do not appear in the reference.

Prioritize visual accuracy over adding new design ideas.

## 3. Website Structure

Implement the following sections according to the reference website.

### A. Header and Navigation

Create a clean header with:

- Product logo or brand name on the left.
- Navigation links for the main website sections.
- Links to documentation, downloads, and other relevant pages.
- Appropriate spacing between navigation items.
- A responsive mobile navigation layout.

Requirements:

- Use consistent horizontal alignment.
- Keep the header visually lightweight.
- Use clear typography and subtle hover states.
- Ensure navigation links work.
- Do not invent destinations for links that are not implemented.

### B. Hero Section

The hero section should communicate the product's purpose immediately.

Include:

- A prominent heading.
- A concise description of the product.
- A primary call-to-action.
- A secondary link or call-to-action when appropriate.
- A relevant product screenshot or visual preview.

Design requirements:

- Establish a clear heading and body-text hierarchy.
- Keep the content width readable.
- Use balanced spacing between the heading, description, and actions.
- Preserve the reference's alignment and overall composition.
- Make the hero responsive without horizontal overflow.

Do not invent a screenshot if actual project assets are available.

### C. Product Features

Create a feature section describing the product's main capabilities.

Possible feature topics, based on the public Spotifast project, include:

- Music library and search.
- Spotify Connect.
- Themes and appearance customization.
- Desktop controls and keyboard shortcuts.
- Classic Winamp mini-player.
- Music visualizers.

Each feature should contain:

- An icon or suitable visual.
- A short heading.
- A concise description.

Use a consistent grid and spacing system. Match the reference's actual layout rather than automatically forcing every feature into a large card.

### D. Featured Product Sections

Create additional sections for important features.

Potential sections include:

**Classic Mini Player**
- Heading and explanatory text.
- Relevant product screenshot.
- Link to additional information.

**Music Visualizer**
- Heading and explanatory text.
- Relevant product screenshot.
- Link to additional information.

Use consistent typography, image proportions, and spacing throughout these sections.

Only include sections that are present on the reference website or are necessary for the existing project.

### E. Related Resources

Provide a clean section for related products, documentation, downloads, or project resources when present in the reference.

Keep these links visually secondary to the main hero action.

### F. Footer

Create a minimal footer containing relevant items such as:

- Product or creator attribution.
- Documentation links.
- Download links.
- Source repository link.
- Relevant legal or project information.

Use muted text and subtle separators where appropriate.

Do not add unnecessary columns or decorative elements.

## 4. Color System

Start with a restrained neutral palette and adjust it after inspecting the reference website.

Suggested CSS variables:

```css
:root {
  --color-background: #ffffff;
  --color-surface: #f7f8fa;
  --color-text: #202124;
  --color-text-secondary: #5f6368;
  --color-text-muted: #777d85;
  --color-border: #e5e7eb;
  --color-accent: #238636;
  --color-accent-hover: #1f7a30;
  --color-focus: #7cc98a;
}
```

These are starting values, not verified exact colors from the reference.

Requirements:

- Inspect the live website before finalizing the palette.
- Keep text and backgrounds readable.
- Use accent colors consistently.
- Avoid introducing unrelated colors.
- Keep all design tokens centralized.
- Implement a dark theme only if it matches the reference or is required by the existing project.

## 5. Typography

Use a clean sans-serif typeface.

Suggested font stack:

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Typography guidelines:

- Main heading: bold and visually prominent.
- Section headings: semibold or bold.
- Body text: regular weight and comfortable line-height.
- Navigation: compact and readable.
- Supporting text: slightly muted.
- Footer text: smaller but still accessible.

Suggested starting sizes:

| Element | Font size |
|---|---|
| Hero heading | 40–64px |
| Section heading | 24–32px |
| Feature heading | 18–22px |
| Body text | 16–18px |
| Navigation | 14–16px |
| Supporting text | 13–14px |

Adjust these sizes after comparing the implementation with the reference.

Use responsive typography with CSS `clamp()` when appropriate.

## 6. Layout and Spacing

Use a consistent layout system.

Suggested values:

```css
:root {
  --content-width: 1160px;
  --page-padding: 24px;

  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  --space-4xl: 80px;

  --radius-sm: 8px;
  --radius-md: 12px;
}
```

Requirements:

- Center the main content.
- Use a consistent maximum width.
- Keep section spacing consistent.
- Avoid unnecessarily long text lines.
- Align headings, images, and content to a shared grid.
- Maintain consistent spacing between related elements.
- Avoid arbitrary margins and padding throughout the application.

## 7. Images and Product Screenshots

Images are important to the product's visual identity.

Requirements:

- Inspect existing assets before creating replacements.
- Use actual product screenshots when available.
- Preserve image aspect ratios.
- Avoid stretching or distorting images.
- Use appropriate border radii.
- Apply borders or backgrounds only when visually necessary.
- Add descriptive alt text.
- Lazy-load images below the fold.

If the original screenshots are unavailable, use clearly identified placeholders until suitable assets are supplied.

## 8. Buttons and Links

Primary buttons should be visually clear without overpowering the page.

Implement:

- Default state.
- Hover state.
- Active state.
- Keyboard focus state.
- Disabled state when applicable.

Requirements:

- Use semantic links for navigation.
- Use buttons for actions.
- Maintain consistent heights, padding, and border radii.
- Keep labels concise.
- Ensure every visible action has a working destination or behavior.

Do not create decorative buttons that do nothing.

## 9. Responsive Design

The website must work at all common screen sizes.

### Desktop: 1024px and above

- Use the full navigation layout.
- Maintain the main content width.
- Display feature grids according to the reference.
- Preserve generous spacing.

### Tablet: 768px–1023px

- Reduce horizontal padding.
- Adjust grid columns.
- Keep images proportional.
- Prevent content from becoming cramped.

### Mobile: below 768px

- Use a single-column layout where appropriate.
- Provide a compact, functional navigation.
- Stack or wrap buttons when needed.
- Reduce oversized headings.
- Keep images within the viewport.
- Ensure text wraps naturally.
- Prevent horizontal scrolling.
- Maintain comfortable touch targets.

Test at widths of 1440px, 1024px, 768px, 390px, and 320px.

## 10. Animations and Interactions

Keep interactions subtle and purposeful.

- Use short transitions for links and buttons.
- Avoid unnecessary entrance animations.
- Avoid excessive parallax and moving backgrounds.
- Respect the user's reduced-motion preference.
- Ensure navigation and interactive controls work correctly.

Suggested transition:

```css
transition:
  color 160ms ease,
  background-color 160ms ease,
  border-color 160ms ease;
```

## 11. Accessibility

Follow accessibility best practices.

- Use semantic HTML.
- Maintain a logical heading hierarchy.
- Provide visible keyboard focus indicators.
- Use meaningful link text.
- Add appropriate image alt text.
- Maintain readable contrast.
- Ensure navigation works with a keyboard.
- Provide accessible labels for icon-only buttons.
- Respect reduced-motion preferences.

## 12. Implementation Rules for OpenCode

Before implementation:

1. Inspect the complete existing project structure.
2. Identify the frontend framework, routing, styling system, and component architecture.
3. Review existing pages and reusable components.
4. Identify existing images, logos, fonts, and other assets.
5. Inspect backend integration and identify behavior that must be preserved.
6. Examine the reference website at desktop and mobile widths.

During implementation:

1. Reuse existing components whenever appropriate.
2. Follow the project's existing coding conventions.
3. Create reusable components for repeated UI elements.
4. Keep styling organized and avoid unnecessary duplication.
5. Centralize design tokens.
6. Preserve working routes, API calls, authentication, and backend behavior.
7. Do not replace existing functionality with mock data.
8. Do not install unnecessary dependencies.
9. Do not rewrite the backend to achieve a frontend redesign.
10. Do not change unrelated files.

After implementation:

1. Run the available build command.
2. Run linting and tests when configured.
3. Fix any errors introduced by the changes.
4. Check the browser console for errors.
5. Test the page at desktop, tablet, and mobile widths.
6. Verify all navigation links and buttons.
7. Compare screenshots against the reference website.
8. Report the files changed, checks performed, and any remaining limitations.

## 13. Visual Accuracy Requirements

The final implementation should match the reference in:

- Overall page structure.
- Header height and alignment.
- Content width.
- Typography and line-height.
- Section spacing.
- Background and text colors.
- Button dimensions and appearance.
- Image placement and proportions.
- Feature grid layout.
- Footer spacing.
- Responsive behavior.

Do not claim pixel-perfect accuracy without comparing actual screenshots.

When a design detail is uncertain, inspect the reference or ask for a screenshot rather than inventing a confident answer.

## 14. Final Instruction

Treat the reference website as the primary visual source of truth.

First understand the existing project. Then implement the design using the project's existing technology and architecture.

The objective is a polished, responsive, maintainable frontend that closely reproduces the reference website's visual language while preserving all existing functionality.

Do not redesign the site according to personal preference. Prioritize reference accuracy, consistency, accessibility, and working behavior.
