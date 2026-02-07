import { logger } from "../../utils/logger";

export function processDynamicFields(obj: any, dynamicPaths: Set<string>, currentPath: string = ""): void {
  if (!obj || typeof obj !== "object") return;

  for (const [key, value] of Object.entries(obj)) {
    const path = currentPath ? `${currentPath}.${key}` : key;

    const isDynamic = Array.from(dynamicPaths).some((dp) => {
      if (dp === path) return true;
      const pattern = dp.replace(/\./g, "\\.").replace(/\*/g, "[^.]+");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(path);
    });

    if (isDynamic && typeof value === "string") {
      try {
        let cleaned = value.trim();
        cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");

        if (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length > 2) {
          try {
            cleaned = JSON.parse(cleaned);
          } catch {
            // ignore
          }
        }

        obj[key] = JSON.parse(cleaned);
      } catch {
        if (typeof value === "string" && value.includes(":") && !value.includes("{")) {
          try {
            const lines = value.split("\n").filter((l) => l.includes(":"));
            const partialObj: any = {};
            lines.forEach((l) => {
              const parts = l.split(":");
              if (parts.length >= 2) {
                const k = parts[0].trim().replace(/^["']|["']$/g, "");
                const v = parts.slice(1).join(":").trim().replace(/^["']|["']$/g, "");
                if (k) partialObj[k] = v;
              }
            });
            obj[key] = Object.keys(partialObj).length > 0 ? partialObj : { value };
          } catch {
            logger.warn(`Failed to parse dynamic field at ${path} even with heuristics`, { value });
            obj[key] = { value };
          }
        } else {
          logger.warn(`Failed to parse dynamic field at ${path}`, { value });
          obj[key] = { value };
        }
      }

      if (typeof obj[key] !== "object" || obj[key] === null) {
        obj[key] = { value: obj[key] };
      }
    } else if (value && typeof value === "object") {
      processDynamicFields(value, dynamicPaths, path);
    }
  }
}

export function convertToGeminiSchema(schema: any, dynamicPaths: Set<string>): any {
  if (schema.type === "object") {
    const geminiSchema: any = {
      type: "object",
      properties: {},
      required: schema.required || [],
    };

    if (schema.properties) {
      for (const [key, value] of Object.entries(schema.properties)) {
        const prop = value as any;
        geminiSchema.properties[key] = convertProperty(prop, key, dynamicPaths);
      }
    }

    return geminiSchema;
  }

  return schema;
}

function convertProperty(prop: any, path: string, dynamicPaths: Set<string>): any {
  if (prop.oneOf || prop.anyOf) {
    const options = prop.oneOf || prop.anyOf;
    const bestOption = options.find((opt: any) => opt.type === "object") || options[0];
    return convertProperty(bestOption, path, dynamicPaths);
  }

  const type = prop.type || (prop.properties ? "object" : "string");
  const geminiProp: any = { type };

  if (prop.description) {
    geminiProp.description = prop.description;
  }

  if (type === "array" && prop.items) {
    geminiProp.items = convertProperty(prop.items, `${path}.*`, dynamicPaths);
  }

  if (type === "object") {
    if (prop.required) {
      geminiProp.required = prop.required;
    }

    const hasProperties = prop.properties && Object.keys(prop.properties).length > 0;

    if (hasProperties) {
      geminiProp.properties = {};
      for (const [key, value] of Object.entries(prop.properties)) {
        geminiProp.properties[key] = convertProperty(value as any, `${path}.${key}`, dynamicPaths);
      }
    } else {
      dynamicPaths.add(path);
      return {
        type: "string",
        description:
          (prop.description ? prop.description + " " : "") +
          "[REQUIREMENT: This field must be a valid JSON string representing the object data]",
      };
    }
  }

  if (prop.enum) {
    geminiProp.enum = prop.enum;
  }

  if (prop.pattern) geminiProp.pattern = prop.pattern;
  if (prop.minLength !== undefined) geminiProp.minLength = prop.minLength;
  if (prop.maxLength !== undefined) geminiProp.maxLength = prop.maxLength;
  if (prop.format) geminiProp.format = prop.format;
  if (prop.minItems !== undefined) geminiProp.minItems = prop.minItems;
  if (prop.maxItems !== undefined) geminiProp.maxItems = prop.maxItems;

  return geminiProp;
}
