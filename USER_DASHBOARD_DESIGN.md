# User Dashboard Design Documentation

## 🎨 Design Concept: "Personal Equipment Hub"

A beautiful, user-focused dashboard that makes equipment tracking feel personal and approachable.

### Aesthetic Direction
**Refined Educational with Organic Touches** - Using the school's purple (#574193) & green (#6AB42D) branding in a modern, welcoming way that feels both professional and friendly.

---

## ✨ Key Features

### 1. **Personalized Hero Header**
- Time-aware greeting (Good Morning/Afternoon/Evening)
- User name prominently displayed
- Department affiliation
- Animated gradient background with school colors
- Decorative pattern overlay
- Quick stats cards showing:
  - Items in Use
  - Active Assignments
  - Total Assignments
  - Completed Assignments

### 2. **Action Required Alert**
- Bright amber/orange gradient for visibility
- Shows count of unsigned transactions
- Direct "Sign Now" button linking to assignments
- Pulse animation to draw attention

### 3. **Your Equipment Section**
- Visual card grid showing currently borrowed items
- Each card includes:
  - Asset image (or placeholder icon)
  - Asset name, brand, model
  - Asset code
  - Borrow date
  - Unsigned badge if signature pending
- Staggered slide-up animation on load
- Hover effects with smooth transitions
- Click-through to assignment details

### 4. **Quick Actions Sidebar**

**My Assignments Card** (Green gradient)
- Active count
- Completed count
- Total count
- "View All Assignments" button

**Help Card** (White with border)
- Contact support option
- User-friendly messaging

**Academic Year Info** (Purple gradient)
- Current year display
- Current term indicator

---

## 🎯 User Experience Highlights

### Visual Design
- **Typography**: Using Outfit font family (already configured)
- **Colors**:
  - Primary Purple: `#574193` (from branding)
  - Secondary Green: `#6AB42D` (from branding)
  - Warm accents for alerts (amber/orange)
  - Soft backgrounds with gradient overlays
- **Motion**:
  - Subtle pulse animations on decorative elements
  - Staggered card reveals (slideUp animation)
  - Smooth hover states
  - Transform/scale effects on interactive elements
- **Depth**:
  - Layered gradient backgrounds
  - Shadow variations
  - Backdrop blur effects
  - Border treatments

### Layout Strategy
- **Responsive Grid**: Desktop (3 columns), Tablet (2 columns), Mobile (1 column)
- **Generous Spacing**: Breathing room for clarity
- **Visual Hierarchy**: Large hero → Action alerts → Content grid
- **Asymmetric Balance**: 2-column main content + 1-column sidebar

---

## 🔄 User Flow

1. **User logs in** → Redirected to `/user-dashboard`
2. **Dashboard loads** with personalized greeting and stats
3. **If unsigned transactions exist** → Alert banner appears at top
4. **Equipment cards** display with visual indicators
5. **Click any card** → Navigate to assignment details
6. **Click "Sign Now"** → Navigate to assignments list
7. **Sidebar actions** → Quick navigation to key areas

---

## 📊 Data Displayed

### Stats Calculated
- `activeItems`: Count of borrowed items not yet returned
- `activeAssignments`: Count of assignments with status = 'Active'
- `totalAssignments`: Total number of user's assignments
- `closedAssignments`: Assignments with status = 'Closed'
- `unsignedTransactions`: Borrow transactions without signature

### Recent Borrows
- Shows up to 6 most recent borrowed items
- Filtered to show only active (not returned) items
- Sorted by borrow date (newest first)
- Includes asset details, transaction info, signature status

---

## 🛠 Technical Implementation

### Files Created
1. `/src/app/(auth)/user-dashboard/page.tsx` - Server component with data fetching
2. `/src/app/(auth)/user-dashboard/UserDashboardClient.tsx` - Client component with UI

### Modified Files
- `/src/app/(auth)/page.tsx` - Added redirect logic for regular users

### Key Logic
```typescript
// User role check
const isAdmin = ['Admin', 'Technician'].includes(user.userRole?.name || '');

// Redirect logic
if (!isAdmin) {
  redirect('/user-dashboard');
}
```

### Data Queries
- Fetches user's active assignments with nested relations
- Calculates active items by excluding returned items
- Identifies unsigned transactions
- Sorts and limits recent borrows

---

## 🎨 Design Principles Applied

1. **Intentional Color Use**: School branding colors dominate, used boldly in gradients
2. **Hierarchy Through Scale**: Large hero, medium content cards, small metadata
3. **Motion with Purpose**: Animations guide attention and provide delight
4. **Contextual Depth**: Gradients, shadows, and overlays create atmosphere
5. **Personal Touch**: User name, time-aware greeting, personalized stats
6. **Action Clarity**: Important actions (unsigned transactions) get visual priority

---

## 🌟 What Makes This Distinctive

### Avoids Generic "AI Slop"
- ✅ Custom gradient compositions (not generic purple-to-blue)
- ✅ Thoughtful font pairing (Outfit for both display and body)
- ✅ Context-specific language ("Your Equipment", not "Assets")
- ✅ Organic, flowing layouts (not rigid grid-only)
- ✅ Playful but professional animations
- ✅ School-specific branding integration

### Memorable Elements
1. **Hero gradient** with animated orbs in background
2. **Time-aware greeting** with sparkle icon
3. **Amber pulse alert** for urgent actions
4. **Staggered card reveals** on page load
5. **Green gradient sidebar** for assignments
6. **Soft purple info card** for academic year

---

## 📱 Responsive Behavior

### Desktop (1024px+)
- Full 3-column layout
- Large hero with stats bar
- 2-column equipment grid + 1-column sidebar

### Tablet (768px - 1023px)
- 2-column equipment grid
- Sidebar moves below on smaller tablets
- Hero stats remain 4-column

### Mobile (< 768px)
- Single column layout
- Hero stats become 2x2 grid
- Stacked equipment cards
- Sidebar sections stack vertically

---

## 🚀 Future Enhancements

Potential additions:
- Calendar view of borrowed equipment
- Return date reminders
- Equipment usage history graph
- Quick search/filter for borrowed items
- Dark mode variant
- Equipment recommendations based on past borrows

---

## 🎯 Success Metrics

This dashboard succeeds when:
- Users can quickly see what they have borrowed
- Unsigned transactions are immediately visible
- Navigation to assignments is intuitive
- Visual experience feels premium and professional
- Users feel ownership over "their" equipment

---

**Design Philosophy**: Make the mundane magical. Equipment tracking doesn't have to be boring - it can be beautiful, personal, and delightful.
