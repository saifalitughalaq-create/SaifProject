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

  const prompt = `Tailor this resume to the job description. Reply with ONLY a JSON object, nothing else.

BASE RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Reply with ONLY this JSON structure filled in (no markdown, no explanation):
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
          content: "You are a JSON API. You only output valid JSON. Never output text, explanations, or markdown. Your entire response must be a single JSON object starting with { and ending with }."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2048,
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
