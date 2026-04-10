export const maxDuration = 60;

// Fix 1: Replace literal newlines/tabs inside JSON strings (LLM commonly does this)
// Fix 2: Balance unclosed brackets/braces
function fixJSON(raw) {
  let result = "";
  let inString = false;
  let escape = false;
  const stack = [];

  for (const ch of raw) {
    if (escape) {
      result += ch;
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      result += ch;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }
    if (inString) {
      // Escape literal control characters inside strings
      if (ch === "\n") { result += "\\n"; continue; }
      if (ch === "\r") { result += "\\r"; continue; }
      if (ch === "\t") { result += "\\t"; continue; }
      result += ch;
      continue;
    }
    // Outside strings — track brackets
    if (ch === "{") { stack.push("}"); result += ch; }
    else if (ch === "[") { stack.push("]"); result += ch; }
    else if (ch === "}" || ch === "]") { stack.pop(); result += ch; }
    else { result += ch; }
  }

  // Close any unclosed string
  if (inString) result += '"';
  // Close any unclosed brackets
  result += stack.reverse().join("");
  return result;
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

Rules: tailor summary to this role (3 sentences), rewrite every bullet using job keywords, quantify achievements with numbers/%, 14 skills, 6-7 bullets per role, 2-3 bullets for education, no em dashes.

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
          content: `You are an expert resume writer and a JSON API. Output ONLY a valid JSON object — no markdown, no explanation, no text outside the JSON. Never use literal newlines inside JSON string values.

Transform the resume to match the job description:
- Extract keywords and skills from the job description
- Rewrite EVERY bullet using those exact keywords — never copy original wording
- Rewrite summary to target this specific role
- Quantify results with numbers, %, $ wherever possible
- Make candidate look like a perfect match for this job`,
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

  // 1. Direct parse
  try { return res.status(200).json(JSON.parse(stripped)); } catch {}

  // 2. Fix literal newlines in strings + balance brackets, then parse
  try {
    const fixed = fixJSON(stripped);
    return res.status(200).json(JSON.parse(fixed));
  } catch {}

  // 3. Find the JSON start, fix, and parse
  const jsonStart = stripped.indexOf("{");
  if (jsonStart !== -1) {
    try {
      const fixed = fixJSON(stripped.slice(jsonStart));
      return res.status(200).json(JSON.parse(fixed));
    } catch {}
  }

  return res.status(500).json({ error: `Could not parse. End: ${stripped.slice(-100)}` });
}
