import { describe, it, expect, vi } from "vitest";
import type { Diagram } from "@/types/diagram";

// Mock jsPDF before importing PDFGenerator
const mockSetFontSize = vi.fn().mockReturnThis();
const mockSetFont = vi.fn().mockReturnThis();
const mockText = vi.fn().mockReturnThis();
const mockSplitTextToSize = vi.fn((text) => [text]);
const mockAddPage = vi.fn().mockReturnThis();
const mockGetNumberOfPages = vi.fn().mockReturnValue(1);
const mockSetPage = vi.fn().mockReturnThis();
const mockOutput = vi.fn().mockReturnValue(new Blob(["pdf"], { type: "application/pdf" }));

class MockjsPDF {
  setFontSize = mockSetFontSize;
  setFont = mockSetFont;
  text = mockText;
  splitTextToSize = mockSplitTextToSize;
  addPage = mockAddPage;
  getNumberOfPages = mockGetNumberOfPages;
  setPage = mockSetPage;
  output = mockOutput;
  internal = {
    pageSize: {
      getWidth: vi.fn().mockReturnValue(210),
      getHeight: vi.fn().mockReturnValue(297),
    },
  };
}

vi.mock("jspdf", () => ({
  __esModule: true,
  jsPDF: MockjsPDF,
}));

// Import after mock
import { PDFGenerator } from "@/lib/artifacts/pdf-generator";

const mockDiagram: Diagram = {
  id: "test-1",
  userId: "user-1",
  title: "Test Document",
  description: "A test document",
  nodes: [],
  edges: [],
  status: "completed",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  metadata: {
    metasop_artifacts: {
      pm_spec: { content: { user_stories: [] } },
    },
  },
};

describe("PDFGenerator", () => {
  describe("generatePDF", () => {
    it("should generate PDF blob", async () => {
      // Reset mocks
      mockOutput.mockReturnValue(new Blob(["pdf"], { type: "application/pdf" }));
      
      const generator = new PDFGenerator(mockDiagram);
      const pdf = await generator.generatePDF();

      expect(pdf).toBeInstanceOf(Blob);
      expect(pdf.type).toBe("application/pdf");
      expect(mockOutput).toHaveBeenCalled();
    });
  });
});

