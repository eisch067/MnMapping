export type MyGeometry =
  | { type: "Point"; coordinates: [number, number] }
  | { type: "LineString"; coordinates: [number, number][] }
  | { type: "Polygon"; coordinates: [number, number][][] };

export interface MyMapItem {
  id: string;
  name: string;
  note?: string;
  geometry: MyGeometry;
  createdAt: string;
}

const databaseName = "mnmapping-local-data";
const storeName = "items";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadMyData(): Promise<MyMapItem[]> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(storeName).objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as MyMapItem[]);
    request.onerror = () => reject(request.error);
  });
}

export async function saveMyItem(item: MyMapItem): Promise<void> {
  const database = await openDatabase();
  await transactionPromise(database.transaction(storeName, "readwrite").objectStore(storeName).put(item));
}

export async function deleteMyItem(id: string): Promise<void> {
  const database = await openDatabase();
  await transactionPromise(database.transaction(storeName, "readwrite").objectStore(storeName).delete(id));
}

export async function clearMyData(): Promise<void> {
  const database = await openDatabase();
  await transactionPromise(database.transaction(storeName, "readwrite").objectStore(storeName).clear());
}

function transactionPromise(request: IDBRequest): Promise<void> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function toGeoJson(items: readonly MyMapItem[]) {
  return { type: "FeatureCollection", features: items.map((item) => ({ type: "Feature", id: item.id, properties: { name: item.name, note: item.note }, geometry: item.geometry })) };
}

export function roughLengthMeters(coordinates: [number, number][]): number {
  return coordinates.slice(1).reduce((sum, point, index) => sum + haversine(coordinates[index], point), 0);
}

export function roughAreaSquareMeters(ring: [number, number][]): number {
  if (ring.length < 3) return 0;
  const latitude = ring.reduce((sum, point) => sum + point[1], 0) / ring.length;
  const scaleX = 111_320 * Math.cos(latitude * Math.PI / 180);
  const scaleY = 110_540;
  return Math.abs(ring.reduce((sum, point, index) => {
    const next = ring[(index + 1) % ring.length];
    return sum + point[0] * scaleX * next[1] * scaleY - next[0] * scaleX * point[1] * scaleY;
  }, 0) / 2);
}

function haversine(a: [number, number], b: [number, number]): number {
  const radians = (value: number) => value * Math.PI / 180;
  const dLat = radians(b[1] - a[1]);
  const dLon = radians(b[0] - a[0]);
  const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(dLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
