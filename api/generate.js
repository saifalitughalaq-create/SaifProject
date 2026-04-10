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

  const prompt = `You are rewriting this resume to perfectly match the job description below.

RULES:
- Use the job description's exact keywords and phrases throughout
- Rewrite EVERY bullet point — never copy original wording
- Each bullet must start with a strong action verb and include numbers/percentages where possible
- The summary must reflect this specific role
- Skills must include terms from the job description
- Output ONLY in the exact format below — no markdown, no code blocks, no extra text

OUTPUT FORMAT (copy exactly, fill in the values):
NAME: [full name]
CONTACT: [city, province | phone | email | linkedin]
SUMMARY: [3 sentences tailored to this job using its exact keywords]
SKILLS: [skill1, skill2, skill3, skill4, skill5, skill6, skill7, skill8, skill9, skill10, skill11, skill12]
JOB: [title] | [company] | [location] | [dates]
BULLET: [rewritten bullet with job keywords and metric]
BULLET: [rewritten bullet with job keywords and metric]
BULLET: [rewritten bullet with job keywords and metric]
BULLET: [rewritten bullet with job keywords and metric]
BULLET: [rewritten bullet with job keywords and metric]
BULLET: [rewritten bullet with job keywords and metric]
(repeat JOB + BULLET blocks for every position in the original resume)
EDU: [degree] | [school] | [location] | [year]
BULLET: [relevant academic achievement]
BULLET: [relevant academic achievement]

---
RESUME:
${resumeText}

---
JOB DESCRIPTION:
${jobDescription}`;

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert resume writer. Output ONLY plain text in the exact format requested — no markdown, no code blocks, no preamble, no commentary. Start your response with NAME: on the first line."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 8192,
    }),
  });

  if (!groqRes.ok) {
    const err = await groqRes.json().catch(() => ({}));
    return res.status(groqRes.status).json({ error: err?.error?.message || "Groq API error" });
  }

  const data = await groqRes.json();
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
