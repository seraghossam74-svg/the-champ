export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-300">
          🏆 The Champ
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
          مصنع الأبطال
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          منصة إدارة البطولات والفرق واللاعبين والمباريات والنتائج
          في مكان واحد.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="/login"
            className="rounded-xl bg-white px-8 py-4 font-bold text-slate-950 transition hover:bg-slate-200"
          >
            دخول الأدمن
          </a>

          <a
            href="/club-login"
            className="rounded-xl border border-white/20 bg-white/5 px-8 py-4 font-bold transition hover:bg-white/10"
          >
            دخول النادي
          </a>
        </div>
      </section>
    </main>
  );
}