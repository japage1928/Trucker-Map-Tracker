export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DrivingPosition extends Coordinates {
  heading: number | null;
  speed: number | null;
}

export interface POIInput {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  address?: string;
  hoursOfOperation?: string;
  notes?: string | null;
}

export interface POIResult {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  address?: string;
  hoursOfOperation?: string;
  notes?: string | null;
  distanceMeters: number;
  distanceMiles: number;
  bearing: number;
  relativeBearing: number;
}

export interface DrivingEngineInput {
  position: DrivingPosition;
  pois: POIInput[];
  options?: DrivingEngineOptions;
}

export interface DrivingEngineOptions {
  maxDistanceMiles?: number;
  coneAngleDegrees?: number;
  maxResults?: number;
}

export interface DrivingEngineOutput {
  poisAhead: POIResult[];
  totalPoisInRange: number;
  headingAvailable: boolean;
}

export const DEFAULT_OPTIONS: Required<DrivingEngineOptions> = {
  maxDistanceMiles: 25,
  coneAngleDegrees: 90,
  maxResults: 20,
};
