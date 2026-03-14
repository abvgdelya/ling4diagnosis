"use client";

import { useState } from "react";
import { saveAs } from "file-saver";
import Papa from "papaparse";
import jsPDF from "jspdf";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from "recharts";
import type { AnalysisResult } from "@/lib/analysis";

const MAX_CHARS = 10_000;

export default function HomePage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Unexpected error. Try again.");
        return;
      }

      setResult(data as AnalysisResult);
    } catch {
      setError(
        "Oops! Seems like there was a problem: Network error. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const value = String(evt.target?.result ?? "");
      setText(value.slice(0, MAX_CHARS));
      setError(null);
    };
    reader.readAsText(file);
  };

  const exportCsv = () => {
    if (!result) return;
    const rows = Object.entries(result.markerStrengths).map(
      ([marker, strength]) => ({
        marker,
        strength,
        present: result.criteria[marker as keyof typeof result.criteria]
          .present
          ? "yes"
          : "no"
      })
    );
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "lang4diagnosis-results.csv");
  };

  const exportPdf = () => {
    if (!result) return;
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(14);
    doc.text("Lang4Diagnosis Report", 10, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Score: ${result.score}% (${result.severity} risk)`, 10, y);
    y += 6;
    doc.text(result.evaluation, 10, y);
    y += 10;
    doc.text("Markers:", 10, y);
    y += 6;
    for (const [marker, crit] of Object.entries(result.criteria)) {
      doc.text(
        `${marker}: ${crit.strength}% - ${crit.present ? "present" : "absent"}`,
        10,
        y
      );
      y += 6;
      if (y > 280) {
        doc.addPage();
        y = 10;
      }
    }
    doc.save("lang4diagnosis-report.pdf");
  };

  const severityColor =
    result?.severity === "High"
      ? "bg-red-500/90"
      : result?.severity === "Medium"
      ? "bg-amber-500/90"
      : "bg-emerald-500/90";

  const chartData =
    result &&
    Object.entries(result.markerStrengths).map(([marker, strength]) => ({
      marker,
      strength
    }));

  return (
    <div className="flex flex-1 flex-col gap-8">
      <header className="mb-4">
        <h1 className="text-balance text-3xl font-semibold tracking-tight text-slate-50 md:text-4xl">
          Analyze English text for depression markers
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Lang4Diagnosis highlights linguistic signals associated with
          depressive expression in English texts. It is a research support tool
          and{" "}
          <span className="font-semibold">
            not a standalone medical diagnosis.
          </span>
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/40">
          <h2 className="text-sm font-medium text-slate-200">
            English text input
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Paste or upload anonymized English text (50–10,000 characters).
          </p>

          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value.slice(0, MAX_CHARS));
              setError(null);
            }}
            className="mt-3 h-56 w-full resize-none rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-brand focus:border-brand focus:ring-1"
            placeholder="Paste anonymized English text here..."
          />
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>{text.length.toLocaleString()} / 10,000 characters</span>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-800 bg-slate-900/80 px-2 py-1 text-[11px] font-medium text-slate-200 hover:border-slate-700">
              <span>Upload .txt</span>
              <input
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {error && (
            <p className="mt-3 rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-100">
              {error}
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="inline-flex items-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
              aria-label="Analyze English text for depression markers"
            >
              {loading ? "Analyzing..." : "Analyze text"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/40">
          <h2 className="text-sm font-medium text-slate-200">
            Risk overview
          </h2>
          {result ? (
            <>
              <div className="flex items-center gap-3">
                <div
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-slate-900 ${severityColor}`}
                >
                  {result.severity} risk
                </div>
                <span className="text-sm text-slate-200">
                  Depression marker score:{" "}
                  <span className="font-semibold">{result.score}%</span>
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`${severityColor} h-2 rounded-full transition-all`}
                  style={{ width: `${Math.min(100, result.score)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-300">{result.evaluation}</p>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={exportCsv}
                  className="inline-flex flex-1 items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-100 hover:border-slate-500"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={exportPdf}
                  className="inline-flex flex-1 items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-100 hover:border-slate-500"
                >
                  Export PDF
                </button>
              </div>
            </>
          ) : (
            <p className="mt-2 text-xs text-slate-400">
              Run an analysis to view a depression marker score, severity level,
              and exportable report.
            </p>
          )}
        </div>
      </section>

      {result && (
        <section className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-sm font-medium text-slate-200">
              Linguistic markers
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Each marker reflects a family of linguistic features reported in
              depression-related research. Values are expressed as percentages
              of the relevant linguistic category.
            </p>
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-xs text-slate-200">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-4">Marker</th>
                    <th className="py-2 pr-4">Present?</th>
                    <th className="py-2 pr-4">Strength (%)</th>
                    <th className="py-2 pr-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {renderMarkerRow(
                    "lexical",
                    "Lexical sentiment (negative polarity)",
                    result
                  )}
                  {renderMarkerRow(
                    "morphological1",
                    "First-person pronoun focus",
                    result
                  )}
                  {renderMarkerRow(
                    "morphological2",
                    "Passive vs. active verb balance",
                    result
                  )}
                  {renderMarkerRow(
                    "semantic",
                    "Mental / existential process focus",
                    result
                  )}
                  {renderMarkerRow(
                    "syntactic1",
                    "11–12 word sentence proportion",
                    result
                  )}
                  {renderMarkerRow(
                    "syntactic2",
                    "Ellipsis usage in sentences",
                    result
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-sm font-medium text-slate-200">
              Marker distribution
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Bar heights reflect relative strength of each marker on a 0–100%
              scale.
            </p>
            <div className="mt-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="marker"
                    tick={{ fontSize: 10, fill: "#cbd5f5" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#cbd5f5" }}
                    domain={[0, 100]}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderColor: "#1e293b",
                      borderRadius: 8,
                      fontSize: 11
                    }}
                  />
                  <Bar dataKey="strength" fill="#38bdf8" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      <footer className="mt-auto pt-4 text-[11px] text-slate-500">
        This tool is intended for professional use as a decision-support aid
        and does not replace comprehensive clinical assessment.
      </footer>
    </div>
  );
}

function renderMarkerRow(
  key: keyof AnalysisResult["criteria"],
  label: string,
  result: AnalysisResult
) {
  const crit = result.criteria[key];
  return (
    <tr key={key}>
      <td className="py-2 pr-4 text-xs font-medium text-slate-100">{label}</td>
      <td className="py-2 pr-4 text-xs">
        {crit.present ? (
          <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
            present
          </span>
        ) : (
          <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
            absent
          </span>
        )}
      </td>
      <td className="py-2 pr-4 text-xs text-slate-100">
        {Math.round(crit.strength)}%
      </td>
      <td className="py-2 pr-4 text-[11px] text-slate-300">{label}</td>
    </tr>
  );
}

