import { apiClient } from "../../../app/api/client";
import type { DriverItem, VehicleItem } from "./dashboard";
import type { TripPlanResponse } from "../types";

export type TripItem = {
  trip_id: number;
  vehicle_id: number;
  driver_id: number;
  started_at: string;
  ended_at?: string | null;
  origin: string;
  destination: string;
  status: string;
  driver_name?: string;
  vehicle_plate?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
};

export const fetchDriversList = async () => {
  const res = await apiClient.get<DriverItem[]>("/drivers");
  return res.data;
};

export const fetchVehiclesList = async () => {
  const res = await apiClient.get<VehicleItem[]>("/vehicles");
  return res.data;
};

export const fetchTripsList = async (status?: string, limit = 50) => {
  const res = await apiClient.get<TripItem[]>("/trips", {
    params: { status, limit },
  });
  return res.data;
};

export const createTripPlan = async (payload: {
  driver_id: number;
  vehicle_id: number;
  origin: string;
  destination: string;
}) => {
  const res = await apiClient.post<TripPlanResponse>("/trips/plans", payload);
  return res.data;
};

export const fetchTripPlans = async (active_only = true) => {
  const res = await apiClient.get<TripPlanResponse[]>("/trips/plans", {
    params: { active_only },
  });
  return res.data;
};
