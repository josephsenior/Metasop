/**
 * Path resolution for artifact JSON.
 * Path format: dot-separated keys, array indices as numbers or [n], e.g. "apis.0.path" or "user_stories[1].title"
 */

export type PathSegment = string | number;

/**
 * Parse a path string into segments.
 * "apis.0.path" -> ["apis", 0, "path"]
 * "user_stories[1].title" -> ["user_stories", 1, "title"]
 */
export function parsePath(path: string): PathSegment[] {
  if (!path || typeof path !== "string") return [];
  const segments: PathSegment[] = [];
  let current = path.trim();
  while (current.length > 0) {
    const bracket = current.indexOf("[");
    const dot = current.indexOf(".");
    if (bracket === -1 && dot === -1) {
      segments.push(current);
      break;
    }
    const takeDot = dot >= 0 && (bracket === -1 || dot < bracket);
    if (takeDot) {
      const key = current.slice(0, dot);
      if (key) {
        const num = parseInt(key, 10);
        segments.push(Number.isNaN(num) || num < 0 || String(num) !== key ? key : num);
      }
      current = current.slice(dot + 1);
      continue;
    }
    if (bracket >= 0) {
      const key = current.slice(0, bracket).trim();
      if (key) segments.push(key);
      const end = current.indexOf("]", bracket);
      if (end === -1) break;
      const num = current.slice(bracket + 1, end);
      const index = parseInt(num, 10);
      if (Number.isNaN(index) || index < 0) break;
      segments.push(index);
      current = current.slice(end + 1).replace(/^\./, "");
    }
  }
  return segments;
}

/**
 * Get value at path in obj. Returns undefined if path doesn't exist.
 */
export function getAtPath(obj: unknown, path: string): unknown {
  const segments = parsePath(path);
  let current: unknown = obj;
  for (const seg of segments) {
    if (current === null || current === undefined) return undefined;
    if (typeof seg === "number") {
      current = Array.isArray(current) ? current[seg] : undefined;
    } else {
      current = typeof current === "object" && current !== null && seg in (current as Record<string, unknown>)
        ? (current as Record<string, unknown>)[seg]
        : undefined;
    }
  }
  return current;
}

/**
 * Set value at path. Creates parent objects/arrays as needed.
 * Mutates obj in place; returns true if successful.
 */
export function setAtPath(obj: Record<string, unknown>, path: string, value: unknown): boolean {
  const segments = parsePath(path);
  if (segments.length === 0) return false;
  let current: Record<string, unknown> | unknown[] = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const nextSeg = segments[i + 1];
    if (typeof seg === "number") {
      if (!Array.isArray(current)) return false;
      let next = current[seg];
      if (next === undefined || next === null) {
        next = typeof nextSeg === "number" ? [] : {};
        current[seg] = next;
      }
      current = next as Record<string, unknown> | unknown[];
    } else {
      const c = current as Record<string, unknown>;
      let next = c[seg];
      if (next === undefined || next === null) {
        next = typeof nextSeg === "number" ? [] : {};
        c[seg] = next;
      }
      current = next as Record<string, unknown> | unknown[];
    }
  }
  const last = segments[segments.length - 1];
  if (typeof last === "number") {
    if (!Array.isArray(current)) return false;
    (current as unknown[])[last] = value;
  } else {
    (current as Record<string, unknown>)[last] = value;
  }
  return true;
}

/**
 * Delete at path. For object key: delete key. For array index: splice.
 * Returns true if something was removed.
 */
export function deleteAtPath(obj: Record<string, unknown>, path: string): boolean {
  const segments = parsePath(path);
  if (segments.length === 0) return false;
  const parentPath = segments.slice(0, -1);
  const last = segments[segments.length - 1];
  let parent: unknown = obj;
  for (const seg of parentPath) {
    if (parent === null || parent === undefined) return false;
    if (typeof seg === "number") {
      parent = Array.isArray(parent) ? parent[seg] : undefined;
    } else {
      parent = typeof parent === "object" && parent !== null && seg in (parent as Record<string, unknown>)
        ? (parent as Record<string, unknown>)[seg]
        : undefined;
    }
  }
  if (parent === null || parent === undefined) return false;
  if (typeof last === "number") {
    if (!Array.isArray(parent)) return false;
    if (last < 0 || last >= parent.length) return false;
    parent.splice(last, 1);
    return true;
  }
  const p = parent as Record<string, unknown>;
  if (!(last in p)) return false;
  delete p[last];
  return true;
}

/**
 * Append item to array at path. Path must point to an array.
 */
export function addArrayItem(obj: Record<string, unknown>, path: string, item: unknown): boolean {
  const arr = getAtPath(obj, path);
  if (!Array.isArray(arr)) return false;
  arr.push(item);
  return true;
}

/**
 * Remove item at array index.
 * - If index is provided: path is path to the array (e.g. "apis"), remove item at index.
 * - If index is not provided: path is full path to the element (e.g. "apis.0"), delete that element.
 */
export function removeArrayItem(obj: Record<string, unknown>, path: string, index?: number): boolean {
  if (typeof index === "number") {
    const arr = getAtPath(obj, path);
    if (!Array.isArray(arr) || index < 0 || index >= arr.length) return false;
    arr.splice(index, 1);
    return true;
  }
  return deleteAtPath(obj, path);
}
