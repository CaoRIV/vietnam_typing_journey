import { useEffect, useMemo, useState } from "react";

import {
  provinceCatalog,
  provinceRegions,
  type ProvinceRegion,
} from "../data/provinceCatalog";
import { vietnamMapGeometry } from "../data/vietnamMap";
import type { ProvinceJourney } from "../journey/types";

type RegionFilter = "all" | ProvinceRegion;

type VietnamJourneySelectorProps = {
  journeys: readonly ProvinceJourney[];
  onOpenJourney: (slug: string) => void;
};

const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();

export function VietnamJourneySelector({
  journeys,
  onOpenJourney,
}: VietnamJourneySelectorProps) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<RegionFilter>("all");
  const availableSlugs = useMemo(
    () => new Set(journeys.map((journey) => journey.slug)),
    [journeys],
  );
  const filteredProvinces = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());
    return provinceCatalog.filter(
      (province) =>
        (region === "all" || province.region === region) &&
        (!normalizedQuery ||
          normalizeSearch(province.name).includes(normalizedQuery)),
    );
  }, [query, region]);
  const activeJourney = journeys[0];
  const activeStops = activeJourney?.route.stops ?? [];
  const markerPoint = activeStops.length
    ? activeStops
        .map((stop) => activeJourney.route.points[stop.pointIndex])
        .reduce(
          (total, point) => ({ x: total.x + point.x, y: total.y + point.y }),
          { x: 0, y: 0 },
        )
    : null;
  const marker =
    markerPoint && activeStops.length
      ? {
          x: markerPoint.x / activeStops.length,
          y: markerPoint.y / activeStops.length,
        }
      : null;

  useEffect(() => {
    const renderSelectorToText = () =>
      JSON.stringify({
        mode: "province-select",
        route: "/ban-do",
        totalProvinces: provinceCatalog.length,
        availableJourneys: journeys.map((journey) => ({
          slug: journey.slug,
          name: journey.name,
          province: journey.shortName,
          places: journey.places.length,
        })),
        filters: { region, query },
        visibleProvinces: filteredProvinces.map((province) => ({
          code: province.code,
          name: province.name,
          region: province.region,
          status:
            province.journeySlug &&
            availableSlugs.has(province.journeySlug)
              ? "available"
              : "coming-soon",
        })),
      });

    window.render_game_to_text = renderSelectorToText;
    return () => {
      if (window.render_game_to_text === renderSelectorToText) {
        delete window.render_game_to_text;
      }
    };
  }, [availableSlugs, filteredProvinces, journeys, query, region]);

  return (
    <main className="journey-selector min-h-[100dvh] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
      <header className="mx-auto flex max-w-[1400px] items-end justify-between gap-6 pb-5 lg:pb-6">
        <div>
          <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-accent">
            Gõ Xuyên Việt
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-foreground sm:text-4xl">
            Chọn hành trình
          </h1>
        </div>
        <div className="hidden text-right sm:block">
          <strong className="font-mono text-2xl text-foreground">01/34</strong>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            tỉnh thành đã mở
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)] lg:gap-5">
        <section className="selector-map-panel relative min-h-[31rem] overflow-hidden rounded-[var(--radius-panel)] border border-map-border bg-map lg:min-h-[calc(100dvh-8rem)]">
          <div className="selector-map-copy">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
              Bản đồ hành trình
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-foreground">
              Việt Nam đang mở từng chặng
            </h2>
            <p className="mt-2 max-w-[38ch] text-sm leading-6 text-muted">
              Bắt đầu tại Huế. Những tỉnh còn lại sẽ được mở khi dữ liệu địa
              điểm và tuyến đường hoàn tất kiểm duyệt.
            </p>
          </div>

          <svg
            className="selector-vietnam-map"
            viewBox={`0 0 ${vietnamMapGeometry.viewBox.width} ${vietnamMapGeometry.viewBox.height}`}
            role="img"
            aria-label="Bản đồ Việt Nam với hành trình Huế đang khả dụng"
          >
            <defs>
              <linearGradient id="selector-land-wash" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--map-land-top)" />
                <stop offset="1" stopColor="var(--map-land-bottom)" />
              </linearGradient>
            </defs>
            <path
              className="selector-vietnam-land"
              fill="url(#selector-land-wash)"
              d={vietnamMapGeometry.path}
            />
            {marker && activeJourney ? (
              <g
                className="selector-journey-marker"
                role="link"
                tabIndex={0}
                aria-label={`Mở hành trình ${activeJourney.shortName}`}
                transform={`translate(${marker.x} ${marker.y})`}
                onClick={() => onOpenJourney(activeJourney.slug)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpenJourney(activeJourney.slug);
                  }
                }}
              >
                <circle className="selector-marker-pulse" r="18" />
                <circle className="selector-marker-ring" r="10" />
                <circle className="selector-marker-core" r="4" />
                <text x="16" y="5">Huế · 5 điểm</text>
              </g>
            ) : null}
          </svg>

          {activeJourney ? (
            <article className="selector-featured-journey">
              <div>
                <span>Đang mở</span>
                <h3>{activeJourney.name}</h3>
                <p>{activeJourney.places.length} điểm tham quan</p>
              </div>
              <button
                id="open-hue-journey"
                type="button"
                onClick={() => onOpenJourney(activeJourney.slug)}
              >
                Bắt đầu
                <span aria-hidden="true">→</span>
              </button>
            </article>
          ) : null}
        </section>

        <aside className="selector-catalog rounded-[var(--radius-panel)] border border-border bg-surface p-5 sm:p-6 lg:flex lg:max-h-[calc(100dvh-8rem)] lg:flex-col">
          <div>
            <h2 className="text-xl font-extrabold tracking-[-0.03em] text-foreground">
              34 tỉnh, thành phố
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Tìm hành trình theo danh mục hành chính hiện hành.
            </p>
          </div>

          <label className="selector-search mt-5">
            <span className="sr-only">Tìm tỉnh hoặc thành phố</span>
            <input
              id="province-search"
              type="search"
              value={query}
              placeholder="Tìm tỉnh hoặc thành phố"
              onChange={(event) => setQuery(event.currentTarget.value)}
            />
          </label>

          <div className="selector-region-tabs mt-3" role="group" aria-label="Lọc theo vùng">
            <button
              type="button"
              data-active={region === "all"}
              onClick={() => setRegion("all")}
            >
              Tất cả
            </button>
            {provinceRegions.map((item) => (
              <button
                key={item.id}
                type="button"
                data-active={region === item.id}
                onClick={() => setRegion(item.id)}
              >
                {item.name.replace("Miền ", "")}
              </button>
            ))}
          </div>

          <div className="selector-province-list mt-4" aria-live="polite">
            {filteredProvinces.map((province) => {
              const isAvailable = Boolean(
                province.journeySlug &&
                  availableSlugs.has(province.journeySlug),
              );
              return (
                <button
                  key={province.code}
                  type="button"
                  className="selector-province-row"
                  data-available={isAvailable}
                  disabled={!isAvailable}
                  onClick={() =>
                    province.journeySlug &&
                    onOpenJourney(province.journeySlug)
                  }
                >
                  <span className="selector-province-code">{province.code}</span>
                  <span>{province.name}</span>
                  <small>{isAvailable ? "Chơi ngay" : "Sắp mở"}</small>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </main>
  );
}
