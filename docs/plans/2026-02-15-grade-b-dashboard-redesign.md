# Grade B Dashboard Redesign

## Context

Grade B merchants have products published and store visitors (analytics data) but no orders yet. The previous Grade B dashboard showed a welcome banner, quick actions (redundant with sidebar), and an empty orders card -- none of which used the available viewport space effectively.

## Layout

Viewport-filling 2x3 grid matching Grade C pattern:

```
Row 1 (50%):  GradeBMetrics (9 cols)     |  Calendar (3 cols)
Row 2 (50%):  EmptyStateOrders (9 cols)   |  YouTubeEmbed (3 cols)
```

## Components

### GradeBMetrics (NEW) -- 9 cols, 50% height
Custom metrics card showing:
- Total store visits (count)
- Number of products (count)
- Store visits chart (line/area chart)

Fetches analytics overview and traffic data (same APIs as Grade C).

### EcommerceEventsCalendar (EXISTING) -- 3 cols, 50% height
Reused as-is. Same position as Grade C Row 1 right column.

### EmptyStateOrders (EXISTING) -- 9 cols, 50% height
Existing component with tips on getting first order. Passed `hasProducts` prop.

### YouTubeEmbed (NEW) -- 3 cols, 50% height
Compact Card with title and single hardcoded YouTube iframe. YouTube fullscreen handles the small size.

## Changes to overview-ecommerce-view.jsx
- Fetch analytics for Grade B (not just Grade C)
- Apply viewport-height container for Grade B
- Remove QuickActionsPanel, WelcomeNewUser, MotivationIllustration
- Wire up new 2x3 grid with GradeBMetrics, Calendar, EmptyStateOrders, YouTubeEmbed
