## Packages
idb | IndexedDB wrapper for local-first storage
leaflet | Maps library
react-leaflet | React components for Leaflet maps
@types/leaflet | Types for Leaflet
clsx | Utility for conditional class names (often used with tailwind-merge)
tailwind-merge | Utility for merging tailwind classes

## Notes
The app is designed as a "Local-First" PWA.
Data is stored in IndexedDB using the 'idb' library.
The 'use-locations' hook mimics the API interface but interacts with local IndexedDB.
Map tiles are provided by OpenStreetMap.
