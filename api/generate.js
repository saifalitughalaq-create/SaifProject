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

  const prompt = `You are a professional resume writer. Rewrite the candidate's resume to be STRONGLY tailored to the job description below. Do NOT copy bullets verbatim — rewrite and reframe every bullet to mirror the job description's language, keywords, and priorities. The result must read like it was written specifically for this job.

BASE RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

INSTRUCTIONS:
- Rewrite the professional summary to directly target this specific role and company
- Rewrite every bullet point to use keywords and phrases from the job description
- Quantify achievements with numbers/percentages wherever possible
- Add extra bullets to each role (7-8 bullets per job) to fill a 2-page resume
- Include 12-15 skills that match the job description requirements
- If the job mentions specific tools, software, or methodologies — include them if the candidate has relevant experience
- No em dashes, no fluff, every word must add value

Reply with ONLY this JSON structure filled in (no markdown, no explanation, no extra text):
{"name":"","contact":"","summary":"","skills":["","","","","","","","","","","",""],"experience":[{"title":"","company":"","bullets":["","","","","","","",""]}],"education":[{"degree":"","school":"","bullets":["",""]}]}`;

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
          content: "You are a JSON API. You only output valid JSON. Never output text, explanations, or markdown. Your entire response must be a single JSON object starting with { and ending with }."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 8192,
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

  // Try direct parse first
  try {
    const result = JSON.parse(text);
    return res.status(200).json(result);
  } catch {}

  // Strip markdown fences and try again
  const stripped = text.replace(/^```(?:json)?|```$/gm, "").trim();
  try {
    const result = JSON.parse(stripped);
    return res.status(200).json(result);
  } catch {}

  // Extract first {...} block and try
  const match = stripped.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const result = JSON.parse(match[0]);
      return res.status(200).json(result);
    } catch {}
  }

  return res.status(500).json({ error: `Model returned: ${text.slice(0, 300)}` });
}
