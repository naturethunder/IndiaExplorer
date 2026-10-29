---
name: react-bits
description: "Animated, interactive, and customizable React & Next.js components, backgrounds, and text animations from React Bits. Use when the user asks for animated React components, interactive landing page hero backgrounds, text effects (blur text, split text, wavy text), animated cards, docks, stacks, bento grids, tilt cards, particle backgrounds, or shadcn MCP registry integration for @react-bits."
---

# React Bits Component Library & Integration

React Bits is the largest open-source library of animated, interactive, and customizable React & Next.js components, backgrounds, and text effects built for modern web experiences.

## Official MCP & shadcn Integration

React Bits works with the shadcn component registry. To add components directly into your project via CLI:

```bash
# Initialize shadcn MCP or use shadcn CLI
npx shadcn@latest add @react-bits/<component-name>
```

To configure the registry manually in `components.json`:

```json
{
  "registries": {
    "@react-bits": "https://reactbits.dev/r/{name}.json"
  }
}
```

## Component Categories

### 1. Text Animations
- **SplitText**: Characters or words reveal with spring/fade physics.
- **BlurText**: Smooth blur-to-sharp animation on entrance.
- **WaveText**: Letter-by-letter wave motion.
- **ShinyText**: Shimmer / glossy light sweep across typography.
- **TrueFocus**: Interactive focus ring that follows mouse hover over text items.
- **DecryptedText**: Hacker/Matrix style random character decrypt animation.
- **RotatingText**: Morphing rotating headlines.

### 2. Interactive Backgrounds
- **Particles / Aurora**: Canvas or CSS based flowing gradients and particle fields.
- **Squares / GridBackground**: Interactive grid that lights up or ripples on cursor hover.
- **Hyperspeed**: Starfield warp-drive / light streak perspective animation.
- **Waves / Noise**: Organic GLSL/canvas liquid surfaces.
- **Ballpit**: Physics-driven bouncy balls interacting with gravity and pointer.

### 3. UI Components & Layouts
- **TiltedCard**: 3D tilt card with glare and parallax depth on mouse move.
- **SpotlightCard**: Card with radial gradient torch spotlight effect tracing the cursor.
- **Dock**: macOS-style magnification dock with elastic spring physics.
- **ElasticSlider**: Fluid slider with spring-back physics and haptic feel.
- **Stack**: Tinder/Deck-style stacked interactive swipe cards.
- **Folder / FlowingMenu**: Organic menu reveal and interactive tab containers.

## Best Practices & Requirements

1. **Framework Requirements**:
   - React 18+ or Next.js App Router (mark with `"use client"` when using browser hooks or canvas).
   - Tailwind CSS for styling and utility classes.
   - Framer Motion (`framer-motion`) for spring transitions and gesture drag states.
   - Lucide React or native SVGs for icons.

2. **Accessibility & Reduced Motion**:
   - Always wrap continuous motion or heavy parallax with `prefers-reduced-motion` checks.
   - Maintain accessible text contrast (WCAG AAA / AA 4.5:1 ratio) over animated backgrounds.
   - Ensure interactive cards and buttons remain keyboard accessible (Tab navigation + focus rings).

3. **Performance Optimization**:
   - Use CSS transforms (`translate3d`, `scale`) rather than triggering layout reflows (`top`, `left`, `width`).
   - Pause or throttle offscreen canvas animations using `IntersectionObserver`.
   - Apply `will-change: transform` judiciously during active animations.
