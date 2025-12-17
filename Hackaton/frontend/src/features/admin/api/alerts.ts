import { apiClient } from "../../../app/api/client";
import type { AlertItem } from "./dashboard";

export const fetchAlertHistory = async (
  params: { start_date?: string; end_date?: string; limit?: number } = {},
) => {
  const res = await apiClient.get<AlertItem[]>("/alerts", {
    params: { limit: 100, ...params },
  });
  return res.data;
};
