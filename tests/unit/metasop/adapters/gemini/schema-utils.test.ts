import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  processDynamicFields,
  convertToGeminiSchema,
} from "@/lib/metasop/adapters/gemini/schema-utils";

describe("Gemini schema utils", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe("processDynamicFields", () => {
    it("parses dynamic field JSON strings", () => {
      const dynamicPaths = new Set<string>(["payload"]);
      const obj: any = { payload: "{\"ok\":true}" };

      processDynamicFields(obj, dynamicPaths);

      expect(obj.payload).toEqual({ ok: true });
    });

    it("strips ```json code fences before parsing", () => {
      const dynamicPaths = new Set<string>(["payload"]);
      const obj: any = {
        payload: "```json\n{\n  \"a\": 1\n}\n```",
      };

      processDynamicFields(obj, dynamicPaths);

      expect(obj.payload).toEqual({ a: 1 });
    });

    it("supports wildcard dynamic paths", () => {
      const dynamicPaths = new Set<string>(["items.*.meta"]);
      const obj: any = {
        items: [{ meta: "{\"x\": 1}" }],
      };

      processDynamicFields(obj, dynamicPaths);

      expect(obj.items[0].meta).toEqual({ x: 1 });
    });

    it("uses heuristic parsing for colon-separated key/value lines", () => {
      const dynamicPaths = new Set<string>(["payload"]);
      const obj: any = {
        payload: "key1: value1\nkey2: value2",
      };

      processDynamicFields(obj, dynamicPaths);

      expect(obj.payload).toEqual({ key1: "value1", key2: "value2" });
    });

    it("wraps unparseable dynamic field as { value } and warns", () => {
      const dynamicPaths = new Set<string>(["payload"]);
      const obj: any = {
        payload: "not valid json",
      };

      processDynamicFields(obj, dynamicPaths);

      expect(obj.payload).toEqual({ value: "not valid json" });
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe("convertToGeminiSchema", () => {
    it("converts empty object properties into JSON-string fields and tracks dynamic paths", () => {
      const dynamicPaths = new Set<string>();
      const schema = {
        type: "object",
        required: ["details"],
        properties: {
          details: {
            type: "object",
            description: "Free-form object",
            properties: {},
          },
        },
      };

      const converted = convertToGeminiSchema(schema, dynamicPaths);

      expect(converted).toEqual({
        type: "object",
        properties: {
          details: {
            type: "string",
            description:
              "Free-form object [REQUIREMENT: This field must be a valid JSON string representing the object data]",
          },
        },
        required: ["details"],
      });

      expect(dynamicPaths.has("details")).toBe(true);
    });

    it("handles oneOf/anyOf by picking an object option when present", () => {
      const dynamicPaths = new Set<string>();
      const schema = {
        type: "object",
        properties: {
          payload: {
            oneOf: [{ type: "string" }, { type: "object", properties: { a: { type: "string" } } }],
          },
        },
      };

      const converted = convertToGeminiSchema(schema, dynamicPaths);

      expect(converted.properties.payload).toEqual({
        type: "object",
        properties: { a: { type: "string" } },
      });
    });

    it("converts arrays recursively and uses wildcard path for items", () => {
      const dynamicPaths = new Set<string>();
      const schema = {
        type: "object",
        properties: {
          arr: {
            type: "array",
            items: {
              type: "object",
              properties: {},
            },
          },
        },
      };

      const converted = convertToGeminiSchema(schema, dynamicPaths);

      expect(converted.properties.arr.type).toBe("array");
      expect(converted.properties.arr.items.type).toBe("string");
      expect(dynamicPaths.has("arr.*")).toBe(true);
    });

    it("preserves enum/pattern/min/max constraints", () => {
      const dynamicPaths = new Set<string>();
      const schema = {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["a", "b"],
            pattern: "^[ab]$",
            minLength: 1,
            maxLength: 1,
          },
        },
      };

      const converted = convertToGeminiSchema(schema, dynamicPaths);

      expect(converted.properties.status).toEqual({
        type: "string",
        enum: ["a", "b"],
        pattern: "^[ab]$",
        minLength: 1,
        maxLength: 1,
      });
    });
  });
});
