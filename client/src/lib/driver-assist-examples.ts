/**
 * Driver Assist Systems - AI Integration Guide
 * 
 * This file demonstrates how to use the HOS, weather, and traffic
 * subsystems with the AI assistant for driver assistance.
 * 
 * Example AI prompt patterns that can reason over this context.
 */

import type { DriverAssistAiContext } from '@shared/driver-assist-ai-context';
import { describeContextForAi } from '@shared/driver-assist-ai-context';

/**
 * Example 1: Time Management Question
 * 
 * Driver asks: "Do I have enough time to make it to my delivery before my 14-hour limit?"
 */
export function generateTimeManagementPrompt(context: DriverAssistAiContext): string {
  const contextStr = describeContextForAi(context);
  
  return `You are a truck driving assistant. The driver has asked: "Do I have enough time to make it to my delivery before my 14-hour limit?"

Given context:
${contextStr}

Provide a brief, practical assessment:
1. Will they make it given their remaining on-duty hours?
2. Any weather or traffic concerns?
3. Specific recommendation (continue, find a stop to rest, etc.)

Keep response under 3 sentences.`;
}

/**
 * Example 2: Route Planning with Constraints
 * 
 * Driver asks: "Should I take the highway or back roads to get to the rest area?"
 */
export function generateRouteDecisionPrompt(context: DriverAssistAiContext): string {
  const contextStr = describeContextForAi(context);
  
  return `You are a truck driving assistant helping with route decisions.

Current conditions:
${contextStr}

The driver is asking whether they should take the highway (faster, more traffic) or back roads (slower, less congestion) to reach the next rest area.

Recommend based on:
- Their remaining drive time
- Current weather conditions
- Traffic situation
- Time of day

Be concise and actionable.`;
}

/**
 * Example 3: Stop Planning
 * 
 * Driver asks: "When should I stop for a mandatory break?"
 */
export function generateStopPlanningPrompt(context: DriverAssistAiContext): string {
  const contextStr = describeContextForAi(context);
  
  return `You are a truck driving assistant helping with compliance planning.

Current status:
${contextStr}

The driver is asking when they should take their next mandatory rest break.

Factors to consider:
- Drive time remaining
- On-duty time remaining
- Weather conditions that might affect driving
- ETA to next major stop

Give specific recommendation (now, in X hours, before/after destination).`;
}

/**
 * Example 4: Weather Impact Assessment
 * 
 * Driver asks: "How bad is the weather I'm about to drive into?"
 */
export function generateWeatherImpactPrompt(context: DriverAssistAiContext): string {
  const contextStr = describeContextForAi(context);
  
  return `You are a truck driving assistant assessing weather impact.

Conditions ahead:
${contextStr}

The driver wants to understand:
1. How severe are these conditions for commercial truck driving?
2. What precautions should they take?
3. Will this significantly impact their ETA?

Keep it practical and direct.`;
}

/**
 * Example 5: Buffer Time Calculation
 * 
 * Driver asks: "How much extra time should I add to my estimate?"
 */
export function generateBufferTimePrompt(context: DriverAssistAiContext): string {
  const contextStr = describeContextForAi(context);
  
  return `You are a truck driving assistant helping with realistic ETAs.

Current situation:
${contextStr}

The driver wants to know how much buffer time to add to their ETA given:
- Current weather
- Traffic conditions
- HOS constraints
- Mandatory rest requirements

Return: "Add X minutes to your ETA" or "No additional buffer needed" with brief explanation.`;
}

/**
 * Example 6: Compliance Check
 * 
 * Driver asks: "Am I still legal to drive right now?"
 */
export function generateComplianceCheckPrompt(context: DriverAssistAiContext): string {
  const contextStr = describeContextForAi(context);
  
  return `You are a truck driving assistant providing HOS guidance.

⚠️ IMPORTANT: This is for informational purposes. The driver is responsible for actual FMCSA compliance.

Status:
${contextStr}

The driver wants informal guidance on whether they can legally continue driving per Federal Regulations.

Response format:
- "Based on entered hours, [yes/no] you appear to have [X hours] remaining"
- Mention any warnings
- Add disclaimer about responsibility

Be clear this is NOT legal advice and they should verify independently.`;
}

/**
 * Example usage in a hook or component:
 * 
 * ```typescript
 * import { useHOSTracking } from '@/hooks/use-hos-tracking';
 * import { fetchWeatherContext } from '@/lib/weather-adapter';
 * import { calculateTrafficDelay } from '@/lib/traffic-adapter';
 * import { buildDriverAssistContext } from '@/lib/ai-context';
 * 
 * function DriverAssistChat() {
 *   const { hos } = useHOSTracking();
 *   const [weather, setWeather] = useState(null);
 *   const [traffic, setTraffic] = useState(null);
 *   
 *   // Fetch weather for current location
 *   useEffect(() => {
 *     if (position) {
 *       fetchWeatherContext(position.lat, position.lng)
 *         .then(setWeather);
 *     }
 *   }, [position]);
 *   
 *   // Build context
 *   const assistContext = buildDriverAssistContext({
 *     hos,
 *     weather,
 *     traffic,
 *     nextStopName: "I-95 Rest Area",
 *     nextStopEtaMinutes: 45,
 *     nextStopDistanceMiles: 30,
 *   });
 *   
 *   // Generate AI prompt based on query
 *   const handleUserQuery = (query: string) => {
 *     let prompt = '';
 *     
 *     if (query.includes('time') || query.includes('limit')) {
 *       prompt = generateTimeManagementPrompt(assistContext);
 *     } else if (query.includes('route') || query.includes('highway')) {
 *       prompt = generateRouteDecisionPrompt(assistContext);
 *     } else if (query.includes('stop') || query.includes('break')) {
 *       prompt = generateStopPlanningPrompt(assistContext);
 *     } else if (query.includes('weather')) {
 *       prompt = generateWeatherImpactPrompt(assistContext);
 *     } else if (query.includes('buffer') || query.includes('extra')) {
 *       prompt = generateBufferTimePrompt(assistContext);
 *     } else if (query.includes('legal') || query.includes('complian')) {
 *       prompt = generateComplianceCheckPrompt(assistContext);
 *     }
 *     
 *     // Send to AI
 *     return sendToAI(prompt);
 *   };
 * }
 * ```
 */

export const SAMPLE_SCENARIOS = {
  shortDelivery: {
    hos: {
      dutyStatus: 'DRIVING',
      driveTimeRemainingHours: 2.5,
      onDutyRemainingHours: 3,
      lastUpdated: new Date().toISOString(),
    },
    weather: {
      condition: 'RAIN',
      severity: 'MODERATE',
      temperatureFahrenheit: 45,
    },
    traffic: {
      delayMinutes: 15,
      congestionLevel: 'MODERATE',
    },
    destination: {
      name: 'Distribution Center - Memphis, TN',
      etaMinutes: 90,
      distanceMiles: 65,
    },
  },
  
  longHaul: {
    hos: {
      dutyStatus: 'DRIVING',
      driveTimeRemainingHours: 8,
      onDutyRemainingHours: 11,
      lastUpdated: new Date().toISOString(),
    },
    weather: {
      condition: 'CLEAR',
      severity: 'LOW',
      temperatureFahrenheit: 72,
    },
    traffic: {
      delayMinutes: 5,
      congestionLevel: 'LOW',
    },
    destination: {
      name: 'Chicago Distribution Center',
      etaMinutes: 420,
      distanceMiles: 280,
    },
  },
  
  severeWeather: {
    hos: {
      dutyStatus: 'DRIVING',
      driveTimeRemainingHours: 5,
      onDutyRemainingHours: 6,
      lastUpdated: new Date().toISOString(),
    },
    weather: {
      condition: 'SNOW',
      severity: 'HIGH',
      alert: 'Winter Storm Warning',
      temperatureFahrenheit: 28,
      windSpeedMph: 35,
      visibilityMiles: 0.2,
    },
    traffic: {
      delayMinutes: 45,
      congestionLevel: 'HIGH',
    },
    destination: {
      name: 'I-80 Rest Area',
      etaMinutes: 60,
      distanceMiles: 25,
    },
  },
};
