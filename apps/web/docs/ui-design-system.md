# NexQA UI Design System

> Canonical reference for all UI primitives, tokens, and patterns used across the NexQA frontend.

---

## 1. Typography

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-headline-sm` | 18px | 600 | Page headers, modal titles |
| `text-title-md` | 16px | 600 | Card headings, section titles |
| `text-body-lg` | 16px | 400 | Section titles inside cards |
| `text-body-md` | 14px | 400 | Body text, form labels, tab labels |
| `text-body-sm` | 13px | 400 | Secondary text, table cells |
| `text-caption` | 12px | 400 | Timestamps, helper text |
| `text-label-sm` | 11px | 600 | Badges, KPI labels, small tags |
| `text-label-md` | 12px | 500 | Form labels |
| `text-code` | 12px / mono | 500 | IDs, monospace values |

### Font Stack
- **Application UI**: Inter (loaded via `next/font/google`)
- **Brand mark**: Manrope (only for the "NexQA" logotype in sidebar)

---

## 2. Color Tokens

### Semantic Surfaces
| Token | CSS Variable | Usage |
|-------|-------------|-------|
| `bg-card` | `--card` | Card backgrounds, modal containers |
| `bg-surface` | `--background` | Page background |
| `bg-surface-container-low` | `--surface-container-low` | Table headers, sidebar hover |
| `bg-surface-container` | `--surface-container` | Avatar circles, status badges |
| `bg-surface-container-high` | `--surface-container-high` | Active sidebar items |
| `text-on-surface` | `--on-surface` | Primary text |
| `text-on-surface-variant` | `--on-surface-variant` | Secondary text |
| `text-muted-foreground` | `--muted-foreground` | Tertiary/disabled text |
| `text-outline` | `--outline` | Timestamps, separators |

### Semantic Intent
| Token | Usage |
|-------|-------|
| `text-primary` / `bg-primary` | Primary actions, links |
| `text-success` / `bg-success` | Passed, completed, active |
| `text-error` / `bg-error` | Failed, critical, destructive |
| `text-warning` / `bg-warning` | Blocked, attention needed |
| `border-outline-variant` | All borders (cards, tables, inputs) |

---

## 3. Spacing System

**Base unit: 4px** (Tailwind default). Common patterns:

| Pattern | Value | Usage |
|---------|-------|-------|
| `gap-2` | 8px | Inline icon+text spacing |
| `gap-3` | 12px | Activity items, form rows |
| `gap-4` | 16px | Grid gaps, section spacing |
| `gap-6` | 24px | Major section gaps |
| `p-4` | 16px | Card padding |
| `p-6` | 24px | Page padding, modal body |
| `px-6 py-4` | 24/16px | Modal header/footer |

---

## 4. Border Radius

| Token | Size | Usage |
|-------|------|-------|
| `rounded-md` | 6px | Inputs, selects, table cells, tags |
| `rounded-lg` | 8px | Cards, modal containers, grouped sections |
| `rounded-xl` | 12px | FAB, large accent containers |
| `rounded-full` | 9999px | Badges, avatars, icon buttons |

---

## 5. Shadows

| Token | Usage |
|-------|-------|
| `shadow-subtle` | Cards, KPI cards |
| `shadow-card` | Active kanban columns |
| `shadow-elevated` | Modal containers, sidebars |
| `shadow-float` | FAB, notification popover |

---

## 6. Component Reference

### Button (`components/ui/button.tsx`)
- Variants: `default`, `secondary`, `outline`, `ghost`, `destructive`, `link`
- Sizes: `sm` (32px), `default` (40px), `lg` (48px), `icon` (40×40px)
- Supports `loading` prop for async actions
- Uses CVA for variant management

### Badge (`components/ui/badge.tsx`)
- 47 semantic variants covering all status/severity/priority states
- Font: `text-label-sm` (11px), `font-semibold`
- Height: 24px, pill-shaped (`rounded-full`)

### Card (`components/ui/card.tsx`)
- Uses `bg-card` semantic token (not hardcoded `bg-white`)
- Sub-components: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

### Input / Select / Textarea (`components/ui/input.tsx`)
- Height: 40px (`h-10`)
- Background: `bg-card`
- Border: `border-outline-variant`
- Focus: `focus:border-primary-container focus:ring-1 focus:ring-ring`

### Modal (`components/ui/modal.tsx`)
- React Portal injection into `document.body`
- Automatic body scroll lock on mount
- ESC key and backdrop click dismissal
- Sizes: `sm`, `md`, `lg`, `xl`, `2xl`
- Sub-components: `ModalHeader`, `ModalTitle`, `ModalBody`, `ModalFooter`
- `preventClose` prop for in-progress operations

### DataTable (`components/ui/data-table.tsx`)
- Sub-components: `TableHead`, `TableBody`, `TableRow`, `TableHeaderCell`, `TableCell`
- Header: `text-label-sm`, uppercase, sticky
- Row: `clickable` prop for hover + cursor-pointer
- Consistent border: `divide-outline-variant`

### PageContainer (`components/layout/page-container.tsx`)
- Variants: `default` (1280px), `wide` (1440px), `full` (100%)
- Responsive padding: `px-6 py-6`
- Vertical gap: `space-y-6`

### PageHeader (`components/layout/page-header.tsx`)
- Title: `text-headline-sm font-semibold`
- Subtitle: `text-body-md text-muted-foreground`
- Supports `actions` slot for buttons

### KpiCard (`components/ui/kpi-card.tsx`)
- Semantic border: `border-outline-variant`
- Hover: colored border accent via `hoverBorderColor` prop
- Label: `text-label-sm`
- Value: `text-headline-sm font-semibold`

### EmptyState (`components/ui/empty-state.tsx`)
- Icon + title + optional description
- Centered layout with muted styling

### StatusTabs (`components/ui/status-tabs.tsx`)
- Title-case labels (not ALL CAPS)
- Active tab: `text-primary border-b-2 border-primary`
- Badge count: inline pill

---

## 7. Layout Constants

| Constant | Value | Usage |
|----------|-------|-------|
| Sidebar width | 260px | `w-sidebar` / `pl-sidebar` |
| Header height | 64px | `h-header-height` |
| Content max-width | 1280px | PageContainer default |

---

## 8. Rules

1. **Never hardcode `bg-white`** — use `bg-card` or `bg-surface`
2. **Never use arbitrary text sizes** (`text-[10px]`, `text-[11px]`) — use tokens
3. **Never use `createPortal` for modals** — use the shared `Modal` component
4. **Never duplicate scroll-lock logic** — `Modal` handles it
5. **Always use `rounded-md` for inputs, `rounded-lg` for cards**
6. **Always use Lucide React for icons** — no other icon libraries
7. **Always use CVA for component variants**
8. **Keep the `destructive` button variant** — do not rename to `danger`
9. **Use Inter for all UI; Manrope only for the NexQA brand mark**
