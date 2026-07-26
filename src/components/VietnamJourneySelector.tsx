import { useCallback, useEffect, useMemo, useState } from "react";

import {
  provinceCatalog,
  provinceRegions,
  type ProvinceCatalogEntry,
  type ProvinceRegion,
} from "../data/provinceCatalog";
import { provinceGeometry } from "../data/provinceGeometry.generated";
import type { JourneyProgress } from "../journey/progress";
import type { ProvinceJourney } from "../journey/types";

type RegionFilter = "all" | ProvinceRegion;
type ProvinceStatus = "coming-soon" | "available" | "completed";

type VietnamJourneySelectorProps = {
  journeys: readonly ProvinceJourney[];
  progress: JourneyProgress;
  onOpenJourney: (slug: string) => void;
};

const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();

const statusLabel: Record<ProvinceStatus, string> = {
  "coming-soon": "Sắp mở",
  available: "Đang mở",
  completed: "Đã hoàn thành",
};

export function VietnamJourneySelector({
  journeys,
  progress,
  onOpenJourney,
}: VietnamJourneySelectorProps) {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<RegionFilter>("all");
  const [selectedProvinceCode, setSelectedProvinceCode] = useState("46");
  const journeyBySlug = useMemo(
    () => new Map(journeys.map((journey) => [journey.slug, journey])),
    [journeys],
  );
  const provinceByCode = useMemo(
    () => new Map(provinceCatalog.map((province) => [province.code, province])),
    [],
  );
  const completedJourneyIds = useMemo(
    () =>
      new Set(
        Object.entries(progress.journeys)
          .filter(([, entry]) => Boolean(entry.completedAt))
          .map(([journeyId]) => journeyId),
      ),
    [progress],
  );
  const getProvinceStatus = useCallback(
    (province: ProvinceCatalogEntry): ProvinceStatus => {
      const journey = province.journeySlug
        ? journeyBySlug.get(province.journeySlug)
        : undefined;
      if (!journey) return "coming-soon";
      return completedJourneyIds.has(journey.id) ? "completed" : "available";
    },
    [completedJourneyIds, journeyBySlug],
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
  const visibleProvinceCodes = useMemo(
    () => new Set(filteredProvinces.map((province) => province.code)),
    [filteredProvinces],
  );
  const selectedProvince =
    provinceByCode.get(selectedProvinceCode) ?? provinceCatalog[0];
  const selectedJourney = selectedProvince.journeySlug
    ? journeyBySlug.get(selectedProvince.journeySlug)
    : undefined;
  const selectedStatus = getProvinceStatus(selectedProvince);
  const selectedGeometry = provinceGeometry.provinces.find(
    (province) => province.code === selectedProvince.code,
  );

  useEffect(() => {
    const renderSelectorToText = () =>
      JSON.stringify({
        mode: "province-select",
        route: "/ban-do",
        coordinateSystem:
          "Projected WGS84 province boundaries in SVG viewBox 0 0 600 1000; origin top-left; x right; y down",
        totalProvinces: provinceCatalog.length,
        completedJourneys: [...completedJourneyIds],
        selectedProvince: {
          code: selectedProvince.code,
          name: selectedProvince.name,
          status: selectedStatus,
        },
        availableJourneys: journeys.map((journey) => ({
          slug: journey.slug,
          name: journey.name,
          province: journey.shortName,
          places: journey.places.length,
          visitedPlaces:
            progress.journeys[journey.id]?.visitedPlaceIds.length ?? 0,
          completed: completedJourneyIds.has(journey.id),
        })),
        filters: { region, query },
        mapProvinces: provinceGeometry.provinces.map((geometry) => {
          const province = provinceByCode.get(geometry.code)!;
          return {
            code: province.code,
            name: province.name,
            status: getProvinceStatus(province),
            selected: province.code === selectedProvince.code,
            visible: visibleProvinceCodes.has(province.code),
          };
        }),
        visibleProvinces: filteredProvinces.map((province) => ({
          code: province.code,
          name: province.name,
          region: province.region,
          status: getProvinceStatus(province),
        })),
      });

    window.render_game_to_text = renderSelectorToText;
    return () => {
      if (window.render_game_to_text === renderSelectorToText) {
        delete window.render_game_to_text;
      }
    };
  }, [
    completedJourneyIds,
    filteredProvinces,
    getProvinceStatus,
    journeyBySlug,
    journeys,
    progress,
    provinceByCode,
    query,
    region,
    selectedProvince,
    selectedStatus,
    visibleProvinceCodes,
  ]);

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
          <strong className="font-mono text-2xl text-foreground">
            {String(journeys.length).padStart(2, "0")}/34
          </strong>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            tỉnh thành đã mở · {completedJourneyIds.size} hoàn thành
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)] lg:gap-5">
        <section className="selector-map-panel relative min-h-[31rem] overflow-hidden rounded-[var(--radius-panel)] border border-map-border bg-map lg:min-h-[calc(100dvh-8rem)]">
          <div className="selector-map-copy">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-accent">
              Bản đồ 34 tỉnh, thành phố
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-foreground">
              Việt Nam đang mở từng chặng
            </h2>
            <p className="mt-2 max-w-[38ch] text-sm leading-6 text-muted">
              Chọn trực tiếp một tỉnh trên bản đồ. Huế đã có hành trình; các
              tỉnh còn lại hiển thị trạng thái chờ nội dung.
            </p>
          </div>

          <svg
            className="selector-vietnam-map"
            viewBox={`0 0 ${provinceGeometry.viewBox.width} ${provinceGeometry.viewBox.height}`}
            role="group"
            aria-label="Bản đồ tương tác 34 tỉnh, thành phố Việt Nam"
          >
            {provinceGeometry.provinces.map((geometry) => {
              const province = provinceByCode.get(geometry.code);
              if (!province) return null;
              const status = getProvinceStatus(province);
              const selected = province.code === selectedProvince.code;
              const visible = visibleProvinceCodes.has(province.code);

              return (
                <path
                  key={province.code}
                  className="selector-province-shape"
                  d={geometry.path}
                  fillRule="evenodd"
                  role="button"
                  tabIndex={0}
                  aria-label={`${province.name}: ${statusLabel[status]}`}
                  aria-pressed={selected}
                  data-province-code={province.code}
                  data-status={status}
                  data-selected={selected}
                  data-filtered={!visible}
                  onClick={() => setSelectedProvinceCode(province.code)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedProvinceCode(province.code);
                    }
                  }}
                >
                  <title>
                    {province.name} · {statusLabel[status]}
                  </title>
                </path>
              );
            })}

            {provinceGeometry.provinces.map((geometry) => {
              const province = provinceByCode.get(geometry.code);
              if (!province) return null;
              return (
                <circle
                  key={`hit-${province.code}`}
                  className="selector-province-hit-area"
                  cx={geometry.label.x}
                  cy={geometry.label.y}
                  r="9"
                  data-province-hit-code={province.code}
                  aria-hidden="true"
                  onClick={() => setSelectedProvinceCode(province.code)}
                />
              );
            })}

            {selectedGeometry ? (
              <g
                className="selector-selected-marker"
                transform={`translate(${selectedGeometry.label.x} ${selectedGeometry.label.y})`}
                aria-hidden="true"
              >
                <circle className="selector-marker-pulse" r="17" />
                <circle className="selector-marker-ring" r="9" />
                <circle className="selector-marker-core" r="3.5" />
              </g>
            ) : null}
          </svg>

          <p className="selector-map-source">
            Ranh giới:{" "}
            <a
              href={provinceGeometry.source.url}
              target="_blank"
              rel="noreferrer"
            >
              {provinceGeometry.source.name}
            </a>{" "}
            · {provinceGeometry.source.license}
          </p>

          <article
            className="selector-featured-journey"
            data-status={selectedStatus}
            aria-live="polite"
          >
            <div>
              <span>{statusLabel[selectedStatus]}</span>
              <h3>
                {selectedJourney?.name ??
                  `Hành trình ${selectedProvince.name}`}
              </h3>
              <p>
                {selectedJourney
                  ? `${selectedJourney.places.length} điểm tham quan`
                  : "Đang biên tập địa điểm và tuyến đường"}
              </p>
            </div>
            <button
              id={
                selectedJourney?.slug === "hue"
                  ? "open-hue-journey"
                  : undefined
              }
              type="button"
              disabled={!selectedJourney}
              onClick={() =>
                selectedJourney && onOpenJourney(selectedJourney.slug)
              }
            >
              {selectedStatus === "completed"
                ? "Đi lại"
                : selectedJourney
                  ? "Bắt đầu"
                  : "Sắp mở"}
              {selectedJourney ? <span aria-hidden="true">→</span> : null}
            </button>
          </article>
        </section>

        <aside className="selector-catalog rounded-[var(--radius-panel)] border border-border bg-surface p-5 sm:p-6 lg:flex lg:max-h-[calc(100dvh-8rem)] lg:flex-col">
          <div>
            <h2 className="text-xl font-extrabold tracking-[-0.03em] text-foreground">
              34 tỉnh, thành phố
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Tìm và chọn theo danh mục hành chính hiện hành.
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

          <div
            className="selector-region-tabs mt-3"
            role="group"
            aria-label="Lọc theo vùng"
          >
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
              const status = getProvinceStatus(province);
              const selected = province.code === selectedProvince.code;
              return (
                <button
                  key={province.code}
                  type="button"
                  className="selector-province-row"
                  data-status={status}
                  data-selected={selected}
                  aria-pressed={selected}
                  onClick={() => setSelectedProvinceCode(province.code)}
                >
                  <span className="selector-province-code">
                    {province.code}
                  </span>
                  <span>{province.name}</span>
                  <small>{statusLabel[status]}</small>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </main>
  );
}
