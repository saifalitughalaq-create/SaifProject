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

ABSOLUTE RULES — NEVER BREAK:
- Each real job from the resume must appear EXACTLY ONCE — never repeat the same company/title combination
- NEVER create a JOB entry that does not exist in the resume — only real companies, real titles, real dates
- NEVER use placeholder text like [Company], [Location], [Dates]
- NEVER fabricate metrics, years of experience, or credentials requiring multi-year training
- Each past resume version is extra context only — if it contains the same job as the current resume, do NOT output that job twice

SHORT-LEARN SKILLS YOU MAY ADD (learnable in 3-6 months — treat as real):
Based on their industry and role, freely add these to skills and weave into bullets:
- Finance/accounting roles: Excel, Google Sheets, QuickBooks, Sage, SAP basics, accounts payable/receivable tools, bank reconciliation software
- Sales/marketing roles: Salesforce basics, HubSpot, Google Analytics, Meta Ads, Mailchimp
- Operations/supply chain: SAP basics, ERP fundamentals, inventory management tools, Warehouse Management Systems basics
- Admin/coordinator roles: MS Office Suite, Google Workspace, Asana, Trello, scheduling tools, data entry systems
- Any office role: Outlook, Teams, Zoom, basic reporting, process documentation
- Certifications naturally implied: WHMIS for lab/safety, Google Analytics cert for marketing, basic PMP concepts for project coordinators, Canadian GAAP knowledge for Canadian accounting roles
- Any skill from ANY past resume version — always include these, they are real

DO NOT ADD:
- Programming languages or advanced dev skills not mentioned anywhere
- Full enterprise system admin (full SAP implementation, Salesforce admin, etc.)
- Management of large teams unless stated
- Any specific numbers or metrics not in any resume version

PAST RESUME ANALYSIS:
Extract every unique skill, tool, certification, and achievement across ALL past versions. These are part of the person's real profile — include all of them in the master profile.

REWRITING APPROACH:
1. Build master profile from: current resume + all past versions + short-learn inferences above
2. Map every JD requirement to the master profile:
   - COVERED: directly in their background or clearly inferable
   - BRIDGED: paraphrase and reframe their closest real experience to address it
   - GAP: genuinely absent, cannot be inferred or bridged
3. For each real job, write 5-6 bullets that use JD language to describe what they actually did — paraphrase freely, reframe completely, use every JD keyword that honestly applies
4. Spread all JD requirements across the existing real jobs — never create a new job to fill a gap
5. Gaps that truly cannot be filled: list in GAPS and explain honestly in REASON

WRITING RULES:
- Every bullet completely rewritten — strong action verb + JD keyword + real context
- Paraphrase aggressively: the same real work can be described many ways to match JD language
- Summary: 3 sentences in first person ("I am...", "I have...", "I bring...") using JD vocabulary
- Skills section — use industry judgment:
  * ALWAYS include in skills (even if mentioned in bullets): specific software, tools, platforms, certifications, and technical methodologies — recruiters and ATS scan skills sections for these independently (e.g. QuickBooks, SAP, Excel, GAAP, Salesforce, Google Analytics, AutoCAD, Python)
  * NEVER include in skills: soft skills, generic phrases, or action verbs already in bullets (e.g. "strong communicator", "detail-oriented", "team player", "prepared financial statements") — these belong only in the experience
  * The skills section should read like a clean, scannable list of hard skills and tools — not a repetition of the bullet narrative
- 5-6 bullets per job, maximally covering JD requirements across all real roles

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
SKILLS: [hard skills, tools, software, platforms, certifications relevant to this JD — include even if briefly mentioned in bullets since ATS scans this independently; exclude soft skills and generic phrases that belong only in the experience, comma-separated]
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
