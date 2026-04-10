import { CSSProperties } from "react";

type LayoutZone = {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  seats?: number;
};

type LayoutFurniture = {
  type: string;
  count?: number;
};

type LayoutSpace = {
  width: number;
  height: number;
  shape?: string;
};

export type Layout3DJson = {
  version?: number;
  unit?: string;
  space?: LayoutSpace;
  zones?: LayoutZone[];
  furniture?: LayoutFurniture[];
  assumptions?: string[];
};

type LayoutPreview2DProps = {
  layout: Layout3DJson | null | undefined;
  title?: string;
};

const zoneStyleMap: Record<
  string,
  {
    label: string;
    background: string;
    border: string;
    text: string;
  }
> = {
  open_office: {
    label: "오픈오피스",
    background: "#dbeafe",
    border: "#60a5fa",
    text: "#1d4ed8",
  },
  meeting_room: {
    label: "회의실",
    background: "#fef3c7",
    border: "#f59e0b",
    text: "#92400e",
  },
  manager_room: {
    label: "대표실",
    background: "#ede9fe",
    border: "#8b5cf6",
    text: "#6d28d9",
  },
  lounge: {
    label: "라운지",
    background: "#dcfce7",
    border: "#22c55e",
    text: "#166534",
  },
  focus_room: {
    label: "집중실",
    background: "#fee2e2",
    border: "#f87171",
    text: "#b91c1c",
  },
  phone_booth: {
    label: "폰부스",
    background: "#fce7f3",
    border: "#ec4899",
    text: "#be185d",
  },
  pantry: {
    label: "탕비실",
    background: "#ffedd5",
    border: "#fb923c",
    text: "#c2410c",
  },
  reception: {
    label: "리셉션",
    background: "#e0f2fe",
    border: "#38bdf8",
    text: "#0369a1",
  },
  storage: {
    label: "창고",
    background: "#e5e7eb",
    border: "#9ca3af",
    text: "#374151",
  },
};

function getZoneMeta(type: string) {
  return (
    zoneStyleMap[type] || {
      label: type,
      background: "#e2e8f0",
      border: "#94a3b8",
      text: "#334155",
    }
  );
}

function formatZoneLabel(zone: LayoutZone) {
  const meta = getZoneMeta(zone.type);
  const sizeText = `${zone.width} × ${zone.height}m`;
  const seatText =
    zone.seats !== undefined && zone.seats !== null ? ` · ${zone.seats}석` : "";
  return `${meta.label}${seatText} · ${sizeText}`;
}

function isValidLayout(layout: Layout3DJson | null | undefined): layout is Layout3DJson {
  return !!layout?.space && !!layout?.space.width && !!layout?.space.height;
}

export default function LayoutPreview2D({
  layout,
  title = "2D 배치 미리보기",
}: LayoutPreview2DProps) {
  if (!isValidLayout(layout)) {
    return (
      <section style={styles.wrapper}>
        <div style={styles.headerRow}>
          <div>
            <h3 style={styles.title}>{title}</h3>
            <p style={styles.description}>
              아직 표시할 배치 데이터가 없습니다.
            </p>
          </div>
        </div>

        <div style={styles.emptyBox}>
          `layout_3d_json`에 `space.width`, `space.height`, `zones` 정보가 들어오면
          이 영역에 배치도가 표시됩니다.
        </div>
      </section>
    );
  }

  const unit = layout.unit || "meter";
  const spaceWidth = layout.space!.width;
  const spaceHeight = layout.space!.height;
  const shape = layout.space?.shape || "rectangle";
  const zones = layout.zones || [];
  const furniture = layout.furniture || [];
  const assumptions = layout.assumptions || [];

  return (
    <section style={styles.wrapper}>
      <div style={styles.headerRow}>
        <div>
          <h3 style={styles.title}>{title}</h3>
          <p style={styles.description}>
            저장된 `layout_3d_json` 데이터를 바탕으로 공간 구역을 2D로 미리 보여줍니다.
          </p>
        </div>

        <div style={styles.summaryRow}>
          <span style={styles.summaryChip}>
            공간 {spaceWidth} × {spaceHeight} {unit}
          </span>
          <span style={styles.summaryChip}>형태 {shape}</span>
          <span style={styles.summaryChip}>구역 {zones.length}개</span>
        </div>
      </div>

      <div style={styles.canvasOuter}>
        <div
          style={{
            ...styles.canvas,
            aspectRatio: `${spaceWidth} / ${spaceHeight}`,
          }}
        >
          <div style={styles.gridOverlay} />

          {zones.map((zone, index) => {
            const meta = getZoneMeta(zone.type);

            const zoneStyle: CSSProperties = {
              ...styles.zone,
              left: `${(zone.x / spaceWidth) * 100}%`,
              top: `${(zone.y / spaceHeight) * 100}%`,
              width: `${(zone.width / spaceWidth) * 100}%`,
              height: `${(zone.height / spaceHeight) * 100}%`,
              backgroundColor: meta.background,
              border: `2px solid ${meta.border}`,
              color: meta.text,
            };

            return (
              <div key={`${zone.type}-${index}`} style={zoneStyle} title={formatZoneLabel(zone)}>
                <div style={styles.zoneTitle}>{meta.label}</div>
                <div style={styles.zoneMeta}>
                  {zone.seats !== undefined && zone.seats !== null
                    ? `${zone.seats}석`
                    : "좌석 미정"}
                </div>
                <div style={styles.zoneMeta}>
                  {zone.width} × {zone.height}m
                </div>
                <div style={styles.zoneMeta}>
                  ({zone.x}, {zone.y})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.bottomGrid}>
        <div style={styles.infoCard}>
          <h4 style={styles.cardTitle}>구역 목록</h4>

          {zones.length === 0 ? (
            <div style={styles.emptyMini}>구역 정보가 없습니다.</div>
          ) : (
            <div style={styles.listWrap}>
              {zones.map((zone, index) => {
                const meta = getZoneMeta(zone.type);
                return (
                  <div key={`${zone.type}-list-${index}`} style={styles.listItem}>
                    <div
                      style={{
                        ...styles.dot,
                        backgroundColor: meta.border,
                      }}
                    />
                    <div style={styles.listText}>
                      <div style={styles.listTitle}>{meta.label}</div>
                      <div style={styles.listMeta}>
                        위치 ({zone.x}, {zone.y}) · 크기 {zone.width} × {zone.height}m
                        {zone.seats !== undefined && zone.seats !== null
                          ? ` · ${zone.seats}석`
                          : ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={styles.infoCard}>
          <h4 style={styles.cardTitle}>가구 요약</h4>

          {furniture.length === 0 ? (
            <div style={styles.emptyMini}>가구 정보가 없습니다.</div>
          ) : (
            <div style={styles.tagWrap}>
              {furniture.map((item, index) => (
                <span key={`${item.type}-${index}`} style={styles.tag}>
                  {item.type}
                  {item.count !== undefined && item.count !== null
                    ? ` × ${item.count}`
                    : ""}
                </span>
              ))}
            </div>
          )}

          <h4 style={{ ...styles.cardTitle, marginTop: 20 }}>가정/메모</h4>

          {assumptions.length === 0 ? (
            <div style={styles.emptyMini}>가정 정보가 없습니다.</div>
          ) : (
            <ul style={styles.assumptionList}>
              {assumptions.map((item, index) => (
                <li key={`${item}-${index}`} style={styles.assumptionItem}>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    color: "#0f172a",
  },
  description: {
    margin: "8px 0 0",
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#64748b",
  },
  summaryRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  summaryChip: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: "999px",
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    fontSize: "12px",
    fontWeight: 700,
    border: "1px solid #bfdbfe",
  },
  canvasOuter: {
    border: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "16px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
  },
  canvas: {
    width: "100%",
    position: "relative",
    backgroundColor: "#f8fafc",
    border: "2px solid #0f172a",
    borderRadius: "16px",
    overflow: "hidden",
    minHeight: "320px",
  },
  gridOverlay: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(to right, rgba(148,163,184,0.18) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.18) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    pointerEvents: "none",
  },
  zone: {
    position: "absolute",
    borderRadius: "14px",
    boxSizing: "border-box",
    padding: "10px",
    overflow: "hidden",
    boxShadow: "0 4px 10px rgba(15, 23, 42, 0.08)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minWidth: "72px",
    minHeight: "56px",
  },
  zoneTitle: {
    fontSize: "13px",
    fontWeight: 800,
    lineHeight: 1.2,
  },
  zoneMeta: {
    fontSize: "11px",
    lineHeight: 1.4,
    opacity: 0.9,
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  infoCard: {
    border: "1px solid #e2e8f0",
    backgroundColor: "#ffffff",
    borderRadius: "18px",
    padding: "18px",
  },
  cardTitle: {
    margin: 0,
    fontSize: "16px",
    color: "#0f172a",
  },
  listWrap: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "14px",
  },
  listItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "12px",
    backgroundColor: "#f8fafc",
  },
  dot: {
    width: "12px",
    height: "12px",
    borderRadius: "999px",
    marginTop: "4px",
    flexShrink: 0,
  },
  listText: {
    flex: 1,
  },
  listTitle: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: "4px",
  },
  listMeta: {
    fontSize: "13px",
    lineHeight: 1.5,
    color: "#475569",
  },
  tagWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "14px",
  },
  tag: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: "999px",
    backgroundColor: "#f1f5f9",
    color: "#334155",
    fontSize: "12px",
    fontWeight: 700,
    border: "1px solid #cbd5e1",
  },
  assumptionList: {
    margin: "14px 0 0",
    paddingLeft: "18px",
    color: "#475569",
  },
  assumptionItem: {
    fontSize: "13px",
    lineHeight: 1.7,
    marginBottom: "6px",
  },
  emptyBox: {
    border: "1px dashed #cbd5e1",
    borderRadius: "16px",
    padding: "18px",
    backgroundColor: "#f8fafc",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  emptyMini: {
    marginTop: "14px",
    border: "1px dashed #cbd5e1",
    borderRadius: "14px",
    padding: "14px",
    backgroundColor: "#f8fafc",
    color: "#64748b",
    fontSize: "13px",
  },
};
