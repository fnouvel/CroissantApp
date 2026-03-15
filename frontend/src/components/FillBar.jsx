import { useEffect, useState } from "react";

export default function FillBar({ label, value, maxValue = 5, size = "md" }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(Math.min((value / maxValue) * 100, 100));
    }, 80);
    return () => clearTimeout(timer);
  }, [value, maxValue]);

  const barHeight = size === "sm" ? 6 : 8;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 12, color: "var(--stone)", width: 80, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: barHeight, background: "var(--cloud)", borderRadius: barHeight, overflow: "hidden" }}>
        <div
          className="fill-bar-inner"
          style={{ height: "100%", borderRadius: barHeight, width: `${width}%`, background: "var(--terracotta)" }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", width: 24, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
        {typeof value === "number" ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}
