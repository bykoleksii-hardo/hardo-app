// Renders one or more Schema.org JSON-LD blocks.
// Escapes "<" so user-supplied article fields can never break out of the
// <script> element (defends against a "</script>" sequence in DB content).

type Json = Record<string, unknown>;

export default function JsonLd({ data }: { data: Json | Json[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
