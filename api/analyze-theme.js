export const maxDuration = 30;

function parseTheme(text) {
  const get = (key) => {
    const match = text.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    return match ? match[1].trim() : null;
  };

  return {
    id: "custom",
    name: "Custom",
    desc: "Uploaded template",
    preview: {
      bg: get("PAGE_BG") || "#ffffff",
      accent: get("ACCENT") || "#333333",
      text: get("PAGE_COLOR") || "#1a1a1a",
    },
    styles: {
      page: {
        background: get("PAGE_BG") || "#ffffff",
        color: get("PAGE_COLOR") || "#1a1a1a",
        fontFamily: get("PAGE_FONT") || "'Helvetica Neue', sans-serif",
        padding: "48px 56px",
        minHeight: "560mm",
      },
      name: {
        fontSize: get("NAME_SIZE") || "28px",
        fontWeight: get("NAME_WEIGHT") || "700",
        color: get("NAME_COLOR") || "#1a1a1a",
        letterSpacing: get("NAME_SPACING") || "0px",
        textTransform: get("NAME_TRANSFORM") || "none",
        fontStyle: get("NAME_STYLE") || "normal",
        marginBottom: "4px",
      },
      contact: {
        fontSize: get("CONTACT_SIZE") || "11px",
        color: get("CONTACT_COLOR") || "#666666",
        marginBottom: "28px",
        letterSpacing: get("CONTACT_SPACING") || "0px",
      },
      sectionTitle: {
        fontSize: get("SECTION_SIZE") || "11px",
        fontWeight: "700",
        color: get("SECTION_COLOR") || "#1a1a1a",
        textTransform: get("SECTION_TRANSFORM") || "uppercase",
        letterSpacing: get("SECTION_SPACING") || "2px",
        borderBottom: get("SECTION_BORDER") || "1px solid #cccccc",
        paddingBottom: "6px",
        marginBottom: "14px",
        marginTop: "28px",
      },
      jobTitle: {
        fontSize: get("JOB_TITLE_SIZE") || "13px",
        fontWeight: "700",
        color: get("JOB_TITLE_COLOR") || "#1a1a1a",
      },
      company: {
        fontSize: get("COMPANY_SIZE") || "12px",
        color: get("COMPANY_COLOR") || "#666666",
        fontStyle: get("COMPANY_STYLE") || "normal",
        marginBottom: "8px",
      },
      bullet: {
        fontSize: get("BULLET_SIZE") || "12px",
        color: get("BULLET_COLOR") || "#333333",
        lineHeight: "1.7",
        marginBottom: "4px",
        paddingLeft: "14px",
        position: "relative",
      },
      summary: {
        fontSize: get("SUMMARY_SIZE") || "12px",
        color: get("SUMMARY_COLOR") || "#444444",
        lineHeight: "1.8",
        fontStyle: get("SUMMARY_STYLE") || "normal",
        background: get("SUMMARY_BG") || "transparent",
        padding: get("SUMMARY_BG") ? "12px 14px" : "0",
        borderLeft: get("SUMMARY_BORDER") || "none",
      },
      skillTag: {
        background: get("SKILL_BG") || "transparent",
        color: get("SKILL_COLOR") || "#333333",
        border: get("SKILL_BORDER") || "1px solid #cccccc",
        fontSize: get("SKILL_SIZE") || "10px",
        padding: "3px 10px",
        borderRadius: get("SKILL_RADIUS") || "3px",
        letterSpacing: "0.5px",
      },
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageBase64, mimeType } = req.body;
  if (!imageBase64 || !mimeType) return res.status(400).json({ error: "Missing image data" });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const prompt = `You are analyzing a resume template image to extract its exact visual design. Output ONLY the style properties below — no explanation, no markdown.

Look carefully at:
- Background color of the page
- Text colors (name, headings, body, contact info)
- Font style (serif, sans-serif, monospace)
- Name styling (size, weight, letter spacing, all-caps or not)
- Section header style (color, size, border/underline style)
- Job title and company text style
- Bullet point text color and size
- Skill tag design (background, border, border-radius)
- Any accent/highlight color used

Output ONLY these lines (fill in each value):
PAGE_BG: [hex color]
PAGE_COLOR: [hex color]
PAGE_FONT: [font stack, e.g. Georgia, serif]
NAME_SIZE: [e.g. 30px]
NAME_COLOR: [hex color]
NAME_WEIGHT: [e.g. 700]
NAME_SPACING: [e.g. 2px]
NAME_TRANSFORM: [uppercase or none]
NAME_STYLE: [italic or normal]
CONTACT_SIZE: [e.g. 11px]
CONTACT_COLOR: [hex color]
CONTACT_SPACING: [e.g. 0px]
SECTION_SIZE: [e.g. 11px]
SECTION_COLOR: [hex color]
SECTION_BORDER: [e.g. 1px solid #333 or none]
SECTION_TRANSFORM: [uppercase or none]
SECTION_SPACING: [e.g. 2px]
JOB_TITLE_SIZE: [e.g. 13px]
JOB_TITLE_COLOR: [hex color]
COMPANY_SIZE: [e.g. 12px]
COMPANY_COLOR: [hex color]
COMPANY_STYLE: [italic or normal]
BULLET_SIZE: [e.g. 12px]
BULLET_COLOR: [hex color]
SUMMARY_SIZE: [e.g. 12px]
SUMMARY_COLOR: [hex color]
SUMMARY_STYLE: [italic or normal]
SUMMARY_BG: [hex color or leave blank if no background]
SUMMARY_BORDER: [e.g. 3px solid #color or none]
SKILL_BG: [hex color or transparent]
SKILL_COLOR: [hex color]
SKILL_BORDER: [e.g. 1px solid #color]
SKILL_SIZE: [e.g. 10px]
SKILL_RADIUS: [e.g. 4px or 0px or 20px]
ACCENT: [main accent/brand color hex]`;

  const VISION_MODELS = [
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "llama-4-scout-17b-16e-instruct",
    "meta-llama/llama-4-maverick-17b-128e-instruct",
    "llama-4-maverick-17b-128e-instruct",
    "llama-3.2-90b-vision-preview",
    "llama-3.2-11b-vision-preview",
  ];
  let data = null;
  let lastError = null;

  for (const model of VISION_MODELS) {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
            { type: "text", text: prompt },
          ],
        }],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (groqRes.ok) {
      data = await groqRes.json();
      break;
    }

    const err = await groqRes.json().catch(() => ({}));
    lastError = err?.error?.message || `Model ${model} failed`;

    // Retry on any model-availability error (rate limit, decommissioned, not found, no access)
    const isModelError = groqRes.status === 429 || groqRes.status === 404 ||
      (lastError && (
        lastError.includes("decommissioned") ||
        lastError.includes("no longer supported") ||
        lastError.includes("not found") ||
        lastError.includes("does not exist") ||
        lastError.includes("access") ||
        lastError.includes("model")
      ));
    if (!isModelError) {
      return res.status(groqRes.status).json({ error: lastError });
    }
  }

  if (!data) {
    return res.status(429).json({ error: lastError || "Vision model unavailable. Please try again." });
  }

  const text = (data.choices?.[0]?.message?.content || "").trim();
  if (!text) return res.status(500).json({ error: "No response from vision model" });

  const theme = parseTheme(text);
  return res.status(200).json(theme);
}
