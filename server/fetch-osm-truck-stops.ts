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
    opening_hours?: string;
    phone?: string;
    website?: string;
    hgv?: string;
    "addr:street"?: string;
    "addr:city"?: string;
    "addr:state"?: string;
  };
}

interface OSMResponse {
  elements: OSMElement[];
}

const REGIONS = [
  { name: "West Coast", bounds: [32, -125, 49, -115] },
  { name: "Southwest", bounds: [31, -115, 37, -102] },
  { name: "Mountain", bounds: [37, -115, 49, -102] },
  { name: "Central South", bounds: [26, -105, 36, -93] },
  { name: "Central North", bounds: [36, -100, 49, -90] },
  { name: "Midwest", bounds: [36, -93, 45, -82] },
  { name: "Southeast", bounds: [25, -90, 36, -75] },
  { name: "Northeast", bounds: [36, -82, 45, -66] },
  { name: "Great Lakes", bounds: [41, -93, 49, -75] },
];

async function fetchRegion(region: { name: string; bounds: number[] }): Promise<OSMElement[]> {
  const [south, west, north, east] = region.bounds;
  const query = `[out:json][timeout:45];(node["amenity"="fuel"]["hgv"="yes"](${south},${west},${north},${east});node["amenity"="fuel"]["truck"~"yes|only"](${south},${west},${north},${east});node["highway"="rest_area"](${south},${west},${north},${east}););out body;`;
  
  console.log(`Fetching ${region.name}...`);
  
  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: query,
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${region.name}: ${response.status}`);
      return [];
    }
    
    const data: OSMResponse = await response.json();
    console.log(`Got ${data.elements.length} elements from ${region.name}`);
    return data.elements;
  } catch (err) {
    console.error(`Error fetching ${region.name}:`, err);
    return [];
  }
}

function getLocationName(el: OSMElement): string {
  if (el.tags?.name) return el.tags.name;
  if (el.tags?.brand) return el.tags.brand;
  if (el.tags?.amenity === "fuel") return "Truck Stop";
  return "Rest Area";
}

function getFacilityKind(el: OSMElement): "truck stop" | "rest area" {
  if (el.tags?.highway === "rest_area") return "rest area";
  return "truck stop";
}

function getAddress(el: OSMElement): string {
  const parts = [];
  if (el.tags?.["addr:street"]) parts.push(el.tags["addr:street"]);
  if (el.tags?.["addr:city"]) parts.push(el.tags["addr:city"]);
  if (el.tags?.["addr:state"]) parts.push(el.tags["addr:state"]);
  
  if (parts.length > 0) return parts.join(", ");
  return `${el.lat.toFixed(4)}, ${el.lon.toFixed(4)}`;
}

export async function fetchAndSeedOSMTruckStops() {
  console.log("Fetching truck stops from OpenStreetMap...\n");
  
  const allElements: OSMElement[] = [];
  const seenIds = new Set<number>();
  
  for (const region of REGIONS) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const elements = await fetchRegion(region);
    for (const el of elements) {
      if (!seenIds.has(el.id)) {
        seenIds.add(el.id);
        allElements.push(el);
      }
    }
  }
  
  console.log(`\nTotal unique elements: ${allElements.length}`);
  console.log("Inserting into database...\n");
  
  let inserted = 0;
  let skipped = 0;
  
  for (const el of allElements) {
    try {
      const existingResult = await db.query.locations.findFirst({
        where: (loc, { eq, and }) => and(
          eq(loc.lat, String(el.lat)),
          eq(loc.lng, String(el.lon))
        )
      });
      
      if (existingResult) {
        skipped++;
        continue;
      }
      
      const name = getLocationName(el);
      const facilityKind = getFacilityKind(el);
      const address = getAddress(el);
      const hours = el.tags?.opening_hours || "24/7";
      
      const [location] = await db.insert(locations).values({
        name,
        address,
        lat: String(el.lat),
        lng: String(el.lon),
        facilityKind,
        locationType: "both",
        hoursOfOperation: hours,
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
      
      if (inserted % 50 === 0) {
        console.log(`Inserted ${inserted} locations...`);
      }
    } catch (err) {
      console.error(`Failed to insert:`, err);
    }
  }
  
  console.log(`\nComplete: ${inserted} inserted, ${skipped} skipped (duplicates)`);
  return { inserted, skipped };
}

const isMainModule = process.argv[1]?.endsWith('fetch-osm-truck-stops.ts');
if (isMainModule) {
  fetchAndSeedOSMTruckStops()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
