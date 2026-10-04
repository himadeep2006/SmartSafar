import api from "../lib/api";

export async function getAssistantStatus() {
  return (await api.get("/assistant/status")).data;
}

export async function sendAssistantMessage(message, history = [], tripId = null) {
  const response = await api.post("/assistant/chat", {
    message,
    history: history.slice(-8),
    ...(tripId ? { trip_id: tripId } : {}),
  });
  return response.data;
}
