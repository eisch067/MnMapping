export function sameValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (typeof left !== typeof right || left === null || right === null) return false;
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) &&
      left.length === right.length && left.every((value, index) => sameValue(value, right[index]));
  }
  if (typeof left !== "object" || typeof right !== "object") return false;
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).toSorted();
  const rightKeys = Object.keys(rightRecord).toSorted();
  return leftKeys.length === rightKeys.length &&
    leftKeys.every((key, index) => key === rightKeys[index] && sameValue(leftRecord[key], rightRecord[key]));
}

export function retainUnchanged<T>(previous: T[], next: T[]): T[] {
  if (previous.length !== next.length) return next;
  for (let index = 0; index < previous.length; index += 1) {
    if (!sameValue(previous[index], next[index])) return next;
  }
  return previous;
}
