import { execFileSync } from "node:child_process";

// Condensed multi-track issue/PR status in one pass, instead of reconstructing it by hand
// from separate `gh issue list` / `gh pr list` calls each time someone asks for the current
// state. Blockers are read from each ticket's own free-text "## Blocked by" section (see
// "Claim an issue" and the wayfinding "Blocking" note in docs/agents/issue-tracker.md) rather
// than GitHub's native issue-dependencies API, since that's what this repo's tickets carry.

function gh(args) {
  const output = execFileSync("gh", args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  return JSON.parse(output);
}

function openBlockers(body, stateByNumber) {
  const section = body.split(/^## Blocked by$/m)[1];
  if (!section) return [];
  const nextHeading = section.search(/^## /m);
  const scoped = nextHeading === -1 ? section : section.slice(0, nextHeading);
  const referenced = [...scoped.matchAll(/#(\d+)/g)].map((match) => Number(match[1]));
  return referenced.filter((number) => stateByNumber.get(number) === "OPEN");
}

function issueRows(issues) {
  const stateByNumber = new Map(issues.map((issue) => [issue.number, issue.state]));
  return issues
    .slice()
    .sort((a, b) => a.number - b.number)
    .map((issue) => {
      const blockers = openBlockers(issue.body, stateByNumber);
      const assignees = issue.assignees.map((a) => a.login).join(",") || "-";
      const status =
        issue.state === "CLOSED"
          ? "closed"
          : blockers.length > 0
            ? `blocked by ${blockers.map((n) => `#${n}`).join(", ")}`
            : "ready";
      return { number: issue.number, status, assignees, title: issue.title };
    });
}

function printTable(rows, columns) {
  const widths = columns.map((c) => Math.max(c.header.length, ...rows.map((r) => String(r[c.key]).length)));
  const printRow = (cells) => console.log(cells.map((cell, i) => String(cell).padEnd(widths[i])).join("  "));
  printRow(columns.map((c) => c.header));
  printRow(widths.map((w) => "-".repeat(w)));
  for (const row of rows) printRow(columns.map((c) => row[c.key]));
}

const issues = gh([
  "issue",
  "list",
  "--state",
  "all",
  "--limit",
  "200",
  "--json",
  "number,title,state,assignees,body",
]);

const prs = gh([
  "pr",
  "list",
  "--state",
  "all",
  "--limit",
  "15",
  "--json",
  "number,title,state,headRefName",
]);

console.log("## Issues\n");
printTable(issueRows(issues), [
  { key: "number", header: "#" },
  { key: "status", header: "status" },
  { key: "assignees", header: "assignees" },
  { key: "title", header: "title" },
]);

console.log("\n## Recent PRs\n");
printTable(
  prs.map((pr) => ({ number: pr.number, state: pr.state, branch: pr.headRefName, title: pr.title })),
  [
    { key: "number", header: "#" },
    { key: "state", header: "state" },
    { key: "branch", header: "branch" },
    { key: "title", header: "title" },
  ],
);
