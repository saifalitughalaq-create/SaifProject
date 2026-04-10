export const maxDuration = 60;

function stripMarkdown(text) {
  // Remove code fences: ```text ... ``` or ```plaintext ... ``` etc.
  return text.replace(/^```[^\n]*\n([\s\S]*?)```$/m, "$1").trim();
}

function parseResume(raw) {
  const text = stripMarkdown(raw);
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const result = { name: "", contact: "", summary: "", skills: [], experience: [], education: [] };
  let currentEntry = null;
  let summaryLines = [];
  let inSummary = false;

  for (const line of lines) {
    if (line.startsWith("NAME:")) {
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
    } else if (inSummary && !line.includes(":")) {
      // Continuation of summary on next line
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

  const prompt = `TASK: Rewrite the resume to better match the job description language. Do NOT analyze or review. Output only the rewritten resume in the exact format below.

DO NOT write: "Verdict", "Match", "Score", "Analysis", "Here is", "Based on", or any commentary.
START your response with: NAME:

STEP 1 — Read the resume and note:
- What tools and software are actually mentioned (e.g. SAP, Excel, specific systems)
- What tasks and responsibilities are described
- What metrics and numbers appear

STEP 2 — Rewrite following these rules:
- ONLY include tools, skills, and software that appear in the resume from Step 1
- If SAP is NOT in the resume, do NOT add SAP. If Excel is NOT in the resume, do NOT add Excel.
- ONLY use metrics and numbers that already exist in the resume — do not invent percentages
- Rephrase each bullet using the job description's vocabulary to describe what the person already did
- Keep all names, job titles, companies, dates, and education exactly as in the original
- Write the summary connecting the person's real background to this role

EXACT OUTPUT FORMAT:
NAME: [full name from resume]
CONTACT: [contact info from resume]
SUMMARY: [3 sentences using job description language to describe their real experience]
SKILLS: [only skills/tools that appear in the original resume, comma-separated]
JOB: [job title] | [company] | [location] | [dates]
BULLET: [reworded bullet — same fact, job description language, action verb first]
BULLET: [reworded bullet — same fact, job description language, action verb first]
BULLET: [reworded bullet — same fact, job description language, action verb first]
BULLET: [reworded bullet — same fact, job description language, action verb first]
BULLET: [reworded bullet — same fact, job description language, action verb first]
BULLET: [reworded bullet — same fact, job description language, action verb first]
(repeat JOB + BULLET blocks for every position in the resume)
EDU: [degree] | [school] | [location] | [year]
BULLET: [real education achievement]
BULLET: [real education achievement]

---
RESUME:
${resumeText}

---
JOB DESCRIPTION:
${jobDescription}

---
BEGIN OUTPUT (start with NAME:):`;

  const MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "llama3-8b-8192"];
  const systemPrompt = "You are a resume rewriter. Your only job is to rewrite the resume in the exact plain-text format the user provides. Never analyze, score, or review. Never add commentary, preamble, or markdown. Your output must start with NAME: and contain only the formatted resume lines.";

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
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (groqRes.ok) {
      data = await groqRes.json();
      break;
    }

    const err = await groqRes.json().catch(() => ({}));
    lastError = err?.error?.message || `Model ${model} failed`;

    // Continue to next model on rate limit or decommissioned model errors
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

  if (!text) {
    return res.status(500).json({ error: "No response from AI" });
  }

  const parsed = parseResume(text);
  if (!parsed.name) {
    // Return raw text snippet to help debug
    return res.status(500).json({ error: `Could not parse output. Raw start: ${text.slice(0, 300)}` });
  }
  return res.status(200).json(parsed);
}
