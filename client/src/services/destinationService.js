import api from "../lib/api";

export async function getDestinations({ search, category, state, signal } = {}) {
  const response = await api.get("/destinations", {
    params: { search: search || undefined, category: category || undefined, state: state || undefined },
    signal,
  });
  return response.data;
}

export async function getDestination(destinationId, { signal } = {}) {
  const response = await api.get(`/destinations/${encodeURIComponent(destinationId)}`, { signal });
  return response.data;
}

export async function getSavedDestinations() {
  const response = await api.get("/saved-destinations");
  return response.data;
}

export async function saveDestination(destinationId) {
  const response = await api.post(`/saved-destinations/${encodeURIComponent(destinationId)}`);
  return response.data;
}

export async function removeSavedDestination(destinationId) {
  await api.delete(`/saved-destinations/${encodeURIComponent(destinationId)}`);
}
