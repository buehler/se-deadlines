# Design System Strategy: The Academic Architect

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Archivist."** 

In an academic context, "clean" often risks becoming "sterile." This system avoids that pitfall by moving away from generic templates toward a high-end editorial experience. We treat academic deadlines not as a simple list, but as a prestigious data collection. 

The aesthetic is driven by **Intentional Asymmetry** and **Tonal Depth**. Instead of a rigid, centered grid, we use wide margins and staggered content blocks to create a sense of breathing room amidst dense information. We break the "Bootstrap" look by prioritizing negative space and layered surfaces over borders and lines. The result is a system that feels authoritative, sophisticated, and bespoke.

---

## 2. Colors & Surface Philosophy
The palette is a refined orchestration of deep academic blues (`primary`) and a sophisticated range of "Warm Greys" (`surface` tokens) that prevent the interface from feeling cold.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are prohibited for sectioning. 
Structure must be defined through **Background Shifting**. To separate a sidebar from a main feed, transition from `surface` to `surface-container-low`. To highlight a featured deadline, use `surface-container-high`. This creates a seamless, modern flow that guides the eye without "trapping" the data in boxes.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like fine vellum paper stacked on a heavy stone desk.
*   **Base:** `surface` (#fbf9f8)
*   **Secondary Content:** `surface-container-low` (#f6f3f2)
*   **Active Interactive Elements:** `surface-container-highest` (#e4e2e1)

### The "Glass & Gradient" Rule
To elevate the "Academic" feel to "Premium," use **Glassmorphism** for floating overlays (like deadline detail modals). Use `surface` at 80% opacity with a `backdrop-filter: blur(12px)`. 
For primary CTAs and Hero sections, apply a subtle linear gradient from `primary` (#06619c) to `primary_container` (#337ab7) at a 135-degree angle. This adds "visual soul" and depth that a flat hex code cannot provide.

---

## 3. Typography
We utilize **Inter** as our core typeface, chosen for its exceptional legibility in data-heavy environments. The hierarchy is designed to mimic a high-end research journal.

*   **Display & Headlines:** Use `display-md` for page titles. The large scale creates a bold, editorial anchor.
*   **Data Titles:** Use `title-md` for deadline names. It provides enough weight to stand out against dense metadata.
*   **The "Information Layer":** Use `body-sm` and `label-md` for metadata (dates, tags, submission links). 
*   **Hierarchy Note:** Always maintain a high contrast between the `headline` (using `on_surface`) and the `body` (using `on_surface_variant`). This tonal shift signals importance more effectively than font weight alone.

---

## 4. Elevation & Depth
In this system, depth is a functional tool for organization, not just an aesthetic choice.

*   **The Layering Principle:** Place a `surface-container-lowest` card (#ffffff) on top of a `surface-container` (#f0eded) background. The subtle 2-step jump in lightness creates a "soft lift" that is easier on the eyes than a drop shadow.
*   **Ambient Shadows:** If an element must float (e.g., a "Create New Deadline" FAB), use a custom shadow: `box-shadow: 0 12px 32px -4px rgba(6, 97, 156, 0.08)`. Notice the shadow is tinted with the `primary` color, creating a natural, ambient glow.
*   **The "Ghost Border" Fallback:** If a container requires a boundary (e.g., in high-density tables), use the `outline_variant` token at **15% opacity**. Never use 100% opacity borders.

---

## 5. Components

### Buttons
*   **Primary:** Linear gradient (`primary` to `primary_container`), `DEFAULT` (0.25rem) roundedness, and `on_primary` text.
*   **Secondary:** `surface_container_high` background with `primary` text. No border.
*   **States:** On hover, increase the elevation through a subtle tonal shift (e.g., move from `primary` to `primary_fixed_dim`).

### Cards & Lists
*   **Strict Rule:** No dividers. Use **Vertical White Space** (Spacing `8` or `10`) to separate list items. 
*   **Structure:** Use `surface_container_low` for the list background and `surface_container_lowest` for individual cards to create a "nested" effect.

### Input Fields
*   **Styling:** Use a "bottom-line only" approach or a soft-filled background (`surface_container_high`). 
*   **Focus State:** Transition the background to `primary_fixed` and add a 2px `primary` underline.

### Deadline Tracker Specifics: "The Urgency Scale"
*   **Standard:** Use `secondary` (#34618d) for typical deadlines.
*   **Imminent:** Use `tertiary` (#313bff) to draw focused attention.
*   **Overdue:** Use `error` (#ba1a1a) but pair it with `error_container` as the background to maintain the "Academic" softness.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical margins (e.g., 10% left, 20% right) to create an editorial layout.
*   **Do** leverage `surface-variant` for "de-emphasized" information like archived deadlines.
*   **Do** use `letter-spacing: -0.02em` on `display` and `headline` tokens to give typography a tighter, premium feel.

### Don't
*   **Don't** use 1px solid black or dark grey borders. Ever.
*   **Don't** use standard "drop shadows" (0,0,5,0 #000). Always use tinted, diffused ambient shadows.
*   **Don't** crowd the data. If the information is dense, increase the `spacing` tokens between containers to allow the user to mentally "batch" the information.