import type { IdentifyLink, IdentifyRow } from "@/lib/identify/types";

export function RowList({ rows }: { rows: readonly IdentifyRow[] }) {
  if (rows.length === 0) return null;
  return (
    <dl>
      {rows.map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LinkList({ links }: { links: readonly IdentifyLink[] }) {
  return links.map((link) => (
    <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
      {link.label} ↗
    </a>
  ));
}
