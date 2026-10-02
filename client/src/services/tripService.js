import api from "../lib/api";

export async function generateTripPlan(preferences) {
  const response = await api.post("/trip-plans/generate", preferences);
  return response.data;
}
export async function createTrip(preferences) {
  const response = await api.post("/trips", preferences);
  return response.data;
}
export async function getTrips() {
  const response = await api.get("/trips");
  return response.data;
}
export async function getTrip(id) {
  const response = await api.get(`/trips/${encodeURIComponent(id)}`);
  return response.data;
}
export async function updateTrip(id, changes) {
  const response = await api.patch(`/trips/${encodeURIComponent(id)}`, changes);
  return response.data;
}
export async function regenerateTrip(id) {
  const response = await api.post(`/trips/${encodeURIComponent(id)}/generate`);
  return response.data;
}
export async function deleteTrip(id) {
  await api.delete(`/trips/${encodeURIComponent(id)}`);
}
