export type ArtifactRecord = {
  content: Record<string, unknown>
  step_id?: string
  role?: string
  timestamp?: string
}

export type EditOp =
  | { tool: "set_at_path"; artifactId: string; path: string; value: unknown }
  | { tool: "delete_at_path"; artifactId: string; path: string }
  | { tool: "add_array_item"; artifactId: string; path: string; value: unknown }
  | { tool: "remove_array_item"; artifactId: string; path: string; index?: number }

type ApplyResult = {
  artifacts: Record<string, ArtifactRecord>
  applied: number
  errors?: Array<{ op: EditOp; error: string }>
}

function deepClone<T>(value: T): T {
  return structuredClone(value)
}

type PathToken = string | number

function parsePath(path: string): PathToken[] {
  // Supports dot + bracket notation:
  // - apis.0.path
  // - user_stories[1].title
  const tokens: PathToken[] = []
  const parts = path.split(".").filter(Boolean)
  for (const part of parts) {
    const re = /([^\[\]]+)|(\[(\d+)\])/g
    let match: RegExpExecArray | null
    while ((match = re.exec(part)) !== null) {
      const key = match[1]
      const indexStr = match[3]
      if (key !== undefined) {
        // If the key itself is numeric (e.g. "0"), treat as array index.
        if (/^\d+$/.test(key)) tokens.push(Number(key))
        else tokens.push(key)
      } else if (indexStr !== undefined) {
        tokens.push(Number(indexStr))
      }
    }
  }
  return tokens
}

function ensureContainerForNext(next: PathToken): any {
  return typeof next === "number" ? [] : {}
}

function getOrCreateParent(root: any, tokens: PathToken[]): { parent: any; key: PathToken } {
  if (tokens.length === 0) {
    throw new Error("Path must not be empty")
  }

  let current = root
  for (let i = 0; i < tokens.length - 1; i++) {
    const token = tokens[i]
    const next = tokens[i + 1]

    if (typeof token === "number") {
      if (!Array.isArray(current)) {
        throw new Error(`Expected array at ${tokens.slice(0, i).join(".") || "<root>"}`)
      }
      if (current[token] === undefined || current[token] === null) {
        current[token] = ensureContainerForNext(next)
      }
      current = current[token]
      continue
    }

    if (typeof current !== "object" || current === null || Array.isArray(current)) {
      throw new Error(`Expected object at ${tokens.slice(0, i).join(".") || "<root>"}`)
    }
    if (!(token in current) || current[token] === undefined || current[token] === null) {
      current[token] = ensureContainerForNext(next)
    }
    current = current[token]
  }

  return { parent: current, key: tokens[tokens.length - 1] }
}

function getAtPath(root: any, tokens: PathToken[]): any {
  let current = root
  for (const token of tokens) {
    if (current == null) return undefined
    current = current[token as any]
  }
  return current
}

function setAtPath(root: any, tokens: PathToken[], value: unknown) {
  const { parent, key } = getOrCreateParent(root, tokens)
  if (typeof key === "number") {
    if (!Array.isArray(parent)) throw new Error("Expected array parent for numeric index")
    parent[key] = value
    return
  }
  if (typeof parent !== "object" || parent === null || Array.isArray(parent)) {
    throw new Error("Expected object parent for string key")
  }
  parent[key] = value
}

function deleteAtPath(root: any, tokens: PathToken[]) {
  const { parent, key } = getOrCreateParent(root, tokens)
  if (typeof key === "number") {
    if (!Array.isArray(parent)) throw new Error("Expected array parent for numeric index")
    if (key < 0 || key >= parent.length) throw new Error("Index out of bounds")
    parent.splice(key, 1)
    return
  }
  if (typeof parent !== "object" || parent === null || Array.isArray(parent)) {
    throw new Error("Expected object parent for string key")
  }
  delete parent[key]
}

function addArrayItem(root: any, tokens: PathToken[], value: unknown) {
  const current = getAtPath(root, tokens)
  if (current === undefined) {
    // Create the array at that path if missing.
    setAtPath(root, tokens, [value])
    return
  }
  if (!Array.isArray(current)) {
    throw new Error("Target is not an array")
  }
  current.push(value)
}

function removeArrayItem(root: any, tokens: PathToken[], index?: number) {
  const current = getAtPath(root, tokens)
  if (!Array.isArray(current)) throw new Error("Target is not an array")
  if (current.length === 0) throw new Error("Array is empty")
  if (index === undefined) {
    current.pop()
    return
  }
  if (!Number.isInteger(index) || index < 0 || index >= current.length) {
    throw new Error("Index out of bounds")
  }
  current.splice(index, 1)
}

/**
 * Applies deterministic edit operations to a copy of the provided artifact records.
 */
export function applyEditOps(
  previousArtifacts: Record<string, ArtifactRecord>,
  edits: EditOp[]
): ApplyResult {
  const artifacts: Record<string, ArtifactRecord> = deepClone(previousArtifacts)
  const errors: Array<{ op: EditOp; error: string }> = []
  let applied = 0

  for (const op of edits) {
    try {
      const record = artifacts[op.artifactId]
      if (!record) throw new Error(`Unknown artifactId: ${op.artifactId}`)
      if (!record.content || typeof record.content !== "object" || Array.isArray(record.content)) {
        throw new Error(`Artifact ${op.artifactId} content must be an object`)
      }

      const tokens = parsePath(op.path)
      switch (op.tool) {
        case "set_at_path":
          setAtPath(record.content, tokens, op.value)
          applied++
          break
        case "delete_at_path":
          deleteAtPath(record.content, tokens)
          applied++
          break
        case "add_array_item":
          addArrayItem(record.content, tokens, op.value)
          applied++
          break
        case "remove_array_item":
          removeArrayItem(record.content, tokens, op.index)
          applied++
          break
        default: {
          const neverOp: never = op
          throw new Error(`Unsupported tool: ${(neverOp as any).tool}`)
        }
      }
    } catch (e: any) {
      errors.push({ op, error: e?.message || String(e) })
    }
  }

  return errors.length ? { artifacts, applied, errors } : { artifacts, applied }
}
