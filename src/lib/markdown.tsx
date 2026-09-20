import type { ReactNode } from "react";

const riskWords = new Set(["GREEN", "YELLOW", "ORANGE", "RED", "GRAY"]);

export function renderMarkdown(source: string): ReactNode[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];
  let table: string[] = [];
  let key = 0;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(<p key={key++}>{renderInline(paragraph.join(" "))}</p>);
    paragraph = [];
  };
  const flushList = () => {
    if (list.length === 0) return;
    blocks.push(<ul key={key++}>{list.map((item, index) => <li key={index}>{renderInline(item)}</li>)}</ul>);
    list = [];
  };
  const flushTable = () => {
    if (table.length === 0) return;
    blocks.push(<MarkdownTable key={key++} rows={table} />);
    table = [];
  };
  const flushAll = () => { flushParagraph(); flushList(); flushTable(); };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      const text = renderInline(heading[2]);
      const Tag = (`h${Math.min(level + 1, 6)}`) as keyof React.JSX.IntrinsicElements;
      blocks.push(<Tag key={key++}>{text}</Tag>);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      flushParagraph();
      flushTable();
      list.push(line.replace(/^\s*[-*]\s+/, ""));
      continue;
    }
    if (line.trim().startsWith("|")) {
      flushParagraph();
      flushList();
      table.push(line.trim());
      continue;
    }
    if (/^-{3,}\s*$/.test(line.trim())) {
      flushAll();
      blocks.push(<hr key={key++} />);
      continue;
    }
    if (line.trim() === "") {
      flushAll();
      continue;
    }
    flushList();
    flushTable();
    paragraph.push(line.trim());
  }
  flushAll();
  return blocks;
}

function MarkdownTable({ rows }: { rows: string[] }) {
  const cells = rows.map(splitTableRow);
  if (cells.length === 0) return null;
  const [header, ...rest] = cells;
  const isSeparator = (row: string[]) => row.every((cell) => /^:?-{2,}:?$/.test(cell.trim()));
  const body = isSeparator(rest[0] ?? []) ? rest.slice(1) : rest;
  return (
    <div className="markdown-table-wrap">
      <table>
        <thead><tr>{header.map((cell, index) => <th key={index}>{renderInline(cell)}</th>)}</tr></thead>
        <tbody>{body.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{renderInline(cell)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function splitTableRow(row: string): string[] {
  const trimmed = row.replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((cell) => cell.trim());
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let remaining = text;
  let key = 0;
  const pattern = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/;
  while (remaining.length > 0) {
    const match = pattern.exec(remaining);
    if (!match) {
      nodes.push(...renderPlainText(remaining, key));
      break;
    }
    if (match.index > 0) nodes.push(...renderPlainText(remaining.slice(0, match.index), key));
    key += 1000;
    if (match[1] !== undefined) nodes.push(<strong key={key++}>{renderInline(match[1])}</strong>);
    else if (match[2] !== undefined) nodes.push(<code key={key++}>{match[2]}</code>);
    else if (match[3] !== undefined) {
      const href = match[4];
      const isLink = /^https?:\/\//.test(href) || href.startsWith("/");
      nodes.push(isLink
        ? <a key={key++} href={href} target={href.startsWith("/") ? undefined : "_blank"} rel={href.startsWith("/") ? undefined : "noreferrer"}>{match[3]}</a>
        : <span key={key++}>{match[3]}</span>);
    }
    remaining = remaining.slice(match.index + match[0].length);
  }
  return nodes;
}

function renderPlainText(text: string, keyBase: number): ReactNode[] {
  const parts = text.split(/\b(GREEN|YELLOW|ORANGE|RED|GRAY)\b/);
  return parts.map((part, index) => {
    if (riskWords.has(part)) return <RiskBadge key={`${keyBase}-${index}`} risk={part as RiskLevel} />;
    return part ? <span key={`${keyBase}-${index}`}>{part}</span> : null;
  });
}

export type RiskLevel = "GREEN" | "YELLOW" | "ORANGE" | "RED" | "GRAY";

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return <span className={`risk-badge risk-${risk.toLowerCase()}`}>{risk}</span>;
}
