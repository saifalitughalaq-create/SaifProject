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

  const prompt = `You are a professional resume writer. Rewrite the person's resume to target this job description using their real background only. Be strategic and honest — never fabricate.

━━━ HARD RULES ━━━
1. Every JOB line must use the exact company name and job title from the resume — never invent, never use [Company] [Location] [Dates] placeholders
2. Each job appears EXACTLY ONCE — do not repeat the same company+title combination
3. Each education entry appears EXACTLY ONCE
4. Do not fabricate work history, past responsibilities, or achievements — only rephrase what actually exists in the resume
5. Do not force JD keywords unnaturally — if a keyword does not genuinely fit the person's real experience, do not use it
6. Never fabricate metrics, specific numbers, or credentials that take years to earn (degrees, CPA, PEng, etc.)
7. Past resume versions — if a past resume contains a real job role more relevant to this JD than the current resume, include that role in the output. Always pick the most JD-relevant real job entries from across all provided resumes. Never fabricate a job — only use roles that exist in one of the provided resumes.

━━━ PERMITTED SKILL ADDITIONS (Skills section only — not experience bullets) ━━━
You may add the following to the Skills section even if not explicitly in the resume:

A. Easily acquirable tools and software (learnable in days to months) if required by the JD:
   MS Excel, Google Sheets, ERP systems, QuickBooks, Sage, Xero, SAP basics, FreshBooks
   MS Office Suite, Google Workspace, Outlook, Teams, Zoom, Asana, Trello, Slack
   Salesforce basics, HubSpot, Google Analytics, Mailchimp
   Canadian GAAP, GST/HST, bank reconciliation tools, basic bookkeeping software

B. Interchangeable tools — if person knows one, add the JD's equivalent:
   QuickBooks ↔ Sage ↔ Xero ↔ FreshBooks | Excel ↔ Google Sheets | SAP ↔ Oracle ↔ Dynamics ↔ NetSuite
   Salesforce ↔ HubSpot ↔ Zoho | Jira ↔ Asana ↔ Trello ↔ Monday | Slack ↔ Teams

C. Every skill, tool, and certification from ANY past resume version

━━━ REWRITING APPROACH ━━━
1. Build master profile: current resume + all past versions + permitted additions above
2. Read JD — classify each requirement:
   COVERED = clearly in their background | BRIDGED = transferable experience addresses it | GAP = genuinely absent
3. Rewrite each real job with 5-6 bullets — rephrase actual responsibilities using JD vocabulary where it fits naturally
4. Distribute JD requirements across existing jobs only — never create a new job entry to fill a gap
5. If a JD requirement absolutely cannot be met by honest rephrasing → list in GAPS

━━━ SKILLS SECTION RULES ━━━
The skills section is driven by the JD — only include what the JD actually cares about.

ALWAYS INCLUDE: technical skills, software, tools, platforms, certifications, methodologies that appear in or are relevant to the JD

INCLUDE ONLY IF JD EXPLICITLY REQUIRES IT: soft skills, using the JD's own phrasing (2-3 words max)
   Example: JD says "cross-functional collaboration" → include "Cross-functional Collaboration"

NEVER INCLUDE: generic filler — "detail-oriented", "team player", "strong work ethic", "excellent organizational skills", "committed to accuracy", "ability to work independently"

━━━ OUTPUT FORMAT — plain text only, no markdown ━━━
MATCH_SCORE: [0-100]
RECOMMENDATION: [APPLY or APPLY_WITH_CAUTION or RECONSIDER]
REASON: [2-3 sentences: strengths, key gaps, honest verdict]
COVERED: [req | req | ...]
BRIDGED: [req | req | ...]
GAPS: [genuine missing req | ...]
NAME: [full name]
CONTACT: [phone with dashes | email | LinkedIn | City Province — pipe separated, no commas]
SUMMARY: [3 sentences, first person: I am... I have... I bring... — use JD vocabulary]
SKILLS: [hard skills and tools only, comma-separated — no soft skills, no filler phrases]
JOB: [title] | [company] | [location] | [dates]
BULLET: [strong verb + real responsibility rephrased with JD keyword]
BULLET: [strong verb + real responsibility rephrased with JD keyword]
BULLET: [strong verb + real responsibility rephrased with JD keyword]
BULLET: [strong verb + real responsibility rephrased with JD keyword]
BULLET: [strong verb + real responsibility rephrased with JD keyword]
BULLET: [strong verb + real responsibility rephrased with JD keyword]
(one JOB block per real position — never repeat)
EDU: [degree] | [school] | [location] | [year]
BULLET: [relevant achievement]
BULLET: [relevant achievement]

━━━ RESUME ━━━
${resumeText}
${pastResumes.length > 0 ? `
━━━ PAST RESUME VERSIONS (use roles from these if more relevant to the JD than the current resume) ━━━
${pastResumes.map((r, i) => `[v${i + 1}]\n${r}`).join("\n---\n")}
` : ""}
━━━ JOB DESCRIPTION ━━━
${jobDescription}

BEGIN OUTPUT:`;

  const systemPrompt = "You are a professional resume writer. Rewrite resumes in the exact plain-text format specified. Skills section = hard skills and tools only, never soft skills or abstract phrases. Never fabricate job entries. Output plain text only, no markdown. First line must be MATCH_SCORE:";

  // Per-model config
  const MODELS = [
    { id: "llama-3.3-70b-versatile", maxTokens: 4096, small: false },
    { id: "llama-3.1-8b-instant",    maxTokens: 2048, small: true  },
    { id: "llama3-8b-8192",          maxTokens: 2048, small: true  },
  ];

  // Compact fallback prompt for small models — same rules, far fewer tokens
  const smallPrompt = `Rewrite this resume to target the job description. Output plain text only.

RULES:
- Only use real companies/titles from the resume — never invent jobs or use [brackets]
- Each job and education entry appears exactly once
- Skills: hard skills and tools only (software, certifications, technical methods). No soft skills, no generic phrases.
- Add implied tools for their industry (Excel/Sheets for finance, QuickBooks/Sage interchangeable, SAP basics for ops, etc.)
- Paraphrase experience bullets using JD keywords — 5-6 bullets per job
- True gaps only: list in GAPS and REASON

OUTPUT FORMAT:
MATCH_SCORE: [0-100]
RECOMMENDATION: [APPLY or APPLY_WITH_CAUTION or RECONSIDER]
REASON: [2-3 sentences]
COVERED: [req | req]
BRIDGED: [req | req]
GAPS: [req | req]
NAME: [name]
CONTACT: [phone | email | LinkedIn | City Province]
SUMMARY: [3 sentences, first person]
SKILLS: [hard skills only, comma-separated]
JOB: [title] | [company] | [location] | [dates]
BULLET: [verb + keyword + context]
(5-6 bullets per job, repeat for each position)
EDU: [degree] | [school] | [location] | [year]
BULLET: [achievement]

RESUME:
${resumeText.slice(0, 1800)}

JOB DESCRIPTION:
${jobDescription.slice(0, 1200)}

BEGIN OUTPUT:`;

  let data = null;
  let lastError = null;

  for (const { id: model, maxTokens, small } of MODELS) {
    const promptToSend = small ? smallPrompt : prompt;

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

  const allResumeText = [resumeText, ...pastResumes].join(" ").toLowerCase();

  // 1. Remove fabricated job entries (bracket placeholders only)
  // Note: job.company = "Company | Location | Dates" — only check the company name segment
  parsed.experience = parsed.experience.filter(job => {
    const companyFull = (job.company || "").toLowerCase();
    const companyName = companyFull.split("|")[0].trim(); // company name only, not location/dates
    const title       = (job.title   || "").toLowerCase();
    // Reject obvious placeholder text with brackets
    if (companyFull.includes("[") || companyFull.includes("]") ||
        title.includes("[")       || title.includes("]")) return false;
    // Check at least one meaningful word from company name or title exists in resume
    const companyWords = companyName.split(/\s+/).filter(w => w.length > 3);
    const titleWords   = title.split(/\s+/).filter(w => w.length > 3);
    const allWords = [...companyWords, ...titleWords];
    if (allWords.length === 0) return true;
    return allWords.some(w => allResumeText.includes(w));
  });

  // 2. Deduplicate jobs — keep only the first occurrence of each company+title
  const seenJobs = new Set();
  parsed.experience = parsed.experience.filter(job => {
    const key = `${job.title}|${job.company}`.toLowerCase().trim();
    if (seenJobs.has(key)) return false;
    seenJobs.add(key);
    return true;
  });

  // 3. Deduplicate education — keep only the first occurrence of each degree+school
  const seenEdu = new Set();
  parsed.education = parsed.education.filter(edu => {
    const key = `${edu.degree}|${edu.school}`.toLowerCase().trim();
    if (seenEdu.has(key)) return false;
    seenEdu.add(key);
    return true;
  });

  return res.status(200).json(parsed);
}
