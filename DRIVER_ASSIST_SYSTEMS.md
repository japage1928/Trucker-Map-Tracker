/**
 * DRIVER-ASSIST SUBSYSTEMS
 * 
 * Three integrated driver-assistance tools for the trucking PWA.
 * These systems provide AI-readable context for route and compliance decisions.
 * 
 * ⚠️  ASSISTIVE ONLY - NOT COMPLIANCE ENFORCEMENT
 * The driver maintains all responsibility for FMCSA HOS compliance.
 */

# Driver-Assist Systems Overview

## 1️⃣ HOS TRACKING (Manual Input)

### Purpose
Drivers manually enter hours worked to track remaining drive and on-duty time.
Used for planning decisions, not enforcement.

### Data Captured
```
{
  dutyStatus: "OFF" | "ON" | "DRIVING" | "SLEEPER",
  driveTimeRemainingHours: number,
  onDutyRemainingHours: number,
  lastUpdated: ISO string
}
```

### Key Rules (Simplified)
- 11-hour max driving per shift
- 14-hour max on-duty per shift
- 30-minute mandatory break after 8 hours driving

### User Interface
**Location**: Settings → Hours of Service

- Status selector (OFF / ON / DRIVING / SLEEPER)
- Visual remaining time indicators with progress bars
- Manual input fields for hours used today
- Low-time warnings (< 1 hour drive, < 2 hours on-duty)
- Reset button for daily use

### Implementation
```typescript
import { useHOSTracking } from '@/hooks/use-hos-tracking';

const { hos, updateHOS, setDutyStatus } = useHOSTracking();
// hos: HOSTracking | null
// Stored in localStorage, persists across sessions
```

### Accuracy Note
This is NOT an ELD. Drivers manually enter estimates.
No GPS tracking or background monitoring.

---

## 2️⃣ WEATHER CONTEXT

### Purpose
Real-time weather data normalized for AI reasoning.
Informs route and timing decisions.

### Data Captured
```
{
  condition: "CLEAR" | "RAIN" | "SNOW" | "FOG" | "WIND" | "UNKNOWN",
  severity: "LOW" | "MODERATE" | "HIGH",
  alert?: string,
  temperatureFahrenheit?: number,
  windSpeedMph?: number,
  visibilityMiles?: number
}
```

### Data Source
**Open-Meteo API** (free, no key required)
- Current conditions only
- No forecast storage
- 5-minute cache recommended

### Use Cases
- "Should I slow down in this weather?"
- "How much buffer time do I need?"
- "Should I wait out the storm?"

### Implementation
```typescript
import { fetchWeatherContext, getWeatherAlert } from '@/lib/weather-adapter';

const weather = await fetchWeatherContext(lat, lng);
const alert = getWeatherAlert(weather);
```

### Alerts Generated
| Condition | Severity | Alert |
|-----------|----------|-------|
| SNOW | HIGH | Winter Storm Warning |
| FOG | MODERATE | Dense fog visibility warning |
| WIND | HIGH | High Wind Warning |
| RAIN | HIGH | Flash Flood Warning |

---

## 3️⃣ TRAFFIC CONTEXT

### Purpose
ETA deltas and congestion levels for route impact.
Used to estimate real-world arrival times.

### Data Captured
```
{
  delayMinutes: number,         // Extra minutes vs free-flow
  congestionLevel: "LOW" | "MODERATE" | "HIGH",
  affectedSegments?: string[]   // e.g., ["I-95 northbound mile 100-120"]
}
```

### Calculation Method
- Free-flow ETA: distance ÷ 65 mph (highway avg)
- Current ETA: distance ÷ current speed
- Delay: current ETA - free-flow ETA

### Time-of-Day Factors
```
7-9 AM:     +30% (morning rush)
4-7 PM:     +40% (evening rush)
Other:      baseline
```

### Data Source
**No external API calls**. Uses:
- Current GPS speed from tracking
- Distance to destination
- Time-of-day patterns

### Implementation
```typescript
import { calculateTrafficDelay } from '@/lib/traffic-adapter';

const traffic = calculateTrafficDelay({
  distanceMiles: 50,
  currentSpeedMph: 45,
  averageFreeFlowSpeedMph: 65
});
// { delayMinutes: 18, congestionLevel: "MODERATE" }
```

---

## 4️⃣ AGGREGATED AI CONTEXT

### Purpose
Single object combining all three subsystems for AI reasoning.

### Data Structure
```typescript
interface DriverAssistAiContext {
  hos?: HOSTracking;              // Hours of service state
  weather?: WeatherContext;       // Current weather
  traffic?: TrafficContext;       // ETA delays
  destination?: {
    name: string,
    etaMinutes: number,
    distanceMiles?: number
  };
  drivingState?: 'driving' | 'stopped' | 'unknown';
  speedMph?: number | null;
  position?: { lat: number; lng: number } | null;
}
```

### Building Context
```typescript
import { buildDriverAssistContext } from '@/lib/ai-context';

const context = buildDriverAssistContext({
  hos: hosCurrent,
  weather: weatherAtCurrentLocation,
  traffic: trafficToDestination,
  nextStopName: "I-95 Rest Area",
  nextStopEtaMinutes: 45,
  drivingState: 'driving',
  speedMph: 62
});
```

### Formatting for AI
```typescript
import { describeContextForAi } from '@shared/driver-assist-ai-context';

const narrative = describeContextForAi(context);
// Returns readable markdown for AI prompt
```

---

## 5️⃣ AI INTEGRATION EXAMPLES

### Question: "Do I have enough time to reach X?"
```typescript
const prompt = generateTimeManagementPrompt(context);
// Considers: HOS remaining, ETA, weather, traffic
// Returns: Yes/No + reasoning
```

### Question: "When should I stop for a break?"
```typescript
const prompt = generateStopPlanningPrompt(context);
// Considers: Drive time used, HOS regulations, upcoming weather
// Returns: Specific time/mile marker recommendation
```

### Question: "How bad is the weather ahead?"
```typescript
const prompt = generateWeatherImpactPrompt(context);
// Considers: Severity, visibility, temp, wind
// Returns: Practical safety guidance
```

### Question: "How much buffer time should I add?"
```typescript
const prompt = generateBufferTimePrompt(context);
// Considers: Weather + traffic + HOS constraints
// Returns: Minutes to add to ETA
```

---

## 6️⃣ STRICT RULES & LIMITATIONS

### ✅ What These Systems Do
- ✅ Provide assistive context for informed decisions
- ✅ Display driver-entered HOS estimates
- ✅ Show current weather conditions
- ✅ Calculate ETA delays based on speed
- ✅ Enable AI reasoning over combined context

### ❌ What These Systems DO NOT Do
- ❌ Enforce HOS compliance (no automated tracking)
- ❌ Perform real-time ELD functions
- ❌ Make decisions for the driver
- ❌ Store long-term weather/traffic data
- ❌ Replace official HOS records
- ❌ Guarantee weather forecast accuracy
- ❌ Source real-time traffic from external APIs
- ❌ Auto-advance duty status

### Liability Clause
```
All HOS estimates are for assistive purposes only.
The driver is solely responsible for FMCSA compliance.
This system is NOT an official Hours of Service record.
Do not rely on these estimates for legal compliance decisions.
```

---

## 7️⃣ UI LOCATIONS

| Component | Location |
|-----------|----------|
| HOS Tracker | Settings → Hours of Service |
| Weather Display | (In AI context, not separate UI yet) |
| Traffic Display | (In AI context, calculated from speed) |
| Combined Context | ChatPage / AI Assistant (future) |

---

## 8️⃣ DEVELOPER INTEGRATION

### Files
```
shared/
  ├─ hos-types.ts
  ├─ weather-types.ts
  ├─ traffic-types.ts
  └─ driver-assist-ai-context.ts

client/src/
  ├─ hooks/use-hos-tracking.ts
  ├─ components/HOSTracker.tsx
  ├─ lib/
  │  ├─ weather-adapter.ts
  │  ├─ traffic-adapter.ts
  │  ├─ ai-context.ts (updated)
  │  └─ driver-assist-examples.ts
  └─ pages/SettingsPage.tsx (updated)
```

### Quick Start
```typescript
// 1. Hook into HOS state
import { useHOSTracking } from '@/hooks/use-hos-tracking';
const { hos, updateHOS } = useHOSTracking();

// 2. Fetch weather
import { fetchWeatherContext } from '@/lib/weather-adapter';
const weather = await fetchWeatherContext(lat, lng);

// 3. Calculate traffic
import { calculateTrafficDelay } from '@/lib/traffic-adapter';
const traffic = calculateTrafficDelay({ distanceMiles, currentSpeedMph });

// 4. Build context
import { buildDriverAssistContext } from '@/lib/ai-context';
const context = buildDriverAssistContext({ hos, weather, traffic, ... });

// 5. Generate AI prompt
import { generateTimeManagementPrompt } from '@/lib/driver-assist-examples';
const prompt = generateTimeManagementPrompt(context);

// 6. Send to AI
const response = await sendToAI(prompt);
```

---

## 9️⃣ TEST SCENARIOS

### Scenario 1: Short Delivery
- 2.5h drive time left, 3h on-duty
- Moderate rain
- 15 min traffic delay
- 90 min ETA to delivery
- Can they make it? **YES**

### Scenario 2: Long Haul
- 8h drive time left, 11h on-duty
- Clear weather
- 5 min traffic delay
- 420 min (7h) ETA to Chicago
- Buffer recommendation? **30 minutes**

### Scenario 3: Severe Weather
- 5h drive time left, 6h on-duty
- Heavy snow with 0.2 mi visibility
- 45 min traffic delay
- 60 min ETA to rest area
- Recommendation? **Reduce speed, consider stopping**

See `driver-assist-examples.ts` for sample context generation.

---

## 🔟 FUTURE ENHANCEMENTS

- [ ] Integrate with official ELD for read-only sync
- [ ] Real-time traffic from HERE/TomTom API (with privacy guards)
- [ ] Historical weather patterns for better predictions
- [ ] PreTrip checklist integration
- [ ] Fuel economy tracking with weather factor
- [ ] Predictive maintenance alerts
- [ ] Route optimization considering HOS/weather/traffic
