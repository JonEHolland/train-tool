# Sounder Train PWA

A lightweight Progressive Web Application for tracking Sound Transit Sounder train schedules in the Seattle/Puget Sound region.

## Features

- **Real-time departures** - View the next 3 trains per direction with countdown timers
- **Two routes** - N-Line (Everett-Seattle) and S-Line (Seattle-Tacoma)
- **Service alerts** - Live alerts from Sound Transit's GTFS Realtime feeds
- **Offline support** - Works without internet via Service Worker caching
- **Installable** - Add to home screen on iOS/Android as a native-like app
- **Single-file build** - Entire app compiles to one ~205KB HTML file

## Tech Stack

- React 18 + TypeScript
- Vite 6 with single-file output
- GTFS (General Transit Feed Specification) data
- PWA with Service Worker

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens development server with hot module replacement at `http://localhost:5173`.

### Build

```bash
npm run build
```

Compiles TypeScript, bundles with Vite, and updates Service Worker cache hash.

### Full Publish

```bash
npm run publish
```

Fetches latest GTFS data from Sound Transit and builds the app.

## Project Structure

```
src/
├── App.tsx              # Main component and schedule logic
├── schedule-data.json   # Processed GTFS schedule data
├── components/          # React UI components
│   ├── Header.tsx
│   ├── RouteSelect.tsx
│   ├── StopSelect.tsx
│   ├── TrainList.tsx
│   ├── AlertList.tsx
│   └── WeekendNotice.tsx
├── hooks/
│   └── useAlerts.ts     # Alert fetching hook
├── utils/
│   └── time.ts          # Time formatting utilities
└── types.ts             # TypeScript interfaces

scripts/
├── fetch-gtfs.ts        # Downloads & processes GTFS data
└── update-sw-hash.ts    # Updates SW cache version

public/
├── manifest.json        # PWA manifest
└── sw.js                # Service Worker
```

## Data Source

Schedule data is sourced from Sound Transit's GTFS feed:
- URL: `https://gtfs.sound.obaweb.org/prod/40_gtfs.zip`
- Service alerts: `https://s3.amazonaws.com/st-service-alerts-prod/alerts_pb.json`

Run `npm run fetch-data` to update schedule data.

## How It Works

1. **Schedule Processing** - The `fetch-gtfs.ts` script downloads and parses GTFS data, filtering for Sounder routes and building a compact JSON schedule
2. **Service Calculation** - The app determines active services based on calendar data, including weekday/weekend rules and holiday exceptions
3. **Train Display** - Shows next departures grouped by destination terminus, with countdown timers that refresh every 60 seconds
4. **Alerts** - Fetches service alerts every 5 minutes, filtered by selected route

## License

MIT
