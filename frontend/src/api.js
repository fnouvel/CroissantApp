const API = import.meta.env.VITE_API_URL;

export async function fetchBakeries() {
  const res = await fetch(`${API}/bakeries`);
  if (!res.ok) throw new Error("Failed to fetch bakeries");
  return res.json();
}

export async function fetchBakery(id) {
  const res = await fetch(`${API}/bakeries/${id}`);
  if (!res.ok) throw new Error("Failed to fetch bakery");
  return res.json();
}

export async function createBakery(data) {
  const res = await fetch(`${API}/bakeries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create bakery");
  return res.json();
}

export async function deleteBakery(id) {
  const res = await fetch(`${API}/bakeries/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete bakery");
}

export async function createRating(bakeryId, data) {
  const res = await fetch(`${API}/bakeries/${bakeryId}/ratings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create rating");
  return res.json();
}
