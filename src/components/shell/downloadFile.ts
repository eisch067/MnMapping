import type { ExportFile } from "@/lib/exchange/exportFiles";

const pauseBetweenDownloadsMs = 300;

export function downloadFile(file: Pick<ExportFile, "filename" | "mimeType" | "content">) {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(new Blob([file.content], { type: file.mimeType }));
  anchor.download = file.filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

// Browsers may refuse several downloads fired at once, so they go one after another.
export async function downloadAll(files: readonly ExportFile[]) {
  for (const file of files) {
    downloadFile(file);
    await new Promise((resolve) => window.setTimeout(resolve, pauseBetweenDownloadsMs));
  }
}
