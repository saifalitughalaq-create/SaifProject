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

  const prompt = `You are rewriting this person's resume from scratch to target a specific job. Every single word must be chosen to match the job description. The original resume is only a source of facts — dates, companies, job titles, metrics, and real experiences. The actual writing must be completely new.

DO NOT copy any sentence from the original resume. DO NOT keep original phrasing. REWRITE EVERYTHING.
DO NOT add skills, tools, software, or metrics that are not in the original resume.
START your output with: MATCH_SCORE:

---
STEP 1: Read the job description. List every responsibility and requirement in your head.

STEP 2: Read the resume. Note:
- Actual job titles, companies, dates
- Real metrics and numbers (keep these exactly)
- What the person actually did (the facts, not the words)
- Skills and tools actually mentioned

STEP 3: For each JD requirement, decide: does this person's real experience cover it? (COVERED) or not? (GAP)

STEP 4: Write the new resume using JD language throughout. Rules:
- Summary: 3 sentences written specifically for THIS job, using JD keywords to describe their real background
- Skills: only what exists in the resume, but use JD terminology where equivalent (e.g. "financial close" if they have it)
- Every bullet: START with an action verb from the JD, use JD keyword phrases, keep original metrics
- Bullets must sound like they were written by someone who has been doing exactly THIS job
- Each job should have 5-6 bullets that collectively cover as many JD requirements as possible

EXAMPLE of weak vs strong rewriting:
WEAK: "Processed financial transactions with 98% accuracy"
STRONG: "Managed high-volume intercompany accounting and COGS reconciliation supporting month-end and quarter-end financial close cycles, maintaining 98% transaction accuracy"
(Same fact, completely different — now matches JD language exactly)

---
OUTPUT FORMAT (no markdown, no extra text):
MATCH_SCORE: [0-100]
COVERED: [jd requirement | jd requirement | ...]
GAPS: [missing skill or experience | ...]
NAME: [full name]
CONTACT: [contact info]
SUMMARY: [3 sentences — completely rewritten using JD vocabulary]
SKILLS: [only real skills from resume, JD terminology preferred, comma-separated]
JOB: [title] | [company] | [location] | [dates]
BULLET: [completely new bullet — JD action verb + JD keyword + real metric]
BULLET: [completely new bullet — JD action verb + JD keyword + real metric]
BULLET: [completely new bullet — JD action verb + JD keyword + real metric]
BULLET: [completely new bullet — JD action verb + JD keyword + real metric]
BULLET: [completely new bullet — JD action verb + JD keyword + real metric]
BULLET: [completely new bullet — JD action verb + JD keyword + real metric]
(repeat JOB + BULLET blocks for every position)
EDU: [degree] | [school] | [location] | [year]
BULLET: [achievement]
BULLET: [achievement]

---
RESUME (source of facts only):
${resumeText}

---
JOB DESCRIPTION (target language and requirements):
${jobDescription}

---
BEGIN (first line must be MATCH_SCORE:):`;

  const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-8b-8192"];
  const systemPrompt = "You are a professional resume writer. Your job is to completely rewrite resumes from scratch using the target job description's exact language. Never copy original wording. Never fabricate skills, tools, or metrics not in the original resume. Output plain text only — no markdown, no preamble. First line of output must be MATCH_SCORE:";

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
