# County imagery research tracker

The `/research` workspace provides an editable record for all 87 Minnesota counties. It is designed for incremental imagery-source research without requiring a database or account.

## Workflow

1. Select a county and paste any links, notes, or leads into its **Source inbox**. One item per line is helpful, but no sorting is required.
2. Add an optional Next action or county research note. Counties with an official viewer or unresolved research lead seed as **Deep research** and display a purple dot; the remaining completed source-pass counties seed as **Needs review**.
3. Use **Current categorized findings** as a read-only reference. Every useful checked link is placed in one of three buckets: **Implemented imagery**, **External imagery—date confirmed**, or **Official viewer/research lead—date unknown**.
4. Select **Export session** at the end of every research session, then send the JSON file to Codex for source verification, categorization, and implementation.
5. Review each county's three categorized columns, open its official viewers when useful, then select **Mark complete & next**. The next unfinished county opens automatically.

Changes save automatically in the current browser with local storage. The JSON export is the round-trip backup and can be restored with **Import JSON** in a later session. The CSV export includes each county's raw source inbox plus a flattened, spreadsheet-friendly view of categorized findings; importing CSV is intentionally unsupported because it cannot preserve multiple structured sources as reliably as JSON.

The initial records are generated from the checked-in county, imagery, external-source, and research-lead registries. Importing an older JSON file merges it with the current 87-county registry so newly added counties or seeded sources remain available. Beacon links are retained as official viewer/research leads when their public landing pages do not establish an imagery date; they are useful for manually opening the map and inspecting its layer list later.
