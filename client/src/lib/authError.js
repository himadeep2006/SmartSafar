export function getAuthError(error, fallback) {
  if (!error.response) return "SmartSafar couldn’t reach the server. Check your connection and try again.";
  const data = error.response.data;
  if (typeof data?.detail === "string") return data.detail;
  const firstError = data?.errors?.[0] || (Array.isArray(data?.detail) ? data.detail[0] : null);
  if (firstError?.message) return firstError.message.replace(/^Value error,\s*/i, "");
  if (firstError?.msg) return firstError.msg.replace(/^Value error,\s*/i, "");
  return fallback;
}
