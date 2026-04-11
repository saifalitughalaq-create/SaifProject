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

  const { resumeText, jobDescription, pastResumes = [] } = req.body;
  if (!resumeText || !jobDescription) return res.status(400).json({ error: "Missing inputs" });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const prompt = `You are an expert resume strategist. Your job is to build the strongest possible resume by combining everything known about this person — their current resume, all past resume versions, and smart professional inference — then target it precisely to the job description.

CORE RULES:
- NEVER invent job titles, companies, degrees, years of experience, or specific metrics not stated anywhere
- NEVER claim deep expertise in something requiring years of training unless stated
- DO use every real skill, tool, and achievement from the current resume and ALL past versions
- DO apply professional inference for implied skills (see below)

PROFESSIONAL INFERENCE — YOU MAY ADD THESE:
Based on a person's industry, role, and years of experience, infer and include skills they almost certainly have even if not listed. These are allowed:
1. Standard productivity tools for their industry (Excel/Google Sheets for finance/ops/admin/HR, Outlook for any office role, basic reporting tools)
2. Common short-learn tools for their role (CRMs like Salesforce basics for sales/marketing, ERPs like SAP basics for supply chain/finance/ops, project tools like Jira/Asana/Trello for coordinators, Adobe basics for marketing/creative)
3. Certifications or knowledge areas that naturally accompany their experience (Google Analytics for marketing roles, WHMIS for lab/safety roles, basic PMP concepts for project coordinators, OSHA basics for operations/facilities)
4. Any skill, tool, or certification mentioned in ANY past resume version — these are real, always include them
5. Industry-standard practices implied by their job titles (budgeting for finance roles, cross-functional collaboration for any manager, data entry/reporting for any admin/coordinator)

INFERENCE LIMITS — NEVER INFER:
- Programming languages or advanced technical skills not mentioned anywhere in any resume
- Specific enterprise implementations (full SAP ERP admin, Salesforce admin certification, etc.)
- Management of large teams unless stated
- Any specific metrics, numbers, or quantified results not appearing in any resume version

PAST RESUME ANALYSIS:
When past resume versions are provided, extract EVERY unique skill, tool, certification, achievement, and responsibility across all versions. Build a complete master profile. Use all of it — past versions reveal what the person forgot to include in their current resume.

REWRITING APPROACH:
1. Build master profile: current resume + all past resume versions + safe professional inferences based on their background
2. Read the JD and classify every requirement against the master profile:
   - COVERED: directly stated in any resume version or clearly inferable
   - BRIDGED: transferable experience that partially addresses it
   - GAP: genuinely absent — not in any version, not inferable
3. Write bullets using JD language to describe real and inferred experience naturally
4. Treat inferred skills as real — state them directly without hedging phrases like "familiar with" or "exposure to"

WRITING RULES:
- Every bullet completely rewritten with a strong action verb + JD keyword + context
- Summary: 3 sentences in first person ("I am...", "I have...", "I bring...") connecting full background to this role
- Skills: all confirmed skills from any resume version + safe inferences relevant to this role
- 5-6 bullets per job maximally covering JD requirements

RECOMMENDATION LOGIC:
- APPLY: 70%+ covered/bridged, no missing core requirements
- APPLY_WITH_CAUTION: 50-69% covered/bridged, or 1-2 preferred skills missing
- RECONSIDER: below 50% or missing core required qualifications

---
OUTPUT FORMAT — exact, no markdown, no extra text:
MATCH_SCORE: [0-100 integer]
RECOMMENDATION: [APPLY or APPLY_WITH_CAUTION or RECONSIDER]
REASON: [2-3 sentences: fit strengths, key gaps, whether gaps are dealbreakers]
COVERED: [requirement | requirement | ...]
BRIDGED: [requirement they partially cover | ...]
GAPS: [genuine missing requirement | ...]
NAME: [full name from resume]
CONTACT: [phone (dashes only, no commas e.g. +1-555-867-5309) | email | LinkedIn URL | City State — use | as separator, never commas between items]
SUMMARY: [3 sentences in first person — connecting full background + inferred strengths to this role using JD vocabulary]
SKILLS: [all confirmed + inferred skills relevant to this role, JD terminology preferred, comma-separated]
JOB: [title] | [company] | [location] | [dates]
BULLET: [action verb + JD keyword + real or inferred context]
BULLET: [action verb + JD keyword + real or inferred context]
BULLET: [action verb + JD keyword + real or inferred context]
BULLET: [action verb + JD keyword + real or inferred context]
BULLET: [action verb + JD keyword + real or inferred context]
BULLET: [action verb + JD keyword + real or inferred context]
(repeat JOB + BULLET for every position in the resume)
EDU: [degree] | [school] | [location] | [year]
BULLET: [real achievement relevant to role]
BULLET: [real achievement relevant to role]

---
CURRENT RESUME:
${resumeText}
${pastResumes.length > 0 ? `
---
PAST RESUME VERSIONS (same person — extract every skill, tool, achievement across all versions and include them):
${pastResumes.map((r, i) => `[Version ${i + 1}]\n${r}`).join("\n---\n")}
` : ""}
---
JOB DESCRIPTION:
${jobDescription}

---
BEGIN OUTPUT (first line: MATCH_SCORE:):`;

  const systemPrompt = "You are an expert resume strategist. Build the strongest resume possible using all resume versions and professional inference. Output plain text only — no markdown, no preamble. First line must be MATCH_SCORE:";

  // Per-model config
  const MODELS = [
    { id: "llama-3.3-70b-versatile", maxTokens: 4096 },
    { id: "llama-3.1-8b-instant",    maxTokens: 2800 },
    { id: "llama3-8b-8192",          maxTokens: 2800 },
  ];

  let data = null;
  let lastError = null;

  for (const { id: model, maxTokens } of MODELS) {
    const isSmall = maxTokens <= 2800;
    const resumeInput = isSmall ? resumeText.slice(0, 3000) : resumeText;
    const jdInput     = isSmall ? jobDescription.slice(0, 2000) : jobDescription;
    const promptToSend = prompt
      .replace(resumeText, resumeInput)
      .replace(jobDescription, jdInput);

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: promptToSend }
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
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
