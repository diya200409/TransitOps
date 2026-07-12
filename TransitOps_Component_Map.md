# TransitOps Frontend Component Map

> Quick reference for all shared components and their props.

---

## Layout Components

### `AppLayout`
Main shell. Renders Sidebar + TopBar + `<Outlet />` for child routes.
- Mobile: hamburger-triggered drawer
- Desktop: persistent collapsible sidebar

### `Sidebar`
Collapsible left nav. Props: none (reads from AuthContext).
- Active route highlighting via `NavLink`
- Collapse to icon-only on toggle
- Shows user info + logout at bottom

### `TopBar`
Top header bar. Props: `onMenuClick` (fn).
- Breadcrumb title from current route
- User dropdown with logout
- Hamburger (mobile only)

---

## Common Components

### `KPICard`
| Prop | Type | Description |
|---|---|---|
| `icon` | Lucide component | Icon displayed in the card |
| `label` | string | Metric name |
| `value` | number \| string | The KPI value |
| `accent` | string | Tailwind bg class for icon box |
| `loading` | bool | Shows skeleton when true |

### `StatusBadge`
| Prop | Type | Description |
|---|---|---|
| `status` | string | e.g. `"Available"`, `"On Trip"` |

Color map defined in `constants/vehicleStatus.js` and `constants/driverStatus.js`.

### `DataTable`
| Prop | Type | Description |
|---|---|---|
| `columns` | array | `{ key, header, render?, sortable? }` |
| `rows` | array | Data objects |
| `loading` | bool | Shows skeleton rows |
| `error` | string | Shows error + retry |
| `empty` | object | `{ title, description, action }` |
| `rowKey` | fn | `(row) => uniqueKey` |

### `Modal`
| Prop | Type | Description |
|---|---|---|
| `open` | bool | Controls visibility |
| `onClose` | fn | Called on backdrop click or Escape |
| `title` | string | Header title |
| `size` | `sm\|md\|lg\|xl` | Max width |

### `FormField`
| Prop | Type | Description |
|---|---|---|
| `label` | string | Field label |
| `name` | string | Input name/id |
| `type` | string | `text\|number\|date\|select\|textarea` |
| `value` | any | Controlled value |
| `onChange` | fn | Change handler |
| `error` | string | Inline error message |
| `options` | array | For `type="select"` |

### `ConfirmDialog`
| Prop | Type | Description |
|---|---|---|
| `open` | bool | |
| `onClose` | fn | |
| `onConfirm` | fn | |
| `title` | string | Dialog title |
| `message` | string | Body text |
| `loading` | bool | Disables buttons |

### `SearchBar`
| Prop | Type | Description |
|---|---|---|
| `onChange` | fn | Called with search string (debounced 300ms) |
| `placeholder` | string | Input placeholder |

### `FilterBar`
| Prop | Type | Description |
|---|---|---|
| `filters` | array | `{ key, label, options[] }` |
| `values` | object | Current filter values |
| `onChange` | fn | `(key, value) => void` |

### `EmptyState`
| Prop | Type | Description |
|---|---|---|
| `title` | string | Heading |
| `description` | string | Subtext |
| `action` | object | `{ label, onClick }` CTA button |

### `LoadingSpinner`
| Prop | Type | Description |
|---|---|---|
| `size` | `sm\|md\|lg` | Spinner size |
| `center` | bool | Wraps in centered flex container |

### `Toast` (via `useToast` hook)
```js
const toast = useToast()
toast({ type: 'success', message: 'Vehicle created.' })
toast({ type: 'error',   message: 'Failed to delete.' })
```

---

## Status Color Reference

### Vehicle Statuses
| Status | Color |
|---|---|
| Available | Green |
| On Trip | Blue |
| In Shop | Amber |
| Retired | Gray |

### Driver Statuses
| Status | Color |
|---|---|
| Available | Green |
| On Trip | Blue |
| Off Duty | Slate |
| Suspended | Red |

---

*Last updated: Phase 1*
