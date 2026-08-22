import { useState, useEffect, useMemo } from "react";
import { getItem, setItem, lookupStock } from "./storage";
import { Plus, Trash2, Bell, Globe, ChevronDown, ChevronUp } from "lucide-react";

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const num = (v) => (v === "" || v === null || v === undefined ? 0 : Number(v));
const hasVal = (v) => v !== "" && v !== null && v !== undefined && !isNaN(Number(v)) && Number(v) !== 0;
const fmt = (n, digits = 0) => {
  if (n === null || n === undefined || isNaN(n)) return "-";
  return Number(n).toLocaleString("ko-KR", { maximumFractionDigits: digits });
};

const STORAGE_KEY = "watchboard:state:v2";

const emptyForm = {
  name: "",
  ticker: "",
  market: "KR",
  price: "",
  high: "",
  low: "",
  alertPct: "25",
  targetPrice: "",
  stopLoss: "",
  ma20: "",
  ma60: "",
  ma120: "",
  per: "",
  pbr: "",
  dividendYield: "",
  avgVolume: "",
  curVolume: "",
  earningsDate: "",
  isHolding: false,
  shares: "",
  avgCost: "",
  note: "",
};

const seedItems = [
  {
    id: "1",
    market: "KR",
    name: "삼성전자",
    ticker: "005930",
    price: 71200,
    high: 88800,
    low: 49900,
    alertPct: 25,
    targetPrice: 90000,
    stopLoss: 62000,
    ma20: 72500,
    ma60: 75800,
    ma120: 78000,
    per: 13.2,
    pbr: 1.1,
    dividendYield: 2.1,
    avgVolume: 14000000,
    curVolume: 21000000,
    earningsDate: "",
    isHolding: true,
    shares: 30,
    avgCost: 68000,
    note: "",
  },
  {
    id: "2",
    market: "US",
    name: "Apple",
    ticker: "AAPL",
    price: 228.5,
    high: 260.1,
    low: 164.1,
    alertPct: 20,
    targetPrice: 250,
    stopLoss: 195,
    ma20: 231,
    ma60: 225,
    ma120: 215,
    per: 34.1,
    pbr: 48.2,
    dividendYield: 0.4,
    avgVolume: 48000000,
    curVolume: 52000000,
    earningsDate: "",
    isHolding: false,
    shares: "",
    avgCost: "",
    note: "",
  },
];

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
  return diff;
};

function toKRW(item, rate) {
  return item.market === "US" ? num(item.price) * rate : num(item.price);
}

function StockCard({ item, rate, onDelete, onEdit, portfolioTotalKRW }) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState(item);
  useEffect(() => setDraft(item), [item]);

  const range = num(item.high) - num(item.low);
  const pos = range > 0 ? clamp(((num(item.price) - num(item.low)) / range) * 100, 0, 100) : 50;
  const dropFromHigh = num(item.high) > 0 ? ((num(item.high) - num(item.price)) / num(item.high)) * 100 : 0;
  const alertThresholdPrice = num(item.high) * (1 - num(item.alertPct) / 100);
  const alertPos = range > 0 ? clamp(((alertThresholdPrice - num(item.low)) / range) * 100, 0, 100) : 0;
  const inAlertZone = hasVal(item.price) && item.price <= alertThresholdPrice;

  const targetHit = hasVal(item.targetPrice) && num(item.price) >= num(item.targetPrice);
  const stopHit = hasVal(item.stopLoss) && num(item.price) <= num(item.stopLoss);
  const volumeSpike = hasVal(item.avgVolume) && hasVal(item.curVolume) && num(item.curVolume) / num(item.avgVolume) >= 2;
  const earningsIn = daysUntil(item.earningsDate);
  const earningsSoon = earningsIn !== null && earningsIn >= 0 && earningsIn <= 7;

  const krwValue = item.isHolding && hasVal(item.shares) ? num(item.shares) * toKRW(item, rate) : 0;
  const weight = portfolioTotalKRW > 0 ? (krwValue / portfolioTotalKRW) * 100 : 0;
  const returnPct = item.isHolding && hasVal(item.avgCost) ? ((num(item.price) - num(item.avgCost)) / num(item.avgCost)) * 100 : null;

  const priceLabel = item.market === "US" ? `$${fmt(item.price, 2)}` : `${fmt(item.price)}원`;

  const saveEdit = () => {
    onEdit({
      ...draft,
      price: num(draft.price),
      high: num(draft.high),
      low: num(draft.low),
      alertPct: num(draft.alertPct) || 25,
      targetPrice: draft.targetPrice === "" ? "" : num(draft.targetPrice),
      stopLoss: draft.stopLoss === "" ? "" : num(draft.stopLoss),
      ma20: draft.ma20 === "" ? "" : num(draft.ma20),
      ma60: draft.ma60 === "" ? "" : num(draft.ma60),
      ma120: draft.ma120 === "" ? "" : num(draft.ma120),
      per: draft.per === "" ? "" : num(draft.per),
      pbr: draft.pbr === "" ? "" : num(draft.pbr),
      dividendYield: draft.dividendYield === "" ? "" : num(draft.dividendYield),
      avgVolume: draft.avgVolume === "" ? "" : num(draft.avgVolume),
      curVolume: draft.curVolume === "" ? "" : num(draft.curVolume),
      shares: draft.shares === "" ? "" : num(draft.shares),
      avgCost: draft.avgCost === "" ? "" : num(draft.avgCost),
    });
    setEditing(false);
  };

  const badges = [
    inAlertZone && { text: "알람 조건 충족", bg: "#4a3610", fg: "#f5c56a" },
    pos >= 95 && { text: "52주 신고가권", bg: "#4a1b1b", fg: "#f0a3a3" },
    pos <= 5 && { text: "52주 신저가권", bg: "#0e2d4a", fg: "#8fc3f0" },
    targetHit && { text: "목표가 도달", bg: "#123320", fg: "#7fd99a" },
    stopHit && { text: "손절가 도달", bg: "#3a1414", fg: "#e0847a" },
    volumeSpike && { text: "거래량 급증", bg: "#2a1a3d", fg: "#c39af0" },
    earningsSoon && { text: `실적 D-${earningsIn}`, bg: "#1c2a40", fg: "#8fc3f0" },
  ].filter(Boolean);

  const maRows = [
    hasVal(item.ma20) && { label: "20일선", val: item.ma20 },
    hasVal(item.ma60) && { label: "60일선", val: item.ma60 },
    hasVal(item.ma120) && { label: "120일선", val: item.ma120 },
  ].filter(Boolean);

  return (
    <div
      style={{
        background: inAlertZone ? "#3d2c0f" : "#141824",
        border: inAlertZone ? "1px solid #d9a441" : "1px solid #262c3a",
        borderRadius: 14,
        padding: "18px 20px",
        marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 7px",
                borderRadius: 6,
                background: item.market === "US" ? "#1c2a40" : "#1f2a1c",
                color: item.market === "US" ? "#8fc3f0" : "#a3d98f",
              }}
            >
              {item.market === "US" ? "US" : "KR"}
            </span>
            <span style={{ fontSize: 16, fontWeight: 600, color: "#f1efe6" }}>{item.name}</span>
            <span style={{ fontSize: 12, color: "#8b93a3", fontFamily: "monospace" }}>{item.ticker}</span>
            {badges.map((b, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: b.bg,
                  color: b.fg,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {b.text === "알람 조건 충족" && <Bell size={11} />}
                {b.text}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: "#f1efe6", fontFamily: "monospace" }}>{priceLabel}</span>
            {item.market === "US" && <span style={{ fontSize: 12, color: "#6b7280" }}>≈ {fmt(toKRW(item, rate))}원</span>}
            {returnPct !== null && (
              <span style={{ fontSize: 13, fontWeight: 600, color: returnPct >= 0 ? "#e2685f" : "#5fa8f5" }}>
                {returnPct >= 0 ? "+" : ""}
                {returnPct.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setExpanded((v) => !v)} style={ghostBtn}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} 상세
          </button>
          <button onClick={() => setEditing((v) => !v)} style={ghostBtn}>
            {editing ? "취소" : "수정"}
          </button>
          <button onClick={() => onDelete(item.id)} style={{ ...ghostBtn, color: "#e0847a" }} aria-label="삭제">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {editing ? (
        <EditForm draft={draft} setDraft={setDraft} onSave={saveEdit} />
      ) : (
        <>
          <div style={{ marginTop: 16, position: "relative", height: 8, background: "#242938", borderRadius: 999 }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${pos}%`,
                background: "linear-gradient(90deg, #2f6feb, #d9a441)",
                borderRadius: 999,
              }}
            />
            <div style={{ position: "absolute", left: `${alertPos}%`, top: -3, bottom: -3, width: 2, background: "#f5c56a" }} />
            <div
              style={{
                position: "absolute",
                left: `calc(${pos}% - 6px)`,
                top: -4,
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: "#f1efe6",
                border: "2px solid #0e1116",
              }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, color: "#6b7280" }}>
            <span>저 {fmt(item.low)}</span>
            <span>고 {fmt(item.high)}</span>
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 12, fontSize: 12, flexWrap: "wrap" }}>
            <span style={{ color: "#8b93a3" }}>
              고점대비 <b style={{ color: dropFromHigh > 0 ? "#5fa8f5" : "#e0847a" }}>-{dropFromHigh.toFixed(1)}%</b>
            </span>
            <span style={{ color: "#8b93a3" }}>
              범위 내 위치 <b style={{ color: "#f1efe6" }}>{pos.toFixed(0)}%</b>
            </span>
            <span style={{ color: "#8b93a3" }}>
              알람선 <b style={{ color: "#f5c56a" }}>{fmt(Math.round(alertThresholdPrice))}</b>
            </span>
            {item.isHolding && hasVal(item.shares) && (
              <span style={{ color: "#8b93a3" }}>
                포트폴리오 비중 <b style={{ color: "#f1efe6" }}>{weight.toFixed(1)}%</b>
              </span>
            )}
          </div>

          {expanded && (
            <div style={{ marginTop: 16, borderTop: "1px solid #262c3a", paddingTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <div style={sectionLabel}>이동평균선</div>
                {maRows.length === 0 ? (
                  <div style={emptyText}>입력된 이평선 없음</div>
                ) : (
                  maRows.map((r) => (
                    <div key={r.label} style={miniRow}>
                      <span style={{ color: "#8b93a3" }}>{r.label}</span>
                      <span style={{ color: num(item.price) >= r.val ? "#e2685f" : "#5fa8f5" }}>
                        {fmt(r.val)} ({num(item.price) >= r.val ? "위" : "아래"})
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div>
                <div style={sectionLabel}>밸류에이션</div>
                {!hasVal(item.per) && !hasVal(item.pbr) && !hasVal(item.dividendYield) ? (
                  <div style={emptyText}>입력된 지표 없음</div>
                ) : (
                  <>
                    {hasVal(item.per) && (
                      <div style={miniRow}>
                        <span style={{ color: "#8b93a3" }}>PER</span>
                        <span>{item.per}배</span>
                      </div>
                    )}
                    {hasVal(item.pbr) && (
                      <div style={miniRow}>
                        <span style={{ color: "#8b93a3" }}>PBR</span>
                        <span>{item.pbr}배</span>
                      </div>
                    )}
                    {hasVal(item.dividendYield) && (
                      <div style={miniRow}>
                        <span style={{ color: "#8b93a3" }}>배당수익률</span>
                        <span>{item.dividendYield}%</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <div style={sectionLabel}>목표가 / 손절가</div>
                {!hasVal(item.targetPrice) && !hasVal(item.stopLoss) ? (
                  <div style={emptyText}>미설정</div>
                ) : (
                  <>
                    {hasVal(item.targetPrice) && (
                      <div style={miniRow}>
                        <span style={{ color: "#8b93a3" }}>목표가</span>
                        <span style={{ color: "#7fd99a" }}>{fmt(item.targetPrice)}</span>
                      </div>
                    )}
                    {hasVal(item.stopLoss) && (
                      <div style={miniRow}>
                        <span style={{ color: "#8b93a3" }}>손절가</span>
                        <span style={{ color: "#e0847a" }}>{fmt(item.stopLoss)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <div style={sectionLabel}>거래량 / 실적일</div>
                {volumeSpike && (
                  <div style={miniRow}>
                    <span style={{ color: "#8b93a3" }}>거래량</span>
                    <span style={{ color: "#c39af0" }}>평균 대비 {(num(item.curVolume) / num(item.avgVolume)).toFixed(1)}배</span>
                  </div>
                )}
                {item.earningsDate && (
                  <div style={miniRow}>
                    <span style={{ color: "#8b93a3" }}>실적발표</span>
                    <span>
                      {item.earningsDate} ({earningsIn >= 0 ? `D-${earningsIn}` : "지남"})
                    </span>
                  </div>
                )}
                {!volumeSpike && !item.earningsDate && <div style={emptyText}>정보 없음</div>}
              </div>
              {item.isHolding && (
                <div>
                  <div style={sectionLabel}>보유 정보</div>
                  <div style={miniRow}>
                    <span style={{ color: "#8b93a3" }}>보유수량</span>
                    <span>{fmt(item.shares)}주</span>
                  </div>
                  {hasVal(item.avgCost) && (
                    <div style={miniRow}>
                      <span style={{ color: "#8b93a3" }}>평단가</span>
                      <span>{fmt(item.avgCost)}</span>
                    </div>
                  )}
                  <div style={miniRow}>
                    <span style={{ color: "#8b93a3" }}>평가금액</span>
                    <span>{fmt(krwValue)}원</span>
                  </div>
                </div>
              )}
              {item.note && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <div style={sectionLabel}>메모</div>
                  <div style={{ fontSize: 12, color: "#c9cdd6" }}>{item.note}</div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EditForm({ draft, setDraft, onSave }) {
  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const [lookupStatus, setLookupStatus] = useState("idle"); // idle | loading | done | error
  const [lookupMsg, setLookupMsg] = useState("");

  const runLookup = async () => {
    const query = (draft.ticker || draft.name || "").trim();
    if (!query) {
      setLookupStatus("error");
      setLookupMsg("종목명이나 종목코드를 먼저 입력해주세요.");
      return;
    }
    setLookupStatus("loading");
    setLookupMsg("");
    try {
      const result = await lookupStock(draft.market, query);
      setDraft((prev) => ({
        ...prev,
        name: prev.name || result.name,
        ticker: result.ticker,
        price: result.price ?? prev.price,
        high: result.high ?? prev.high,
        low: result.low ?? prev.low,
      }));
      setLookupStatus("done");
      setLookupMsg(`불러옴: ${result.name} · 현재가 ${result.price ?? "-"}`);
    } catch (e) {
      setLookupStatus("error");
      setLookupMsg(e.message || "조회에 실패했어요.");
    }
  };

  return (
    <div style={{ marginTop: 14 }}>
      <div style={sectionLabel}>기본 정보</div>
      <div style={grid2}>
        <input placeholder="종목명 (예: 삼성전자)" value={draft.name} onChange={set("name")} style={inputStyle} />
        <input placeholder="종목코드/티커 (예: 005930, AAPL)" value={draft.ticker} onChange={set("ticker")} style={inputStyle} />
        <select value={draft.market} onChange={set("market")} style={inputStyle}>
          <option value="KR">국내 (KRW)</option>
          <option value="US">해외 (USD)</option>
        </select>
        <button
          type="button"
          onClick={runLookup}
          disabled={lookupStatus === "loading"}
          style={{ ...ghostBtn, justifyContent: "center", color: "#f5c56a", borderColor: "#5a4a24" }}
        >
          {lookupStatus === "loading" ? "조회 중..." : "자동 조회로 현재가·52주 채우기"}
        </button>
        <input placeholder="현재가" value={draft.price} onChange={set("price")} style={inputStyle} />
        <input placeholder="52주 최고가" value={draft.high} onChange={set("high")} style={inputStyle} />
        <input placeholder="52주 최저가" value={draft.low} onChange={set("low")} style={inputStyle} />
        <input placeholder="알람 기준 % (기본 25)" value={draft.alertPct} onChange={set("alertPct")} style={inputStyle} />
      </div>
      {lookupMsg && (
        <div style={{ fontSize: 12, color: lookupStatus === "error" ? "#e0847a" : "#7fd99a", marginTop: -6, marginBottom: 12 }}>
          {lookupMsg}
        </div>
      )}

      <div style={sectionLabel}>목표가 / 손절가 (선택)</div>
      <div style={grid2}>
        <input placeholder="목표가" value={draft.targetPrice} onChange={set("targetPrice")} style={inputStyle} />
        <input placeholder="손절가" value={draft.stopLoss} onChange={set("stopLoss")} style={inputStyle} />
      </div>

      <div style={sectionLabel}>이동평균선 (선택)</div>
      <div style={grid2}>
        <input placeholder="20일선" value={draft.ma20} onChange={set("ma20")} style={inputStyle} />
        <input placeholder="60일선" value={draft.ma60} onChange={set("ma60")} style={inputStyle} />
        <input placeholder="120일선" value={draft.ma120} onChange={set("ma120")} style={inputStyle} />
      </div>

      <div style={sectionLabel}>밸류에이션 (선택)</div>
      <div style={grid2}>
        <input placeholder="PER (배)" value={draft.per} onChange={set("per")} style={inputStyle} />
        <input placeholder="PBR (배)" value={draft.pbr} onChange={set("pbr")} style={inputStyle} />
        <input placeholder="배당수익률 (%)" value={draft.dividendYield} onChange={set("dividendYield")} style={inputStyle} />
      </div>

      <div style={sectionLabel}>거래량 / 실적발표일 (선택)</div>
      <div style={grid2}>
        <input placeholder="평균 거래량" value={draft.avgVolume} onChange={set("avgVolume")} style={inputStyle} />
        <input placeholder="최근 거래량" value={draft.curVolume} onChange={set("curVolume")} style={inputStyle} />
        <input type="date" value={draft.earningsDate} onChange={set("earningsDate")} style={inputStyle} />
      </div>

      <div style={sectionLabel}>보유 정보 (선택)</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <input type="checkbox" checked={draft.isHolding} onChange={set("isHolding")} id={`hold-${draft.id}`} />
        <label htmlFor={`hold-${draft.id}`} style={{ fontSize: 12, color: "#c9cdd6" }}>
          이 종목을 실제 보유 중
        </label>
      </div>
      {draft.isHolding && (
        <div style={grid2}>
          <input placeholder="보유수량" value={draft.shares} onChange={set("shares")} style={inputStyle} />
          <input placeholder="평단가" value={draft.avgCost} onChange={set("avgCost")} style={inputStyle} />
        </div>
      )}

      <div style={sectionLabel}>메모 (선택)</div>
      <textarea
        placeholder="관련 뉴스, 공시, 매매 아이디어 등을 메모해 두세요"
        value={draft.note}
        onChange={set("note")}
        style={{ ...inputStyle, width: "100%", minHeight: 60, resize: "vertical" }}
      />

      <button onClick={onSave} style={saveBtn}>
        저장
      </button>
    </div>
  );
}

export default function WatchboardApp() {
  const [items, setItems] = useState(seedItems);
  const [exchangeRate, setExchangeRate] = useState(1380);
  const [loaded, setLoaded] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [marketFilter, setMarketFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getItem(STORAGE_KEY);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) setItems(parsed.items);
          if (parsed.exchangeRate) setExchangeRate(parsed.exchangeRate);
        }
      } catch (e) {
        // 저장된 데이터 없음 - 샘플 데이터 유지
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(async () => {
      try {
        await setItem(STORAGE_KEY, JSON.stringify({ items, exchangeRate }));
        setSaveError(false);
      } catch (e) {
        setSaveError(true);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [items, exchangeRate, loaded]);

  const portfolioTotalKRW = useMemo(
    () =>
      items.reduce((sum, it) => {
        if (!it.isHolding || !hasVal(it.shares)) return sum;
        return sum + num(it.shares) * toKRW(it, exchangeRate);
      }, 0),
    [items, exchangeRate]
  );

  const alertCount = useMemo(
    () => items.filter((it) => hasVal(it.price) && hasVal(it.high) && it.price <= it.high * (1 - num(it.alertPct) / 100)).length,
    [items]
  );

  const visibleItems = useMemo(() => {
    let list = [...items];
    if (marketFilter !== "all") list = list.filter((it) => it.market === marketFilter);
    if (sortBy === "dropFromHigh") {
      list.sort((a, b) => {
        const da = num(a.high) > 0 ? (num(a.high) - num(a.price)) / num(a.high) : 0;
        const db = num(b.high) > 0 ? (num(b.high) - num(b.price)) / num(b.high) : 0;
        return db - da;
      });
    } else if (sortBy === "alertFirst") {
      list.sort((a, b) => {
        const aa = hasVal(a.price) && hasVal(a.high) && a.price <= a.high * (1 - num(a.alertPct) / 100) ? 1 : 0;
        const bb = hasVal(b.price) && hasVal(b.high) && b.price <= b.high * (1 - num(b.alertPct) / 100) ? 1 : 0;
        return bb - aa;
      });
    } else if (sortBy === "weight") {
      list.sort((a, b) => {
        const wa = a.isHolding && hasVal(a.shares) ? num(a.shares) * toKRW(a, exchangeRate) : 0;
        const wb = b.isHolding && hasVal(b.shares) ? num(b.shares) * toKRW(b, exchangeRate) : 0;
        return wb - wa;
      });
    }
    return list;
  }, [items, sortBy, marketFilter, exchangeRate]);

  const addItem = () => {
    if (!form.name.trim() || !form.price || !form.high || !form.low) return;
    setItems((prev) => [...prev, { ...form, id: Date.now().toString() }]);
    setForm(emptyForm);
    setShowForm(false);
  };

  const deleteItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));
  const editItem = (updated) => setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));

  return (
    <div
      style={{
        background: "#0b0e14",
        minHeight: "100%",
        padding: "28px 24px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Malgun Gothic', sans-serif",
        borderRadius: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 2, color: "#d9a441", fontWeight: 600 }}>WATCHBOARD</div>
          <h1 style={{ fontSize: 22, color: "#f1efe6", margin: "4px 0 0", fontWeight: 700 }}>관심종목 워치보드</h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>국내외 종목의 52주 위치, 알람, 목표가, 이평선, 포트폴리오 비중을 한 곳에서</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#141824", border: "1px solid #3a4152", borderRadius: 8, padding: "6px 10px" }}>
            <Globe size={13} color="#8b93a3" />
            <span style={{ fontSize: 11, color: "#8b93a3" }}>USD/KRW</span>
            <input
              value={exchangeRate}
              onChange={(e) => setExchangeRate(num(e.target.value) || 0)}
              style={{ width: 56, background: "transparent", border: "none", color: "#f1efe6", fontSize: 12, outline: "none" }}
            />
          </div>
          <select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)} style={selectStyle}>
            <option value="all">전체 시장</option>
            <option value="KR">국내만</option>
            <option value="US">해외만</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={selectStyle}>
            <option value="default">기본 정렬</option>
            <option value="dropFromHigh">고점대비 하락률순</option>
            <option value="alertFirst">알람권 먼저보기</option>
            <option value="weight">보유 비중순</option>
          </select>
          <button onClick={() => setShowForm((v) => !v)} style={addBtn}>
            <Plus size={14} /> 종목 추가
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="관심종목" value={`${items.length}개`} />
        <StatCard label="알람 조건 충족" value={`${alertCount}개`} color={alertCount > 0 ? "#f5c56a" : undefined} />
        <StatCard label="보유 평가금액" value={`${fmt(portfolioTotalKRW)}원`} />
        <StatCard label="보유 종목수" value={`${items.filter((it) => it.isHolding).length}개`} />
      </div>

      {saveError && <div style={{ fontSize: 12, color: "#e0847a", marginBottom: 12 }}>저장 중 오류가 발생했어요. 새로고침 후 다시 시도해 주세요.</div>}

      {showForm && (
        <div style={{ background: "#141824", border: "1px solid #262c3a", borderRadius: 14, padding: 18, marginBottom: 18 }}>
          <EditForm draft={{ ...form, id: "new" }} setDraft={setForm} onSave={addItem} />
        </div>
      )}

      {visibleItems.map((item) => (
        <StockCard key={item.id} item={item} rate={exchangeRate} onDelete={deleteItem} onEdit={editItem} portfolioTotalKRW={portfolioTotalKRW} />
      ))}

      {visibleItems.length === 0 && <div style={{ textAlign: "center", color: "#6b7280", padding: "40px 0", fontSize: 13 }}>표시할 종목이 없어요.</div>}

      <div style={{ marginTop: 20, fontSize: 11, color: "#4b5160", lineHeight: 1.6 }}>
        가격, 이평선, 지표는 직접 입력하는 방식이며 이 브라우저에 저장됩니다. 실시간 시세 자동 연동은 국내는 증권사 Open API(한국투자증권, 키움), 해외는
        Alpha Vantage나 Yahoo Finance 같은 API 연결이 필요해요. 뉴스/공시 자동 수집과 카카오톡·이메일 푸시 알림도 별도 서버 연동이 필요한 영역이라
        지금은 메모란과 화면 표시로 대체해 두었어요.
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background: "#141824", borderRadius: 10, padding: "10px 16px", flex: "1 1 140px" }}>
      <div style={{ fontSize: 11, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || "#f1efe6" }}>{value}</div>
    </div>
  );
}

const ghostBtn = {
  background: "transparent",
  border: "1px solid #3a4152",
  color: "#8b93a3",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 12,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
};

const addBtn = {
  background: "#d9a441",
  border: "none",
  borderRadius: 8,
  padding: "8px 14px",
  color: "#2c2107",
  fontWeight: 600,
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
};

const selectStyle = {
  background: "#141824",
  border: "1px solid #3a4152",
  color: "#f1efe6",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 12,
};

const saveBtn = {
  marginTop: 4,
  background: "#d9a441",
  border: "none",
  borderRadius: 8,
  padding: "9px 0",
  width: "100%",
  color: "#2c2107",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const inputStyle = {
  background: "#0e1116",
  border: "1px solid #3a4152",
  borderRadius: 8,
  padding: "8px 10px",
  color: "#f1efe6",
  fontSize: 13,
  boxSizing: "border-box",
};

const grid2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 };

const sectionLabel = { fontSize: 11, fontWeight: 600, color: "#6b7280", letterSpacing: 0.5, marginBottom: 8, marginTop: 4 };

const miniRow = { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#f1efe6", padding: "3px 0" };

const emptyText = { fontSize: 12, color: "#4b5160" };
