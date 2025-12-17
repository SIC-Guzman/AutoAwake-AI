export type TripPlanResponse = {
  plan_id: number;
  driver_id: number;
  vehicle_id: number;
  origin: string;
  destination: string;
  is_active: number;
  created_at: string;
  used_at?: string | null;
  driver_name?: string;
  license_number?: string;
  vehicle_plate?: string;
  brand?: string;
  model?: string;
};
