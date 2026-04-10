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

  const prompt = `You are an expert resume writer. Analyze this resume and job description, then generate a perfectly tailored resume.

BASE RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Generate a tailored resume as a JSON object with this exact structure:
{
  "name": "Full Name",
  "contact": "City, Province | Phone | Email | LinkedIn",
  "summary": "2-3 sentence professional summary tailored to the job",
  "skills": ["skill1", "skill2", "skill3", "skill4", "skill5", "skill6", "skill7", "skill8"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name | Location | Dates",
      "bullets": ["bullet1", "bullet2", "bullet3", "bullet4", "bullet5"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "school": "School Name | Location | Dates",
      "bullets": ["bullet1", "bullet2"]
    }
  ]
}

Rules:
- Mirror the job description language in bullets
- Quantify achievements where possible
- Keep bullets concise and impactful
- No em dashes
- Return ONLY the JSON, no other text`;

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.json().catch(() => ({}));
    return res.status(groqRes.status).json({
      error: err?.error?.message || "Groq API error",
    });
  }

  const data = await groqRes.json();
  const text = data.choices?.[0]?.message?.content || "";

  // Strip markdown fences if present, then extract first JSON object
  const stripped = text.replace(/```json|```/g, "").trim();
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) {
    return res.status(500).json({ error: "No JSON found in AI response" });
  }

  try {
    const result = JSON.parse(match[0]);
    return res.status(200).json(result);
  } catch {
    return res.status(500).json({ error: "Failed to parse AI response" });
  }
}
