# Trucker Buddy PWA

## Overview

A Progressive Web App for semi-truck drivers to manage pickup and delivery location data. The application supports both local-first storage (IndexedDB) and server-side persistence with user authentication. Users can create, view, and edit facility records with detailed trucking-specific information (dock types, parking instructions, hours of operation) and place custom entry/exit pins on interactive maps.

The architecture supports multiple facility types (warehouses, truck stops, rest areas, parking) and includes predefined seeded POIs. User authentication enables private location storage per user.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Trucker Buddy AI Chat (Feb 2026)
- Added /chat route with AI-powered chat assistant
- Uses OpenAI via Replit AI Integrations (no API key required)
- Trucker-specific personality: casual tone, uses miles, references CDL/HOS rules
- Voice-to-text input using Web Speech API for hands-free use
- Location-aware responses when user grants GPS permission
- Streaming responses for real-time conversation feel
- Conversation history stored in PostgreSQL (conversations, messages tables)
- New files: server/trucker-ai.ts, client/src/pages/ChatPage.tsx

### Crowdsourced Fullness Reports (Feb 2026)
- Added fullness_reports table for user-submitted stop availability
- Status options: empty, moderate, limited, full
- API endpoints: POST /api/fullness-reports, GET /api/fullness-reports/:locationId
- Returns aggregated counts and recent reports (last 24 hours)
- Future integration with Google Maps traffic data for AI predictions

### Marker Clustering & Expanded Data (Feb 2026)
- Added marker clustering to map using leaflet.markercluster
- Nearby pins group into numbered orange clusters that expand on zoom
- ClusteredMap component (client/src/components/ClusteredMap.tsx) replaces basic map view
- Expanded seeded data: 1,592 real US locations with strong Southeast coverage
- Data sourced from OpenStreetMap via regional Overpass API queries
- New file: fetch-osm-truck-stops.ts for fetching additional locations

### Live Tracking Feature (Feb 2026)
- Added /track route with continuous GPS tracking
- Uses device heading/bearing to show "stops ahead" in direction of travel
- Forward-facing cone filter (90 degrees) excludes POIs behind the truck
- Map centers slightly ahead of truck position, not directly on top
- Stops Ahead panel shows distance, category, and tap-to-center
- Configurable range: 5, 10, 25, or 50 miles
- Throttled GPS updates (every 3 seconds, 50m minimum movement) for performance
- New files: use-tracking.ts, geo-utils.ts, TrackingView.tsx, TrackingMap.tsx, StopsAheadPanel.tsx

### UI Improvements (Feb 2026)
- Form fields now conditional based on facility type (warehouse shows dock/delivery info, truck stops don't)
- Map popup shows facility name, type, address, hours when clicking POI
- Map centers on user's GPS location on load
- Bottom navigation buttons evenly distributed

### Authentication System (Feb 2026)
- Added email/password authentication with Passport.js local strategy
- Users table with id, username, password (hashed), createdAt
- Locations table now has userId field for ownership
- Protected routes redirect to /auth when not logged in
- Session storage in PostgreSQL via connect-pg-simple
- Logout button in navigation (desktop sidebar and mobile bottom bar)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript (strict mode)
- **Build Tool**: Vite with custom plugins for Replit integration
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query for async state, React Hook Form for forms
- **Styling**: Tailwind CSS with Shadcn UI component library
- **Maps**: Leaflet + React-Leaflet with OpenStreetMap tiles (no API key required)

### Data Storage Strategy
- **Primary Storage**: PostgreSQL database via server API
- **Pattern**: Server-first - all CRUD operations go through the Express API
- **Hooks**: Custom hooks (`use-locations.ts`) use TanStack Query to fetch from `/api/locations`
- **Schema**: Locations with nested pins (entry/exit points with coordinates and labels)
- **Seeded Data**: 50 real truck stop/rest area locations pre-populated via `server/seed-truck-stops.ts`

### Backend Structure
- **Runtime**: Node.js with Express
- **Database ORM**: Drizzle ORM configured for PostgreSQL (schema in `shared/schema.ts`)
- **Authentication**: Passport.js with local strategy (server/auth.ts)
- **Session Store**: PostgreSQL via connect-pg-simple
- **Password Hashing**: Node.js crypto (scrypt with salt)

### Shared Code
- **Location**: `shared/` directory
- **Schema**: `schema.ts` defines Drizzle tables, Zod validation schemas, and TypeScript types
- **Routes**: `routes.ts` defines API contract with Zod schemas for type-safe endpoints

### Key Design Decisions

1. **Local-First Over Cloud-First**: Data stored in IndexedDB ensures offline functionality. The hook interface mirrors API patterns so switching to server sync requires minimal changes.

2. **No Geocoding Dependencies**: Uses OpenStreetMap tiles (free, no key). Reverse geocoding via OSM Nominatim for "use current location" feature.

3. **Phone-First PWA**: Designed for mobile with responsive navigation (bottom bar on mobile, sidebar on desktop). Dark industrial theme optimized for trucking use cases.

4. **Single Source of Truth**: Edits overwrite previous data - no version history or conflict resolution complexity.

## External Dependencies

### Maps & Location
- **OpenStreetMap**: Free map tiles, no API key required
- **OSM Nominatim**: Reverse geocoding for current location feature
- **Leaflet/React-Leaflet**: Map rendering and interaction

### Database (Backend - Optional)
- **PostgreSQL**: Target database when `DATABASE_URL` is provisioned
- **Drizzle ORM**: Type-safe database operations with `drizzle-kit` for migrations

### UI Components
- **Shadcn UI**: Pre-built accessible components (located in `client/src/components/ui/`)
- **Radix UI**: Underlying primitives for Shadcn components
- **Lucide Icons**: Icon library

### Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation shared between frontend and backend
- **drizzle-zod**: Generates Zod schemas from Drizzle table definitions