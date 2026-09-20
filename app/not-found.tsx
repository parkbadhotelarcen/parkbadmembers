import Link from "next/link";
export default function NotFound() {
  return (
    <main className="standalone">
      <h1>Even de weg kwijt?</h1>
      <p>Deze pagina bestaat niet.</p>
      <Link className="primary" href="/">
        Terug naar Home
      </Link>
    </main>
  );
}
