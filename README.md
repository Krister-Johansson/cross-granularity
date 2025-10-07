# Cross-Granularity Time Series Viewer

A Next.js application for viewing time series data with dynamic resolution and date range selection. Built with TypeScript, Luxon for date handling, Recharts for visualization, and shadcn/ui components.

## Features

- **Multiple Time Presets**: Quick access to 1 week, 1 month, 3 months, 6 months, and 1 year views
- **Custom Date Range**: Pick any arbitrary date range with a calendar picker
- **Dynamic Resolution**: Switch between hour, day, week, month, and year granularities
- **Smart Navigation**: Prev/Next buttons that maintain context and move by the appropriate time span
- **Today Button**: Instantly return to the current time period
- **URL State Management**: All settings persist in the URL for easy sharing and bookmarking
- **Empty States**: Beautiful UI feedback when no data is available

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Architecture

### Core Concepts

#### 1. **endAnchor** - The Navigation Foundation

The `endAnchor` is a timestamp that pins the right edge of the chart's visible range. This is the key to predictable navigation:

- **Purpose**: Ensures that switching resolutions or navigating doesn't cause unexpected "sliding"
- **Usage**: All date range calculations are derived from `(preset/custom duration) + endAnchor + resolution`
- **Analogy**: Think of it as a bookmark at the end of what you're viewing. You can zoom (change resolution) or flip pages (next/prev), but the bookmark stays put

**Example**:

- Preset: 6 months, Resolution: week, endAnchor: Oct 6, 2025 21:23
- Result: Shows the last 6 months ending at Oct 6, labeled in weeks
- Click "Next": Moves endAnchor +6 months, re-snaps to weeks
- Switch to "Month" view: Same endAnchor, just relabeled into months

#### 2. **State Management** (`lib/timeSeriesContext.tsx`)

The `TimeSeriesContext` manages all application state:

```typescript
interface TimeSeriesState {
  startDate: string; // ISO timestamp - computed from preset/custom + resolution
  endDate: string; // ISO timestamp - computed from preset/custom + resolution
  resolution: DateTimeUnit; // 'hour' | 'day' | 'week' | 'month' | 'year'
  selectedPreset: string | null; // '1w' | '1m' | '3m' | '6m' | '1y' | 'custom' | null
  endAnchor: string; // ISO timestamp - the stable reference point
  from?: string; // ISO timestamp - custom range start (semantic)
  to?: string; // ISO timestamp - custom range end (semantic)
}
```

**Key Functions**:

- **`setParams(params)`**: Single function to update any combination of state values atomically
- **`computeRangeFromPreset(presetKey, endAnchorISO, resolution, tz)`**: Calculates startDate/endDate from preset configuration
- **`computeRangeFromCustom(fromISO, toISO, resolution, tz)`**: Calculates startDate/endDate from custom range

### Helper Functions

#### `computeRangeFromPreset`

Computes the visible date range for preset-based views:

1. Takes the preset's duration (e.g., `{ months: 6 }`)
2. Calculates semantic span: `endAnchor - duration` to `endAnchor`
3. Snaps edges to resolution buckets using `startOf(resolution)` and `endOf(resolution)`
4. Special case: 1-week preset in day resolution = exactly 7 days

```typescript
// Example: 1-month preset, day resolution, endAnchor = "2025-10-15T12:00:00"
// → startDate = "2025-09-15T00:00:00" (start of day)
// → endDate = "2025-10-15T23:59:59" (end of day)
```

#### `computeRangeFromCustom`

Computes the visible date range for custom date selections:

1. Takes user-selected `from` and `to` dates
2. Snaps both to resolution buckets
3. Returns bucketized startDate/endDate

```typescript
// Example: from = "2025-10-13", to = "2025-10-27", resolution = "week"
// → startDate = "2025-10-13T00:00:00" (start of week)
// → endDate = "2025-11-02T23:59:59" (end of week covering Oct 27)
```

### Navigation Logic

#### Preset Navigation

Uses the preset's calendar-aware duration:

```typescript
const stepPresetWindow = (direction: 'minus' | 'plus') => {
  const dur = presetConfig[selectedPreset].duration; // e.g., { months: 1 }
  const anchor = DateTime.fromISO(endAnchor, { zone: timezone });
  const nextEndAnchor =
    direction === 'plus' ? anchor.plus(dur) : anchor.minus(dur);

  // Recompute range with new anchor
  const { startDate, endDate } = computeRangeFromPreset(
    selectedPreset,
    nextEndAnchor,
    resolution,
    timezone
  );
  setParams({ endAnchor: nextEndAnchor, startDate, endDate });
};
```

#### Custom Range Navigation

Uses the literal span between `from` and `to`:

```typescript
const stepCustomWindow = (direction: 'minus' | 'plus') => {
  const fromDT = DateTime.fromISO(from, { zone: timezone });
  const toDT = DateTime.fromISO(to, { zone: timezone });
  const span = toDT.diff(fromDT); // Calculate the duration

  const shift = direction === 'plus' ? span : span.negate();

  const nextFrom = fromDT.plus(shift);
  const nextTo = toDT.plus(shift);

  // Recompute range with new from/to
  const { startDate, endDate } = computeRangeFromCustom(
    nextFrom.toISO(),
    nextTo.toISO(),
    resolution,
    timezone
  );
  setParams({
    from: nextFrom.toISO(),
    to: nextTo.toISO(),
    endAnchor: nextTo.toISO(),
    startDate,
    endDate,
  });
};
```

#### Today Button

Resets the view to center on "now":

**For Presets**:

```typescript
const nowISO = DateTime.now().setZone(timezone).toISO();
const { startDate, endDate } = computeRangeFromPreset(
  selectedPreset,
  nowISO,
  resolution,
  timezone
);
setParams({ startDate, endDate, endAnchor: nowISO });
```

**For Custom Range**:

```typescript
const span = DateTime.fromISO(to).diff(DateTime.fromISO(from));
const newTo = DateTime.now().setZone(timezone).toISO();
const newFrom = DateTime.fromISO(newTo).minus(span).toISO();
// Shifts the custom window so 'to' equals now, maintaining the same span
```

### Preset Configuration (`lib/presets.ts`)

Each preset defines:

```typescript
interface PresetConfig {
  label: string; // Display name
  description: string; // UI hint
  defaultResolution: DateTimeUnit; // Initial resolution
  allowedResolutions: DateTimeUnit[]; // Available resolutions
  duration: DurationLikeObject; // Calendar-aware duration
  getPreset: () => { startDate: string; endDate: string }; // Initial view
}
```

**Example**:

```typescript
'1w': {
  label: '1 Week',
  description: '2 days past, 5 days future',
  defaultResolution: 'day',
  allowedResolutions: ['day', 'hour'],
  duration: { weeks: 1 }, // Used for navigation
  getPreset: () => {
    const now = DateTime.now();
    return {
      startDate: now.minus({ day: 2 }).toISO(),
      endDate: now.plus({ day: 5 }).toISO(),
    };
  },
}
```

### API Route (`app/api/time-series/route.ts`)

Returns time series data bucketed by the requested resolution:

**Request Parameters**:

- `startDate`: ISO timestamp
- `endDate`: ISO timestamp
- `resolution`: 'hour' | 'day' | 'week' | 'month' | 'year'

**Response**:

```typescript
{
  buckets: [
    { timestamp: "2025-10-01T00:00:00", value: 42, label: "Day 1" }
  ],
  metadata: {
    startDate: "2025-10-01T00:00:00",
    endDate: "2025-10-07T23:59:59",
    resolution: "day",
    totalHourlyPoints: 168
  }
}
```

## Key Design Decisions

### 1. **Always Update endAnchor on Navigation**

Every navigation action updates the endAnchor to maintain a stable reference point.

### 2. **Calendar-Aware Durations**

Presets use Luxon's `DurationLikeObject` (e.g., `{ months: 1 }`) which respects calendar boundaries and DST transitions.

### 3. **Timezone Consistency**

All DateTime operations specify the timezone explicitly: `DateTime.fromISO(date, { zone: timezone })`

### 4. **Bucket Alignment**

Date ranges are always snapped to complete resolution buckets using `startOf(resolution)` and `endOf(resolution)`.

### 5. **URL as Source of Truth**

All state is synced to URL parameters, making the app shareable and bookmarkable.

### 6. **Atomic State Updates**

The single `setParams()` function prevents race conditions from multiple sequential setState calls.

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Luxon** - Date/time manipulation
- **Recharts** - Chart visualization
- **shadcn/ui** - UI component library
- **Tailwind CSS v4** - Styling
- **TanStack Query** - Data fetching

## Project Structure

```
app/
├── api/time-series/route.ts    # API endpoint for fetching data
├── components/
│   ├── ActionButtons.tsx       # Action toolbar
│   ├── BottomSummaryBar.tsx    # Date range summary
│   ├── CustomRangePicker.tsx   # Custom date range selector
│   ├── PresetButtons.tsx       # Preset selection buttons
│   ├── TimeNavigationControls.tsx # Navigation + resolution selector
│   └── TimeSeriesChart.tsx     # Chart visualization
├── page.tsx                    # Main page
└── providers.tsx               # Query client provider

lib/
├── presets.ts                  # Preset configurations
├── timeSeries.ts               # Data fetching logic
├── timeSeriesContext.tsx       # Global state management
└── utils.ts                    # Utility functions

components/ui/                  # shadcn/ui components
```

## Development

### Run Linter

```bash
npm run lint
```

### Find Unused Code

```bash
npm run knip
```

### Build for Production

```bash
npm run build
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Luxon Documentation](https://moment.github.io/luxon/)
- [Recharts Documentation](https://recharts.org/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

## License

MIT
