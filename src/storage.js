const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw2UAnW6uI1rB_T78UK-OEXjWxXcBvx3kjHCPcMONZdSJ170WlQvsY0lBY5z10SaKe7/exec";
const TOKEN = "첫마을-7979";

export async function getItem(key) {
  const res = await fetch(`${APPS_SCRIPT_URL}?token=${encodeURIComponent(TOKEN)}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return { key, value: JSON.stringify({ items: data.items, exchangeRate: data.exchangeRate }) };
}

export async function setItem(key, value) {
  const parsed = JSON.parse(value);
  const res = await fetch(APPS_SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ token: TOKEN, items: parsed.items, exchangeRate: parsed.exchangeRate }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return { key, value };
}
// market: "KR" | "US", query: 종목명 또는 종목코드/티커
export async function lookupStock(market, query) {
  const url = `${APPS_SCRIPT_URL}?token=${encodeURIComponent(TOKEN)}&action=lookup&market=${encodeURIComponent(
    market
  )}&query=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.message || data.error);
  return data;
}
