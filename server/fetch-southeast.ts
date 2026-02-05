import { db } from "./db";
import { locations, pins } from "@shared/schema";

interface OSMElement {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags?: {
    name?: string;
    brand?: string;
    amenity?: string;
    highway?: string;
    opening_hours?: string;
    "addr:street"?: string;
    "addr:city"?: string;
    "addr:state"?: string;
  };
}

const SOUTHEAST_REGIONS = [
  { name: "Florida", bounds: [24, -88, 31, -79] },
  { name: "Georgia", bounds: [30, -86, 35, -80] },
  { name: "Alabama", bounds: [30, -89, 35, -84] },
  { name: "Tennessee", bounds: [34, -91, 37, -81] },
  { name: "North Carolina", bounds: [33, -85, 37, -75] },
  { name: "South Carolina", bounds: [32, -84, 36, -78] },
  { name: "Mississippi", bounds: [30, -92, 35, -88] },
  { name: "Louisiana", bounds: [28, -95, 33, -88] },
];

async function fetchRegion(region: { name: string; bounds: number[] }): Promise<OSMElement[]> {
  const [south, west, north, east] = region.bounds;
  const query = `[out:json][timeout:60];(
    node["amenity"="fuel"]["hgv"="yes"](${south},${west},${north},${east});
    node["amenity"="fuel"]["truck"~"yes|only"](${south},${west},${north},${east});
    node["amenity"="fuel"]["brand"~"Love|Pilot|Flying J|TA|Petro|Sapp"](${south},${west},${north},${east});
    node["highway"="rest_area"](${south},${west},${north},${east});
    node["amenity"="parking"]["hgv"~"yes|designated"](${south},${west},${north},${east});
  );out body;`;
  
  console.log(`Fetching ${region.name}...`);
  
  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: query,
    });
    
    if (!response.ok) {
      console.error(`Failed ${region.name}: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    console.log(`Got ${data.elements.length} from ${region.name}`);
    return data.elements;
  } catch (err) {
    console.error(`Error ${region.name}:`, err);
    return [];
  }
}

async function main() {
  console.log("Fetching Southeast US truck stops...\n");
  
  const allElements: OSMElement[] = [];
  const seenIds = new Set<number>();
  
  for (const region of SOUTHEAST_REGIONS) {
    await new Promise(r => setTimeout(r, 3000));
    const elements = await fetchRegion(region);
    for (const el of elements) {
      if (!seenIds.has(el.id)) {
        seenIds.add(el.id);
        allElements.push(el);
      }
    }
  }
  
  console.log(`\nTotal unique: ${allElements.length}`);
  
  let inserted = 0, skipped = 0;
  
  for (const el of allElements) {
    const existing = await db.query.locations.findFirst({
      where: (loc, { eq, and }) => and(
        eq(loc.lat, String(el.lat)),
        eq(loc.lng, String(el.lon))
      )
    });
    
    if (existing) { skipped++; continue; }
    
    const name = el.tags?.name || el.tags?.brand || (el.tags?.highway === "rest_area" ? "Rest Area" : "Truck Stop");
    const facilityKind = el.tags?.highway === "rest_area" ? "rest area" : "truck stop";
    
    const [location] = await db.insert(locations).values({
      name,
      address: [el.tags?.["addr:street"], el.tags?.["addr:city"], el.tags?.["addr:state"]].filter(Boolean).join(", ") || `${el.lat.toFixed(4)}, ${el.lon.toFixed(4)}`,
      lat: String(el.lat),
      lng: String(el.lon),
      facilityKind,
      locationType: "both",
      hoursOfOperation: el.tags?.opening_hours || "24/7",
      category: facilityKind,
      isSeeded: true,
      visibility: "public",
      addressSource: "manual",
    }).returning();
    
    await db.insert(pins).values({
      locationId: location.id,
      type: "entry",
      lat: String(el.lat),
      lng: String(el.lon),
      label: "Main Entrance",
      instruction: "Follow truck entrance signs",
    });
    
    inserted++;
  }
  
  console.log(`\nComplete: ${inserted} new, ${skipped} duplicates`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
