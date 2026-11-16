"use client";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div role="alert" className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      <p>Panel admin gagal dimuat.</p>
      <button type="button" onClick={reset} className="mt-2 font-semibold underline">Coba lagi</button>
    </div>
  );
}
