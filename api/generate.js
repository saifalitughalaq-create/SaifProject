export const maxDuration = 60;

function stripMarkdown(text) {
  return text.replace(/^```[^\n]*\n([\s\S]*?)```$/m, "$1").trim();
}

function parseOutput(raw) {
  const text = stripMarkdown(raw);
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  const result = {
    matchScore: 0,
    covered: [],
    gaps: [],
    name: "",
    contact: "",
    summary: "",
    skills: [],
    experience: [],
    education: [],
  };

  let currentEntry = null;
  let summaryLines = [];
  let inSummary = false;

  for (const line of lines) {
    if (line.startsWith("MATCH_SCORE:")) {
      result.matchScore = parseInt(line.slice(12).trim(), 10) || 0;
    } else if (line.startsWith("COVERED:")) {
      result.covered = line.slice(8).split("|").map(s => s.trim()).filter(Boolean);
    } else if (line.startsWith("GAPS:")) {
      result.gaps = line.slice(5).split("|").map(s => s.trim()).filter(Boolean);
    } else if (line.startsWith("NAME:")) {
      result.name = line.slice(5).trim();
      inSummary = false;
    } else if (line.startsWith("CONTACT:")) {
      result.contact = line.slice(8).trim();
      inSummary = false;
    } else if (line.startsWith("SUMMARY:")) {
      summaryLines = [line.slice(8).trim()];
      inSummary = true;
    } else if (line.startsWith("SKILLS:")) {
      if (summaryLines.length) result.summary = summaryLines.join(" ");
      inSummary = false;
      result.skills = line.slice(7).split(",").map(s => s.trim()).filter(Boolean);
    } else if (line.startsWith("JOB:")) {
      if (summaryLines.length && !result.summary) result.summary = summaryLines.join(" ");
      inSummary = false;
      currentEntry = { title: "", company: "", bullets: [] };
      const parts = line.slice(4).trim().split("|");
      currentEntry.title = (parts[0] || "").trim();
      currentEntry.company = parts.slice(1).join("|").trim();
      result.experience.push(currentEntry);
    } else if (line.startsWith("EDU:")) {
      if (summaryLines.length && !result.summary) result.summary = summaryLines.join(" ");
      inSummary = false;
      currentEntry = { degree: "", school: "", bullets: [] };
      const parts = line.slice(4).trim().split("|");
      currentEntry.degree = (parts[0] || "").trim();
      currentEntry.school = parts.slice(1).join("|").trim();
      result.education.push(currentEntry);
    } else if (line.startsWith("BULLET:") && currentEntry) {
      inSummary = false;
      currentEntry.bullets.push(line.slice(7).trim());
    } else if (inSummary && !line.match(/^[A-Z_]{3,}:/)) {
      summaryLines.push(line);
    }
  }

  if (summaryLines.length && !result.summary) result.summary = summaryLines.join(" ");
  return result;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { resumeText, jobDescription } = req.body;
  if (!resumeText || !jobDescription) return res.status(400).json({ error: "Missing inputs" });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const prompt = `You are a professional resume analyst and rewriter. Do the following in order:

STEP 1 — Analyze the job description and extract:
- Every specific responsibility listed
- Every required skill, tool, or qualification
- Key action verbs and terminology used

STEP 2 — Analyze the resume and for each JD requirement determine:
- COVERED: the person genuinely has this experience (from their resume)
- GAP: the person does not have this, or it is not mentioned in their resume

STEP 3 — Rewrite the resume:
- Rephrase bullets to use the JD's exact vocabulary for things the person already did
- Do NOT add any skill, tool, software, or metric not present in the original resume
- Do NOT invent SAP, ARIBA, Excel, or any tool unless it appears in the resume
- Keep all names, job titles, companies, dates, education exactly as-is
- Each bullet: action verb + JD keyword + real metric from resume
- Summary: connect their real background to this role using JD language

OUTPUT — use this exact format, no extra text, no markdown:
MATCH_SCORE: [0-100 integer: what % of JD requirements this resume genuinely covers]
COVERED: [requirement1 | requirement2 | requirement3 | ...all covered items]
GAPS: [gap1 | gap2 | gap3 | ...all genuine gaps]
NAME: [from resume]
CONTACT: [from resume]
SUMMARY: [3 sentences using JD language to describe their real experience]
SKILLS: [only skills present in original resume, comma-separated]
JOB: [title] | [company] | [location] | [dates]
BULLET: [reworded — same fact, JD language, action verb]
BULLET: [reworded — same fact, JD language, action verb]
BULLET: [reworded — same fact, JD language, action verb]
BULLET: [reworded — same fact, JD language, action verb]
BULLET: [reworded — same fact, JD language, action verb]
BULLET: [reworded — same fact, JD language, action verb]
(repeat JOB + BULLET for every position in the resume)
EDU: [degree] | [school] | [location] | [year]
BULLET: [real achievement]
BULLET: [real achievement]

---
RESUME:
${resumeText}

---
JOB DESCRIPTION:
${jobDescription}

---
START OUTPUT (first line must be MATCH_SCORE:):`;

  const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-8b-8192"];
  const systemPrompt = "You are a resume analyst and rewriter. Follow the output format exactly. Never fabricate skills, tools, or metrics not in the original resume. Output plain text only — no markdown, no preamble.";

  let data = null;
  let lastError = null;

  for (const model of MODELS) {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 4096,
      }),
    });

    if (groqRes.ok) {
      data = await groqRes.json();
      break;
    }

    const err = await groqRes.json().catch(() => ({}));
    lastError = err?.error?.message || `Model ${model} failed`;

    const isRetryable = groqRes.status === 429 ||
      (lastError && (lastError.includes("decommissioned") || lastError.includes("no longer supported") || lastError.includes("not found")));
    if (!isRetryable) {
      return res.status(groqRes.status).json({ error: lastError });
    }
  }

  if (!data) {
    return res.status(429).json({ error: "All models are rate limited. Please try again in a few minutes." });
  }

  const text = (data.choices?.[0]?.message?.content || "").trim();
  if (!text) return res.status(500).json({ error: "No response from AI" });

  const parsed = parseOutput(text);
  if (!parsed.name) {
    return res.status(500).json({ error: `Could not parse output. Raw start: ${text.slice(0, 300)}` });
  }

  return res.status(200).json(parsed);
}
