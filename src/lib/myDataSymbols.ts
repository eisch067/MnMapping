export interface BuiltInSymbol {
  id: string;
  label: string;
  glyph: string;
}

export const builtInSymbols: readonly BuiltInSymbol[] = [
  { id: "pin", label: "Pin", glyph: "●" },
  { id: "star", label: "Star", glyph: "★" },
  { id: "camp", label: "Camp", glyph: "▲" },
  { id: "hunt", label: "Hunting", glyph: "◆" },
  { id: "fish", label: "Fishing", glyph: "◉" },
] as const;

export const fallbackSymbol = builtInSymbols[0];

export function builtInSymbol(id: string): BuiltInSymbol {
  return builtInSymbols.find((symbol) => symbol.id === id) ?? fallbackSymbol;
}
