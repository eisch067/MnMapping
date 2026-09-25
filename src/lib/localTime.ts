function pad(value: number): string {
  return String(value).padStart(2, "0");
}

// The user's own clock, never UTC: filenames and Import folders are read by the person who made them.
export function localDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function localClock(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
