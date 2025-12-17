import { apiClient } from "../../../app/api/client";

export type AlertItem = {
  alert_id: number;
  trip_id: number;
  vehicle_id: number;
  driver_id: number;
  alert_type: string;
  severity: string;
  message: string;
  detected_at: string;
  driver_name?: string;
  vehicle_plate?: string;
};

export type VehicleItem = {
  vehicle_id: number;
  plate: string;
  brand: string;
  model: string;
  status: string;
};

export type DriverItem = {
  driver_id: number;
  first_name: string;
  last_name: string;
  license_number: string;
  status: string;
};

export type AssignmentItem = {
  assignment_id: number;
  driver_id: number;
  driver_name: string;
  license_number: string;
  driver_status: string;
  vehicle_id: number;
  vehicle_plate: string;
  brand: string;
  model: string;
  vehicle_status: string;
  assigned_from: string;
  assigned_to?: string | null;
};

export type IssueItem = {
  issue_id: number;
  vehicle_id: number | null;
  driver_id: number | null;
  trip_id: number | null;
  issue_type: string;
  description: string;
  status: string;
  reported_at: string;
  resolved_at?: string | null;
  driver_name?: string;
  vehicle_plate?: string;
};

export type ActiveTripStats = {
  total_active_trips: number;
  drivers_alert: number;
  drivers_ok: number;
  active_trips: Array<{
    trip_id: number;
    driver_id: number;
    vehicle_id: number;
    started_at: string;
    origin: string;
    destination: string;
    driver_name: string;
    vehicle_plate: string;
    brand: string;
    model: string;
    critical_alerts: number;
    total_alerts: number;
    last_alert_time: string | null;
    duration_minutes: number;
  }>;
};

const formatDateParam = (date: Date) => date.toISOString().slice(0, 19).replace("T", " ");

export const fetchAlerts = async (limit = 10) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const params = { limit, start_date: formatDateParam(startOfToday) };
  const res = await apiClient.get<AlertItem[]>("/alerts", { params });
  return res.data;
};

export const fetchVehicles = async () => {
  const res = await apiClient.get<VehicleItem[]>("/vehicles");
  return res.data;
};

export const fetchDrivers = async () => {
  const res = await apiClient.get<DriverItem[]>("/drivers");
  return res.data;
};

export const fetchActiveAssignments = async () => {
  const res = await apiClient.get<AssignmentItem[]>("/assignments", {
    params: { active_only: true },
  });
  return res.data;
};

export const fetchOpenIssues = async (limit = 10) => {
  const res = await apiClient.get<IssueItem[]>("/issues", {
    params: { status: "OPEN", limit },
  });
  return res.data;
};

export const fetchActiveTripStats = async () => {
  const res = await apiClient.get<ActiveTripStats>("/trips/stats/active");
  return res.data;
};
