## Lang4Diagnosis

Lang4Diagnosis is a Next.js 15 web application for analyzing **English-only** texts for depression-related linguistic markers, designed for psychologists and therapists as a research decision-support tool.

### Tech stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS
- Custom UI components styled in a clinical dark theme
- `papaparse` and `jspdf` for CSV/PDF export
- `recharts` for marker visualization

### Getting started

```bash
cd lang4diagnosis
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

### Analysis API

The analysis endpoint lives at `src/app/api/analyze/route.ts` and exposes a `POST /api/analyze` route that accepts:

```json
{ "text": "English text to analyze..." }
```

Validation rules:

- Empty or whitespace-only text is rejected.
- Text shorter than 50 characters or longer than 10,000 characters is rejected.
- Inputs with more than 80% special characters are rejected.
- Inputs where less than 70% of characters are Latin letters/space are rejected as non-English.

On success, the API returns a JSON payload containing:

- Overall score and severity (Low / Medium / High).
- Presence and strength (0–100%) of:
  - Lexical marker (negative sentiment)
  - Two morphological markers
  - One semantic marker
  - Two syntactic markers
- A human-readable evaluation string.

### Running tests

```bash
npm test
```

### Deployment

The project is ready for deployment on Vercel:

1. Push the repository to GitHub.
2. Import the project in Vercel.
3. Use the default Next.js build settings (`npm install`, then `npm run build`).

Raw text is not logged by default; the tool is intended as a **supporting signal** and must not be used as a standalone diagnostic instrument.

