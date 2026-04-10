export const maxDuration = 60;

// Balances unclosed brackets/braces in LLM JSON output
function balanceJSON(str) {
  const stack = [];
  let inString = false;
  let escape = false;

  for (const ch of str) {
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (!inString) {
      if (ch === "{") stack.push("}");
      else if (ch === "[") stack.push("]");
      else if (ch === "}" || ch === "]") stack.pop();
    }
  }

  // Close any unclosed structures
  return str + stack.reverse().join("");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { resumeText, jobDescription } = req.body;

  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: "Missing resumeText or jobDescription" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured on server" });
  }

  const prompt = `Rewrite this resume tailored to the job description. Use the job description's exact keywords. Rewrite every bullet — do not copy from the resume.

RESUME:
${resumeText}

JOB:
${jobDescription}

Rules: tailor summary to this role (3 sentences), rewrite every bullet using job keywords, quantify achievements with numbers/%, 14 skills, 6-7 bullets per role (more for recent roles), add 2-3 bullets for education, no em dashes. Generate enough content to fill a full 2-page resume.

Respond with ONLY valid JSON:
{"name":"","contact":"","summary":"","skills":[],"experience":[{"title":"","company":"","bullets":[]}],"education":[{"degree":"","school":"","bullets":[]}]}`;

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert resume writer and a JSON API. Your only output is a valid JSON object — no markdown, no explanation, no text outside the JSON.

Your job is to TRANSFORM a resume to match a job description:
- Extract keywords, skills, tools, and responsibilities from the job description
- Rewrite EVERY bullet point using those exact keywords — never copy the original wording
- Rewrite the summary to directly target the specific role
- List only skills that appear in or are relevant to the job description
- Quantify results (numbers, %, $) wherever the original hints at measurable work
- If the original says "helped with invoices" and the job says "AP/AR processing" — write "Processed AP/AR transactions..."
- Make the candidate look like a perfect match for this specific job`,
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 4096,
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.json().catch(() => ({}));
    return res.status(groqRes.status).json({
      error: err?.error?.message || "Groq API error",
    });
  }

  const data = await groqRes.json();
  const text = (data.choices?.[0]?.message?.content || "").trim();

  // Strip markdown fences
  const stripped = text.replace(/^```(?:json)?|```$/gm, "").trim();

  // 1. Try direct parse
  try { return res.status(200).json(JSON.parse(stripped)); } catch {}

  // 2. Try balancing unclosed brackets (most common LLM issue)
  try {
    const balanced = balanceJSON(stripped);
    return res.status(200).json(JSON.parse(balanced));
  } catch {}

  // 3. Extract largest {...} block and balance it
  const match = stripped.match(/\{[\s\S]*/);
  if (match) {
    try {
      const balanced = balanceJSON(match[0]);
      return res.status(200).json(JSON.parse(balanced));
    } catch {}
  }

  return res.status(500).json({ error: `Could not parse response. End: ${stripped.slice(-150)}` });
}
