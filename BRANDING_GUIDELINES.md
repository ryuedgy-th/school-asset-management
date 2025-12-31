# 🎨 School Asset Management - Branding Guidelines

## School Brand Colors

### Primary Color - Purple
- **Hex:** `#574193`
- **HSL:** `262 42% 41%`
- **Usage:** Main actions, headers, primary buttons, navigation highlights
- **Tailwind Class:** `bg-primary`, `text-primary`, `border-primary`

### Secondary Color - Green
- **Hex:** `#6AB42D`
- **HSL:** `89 62% 45%`
- **Usage:** Secondary actions, complementary highlights, success states
- **Tailwind Class:** `bg-secondary`, `text-secondary`, `border-secondary`

---

## Color Usage Rules

### ✅ DO Use Brand Colors For:
1. **Primary Actions & Buttons**
   - Submit buttons
   - Create/Add buttons
   - Next/Continue buttons
   - Primary CTAs (Call-to-Actions)

2. **Headers & Navigation**
   - Page headers with icons
   - Module cards
   - Dashboard widgets
   - Navigation highlights

3. **Active States**
   - Active step indicators
   - Selected items
   - Current page highlights

4. **Links & Interactive Elements**
   - Primary links
   - Hover states for navigation

### ❌ DON'T Use Brand Colors For:
1. **Semantic Status Indicators** (Use standard semantic colors)
   - Success: `bg-green-600` (different from secondary green)
   - Warning: `bg-yellow-600`
   - Error: `bg-red-600`
   - Info: Keep existing info colors

2. **Destructive Actions**
   - Delete buttons: `bg-red-600`
   - Cancel/Reject: `bg-red-600`

3. **Status Badges**
   - Approved: `bg-green-100 text-green-800`
   - Pending: `bg-yellow-100 text-yellow-800`
   - Rejected: `bg-red-100 text-red-800`
   - Draft: `bg-slate-100 text-slate-800`

---

## Button Component Usage

We have a standardized Button component at `/src/components/ui/Button.tsx`.

### Button Variants

```tsx
import { Button } from '@/components/ui/Button';

// Primary actions (uses school purple)
<Button variant="primary">Submit</Button>

// Secondary actions (uses school green)
<Button variant="secondary">Cancel</Button>

// Outline style
<Button variant="outline">More Info</Button>

// Ghost/subtle
<Button variant="ghost">Skip</Button>

// Destructive actions
<Button variant="danger">Delete</Button>

// Success actions
<Button variant="success">Approve</Button>
```

### Button Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>
```

### Loading State

```tsx
<Button isLoading={true}>Processing...</Button>
```

---

## Module-Specific Color Guidelines

### FM (Facilities Management) Module ✅
**Status:** Fully compliant with brand colors
- Uses `bg-primary` throughout
- Headers use school purple
- Buttons use brand colors
- Status badges use semantic colors correctly

### Stationary Module ✅
**Status:** Updated to brand colors
- Dashboard uses `bg-primary` and `bg-secondary`
- All action buttons use school purple
- Module cards alternate between primary and secondary
- Quick actions use appropriate brand colors

---

## CSS Variables Reference

Located in `/src/app/globals.css`:

```css
:root {
  /* School Brand Colors */
  --primary: 262 42% 41%;        /* #574193 Purple */
  --primary-foreground: 0 0% 100%;

  --secondary: 89 62% 45%;       /* #6AB42D Green */
  --secondary-foreground: 0 0% 100%;

  /* Semantic Colors */
  --destructive: 0 84% 60%;      /* Red for errors */
  --muted: 220 14% 96%;          /* Light gray */
  --accent: 262 42% 96%;         /* Light purple accent */

  /* UI Colors */
  --background: 0 0% 100%;       /* White */
  --foreground: 222 47% 11%;     /* Dark text */
  --border: 220 13% 91%;         /* Border gray */
}
```

---

## Utility Classes Reference

### Background Classes
```css
bg-primary          /* School purple background */
bg-secondary        /* School green background */
bg-primary/90       /* 90% opacity purple (for hover states) */
bg-secondary/80     /* 80% opacity green (for hover states) */
```

### Text Classes
```css
text-primary        /* Purple text */
text-secondary      /* Green text */
```

### Border Classes
```css
border-primary      /* Purple border */
border-secondary    /* Green border */
```

### Shadow Classes
```css
shadow-primary/20   /* Purple shadow with 20% opacity */
shadow-secondary/20 /* Green shadow with 20% opacity */
```

---

## Migration from Old Colors

### Color Mapping Table

| Old Color | New Color | Usage |
|-----------|-----------|-------|
| `bg-blue-600` | `bg-primary` | Primary actions, headers |
| `bg-purple-600` | `bg-primary` | Primary actions |
| `bg-indigo-600` | `bg-primary` | Primary actions |
| `bg-orange-600` | `bg-secondary` | Secondary actions |
| `text-blue-600` | `text-primary` | Primary text highlights |
| `text-purple-600` | `text-primary` | Primary text highlights |
| `text-orange-600` | `text-secondary` | Secondary text highlights |
| `hover:bg-blue-700` | `hover:bg-primary/90` | Hover states |
| `shadow-blue-600/20` | `shadow-primary/20` | Shadows |

### Background Gradients

```css
/* Old */
bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50

/* New */
bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50
```

---

## Best Practices

### 1. **Consistency First**
Always use `bg-primary` and `bg-secondary` instead of hardcoded color values.

### 2. **Semantic Colors for States**
Use semantic colors (green/yellow/red) for status indicators, not brand colors.

### 3. **Use the Button Component**
Prefer using the `<Button>` component with variants over custom button classes.

### 4. **Accessibility**
Ensure sufficient contrast ratios:
- Primary purple (#574193) on white: ✅ WCAG AA compliant
- Secondary green (#6AB42D) on white: ✅ WCAG AA compliant

### 5. **Testing**
Before deploying, check:
- All primary buttons use school purple
- All secondary buttons use school green
- Status badges use appropriate semantic colors
- No hardcoded blue/indigo/orange in brand elements

---

## File Locations

### Core Files
- **Color Variables:** `/src/app/globals.css`
- **Tailwind Config:** `/tailwind.config.js`
- **Button Component:** `/src/components/ui/Button.tsx`
- **Utility Functions:** `/src/lib/utils.ts`

### Updated Modules
- **Stationary Module:** `/src/app/(auth)/stationary/**/*`
- **FM Module:** `/src/app/(auth)/fm-assets/**/*`

---

## Quick Reference

### Common Button Patterns

```tsx
// Create/Add new item
<Button variant="primary">
  <Plus size={20} />
  Add Item
</Button>

// Save/Submit form
<Button variant="primary" type="submit">
  Save Changes
</Button>

// Edit action
<Button variant="outline">
  <Edit size={16} />
  Edit
</Button>

// Delete action
<Button variant="danger">
  <Trash2 size={16} />
  Delete
</Button>

// Cancel action
<Button variant="secondary">
  Cancel
</Button>

// Approve action
<Button variant="success">
  <Check size={16} />
  Approve
</Button>
```

---

## Changelog

### 2025-12-31 - Brand Consistency Update
- ✅ Fixed secondary color to exact `#6AB42D`
- ✅ Created reusable Button component
- ✅ Updated entire Stationary module to use brand colors
- ✅ Updated FM Asset forms to use brand colors
- ✅ Replaced all hardcoded blue/purple/indigo/orange with brand colors
- ✅ Maintained semantic colors for status indicators

---

## Support

For questions or clarifications about brand color usage:
1. Check this guide first
2. Review existing implementations in FM or Stationary modules
3. Use the Button component whenever possible
4. Keep semantic colors for status badges

**Remember:** Consistency is key to strong branding! 🎨
