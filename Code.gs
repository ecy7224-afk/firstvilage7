const APPS_SCRIPT_URL = "https://script.google.com/macros/s/여기에_배포_URL_붙여넣기/exec";
const TOKEN = "여기에_직접_정한_토큰_문자열";

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
