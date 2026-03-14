import { describe, it, expect } from "vitest";
import {
  validateEnglishText,
  analyzeEnglishText,
  AnalysisResult
} from "./analysis";

describe("validateEnglishText", () => {
  it("rejects empty text", () => {
    const err = validateEnglishText("   ");
    expect(err).toContain("Empty text");
  });

  it("rejects too short text", () => {
    const err = validateEnglishText("short text under 50 chars");
    expect(err).toContain("Text too short");
  });

  it("rejects too long text", () => {
    const long = "a".repeat(10_001);
    const err = validateEnglishText(long);
    expect(err).toContain("Text too long");
  });

  it("rejects too many special characters", () => {
    const txt = "!".repeat(100);
    const err = validateEnglishText(txt);
    expect(err).toContain("Too many special characters");
  });

  it("rejects non-English text", () => {
    const txt = "анализ текста на русском языке".repeat(10);
    const err = validateEnglishText(txt);
    expect(err).toContain("English text only");
  });
});

describe("analyzeEnglishText", () => {
  it("returns low risk when lexical marker absent", () => {
    const text =
      "This is a neutral description of daily activities without clear negative emotion.";
    const res: AnalysisResult = analyzeEnglishText(text);
    expect(res.score).toBe(0);
    expect(res.severity).toBe("Low");
    expect(res.criteria.lexical.present).toBe(false);
  });

  it("returns non-zero score when clearly negative", () => {
    const text =
      "I feel hopeless and miserable. Everything seems worthless and I am very unhappy with my life.";
    const res: AnalysisResult = analyzeEnglishText(text);
    expect(res.criteria.lexical.present).toBe(true);
    expect(res.score).toBeGreaterThan(0);
  });
});

