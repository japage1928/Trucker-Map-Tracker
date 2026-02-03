# Truck Locations PWA

A clean, structured input/output database web application for semi-truck pickup and delivery locations. Built as a Progressive Web App (PWA) with local-first persistence.

## Features
- **Local-First Data**: All locations and pins are stored locally on your device using IndexedDB. Works offline!
- **Interactive Maps**: Visualize facility locations with custom pins for Entries and Exits. Uses OpenStreetMap (no API key required).
- **Structured Data**: detailed fields for trucking operations (SOP, Dock Type, Parking, Hours).
- **Installable**: Add to your home screen for a native app-like experience.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser at `http://localhost:5000` (or port 0.0.0.0:5000 in Replit).

## PWA Installation
- **Mobile (iOS/Android)**: Open in Safari/Chrome, tap "Share" or "Menu", then select "Add to Home Screen".
- **Desktop (Chrome/Edge)**: Click the install icon in the address bar.

## Usage
- **Add Location**: Click the "+" button to create a new facility record.
- **Edit Map**: In the location editor, use the map to place the Facility pin (fixed) and add draggable Entry/Exit pins.
- **Offline**: The app caches resources and data, allowing full functionality without an internet connection (maps may require caching or connection for tiles).

## Tech Stack
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Shadcn UI
- **Maps**: Leaflet, React Leaflet, OpenStreetMap
- **Storage**: IndexedDB (via `idb` library)
- **Backend Structure**: Express, Drizzle ORM (included for future sync capabilities, currently used for serving the app)

## Project Structure
- `client/src`: Frontend source code
  - `lib/idb-storage.ts`: Local database logic
  - `components/`: UI components
  - `pages/`: Application routes
- `shared/`: Shared TypeScript schemas (Data Model)
- `server/`: Backend server (Express)

## License
MIT
