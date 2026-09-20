"use client";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="standalone">
      <h1>Dat ging even mis</h1>
      <p>Probeer de pagina opnieuw te laden.</p>
      <button className="primary" onClick={reset}>
        Opnieuw proberen
      </button>
    </main>
  );
}
