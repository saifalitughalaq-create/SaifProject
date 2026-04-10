export const maxDuration = 60;

function stripMarkdown(text) {
  return text.replace(/^```[^\n]*\n([\s\S]*?)```$/m, "$1").trim();
}

function parseOutput(raw) {
  const text = stripMarkdown(raw);
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  const result = {
    matchScore: 0,
    recommendation: "",   // APPLY | APPLY_WITH_CAUTION | RECONSIDER
    recommendationReason: "",
    covered: [],
    gaps: [],
    bridgedGaps: [],      // gaps that were partially addressed
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
  let inReason = false;

  for (const line of lines) {
    if (line.startsWith("MATCH_SCORE:")) {
      result.matchScore = parseInt(line.slice(12).trim(), 10) || 0;
      inSummary = false; inReason = false;
    } else if (line.startsWith("RECOMMENDATION:")) {
      result.recommendation = line.slice(15).trim().toUpperCase();
      inSummary = false; inReason = false;
    } else if (line.startsWith("REASON:")) {
      result.recommendationReason = line.slice(7).trim();
      inReason = true; inSummary = false;
    } else if (line.startsWith("COVERED:")) {
      result.covered = line.slice(8).split("|").map(s => s.trim()).filter(Boolean);
      inReason = false;
    } else if (line.startsWith("GAPS:")) {
      result.gaps = line.slice(5).split("|").map(s => s.trim()).filter(Boolean);
      inReason = false;
    } else if (line.startsWith("BRIDGED:")) {
      result.bridgedGaps = line.slice(8).split("|").map(s => s.trim()).filter(Boolean);
      inReason = false;
    } else if (line.startsWith("NAME:")) {
      result.name = line.slice(5).trim();
      inSummary = false; inReason = false;
    } else if (line.startsWith("CONTACT:")) {
      result.contact = line.slice(8).trim();
      inSummary = false; inReason = false;
    } else if (line.startsWith("SUMMARY:")) {
      summaryLines = [line.slice(8).trim()];
      inSummary = true; inReason = false;
    } else if (line.startsWith("SKILLS:")) {
      if (summaryLines.length) result.summary = summaryLines.join(" ");
      inSummary = false; inReason = false;
      result.skills = line.slice(7).split(",").map(s => s.trim()).filter(Boolean);
    } else if (line.startsWith("JOB:")) {
      if (summaryLines.length && !result.summary) result.summary = summaryLines.join(" ");
      inSummary = false; inReason = false;
      currentEntry = { title: "", company: "", bullets: [] };
      const parts = line.slice(4).trim().split("|");
      currentEntry.title = (parts[0] || "").trim();
      currentEntry.company = parts.slice(1).join("|").trim();
      result.experience.push(currentEntry);
    } else if (line.startsWith("EDU:")) {
      if (summaryLines.length && !result.summary) result.summary = summaryLines.join(" ");
      inSummary = false; inReason = false;
      currentEntry = { degree: "", school: "", bullets: [] };
      const parts = line.slice(4).trim().split("|");
      currentEntry.degree = (parts[0] || "").trim();
      currentEntry.school = parts.slice(1).join("|").trim();
      result.education.push(currentEntry);
    } else if (line.startsWith("BULLET:") && currentEntry) {
      inSummary = false; inReason = false;
      currentEntry.bullets.push(line.slice(7).trim());
    } else if (inSummary && !line.match(/^[A-Z_]{3,}:/)) {
      summaryLines.push(line);
    } else if (inReason && !line.match(/^[A-Z_]{3,}:/)) {
      result.recommendationReason += " " + line;
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

  const prompt = `You are a professional resume writer and career advisor. Rewrite this resume from scratch to maximally target the job description — using every transferable skill and experience the person genuinely has. Also provide an honest job fit assessment.

TRUTHFULNESS RULES (never break these):
- NEVER invent skills, tools, software, or metrics not in the original resume
- NEVER add SAP, ARIBA, Excel, or any tool not mentioned in the resume
- NEVER fabricate metrics — only use numbers from the original resume
- Original resume = source of facts only. All writing must be completely new.

REWRITING APPROACH:
1. Read the JD and identify every requirement (required vs preferred)
2. Read the resume and identify everything the person genuinely has
3. For each JD requirement:
   - COVERED: person clearly has this from their resume
   - BRIDGED: person has related/transferable experience that partially covers this
   - GAP: person genuinely does not have this at all
4. Rewrite the resume to maximally cover COVERED + BRIDGED requirements
5. For BRIDGED items: frame the closest real experience in JD language as strongly as possible
6. For GAP items: do not address in resume — list them honestly in GAPS

WRITING RULES:
- Every bullet completely rewritten — no original phrasing kept at all
- Bullets: strong JD action verb + JD keyword phrase + real metric from resume
- Summary: 3 sentences connecting real background to this specific role using JD vocabulary
- Skills: only what exists in the resume, using JD terminology where equivalent
- 5-6 bullets per job covering as many JD requirements as possible

RECOMMENDATION LOGIC:
- APPLY: 70%+ covered/bridged, no missing core requirements
- APPLY_WITH_CAUTION: 50-69% covered/bridged, or missing 1-2 preferred (not required) skills
- RECONSIDER: below 50% covered/bridged, or missing core required qualifications

EXAMPLE — weak vs strong bullet:
WEAK: "Processed financial transactions with 98% accuracy"
STRONG: "Owned high-volume intercompany accounting and COGS reconciliation cycles, driving month-end and quarter-end financial close with 98% transaction accuracy across all accounts"

---
OUTPUT FORMAT — exact, no markdown, no extra text:
MATCH_SCORE: [0-100 integer]
RECOMMENDATION: [APPLY or APPLY_WITH_CAUTION or RECONSIDER]
REASON: [2-3 sentences: what makes them a good fit, what the key gaps are, and whether those gaps are dealbreakers]
COVERED: [requirement | requirement | ...]
BRIDGED: [requirement they partially cover | ...]
GAPS: [genuine missing requirement | ...]
NAME: [full name from resume]
CONTACT: [contact info from resume]
SUMMARY: [3 sentences — rewritten using JD vocabulary, connecting real background to this role]
SKILLS: [only skills from original resume, JD terminology preferred, comma-separated]
JOB: [title] | [company] | [location] | [dates]
BULLET: [new bullet — JD verb + JD phrase + real metric]
BULLET: [new bullet — JD verb + JD phrase + real metric]
BULLET: [new bullet — JD verb + JD phrase + real metric]
BULLET: [new bullet — JD verb + JD phrase + real metric]
BULLET: [new bullet — JD verb + JD phrase + real metric]
BULLET: [new bullet — JD verb + JD phrase + real metric]
(repeat JOB + BULLET for every position in the resume)
EDU: [degree] | [school] | [location] | [year]
BULLET: [real achievement relevant to role]
BULLET: [real achievement relevant to role]

---
RESUME (facts only):
${resumeText}

---
JOB DESCRIPTION:
${jobDescription}

---
BEGIN OUTPUT (first line: MATCH_SCORE:):`;

  const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-8b-8192"];
  const systemPrompt = "You are a professional resume writer and career advisor. Completely rewrite resumes from scratch in the exact plain-text format given. Never fabricate skills, tools, or metrics. Output plain text only — no markdown, no preamble. First line must be MATCH_SCORE:";

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

    const isRetryable = groqRes.status === 429 || groqRes.status === 404 ||
      (lastError && (
        lastError.includes("decommissioned") ||
        lastError.includes("no longer supported") ||
        lastError.includes("not found") ||
        lastError.includes("does not exist") ||
        lastError.includes("access")
      ));
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
