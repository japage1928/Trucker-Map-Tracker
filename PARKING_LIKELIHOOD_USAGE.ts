/**
 * PARKING LIKELIHOOD SYSTEM - USAGE EXAMPLES
 * 
 * This file demonstrates how the parking likelihood prediction system works
 * across different user scenarios (free vs paid) and contexts (HUD vs detail card).
 */

// ============================================================================
// SCENARIO 1: FREE USER ON DRIVING SCREEN
// ============================================================================

/*
USER STATE:
- Not purchased parking insights
- Driving on highway with truck stops ahead

WHAT THEY SEE:
- Bottom-left HUD badge: "🟢 Likely Available" (compact)
- NO explanation text
- Badge auto-hides when no truck stops in range

UI BEHAVIOR:
- <ParkingHudBadge status="LIKELY_AVAILABLE" showExplanation={false} visible={true} />
- Badge position: fixed bottom-20 left-4
- Non-intrusive, glanceable status indicator
- Auto-updates as stops change

BACKEND LOGGING:
- Silent ping sent: { stopId: "loves_123", hour: 19, dayType: "weekday", pingCount: +1 }
- No user ID stored
- Fire-and-forget (doesn't block UI)
*/

// ============================================================================
// SCENARIO 2: PAID USER ON DRIVING SCREEN
// ============================================================================

/*
USER STATE:
- Purchased parking insights ($4.99 one-time)
- Driving on highway approaching truck stop

WHAT THEY SEE:
- Bottom-left HUD badge: "🟡 Uncertain" (compact)
- Explanation text: "Evening parking usually fills up. Small lots may be limited."
- Badge auto-hides when no truck stops in range

UI BEHAVIOR:
- <ParkingHudBadge status="UNCERTAIN" explanation="..." showExplanation={true} visible={true} />
- Explanation shows in 2-line text below badge
- Max width: 240px (doesn't obstruct map)

BACKEND LOGGING:
- Silent ping sent: { stopId: "pilot_456", hour: 18, dayType: "weekday", pingCount: +1 }
*/

// ============================================================================
// SCENARIO 3: FREE USER ON LOCATION DETAIL PAGE
// ============================================================================

/*
USER STATE:
- Not purchased parking insights
- Viewing detail card for "Pilot Travel Center #456"

WHAT THEY SEE:
- Parking Likelihood card (full card layout)
- Badge: "🔴 Likely Full"
- Label: "Based on time patterns"
- Collapsible "Why? (Tap to unlock)" button

UI BEHAVIOR:
- <ParkingLikelihoodBadge status="LIKELY_FULL" showExplanation={false} />
- When user taps "Why?":
  - Paywall modal appears
  - Copy: "Built by a driver. This feature helps keep the app running."
  - Button: "Unlock for $4.99 (one-time)"
  - No aggressive upselling
  - User can still see the badge status (NOT crippled)

BACKEND:
- Check purchase status: GET /api/purchases/parkingInsights → { hasPurchase: false }
- If user purchases: POST /api/purchases/parkingInsights → creates record
- Silent ping sent: { stopId: "pilot_456", hour: 20, dayType: "weekend", pingCount: +1 }
*/

// ============================================================================
// SCENARIO 4: PAID USER ON LOCATION DETAIL PAGE
// ============================================================================

/*
USER STATE:
- Purchased parking insights
- Viewing detail card for "TA Truck Stop #789"

WHAT THEY SEE:
- Parking Likelihood card
- Badge: "🟢 Likely Available"
- Full explanation: "Midday parking is often available. Large lots typically have space."
- Expandable "Why?" section (auto-expanded or collapsible)

UI BEHAVIOR:
- <ParkingLikelihoodBadge 
    status="LIKELY_AVAILABLE" 
    explanation="Midday parking is often available. Large lots typically have space."
    showExplanation={true} 
  />
- No paywall shown
- Clean, informative presentation

BACKEND:
- Check purchase status: GET /api/purchases/parkingInsights → { hasPurchase: true, purchasedAt: "2026-02-01T10:30:00Z" }
- Silent ping sent: { stopId: "ta_789", hour: 13, dayType: "weekday", pingCount: +1 }
*/

// ============================================================================
// TECHNICAL FLOW
// ============================================================================

/*
1. LOCATION → STOP PROFILE MAPPING

const location = {
  id: "loves_123",
  facilityKind: "truck stop",
  notes: "Large lot with 200+ spots",
  address: "1234 Highway 80, Lincoln, NE"
};

const profile = locationToStopProfile(location);
// → { stopId: "loves_123", capacityBucket: "large", region: "NE", type: "truck_stop" }


2. PREDICTION CALCULATION

const result = getParkingLikelihood(profile, Date.now());
// → { status: "LIKELY_AVAILABLE", explanation: "Evening parking often available at large stops." }


3. FEATURE GATING

const { hasParkingInsights } = useParkingInsights();
// → false (free user) OR true (paid user)

<ParkingLikelihoodBadge
  status={result.status}
  explanation={result.explanation}
  showExplanation={hasParkingInsights} // ← SINGLE SOURCE OF TRUTH
/>


4. PURCHASE FLOW

// User clicks "Unlock for $4.99"
const { purchase, isPurchasing } = useParkingInsights();
purchase(); // Triggers POST /api/purchases/parkingInsights

// Backend creates purchase record
await storage.createPurchase(userId, "parkingInsights");

// Frontend refetches purchase status
// → hasParkingInsights changes from false to true
// → UI automatically shows explanations


5. SILENT LOGGING

// Triggered whenever parking likelihood is displayed
useEffect(() => {
  if (parkingLikelihood?.stopId) {
    logParkingPing(parkingLikelihood.stopId);
    // → POST /api/parking-pings { stopId, hour, dayType }
    // → Fire-and-forget, never blocks UI
  }
}, [parkingLikelihood?.stopId]);

// Backend increments aggregate count
// No user IDs, no precise GPS, no personal tracking
*/

// ============================================================================
// PREDICTION LOGIC (BLACK BOX)
// ============================================================================

/*
DO NOT MODIFY: The core prediction logic is in shared/parking-likelihood.ts

Input:
- StopProfile (stopId, capacityBucket, region, type)
- Timestamp (Date.now())

Output:
- status: "LIKELY_AVAILABLE" | "UNCERTAIN" | "LIKELY_FULL"
- explanation: Plain-language string

Example temporal patterns (weekday, hour 19):
- Small truck stop: temporal=0.92, capacity=1.2 → baseLoad=1.104 → LIKELY_FULL
- Medium truck stop: temporal=0.92, capacity=1.0 → baseLoad=0.92 → LIKELY_FULL
- Large truck stop: temporal=0.92, capacity=0.8 → baseLoad=0.736 → UNCERTAIN

Decision boundaries:
- baseLoad < 0.45 → LIKELY_AVAILABLE
- baseLoad < 0.75 → UNCERTAIN
- baseLoad >= 0.75 → LIKELY_FULL
*/

// ============================================================================
// FUTURE ENHANCEMENTS (NOT IMPLEMENTED YET)
// ============================================================================

/*
1. Crowd Data Blending:
   - Use fullnessReports table data
   - Weight recent reports higher
   - Blend with temporal predictions

2. Regional Variations:
   - Different temporal patterns for different regions
   - Interstate corridors have different peaks than urban areas

3. Weather Integration:
   - Bad weather → higher parking demand
   - Use existing weather alerts system

4. Event Detection:
   - Holidays affect patterns (e.g., Thanksgiving eve)
   - Major events cause anomalies

5. Subscription Option:
   - Keep $4.99 one-time tier
   - Add optional $0.99/month for advanced features (notifications, etc.)
*/

export {};
