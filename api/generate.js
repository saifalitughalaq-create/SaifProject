export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { resumeText, jobDescription } = req.body;

  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: "Missing resumeText or jobDescription" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
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

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
      }),
    }
  );

  if (!geminiRes.ok) {
    const err = await geminiRes.json().catch(() => ({}));
    return res.status(geminiRes.status).json({
      error: err?.error?.message || "Gemini API error",
    });
  }

  const data = await geminiRes.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const clean = text.replace(/```json|```/g, "").trim();

  try {
    const result = JSON.parse(clean);
    return res.status(200).json(result);
  } catch {
    return res.status(500).json({ error: "Failed to parse AI response" });
  }
}
