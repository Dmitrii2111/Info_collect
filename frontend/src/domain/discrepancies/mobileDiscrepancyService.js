import { mobileDiscrepanciesData } from "../../mobile/data/mobileMockData.js";

export function getMobileDiscrepancyById(discrepancyId) {
  if (!discrepancyId) {
    return null;
  }

  return mobileDiscrepanciesData.discrepancies.find((item) => item.id === discrepancyId) ?? null;
}
