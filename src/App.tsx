const foundation = [
  ["Framework", "Vite + React + TypeScript"],
  ["Giao diện", "Tailwind CSS 4"],
  ["Kiểm thử", "Vitest + Playwright"],
] as const;

export default function App() {
  return (
    <main className="mx-auto grid min-h-[100dvh] w-full max-w-[1400px] items-center gap-12 px-5 py-12 md:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] md:px-10 lg:px-16">
      <section aria-labelledby="page-title" className="max-w-3xl">
        <p className="mb-5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Gõ Xuyên Việt
        </p>
        <h1
          id="page-title"
          className="max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl"
        >
          Nền tảng đã sẵn sàng.
        </h1>
        <p className="mt-6 max-w-[58ch] text-base leading-7 text-muted sm:text-lg">
          Bước tiếp theo là dựng bản đồ SVG và hành trình miền Trung gồm sáu
          điểm dừng.
        </p>
        <a
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-[var(--radius-control)] bg-action px-5 font-semibold text-accent-contrast transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-px"
          href="#nen-tang"
        >
          Xem cấu hình
        </a>
      </section>

      <section
        id="nen-tang"
        aria-labelledby="foundation-title"
        className="rounded-[var(--radius-panel)] border border-border bg-surface p-6 shadow-[0_24px_70px_color-mix(in_srgb,var(--forest)_12%,transparent)] sm:p-8"
      >
        <h2 id="foundation-title" className="text-xl font-bold text-foreground">
          Nền tảng kỹ thuật
        </h2>
        <dl className="mt-7 space-y-6">
          {foundation.map(([term, detail]) => (
            <div key={term} className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4">
              <dt className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                {term}
              </dt>
              <dd className="m-0 font-semibold text-foreground">{detail}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
