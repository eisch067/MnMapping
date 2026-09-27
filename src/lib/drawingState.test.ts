import { describe, expect, it } from "vitest";
import {
  addVertex,
  cancelShapeEdit,
  createShapeEditState,
  insertMidpoint,
  moveVertex,
  undoShapeEdit,
} from "./drawingState";

describe("shape editing", () => {
  it("adds a midpoint as a new vertex and can undo it", () => {
    const initial = createShapeEditState([[-94, 46], [-93, 46]], false);
    const inserted = insertMidpoint(initial, 0);

    expect(inserted.vertices).toHaveLength(3);
    expect(inserted.vertices[1][0]).toBeCloseTo(-93.5, 4);
    expect(undoShapeEdit(inserted).vertices).toEqual(initial.vertices);
  });

  it("preserves the original shape when canceling multiple edits", () => {
    const initial = createShapeEditState([[-94, 46], [-93, 46]], false);
    const changed = moveVertex(addVertex(initial, [-92, 46]), 0, [-95, 47]);

    expect(cancelShapeEdit(changed).vertices).toEqual(initial.vertices);
  });

  it("removes a polygon's duplicate closing coordinate", () => {
    const state = createShapeEditState([[0, 0], [1, 0], [1, 1], [0, 0]], true);

    expect(state.vertices).toHaveLength(3);
  });
});
