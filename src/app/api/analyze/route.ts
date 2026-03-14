import { NextRequest, NextResponse } from "next/server";
import {
  analyzeEnglishText,
  validateEnglishText,
  AnalysisResult
} from "@/lib/analysis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = typeof body?.text === "string" ? body.text : "";

    const validationError = validateEnglishText(text);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const result: AnalysisResult = analyzeEnglishText(text);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "Oops! Seems like there was a problem: Server error. Try again."
      },
      { status: 500 }
    );
  }
}

