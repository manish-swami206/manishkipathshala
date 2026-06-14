# Design System — Manish Ki Pathshala

## Brand Colors

| Token          | Value        | Usage                              |
|----------------|-------------|-------------------------------------|
| Primary        | `#7c3aed`   | Buttons, links, active states      |
| Primary Hover  | `#6d28d9`   | Button hover states                |
| Violet-600     | `#7c3aed`   | Header, Footer branding, badges    |
| Violet-700     | `#6d28d9`   | Darker shade for hover/gradient    |
| Background     | `#f8fafc`   | Page background (gray-50)          |
| Surface        | `#ffffff`   | Cards, modals, sheets              |
| Foreground     | `#1e293b`   | Primary text color                 |
| Muted          | `#64748b`   | Secondary text, labels             |
| Border         | `#e2e8f0`   | Card borders, dividers             |

## Typography

- **Font Family:** `Plus Jakarta Sans` (headings), `Inter` (body)
- **Headings:** Extra bold (800) or bold (700)
- **Body:** Regular (400) or medium (500) at 14-16px
- **Small text:** 12px, semibold for labels and metadata

## Component Styling

| Component  | Border Radius | Shadow                    |
|-----------|---------------|---------------------------|
| Cards     | `rounded-2xl` | `shadow-sm`               |
| Buttons   | `rounded-xl`  | Inset or `shadow-md`      |
| Inputs    | `rounded-xl`  | `border border-border`    |
| Dialogs   | `rounded-2xl` | `shadow-xl`               |
| Tables    | `rounded-2xl` | `shadow-sm` with overflow |
| Badges    | `rounded-full` or `rounded-md` | -             |

## Admin Panel

- **Sidebar:** White background, indigo-50 active state
- **Header:** White with backdrop blur, breadcrumb nav
- **Primary Actions:** `bg-violet-600 hover:bg-violet-700 text-white`
- **Danger Actions:** `bg-red-600 hover:bg-red-700 text-white`
- **Data Tables:** White card with `bg-gray-50/70` header row

## Spacing & Layout

- **Page max-width:** `max-w-6xl`
- **Page padding:** `p-4 md:p-8` (responsive)
- **Section gap:** `space-y-6`
- **Grid:** `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (common)

## Animations (Framer Motion)

- **Page transitions:** `{ opacity: 0, y: 12 }` → `{ opacity: 1, y: 0 }`
- **Table rows:** Staggered entry with `delay: i * 0.05`
- **Hover:** `scale: 1.02-1.08` with spring physics
- **Tap:** `scale: 0.92-0.97` with spring physics
- **Duration:** 0.25-0.45s, `ease: [0.22, 1, 0.36, 1]`

## SEO Defaults

- **Title format:** `{Page Name} | Manish Ki Pathshala`
- **Description:** Educational platform for UPSC, SSC, RAS, and competitive exams
- **Open Graph:** Include OG title, description, image
- **Keywords:** UPSC, SSC, RAS, RRB, competitive exams, India, study material
