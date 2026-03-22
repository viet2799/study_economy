export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-3xl font-semibold text-slate-950">Page not found</h1>
      <p className="text-slate-600">The requested route does not exist.</p>
    </main>
  );
}
