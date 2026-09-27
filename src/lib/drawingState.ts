import { geodesicMidpoint, type Position } from "./geodesy";

export interface ShapeEditState {
  original: readonly Position[];
  vertices: readonly Position[];
  history: readonly (readonly Position[])[];
  closed: boolean;
}

export function createShapeEditState(vertices: readonly Position[], closed: boolean): ShapeEditState {
  const normalized = closed && positionsEqual(vertices[0], vertices.at(-1)) ? vertices.slice(0, -1) : vertices;
  return { original: normalized, vertices: normalized, history: [], closed };
}

export function addVertex(state: ShapeEditState, point: Position): ShapeEditState {
  return updateVertices(state, [...state.vertices, point]);
}

export function insertMidpoint(state: ShapeEditState, segmentIndex: number): ShapeEditState {
  const endIndex = segmentIndex + 1;
  const end = state.vertices[endIndex] ?? (state.closed ? state.vertices[0] : undefined);
  const start = state.vertices[segmentIndex];
  if (!start || !end) return state;
  const vertices = [...state.vertices];
  vertices.splice(endIndex, 0, geodesicMidpoint(start, end));
  return updateVertices(state, vertices);
}

export function moveVertex(state: ShapeEditState, vertexIndex: number, point: Position): ShapeEditState {
  if (!state.vertices[vertexIndex]) return state;
  const vertices = [...state.vertices];
  vertices[vertexIndex] = point;
  return updateVertices(state, vertices);
}

export function undoShapeEdit(state: ShapeEditState): ShapeEditState {
  const previous = state.history.at(-1);
  if (!previous) return state;
  return { ...state, vertices: previous, history: state.history.slice(0, -1) };
}

export function cancelShapeEdit(state: ShapeEditState): ShapeEditState {
  return { ...state, vertices: state.original, history: [] };
}

export function closeRing(vertices: readonly Position[]): Position[] {
  return vertices.length ? [...vertices, vertices[0]] : [];
}

function updateVertices(state: ShapeEditState, vertices: readonly Position[]): ShapeEditState {
  return { ...state, vertices, history: [...state.history, state.vertices] };
}

function positionsEqual(first: Position | undefined, second: Position | undefined): boolean {
  return Boolean(first && second && first[0] === second[0] && first[1] === second[1]);
}
