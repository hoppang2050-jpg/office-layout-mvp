"use client";

import React from "react";

type LayoutZone = {
  id?: string;
  type?: string;
  label?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  meta?: {
    capacity?: number;
    note?: string;
  };
};

type LayoutFurniture = {
  id?: string;
  type?: string;
  label?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
};

type LayoutSpace = {
  width?: number;
  height?: number;
  unit?: string;
  shape?: string;
};

type LayoutData = {
  space?: LayoutSpace;
  zones?: LayoutZone[];
  furniture?: LayoutFurniture[];
};

function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isNaN(num) ? fallback : num;
}

function hasValidLayout(layoutData: any): layoutData is LayoutData {
  return Boolean(
    layoutData &&
      layoutData.space &&
      typeof layoutData.space === "object" &&
      toNumber(layoutData.space.width, 0) > 0 &&
      toNumber(layoutData.space.height, 0) > 0 &&
      Array.isArray(layoutData.zones)
  );
}

function getSafeZones(layoutData: LayoutData) {
  return Array.isArray(layoutData.zones) ? layoutData.zones : [];
}

function getSafeFurniture(layoutData: LayoutData) {
  return Array.isArray(layoutData.furniture) ? layoutData.furniture : [];
}

export default function LayoutPreview2D({
  layoutData,
}: {
  layoutData?: any | null;
}) {
  if (!hasValidLayout(layoutData)) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="text-base font-semibold text-slate-900">
          2D 배치 미리보기
        </div>
        <p className="mt-2 text-sm text-slate-500">
          아직 표시할 배치 데이터가 없습니다.
        </p>
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-500">
          <code>layout_3d_json</code>에 <code>space.width</code>,{" "}
          <code>space.height</code>, <code>zones</code> 정보가 들어오면 이
          영역에 배치도가 표시됩니다.
        </div>
      </div>
    );
  }

  const spaceWidth = toNumber(layoutData.space?.width, 1);
  const spaceHeight = toNumber(layoutData.space?.height, 1);
  const unit = layoutData.space?.unit || "m";
  const shape = layoutData.space?.shape || "직사각형";
  const zones = getSafeZones(layoutData);
  const furniture = getSafeFurniture(layoutData);

  const previewWidthPx = 760;
  const scale = previewWidthPx / spaceWidth;
  const previewHeightPx = Math.max(260, Math.round(spaceHeight * scale));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-base font-semibold text-slate-900">
            2D 배치 미리보기
          </div>
          <p className="mt-1 text-sm text-slate-500">
            자동 생성된 공간 구역과 가구 배치를 간단한 2D 형태로 보여줍니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1">
            크기: {spaceWidth}
            {unit} × {spaceHeight}
            {unit}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1">
            형태: {shape}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1">
            존: {zones.length}개
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1">
            가구: {furniture.length}개
          </span>
        </div>
      </div>

      <div className="mt-5 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div
          className="relative mx-auto rounded-xl border-2 border-slate-400 bg-white shadow-sm"
          style={{
            width: `${previewWidthPx}px`,
            height: `${previewHeightPx}px`,
            minWidth: `${previewWidthPx}px`,
          }}
        >
          {zones.map((zone, index) => {
            const x = toNumber(zone.x, 0);
            const y = toNumber(zone.y, 0);
            const width = Math.max(0.6, toNumber(zone.width, 1));
            const height = Math.max(0.6, toNumber(zone.height, 1));
            const color = zone.color || "#BFDBFE";

            return (
              <div
                key={zone.id || `zone-${index}`}
                className="absolute overflow-hidden rounded-lg border border-slate-300"
                style={{
                  left: `${x * scale}px`,
                  top: `${y * scale}px`,
                  width: `${width * scale}px`,
                  height: `${height * scale}px`,
                  backgroundColor: color,
                  opacity: 0.88,
                }}
                title={`${zone.label || zone.type || "구역"} (${width}${unit} × ${height}${unit})`}
              >
                <div className="p-2">
                  <div className="text-[11px] font-semibold leading-tight text-slate-800 sm:text-xs">
                    {zone.label || zone.type || "구역"}
                  </div>

                  {zone.meta?.capacity ? (
                    <div className="mt-1 text-[10px] text-slate-700 sm:text-[11px]">
                      수용 {zone.meta.capacity}명
                    </div>
                  ) : null}

                  {zone.meta?.note ? (
                    <div className="mt-1 line-clamp-2 text-[10px] text-slate-700 sm:text-[11px]">
                      {zone.meta.note}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {furniture.map((item, index) => {
            const x = toNumber(item.x, 0);
            const y = toNumber(item.y, 0);
            const width = Math.max(0.3, toNumber(item.width, 0.8));
            const height = Math.max(0.3, toNumber(item.height, 0.5));

            return (
              <div
                key={item.id || `furniture-${index}`}
                className="absolute rounded border border-slate-500 bg-white/85"
                style={{
                  left: `${x * scale}px`,
                  top: `${y * scale}px`,
                  width: `${width * scale}px`,
                  height: `${height * scale}px`,
                  transform: `rotate(${toNumber(item.rotation, 0)}deg)`,
                  transformOrigin: "center center",
                }}
                title={item.label || item.type || "가구"}
              />
            );
          })}
        </div>
      </div>

      {zones.length > 0 ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {zones.map((zone, index) => (
            <div
              key={zone.id || `zone-card-${index}`}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3"
            >
              <span
                className="mt-1 h-3 w-3 rounded-full border border-slate-300"
                style={{ backgroundColor: zone.color || "#BFDBFE" }}
              />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-900">
                  {zone.label || zone.type || "구역"}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {toNumber(zone.width, 0)}
                  {unit} × {toNumber(zone.height, 0)}
                  {unit}
                </div>
                {zone.meta?.note ? (
                  <div className="mt-1 text-xs text-slate-600">
                    {zone.meta.note}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
