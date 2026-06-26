import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <main className="w-full max-w-2xl space-y-10 text-center">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-widest text-muted">
            Spike PWA
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Music Bridge Karaoke
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-muted">
            Prototipo funcional sin backend para validar una experiencia de
            karaoke en pantallas de coche (Android Automotive / Chrome). Datos
            mock, reproducción simulada y letras sincronizadas por timestamp.
          </p>
        </div>

        <ul className="mx-auto max-w-md space-y-2 text-left text-sm text-muted">
          <li>• Layout optimizado para 1408×792, 1080×600 y móvil</li>
          <li>• Controles grandes, sin autoplay</li>
          <li>• Sin Supabase, Apple Music ni APIs externas</li>
        </ul>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/car"
            className="inline-flex min-h-16 items-center justify-center rounded-2xl bg-accent px-10 text-xl font-semibold text-background transition-opacity hover:opacity-90"
          >
            Abrir modo camioneta
          </Link>
          <Link
            href="/debug"
            className="inline-flex min-h-16 items-center justify-center rounded-2xl border border-border bg-surface px-10 text-lg font-medium transition-colors hover:bg-border/40"
          >
            Pantalla debug
          </Link>
        </div>
      </main>
    </div>
  );
}
