const API = import.meta.env.VITE_API_URL;

export async function fetchBakeries(token) {
  const res = await fetch(`${API}/bakeries`, {
    credentials: "include",
    headers: { Authorization: "Bearer " + token },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch bakeries");
  return res.json();
}

export async function fetchBakery(token, id) {
  const res = await fetch(`${API}/bakeries/${id}`, {
    credentials: "include",
    headers: { Authorization: "Bearer " + token },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch bakery");
  return res.json();
}

export async function createBakery(token, data) {
  const res = await fetch(`${API}/bakeries`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify(data),
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to create bakery");
  return res.json();
}

export async function deleteBakery(token, id) {
  const res = await fetch(`${API}/bakeries/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: { Authorization: "Bearer " + token },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to delete bakery");
}

export async function createRating(token, bakeryId, { flakiness, butteriness, freshness, size_value, notes, visited_at, photo }) {
  const form = new FormData();
  form.append("flakiness", flakiness);
  form.append("butteriness", butteriness);
  form.append("freshness", freshness);
  form.append("size_value", size_value);
  if (notes) form.append("notes", notes);
  if (visited_at) form.append("visited_at", visited_at);
  if (photo) form.append("photo", photo);

  const res = await fetch(`${API}/bakeries/${bakeryId}/ratings`, {
    method: "POST",
    credentials: "include",
    headers: { Authorization: "Bearer " + token },
    body: form,
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to create rating");
  return res.json();
}

export async function fetchMyRatings(token) {
  const res = await fetch(`${API}/ratings/me`, {
    credentials: "include",
    headers: { Authorization: "Bearer " + token },
  });
  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch ratings");
  return res.json();
}
