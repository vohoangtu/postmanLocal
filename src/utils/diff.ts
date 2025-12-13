/**
 * Diff utilities để so sánh JSON objects
 */

export interface DiffResult {
  type: "added" | "removed" | "modified" | "unchanged";
  path: string;
  oldValue?: any;
  newValue?: any;
}

/**
 * So sánh hai objects và trả về danh sách differences
 */
export function diffObjects(oldObj: any, newObj: any, path: string = ""): DiffResult[] {
  const diffs: DiffResult[] = [];

  // Nếu cả hai đều null/undefined
  if (oldObj === null && newObj === null) {
    return [];
  }

  // Nếu một trong hai là null/undefined
  if (oldObj === null || oldObj === undefined) {
    diffs.push({
      type: "added",
      path,
      newValue: newObj,
    });
    return diffs;
  }

  if (newObj === null || newObj === undefined) {
    diffs.push({
      type: "removed",
      path,
      oldValue: oldObj,
    });
    return diffs;
  }

  // Nếu là primitive types
  if (typeof oldObj !== "object" || typeof newObj !== "object") {
    if (oldObj !== newObj) {
      diffs.push({
        type: "modified",
        path,
        oldValue: oldObj,
        newValue: newObj,
      });
    }
    return diffs;
  }

  // Nếu là arrays
  if (Array.isArray(oldObj) || Array.isArray(newObj)) {
    const oldArray = Array.isArray(oldObj) ? oldObj : [];
    const newArray = Array.isArray(newObj) ? newObj : [];

    const maxLength = Math.max(oldArray.length, newArray.length);
    for (let i = 0; i < maxLength; i++) {
      const itemPath = path ? `${path}[${i}]` : `[${i}]`;
      if (i >= oldArray.length) {
        diffs.push({
          type: "added",
          path: itemPath,
          newValue: newArray[i],
        });
      } else if (i >= newArray.length) {
        diffs.push({
          type: "removed",
          path: itemPath,
          oldValue: oldArray[i],
        });
      } else {
        diffs.push(...diffObjects(oldArray[i], newArray[i], itemPath));
      }
    }
    return diffs;
  }

  // Nếu là objects
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const itemPath = path ? `${path}.${key}` : key;
    const oldValue = oldObj[key];
    const newValue = newObj[key];

    if (!(key in oldObj)) {
      diffs.push({
        type: "added",
        path: itemPath,
        newValue,
      });
    } else if (!(key in newObj)) {
      diffs.push({
        type: "removed",
        path: itemPath,
        oldValue,
      });
    } else {
      diffs.push(...diffObjects(oldValue, newValue, itemPath));
    }
  }

  return diffs;
}

/**
 * Format diff result thành readable string
 */
export function formatDiff(diffs: DiffResult[]): string {
  if (diffs.length === 0) {
    return "No differences";
  }

  const lines: string[] = [];
  for (const diff of diffs) {
    switch (diff.type) {
      case "added":
        lines.push(`+ ${diff.path}: ${JSON.stringify(diff.newValue)}`);
        break;
      case "removed":
        lines.push(`- ${diff.path}: ${JSON.stringify(diff.oldValue)}`);
        break;
      case "modified":
        lines.push(`~ ${diff.path}:`);
        lines.push(`  - ${JSON.stringify(diff.oldValue)}`);
        lines.push(`  + ${JSON.stringify(diff.newValue)}`);
        break;
    }
  }

  return lines.join("\n");
}

/**
 * Highlight diff trong JSON string
 */
export function highlightDiffInJson(
  oldJson: string,
  newJson: string
): { oldHighlighted: string; newHighlighted: string; diffs: DiffResult[] } {
  try {
    const oldObj = JSON.parse(oldJson);
    const newObj = JSON.parse(newJson);
    const diffs = diffObjects(oldObj, newObj);

    // Simple highlighting: wrap changed values
    let oldHighlighted = oldJson;
    let newHighlighted = newJson;

    for (const diff of diffs) {
      if (diff.type === "removed" && diff.oldValue !== undefined) {
        const valueStr = JSON.stringify(diff.oldValue);
        oldHighlighted = oldHighlighted.replace(
          valueStr,
          `<<<REMOVED>>>${valueStr}<<</REMOVED>>>`
        );
      } else if (diff.type === "added" && diff.newValue !== undefined) {
        const valueStr = JSON.stringify(diff.newValue);
        newHighlighted = newHighlighted.replace(
          valueStr,
          `<<<ADDED>>>${valueStr}<<</ADDED>>>`
        );
      } else if (diff.type === "modified") {
        if (diff.oldValue !== undefined) {
          const valueStr = JSON.stringify(diff.oldValue);
          oldHighlighted = oldHighlighted.replace(
            valueStr,
            `<<<MODIFIED>>>${valueStr}<<</MODIFIED>>>`
          );
        }
        if (diff.newValue !== undefined) {
          const valueStr = JSON.stringify(diff.newValue);
          newHighlighted = newHighlighted.replace(
            valueStr,
            `<<<MODIFIED>>>${valueStr}<<</MODIFIED>>>`
          );
        }
      }
    }

    return { oldHighlighted, newHighlighted, diffs };
  } catch {
    return { oldHighlighted: oldJson, newHighlighted: newJson, diffs: [] };
  }
}
