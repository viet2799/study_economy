'use client';

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-3xl font-semibold text-slate-950">Something broke</h1>
      <p className="text-slate-600">{error.message}</p>
      <button
        className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </main>
  );
}
