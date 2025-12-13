/**
 * Unit tests cho Diff utilities
 */

import { describe, it, expect } from "vitest";
import { diffObjects, formatDiff, highlightDiffInJson } from "../utils/diff";

describe("Diff Utilities", () => {
  describe("diffObjects", () => {
    it("should detect no differences for identical objects", () => {
      const obj1 = { a: 1, b: "test" };
      const obj2 = { a: 1, b: "test" };

      const diffs = diffObjects(obj1, obj2);

      expect(diffs).toHaveLength(0);
    });

    it("should detect added properties", () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 1, b: 2 };

      const diffs = diffObjects(obj1, obj2);

      expect(diffs).toHaveLength(1);
      expect(diffs[0].type).toBe("added");
      expect(diffs[0].path).toBe("b");
      expect(diffs[0].newValue).toBe(2);
    });

    it("should detect removed properties", () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1 };

      const diffs = diffObjects(obj1, obj2);

      expect(diffs).toHaveLength(1);
      expect(diffs[0].type).toBe("removed");
      expect(diffs[0].path).toBe("b");
      expect(diffs[0].oldValue).toBe(2);
    });

    it("should detect modified properties", () => {
      const obj1 = { a: 1, b: "old" };
      const obj2 = { a: 1, b: "new" };

      const diffs = diffObjects(obj1, obj2);

      expect(diffs).toHaveLength(1);
      expect(diffs[0].type).toBe("modified");
      expect(diffs[0].path).toBe("b");
      expect(diffs[0].oldValue).toBe("old");
      expect(diffs[0].newValue).toBe("new");
    });

    it("should handle nested objects", () => {
      const obj1 = { user: { name: "John", age: 30 } };
      const obj2 = { user: { name: "Jane", age: 30 } };

      const diffs = diffObjects(obj1, obj2);

      expect(diffs).toHaveLength(1);
      expect(diffs[0].type).toBe("modified");
      expect(diffs[0].path).toBe("user.name");
    });

    it("should handle arrays", () => {
      const obj1 = { items: [1, 2, 3] };
      const obj2 = { items: [1, 2, 4] };

      const diffs = diffObjects(obj1, obj2);

      expect(diffs.length).toBeGreaterThan(0);
      const modifiedDiff = diffs.find((d) => d.path.includes("[2]"));
      expect(modifiedDiff?.type).toBe("modified");
    });

    it("should handle null and undefined", () => {
      const obj1 = { a: null };
      const obj2 = { a: undefined };

      const diffs = diffObjects(obj1, obj2);

      expect(diffs.length).toBeGreaterThan(0);
    });
  });

  describe("formatDiff", () => {
    it("should format diff results as readable string", () => {
      const diffs = [
        { type: "added", path: "newField", newValue: "value" },
        { type: "removed", path: "oldField", oldValue: "old" },
        { type: "modified", path: "changed", oldValue: "old", newValue: "new" },
      ];

      const formatted = formatDiff(diffs);

      expect(formatted).toContain("+ newField");
      expect(formatted).toContain("- oldField");
      expect(formatted).toContain("~ changed");
    });

    it("should return 'No differences' for empty diffs", () => {
      const formatted = formatDiff([]);

      expect(formatted).toBe("No differences");
    });
  });

  describe("highlightDiffInJson", () => {
    it("should highlight differences in JSON strings", () => {
      const oldJson = JSON.stringify({ a: 1, b: "old" });
      const newJson = JSON.stringify({ a: 1, b: "new" });

      const result = highlightDiffInJson(oldJson, newJson);

      expect(result.diffs.length).toBeGreaterThan(0);
      expect(result.oldHighlighted).toContain("old");
      expect(result.newHighlighted).toContain("new");
    });

    it("should handle invalid JSON gracefully", () => {
      const oldJson = "invalid json";
      const newJson = "also invalid";

      const result = highlightDiffInJson(oldJson, newJson);

      expect(result.oldHighlighted).toBe(oldJson);
      expect(result.newHighlighted).toBe(newJson);
      expect(result.diffs).toHaveLength(0);
    });
  });
});
