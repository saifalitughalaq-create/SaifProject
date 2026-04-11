export const maxDuration = 60;

function stripMarkdown(text) {
  return text.replace(/^```[^\n]*\n([\s\S]*?)```$/m, "$1").trim();
}

function parseOutput(raw) {
  const text = stripMarkdown(raw);
  // Strip markdown formatting (bold, italic, headers) so **JOB:** or ## NAME: still parse correctly
  const lines = text.split("\n")
    .map(l => l.replace(/^[#*_>\s]+/, "").replace(/[*_`]+/g, "").trim())
    .filter(Boolean);

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

  const prompt = `You are a professional resume writer. Rewrite the resume below to target the job description. Follow these rules exactly:

1. HONESTY: Do not fabricate work history, past responsibilities, or core achievements. Only rephrase existing content from the provided resumes to highlight its relevance to the JD.
2. NATURAL PHRASING: All rephrasing must flow naturally and professionally. Do not force keywords or over-exaggerate if it makes the sentence sound unnatural.
3. PERMITTED SKILL ADDITIONS: You may add easily acquirable skills to the Skills section if requested in the JD — things like MS Excel, ERP systems, QuickBooks, Sage, Xero, SAP basics, Google Sheets, or similar software that can be learned in 3–6 months. Add to Skills section only.
4. UNFILLED GAPS: If critical JD requirements cannot be met, list them in GAPS only — do not invent experience.
5. MEMORY & RELEVANCE: If past resume versions are provided and contain job roles more relevant to this JD than the current resume, use those roles in the output. Always pick the most JD-relevant real job entries from across all provided resumes. Never fabricate a job — only use roles that actually exist in one of the provided resumes.

OUTPUT FORMAT:
MATCH_SCORE: [0-100]
RECOMMENDATION: [APPLY or APPLY_WITH_CAUTION or RECONSIDER]
REASON: [2-3 sentences]
COVERED: [requirement | requirement | ...]
BRIDGED: [requirement | requirement | ...]
GAPS: [requirement | requirement | ...]
NAME: [full name]
CONTACT: [phone | email | LinkedIn | City Province]
SUMMARY: [3 sentences, first person]
SKILLS: [skills, comma-separated]
JOB: [title] | [company] | [location] | [dates]
BULLET: [bullet point]
BULLET: [bullet point]
BULLET: [bullet point]
BULLET: [bullet point]
EDU: [degree] | [school] | [location] | [year]
BULLET: [achievement]

RESUME:
${resumeText}
${pastResumes.length > 0 ? `
PAST RESUME VERSIONS (use roles from these if more relevant to the JD):
${pastResumes.map((r, i) => `[v${i + 1}]\n${r}`).join("\n---\n")}
` : ""}
JOB DESCRIPTION:
${jobDescription}

BEGIN OUTPUT:`;

  const systemPrompt = "You are a professional resume writer. Output plain text only, no markdown. First line must be MATCH_SCORE:";

  // Per-model config
  const MODELS = [
    { id: "llama-3.3-70b-versatile", maxTokens: 4096, small: false },
    { id: "llama-3.1-8b-instant",    maxTokens: 2048, small: true  },
    { id: "llama3-8b-8192",          maxTokens: 2048, small: true  },
  ];

  // Compact fallback prompt for small models
  const smallPrompt = `Rewrite the resume to target the job description. Rules: (1) Only rephrase real content from the resumes provided — no fabrication of experience. (2) Natural phrasing only. (3) Add easily acquirable skills (Excel, ERP, QuickBooks, Sage, etc.) to Skills if JD requires them. (4) If past resume versions have more relevant roles for this JD, use those. (5) List unmet requirements in GAPS. Output plain text only.

OUTPUT FORMAT:
MATCH_SCORE: [0-100]
RECOMMENDATION: [APPLY or APPLY_WITH_CAUTION or RECONSIDER]
REASON: [2-3 sentences]
COVERED: [requirement | requirement | ...]
BRIDGED: [requirement | requirement | ...]
GAPS: [requirement | requirement | ...]
NAME: [full name]
CONTACT: [phone | email | LinkedIn | City Province]
SUMMARY: [3 sentences, first person]
SKILLS: [skills, comma-separated]
JOB: [title] | [company] | [location] | [dates]
BULLET: [bullet point]
BULLET: [bullet point]
BULLET: [bullet point]
BULLET: [bullet point]
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

  // ── Post-processing: enforce rules in code regardless of AI compliance ──

  // 1. Remove fabricated job entries — bracket placeholders only
  parsed.experience = parsed.experience.filter(job => {
    // job.company = "Company | Location | Dates" — only check company name, not location/dates
    const companyName = (job.company || "").split("|")[0].toLowerCase().trim();
    const title       = (job.title   || "").toLowerCase();
    return !(companyName.includes("[") || companyName.includes("]") ||
             title.includes("[")       || title.includes("]"));
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

  // 4. Strip generic soft skills the AI keeps adding despite instructions
  const BANNED_SKILLS = [
    "detail-oriented", "detail oriented", "attention to detail",
    "hard worker", "hard-worker", "strong work ethic", "work ethic",
    "team player", "team-player", "teamwork", "collaborative",
    "excellent organizational skills", "organizational skills", "organization skills",
    "committed to accuracy", "accuracy", "committed to",
    "ability to work independently", "works independently", "independent worker",
    "strong communication", "excellent communication", "communication skills",
    "verbal communication", "written communication", "interpersonal skills",
    "time management", "multitasking", "multi-tasking",
    "fast learner", "quick learner", "eager to learn",
    "problem solver", "problem-solver", "critical thinking",
    "analytical skills", "self-motivated", "self motivated",
    "motivated", "proactive", "adaptable", "flexible",
    "results-oriented", "results oriented", "results-driven", "goal-oriented",
    "customer-focused", "client-focused", "service-oriented",
    "strong work", "positive attitude", "willingness to learn",
  ];
  parsed.skills = parsed.skills.filter(skill => {
    const lower = skill.toLowerCase().trim();
    return !BANNED_SKILLS.some(banned => lower === banned || lower.includes(banned));
  });

  // 5. Auto-prepend [Unfilled Gaps] to reason when genuine gaps exist
  //    (Rule 3 — enforced here so AI compliance doesn't matter)
  // 5. Auto-prepend [Unfilled Gaps] to reason when genuine gaps exist
  if (parsed.gaps.length > 0) {
    const gapLabel = `[Unfilled Gaps: ${parsed.gaps.join(", ")}]`;
    if (!parsed.recommendationReason.startsWith("[Unfilled Gaps")) {
      parsed.recommendationReason = `${gapLabel} ${parsed.recommendationReason}`;
    }
  }

  // 6. Strip AI placeholder text from education fields (e.g. "[Year Not Specified]")
  const stripPlaceholders = (str) => (str || "").replace(/\[.*?\]/g, "").trim();
  parsed.education = parsed.education.map(edu => ({
    ...edu,
    degree: stripPlaceholders(edu.degree),
    school: stripPlaceholders(edu.school),
  }));

  return res.status(200).json(parsed);
}
