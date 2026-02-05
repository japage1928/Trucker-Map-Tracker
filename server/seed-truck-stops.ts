import { db } from "./db";
import { locations, pins } from "@shared/schema";

interface TruckStopSeed {
  name: string;
  address: string;
  lat: number;
  lng: number;
  facilityKind: "truck stop" | "rest area" | "parking only";
  hoursOfOperation: string;
  category: string;
}

const truckStops: TruckStopSeed[] = [
  { name: "Pilot Travel Center", address: "2200 N 21st St, Newark, OH 43055", lat: 40.0877, lng: -82.3959, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Love's Travel Stop", address: "1450 E Main St, Barstow, CA 92311", lat: 34.8953, lng: -117.0107, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Flying J Travel Center", address: "6600 Wheeler Ridge Rd, Lebec, CA 93243", lat: 34.9507, lng: -118.9374, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "TA Travel Center", address: "1305 S Bloomington Rd, Bloomington, IL 61704", lat: 40.4547, lng: -88.9784, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Petro Stopping Center", address: "2400 E Frontage Rd, Kingman, AZ 86401", lat: 35.2078, lng: -113.9921, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Pilot Travel Center", address: "8690 W Irlo Bronson Memorial Hwy, Kissimmee, FL 34747", lat: 28.3314, lng: -81.5825, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Love's Travel Stop", address: "2610 Wesley St, Greenwood, SC 29649", lat: 34.1734, lng: -82.1559, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Flying J Travel Center", address: "4770 W State St, Boise, ID 83703", lat: 43.6443, lng: -116.2939, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "TA Travel Center", address: "101 TA Dr, Lodi, OH 44254", lat: 41.0315, lng: -82.0127, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Pilot Travel Center", address: "150 Truck Stop Rd, Raphine, VA 24472", lat: 37.9256, lng: -79.2189, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Love's Travel Stop", address: "1401 SE 29th St, Oklahoma City, OK 73129", lat: 35.4276, lng: -97.4797, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Flying J Travel Center", address: "5001 S Hoover Rd, Joplin, MO 64804", lat: 37.0326, lng: -94.5213, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Sapp Bros Travel Center", address: "9900 Sapp Bros Dr, Omaha, NE 68138", lat: 41.1766, lng: -96.1047, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Petro Stopping Center", address: "2201 W Frontage Rd, Carlisle, PA 17015", lat: 40.2254, lng: -77.2108, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Pilot Travel Center", address: "2200 E Interstate 40, Amarillo, TX 79104", lat: 35.1926, lng: -101.7959, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Love's Travel Stop", address: "101 Loves Blvd, Salina, KS 67401", lat: 38.7862, lng: -97.6061, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Flying J Travel Center", address: "6200 E Ben White Blvd, Austin, TX 78741", lat: 30.2150, lng: -97.7082, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "TA Travel Center", address: "100 TA Dr, Effingham, IL 62401", lat: 39.1033, lng: -88.5454, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Pilot Travel Center", address: "4 Commerce Dr, Milford, CT 06460", lat: 41.2309, lng: -73.0583, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Love's Travel Stop", address: "630 N Broadway, Lexington, KY 40508", lat: 38.0612, lng: -84.4969, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "I-80 Iowa Rest Area EB", address: "I-80 Mile Marker 267, Adair, IA 50002", lat: 41.5256, lng: -94.6392, facilityKind: "rest area", hoursOfOperation: "24/7", category: "rest area" },
  { name: "I-80 Iowa Rest Area WB", address: "I-80 Mile Marker 143, Brooklyn, IA 52211", lat: 41.7333, lng: -92.4583, facilityKind: "rest area", hoursOfOperation: "24/7", category: "rest area" },
  { name: "I-10 Arizona Rest Area", address: "I-10 Mile Marker 87, Buckeye, AZ 85326", lat: 33.3739, lng: -112.6621, facilityKind: "rest area", hoursOfOperation: "24/7", category: "rest area" },
  { name: "I-40 New Mexico Rest Area", address: "I-40 Mile Marker 302, Albuquerque, NM 87109", lat: 35.1369, lng: -106.5611, facilityKind: "rest area", hoursOfOperation: "24/7", category: "rest area" },
  { name: "I-95 Virginia Welcome Center", address: "I-95 Mile Marker 0, Skippers, VA 23879", lat: 36.5734, lng: -77.5642, facilityKind: "rest area", hoursOfOperation: "24/7", category: "rest area" },
  { name: "Flying J Travel Center", address: "2440 S Riverside Ave, Rialto, CA 92376", lat: 34.0742, lng: -117.3865, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Love's Travel Stop", address: "3330 N Lamb Blvd, Las Vegas, NV 89115", lat: 36.2100, lng: -115.0711, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Pilot Travel Center", address: "1600 Valley View Ln, Farmers Branch, TX 75234", lat: 32.9265, lng: -96.8878, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "TA Travel Center", address: "200 TA Dr, Seymour, IN 47274", lat: 38.9359, lng: -85.8903, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Petro Stopping Center", address: "3401 E Main St, Jackson, TN 38305", lat: 35.6267, lng: -88.7913, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Flying J Travel Center", address: "2800 S Main St, Salt Lake City, UT 84115", lat: 40.7109, lng: -111.8833, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Love's Travel Stop", address: "4500 E Broadway Rd, Phoenix, AZ 85040", lat: 33.4073, lng: -111.9659, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Pilot Travel Center", address: "7601 Tidewater Dr, Norfolk, VA 23505", lat: 36.9150, lng: -76.2634, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "TA Travel Center", address: "520 N Sheldon Rd, Channelview, TX 77530", lat: 29.7883, lng: -95.1117, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Flying J Travel Center", address: "4343 S 400 W, Ogden, UT 84405", lat: 41.1778, lng: -111.9747, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Love's Travel Stop", address: "1900 Turner Hill Rd, Lithonia, GA 30058", lat: 33.7186, lng: -84.1153, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Pilot Travel Center", address: "2150 E Chicago St, Elgin, IL 60120", lat: 42.0350, lng: -88.2534, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Petro Stopping Center", address: "6025 E Marietta Rd, Kansas City, MO 64120", lat: 39.1347, lng: -94.4509, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "TA Travel Center", address: "2660 Gateway Dr, Anderson, CA 96007", lat: 40.4597, lng: -122.2894, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Flying J Travel Center", address: "3535 W Coliseum Blvd, Fort Wayne, IN 46808", lat: 41.1022, lng: -85.1803, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Love's Travel Stop", address: "1601 S Hwy 77, Waxahachie, TX 75165", lat: 32.3683, lng: -96.8375, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Pilot Travel Center", address: "1950 E 2nd St, Reno, NV 89502", lat: 39.5152, lng: -119.7831, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Petro Stopping Center", address: "701 E Frontage Rd, Little Rock, AR 72206", lat: 34.6972, lng: -92.2242, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "TA Travel Center", address: "1700 W Bakerview Rd, Bellingham, WA 98226", lat: 48.7924, lng: -122.4915, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Flying J Travel Center", address: "4495 Corridor Dr, Knoxville, TN 37919", lat: 35.9350, lng: -84.0853, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Love's Travel Stop", address: "14700 S I-35, Edmond, OK 73013", lat: 35.6534, lng: -97.4542, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Pilot Travel Center", address: "3200 S Cooper St, Arlington, TX 76015", lat: 32.6984, lng: -97.1081, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "Petro Stopping Center", address: "850 N Dixie Hwy, Harrodsburg, KY 40330", lat: 37.7722, lng: -84.8511, facilityKind: "truck stop", hoursOfOperation: "24/7", category: "truck stop" },
  { name: "I-70 Kansas Rest Area", address: "I-70 Mile Marker 240, WaKeeney, KS 67672", lat: 39.0253, lng: -99.8739, facilityKind: "rest area", hoursOfOperation: "24/7", category: "rest area" },
  { name: "I-90 South Dakota Rest Area", address: "I-90 Mile Marker 190, Kadoka, SD 57543", lat: 43.8347, lng: -101.5089, facilityKind: "rest area", hoursOfOperation: "24/7", category: "rest area" },
];

export async function seedTruckStops() {
  console.log("Starting truck stop seed...");
  
  let inserted = 0;
  let skipped = 0;

  for (const stop of truckStops) {
    try {
      const existingResult = await db.query.locations.findFirst({
        where: (loc, { eq, and }) => and(
          eq(loc.name, stop.name),
          eq(loc.lat, String(stop.lat))
        )
      });

      if (existingResult) {
        skipped++;
        continue;
      }

      const [location] = await db.insert(locations).values({
        name: stop.name,
        address: stop.address,
        lat: String(stop.lat),
        lng: String(stop.lng),
        facilityKind: stop.facilityKind,
        locationType: "both",
        hoursOfOperation: stop.hoursOfOperation,
        category: stop.category,
        isSeeded: true,
        visibility: "public",
        addressSource: "manual",
      }).returning();

      await db.insert(pins).values({
        locationId: location.id,
        type: "entry",
        lat: String(stop.lat),
        lng: String(stop.lng),
        label: "Main Entrance",
        instruction: "Follow truck entrance signs",
      });

      inserted++;
    } catch (err) {
      console.error(`Failed to insert ${stop.name}:`, err);
    }
  }

  console.log(`Seed complete: ${inserted} inserted, ${skipped} skipped (already exist)`);
  return { inserted, skipped };
}

const isMainModule = process.argv[1]?.endsWith('seed-truck-stops.ts');
if (isMainModule) {
  seedTruckStops().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
