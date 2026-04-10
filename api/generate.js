export const maxDuration = 60;

function parseResume(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const result = { name: "", contact: "", summary: "", skills: [], experience: [], education: [] };
  let currentSection = null;
  let currentEntry = null;

  for (const line of lines) {
    if (line.startsWith("NAME:")) { result.name = line.slice(5).trim(); }
    else if (line.startsWith("CONTACT:")) { result.contact = line.slice(8).trim(); }
    else if (line.startsWith("SUMMARY:")) { result.summary = line.slice(8).trim(); }
    else if (line.startsWith("SKILLS:")) {
      result.skills = line.slice(7).split(",").map(s => s.trim()).filter(Boolean);
    }
    else if (line.startsWith("JOB:")) {
      currentEntry = { title: "", company: "", bullets: [] };
      const parts = line.slice(4).trim().split("|");
      currentEntry.title = (parts[0] || "").trim();
      currentEntry.company = parts.slice(1).join("|").trim();
      result.experience.push(currentEntry);
      currentSection = "exp";
    }
    else if (line.startsWith("EDU:")) {
      currentEntry = { degree: "", school: "", bullets: [] };
      const parts = line.slice(4).trim().split("|");
      currentEntry.degree = (parts[0] || "").trim();
      currentEntry.school = parts.slice(1).join("|").trim();
      result.education.push(currentEntry);
      currentSection = "edu";
    }
    else if (line.startsWith("BULLET:") && currentEntry) {
      currentEntry.bullets.push(line.slice(7).trim());
    }
  }
  return result;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { resumeText, jobDescription } = req.body;
  if (!resumeText || !jobDescription) return res.status(400).json({ error: "Missing inputs" });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const prompt = `Rewrite this resume to be perfectly tailored for the job below. Use the job's exact keywords and language. Rewrite every bullet — never copy original wording.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Output ONLY in this exact format (no JSON, no markdown, no extra text):

NAME: Full Name
CONTACT: City, Province | Phone | Email | LinkedIn
SUMMARY: 3-sentence tailored summary using job keywords
SKILLS: skill1, skill2, skill3, skill4, skill5, skill6, skill7, skill8, skill9, skill10, skill11, skill12
JOB: Job Title | Company Name | Location | Start - End
BULLET: Rewritten bullet using job keywords with quantified results
BULLET: Rewritten bullet using job keywords with quantified results
BULLET: Rewritten bullet using job keywords with quantified results
BULLET: Rewritten bullet using job keywords with quantified results
BULLET: Rewritten bullet using job keywords with quantified results
BULLET: Rewritten bullet using job keywords with quantified results
(repeat JOB/BULLET blocks for each position)
EDU: Degree Name | School | Location | Year
BULLET: Education achievement relevant to job
BULLET: Education achievement relevant to job`;

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are an expert resume writer. Follow the output format exactly. Use the job description keywords in every bullet. Rewrite bullets completely — never copy original wording. Quantify achievements with numbers and percentages."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 4096,
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.json().catch(() => ({}));
    return res.status(groqRes.status).json({ error: err?.error?.message || "Groq API error" });
  }

  const data = await groqRes.json();
  const text = (data.choices?.[0]?.message?.content || "").trim();

  try {
    const parsed = parseResume(text);
    if (!parsed.name) throw new Error("Parse produced empty result");
    return res.status(200).json(parsed);
  } catch {
    return res.status(500).json({ error: `Could not parse output: ${text.slice(0, 200)}` });
  }
}
