import api from "../lib/api";

export const getProfile = async () => (await api.get("/profile")).data;
export const updateProfile = async (profile) => (await api.put("/profile", profile)).data;
export const getEmergencyContacts = async () => (await api.get("/safety/contacts")).data;
export const createEmergencyContact = async (contact) => (await api.post("/safety/contacts", contact)).data;
export const updateEmergencyContact = async (id, contact) => (await api.put(`/safety/contacts/${id}`, contact)).data;
export const deleteEmergencyContact = async (id) => api.delete(`/safety/contacts/${id}`);
export const getNearbyServices = async (latitude, longitude) =>
  (await api.post("/safety/nearby", { latitude, longitude })).data;
