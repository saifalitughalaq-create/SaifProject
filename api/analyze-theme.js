export const maxDuration = 30;

function parseTheme(text) {
  const get = (key) => {
    const match = text.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
    return match ? match[1].trim() : null;
  };

  const bgHex     = get("PAGE_BG")      || "#ffffff";
  const textHex   = get("PAGE_COLOR")   || "#1a1a1a";
  const accentHex = get("ACCENT")       || "#333333";

  const fontRaw = (get("FONT_TYPE") || "sans").toLowerCase();
  const fontFamily = fontRaw.includes("serif") && !fontRaw.includes("sans")
    ? "'Georgia', 'Cambria', serif"
    : fontRaw.includes("mono")
      ? "'Courier New', monospace"
      : "'Helvetica Neue', Helvetica, Arial, sans-serif";

  const nameTransform = (get("NAME_CAPS") || "no").toLowerCase() === "yes" ? "uppercase" : "none";
  const nameItalic    = (get("NAME_ITALIC") || "no").toLowerCase() === "yes" ? "italic" : "normal";
  const nameCentered  = (get("NAME_CENTERED") || "no").toLowerCase() === "yes";
  const sectionStyle  = (get("SECTION_DIVIDER") || "underline").toLowerCase();
  const skillStyle    = (get("SKILL_STYLE") || "box").toLowerCase();
  const hasSidebar    = (get("HAS_SIDEBAR") || "no").toLowerCase() === "yes";
  const sidebarColor  = get("SIDEBAR_COLOR") || accentHex;

  const a40 = accentHex + "66";
  const a20 = accentHex + "33";

  // Section title border based on detected style
  const sectionBorderBottom = sectionStyle === "underline" ? `1px solid ${a40}`
    : sectionStyle === "thick" ? `2px solid ${accentHex}`
    : sectionStyle === "colored" ? `2px solid ${accentHex}`
    : "none";
  const sectionBorderLeft = sectionStyle === "leftbar" ? `3px solid ${accentHex}` : "none";
  const sectionPaddingLeft = sectionStyle === "leftbar" ? "10px" : "0";

  // Skill tag style
  const skillBg     = skillStyle === "filled" ? accentHex
    : skillStyle === "pill" || skillStyle === "box" ? a20
    : "transparent";
  const skillColor  = skillStyle === "filled" ? "#ffffff" : accentHex;
  const skillBorder = skillStyle === "plain" ? "none" : `1px solid ${a40}`;
  const skillRadius = skillStyle === "pill" ? "20px" : skillStyle === "filled" ? "3px" : "3px";

  const isDark = (() => {
    const r = parseInt(bgHex.slice(1,3),16), g = parseInt(bgHex.slice(3,5),16), b = parseInt(bgHex.slice(5,7),16);
    return (0.299*r + 0.587*g + 0.114*b)/255 < 0.4;
  })();

  return {
    id: "custom",
    name: "Custom",
    desc: "Matched from your template",
    preview: { bg: bgHex, accent: accentHex, text: textHex },
    styles: {
      page: {
        background: bgHex, color: textHex, fontFamily,
        padding: hasSidebar ? "0" : "48px 56px",
        minHeight: "560mm",
        display: hasSidebar ? "flex" : "block",
      },
      ...(hasSidebar ? {
        sidebar: { background: sidebarColor, width: "200px", minHeight: "560mm", padding: "48px 24px", flexShrink: 0 },
        main: { flex: 1, padding: "48px 40px" },
      } : {}),
      name: {
        fontSize: get("NAME_SIZE") || "30px",
        fontWeight: get("NAME_WEIGHT") || "700",
        color: accentHex,
        letterSpacing: nameTransform === "uppercase" ? "3px" : "0px",
        textTransform: nameTransform,
        fontStyle: nameItalic,
        textAlign: nameCentered ? "center" : "left",
        marginBottom: "4px",
      },
      contact: {
        fontSize: "11px",
        color: textHex + "99",
        letterSpacing: "0.5px",
        marginBottom: "28px",
        textAlign: nameCentered ? "center" : "left",
      },
      sectionTitle: {
        fontSize: "10px", fontWeight: "700", color: accentHex,
        textTransform: "uppercase", letterSpacing: "2px",
        borderBottom: sectionBorderBottom,
        borderLeft: sectionBorderLeft,
        paddingLeft: sectionPaddingLeft,
        paddingBottom: sectionStyle !== "none" ? "5px" : "0",
        marginBottom: "12px", marginTop: "26px",
      },
      jobTitle: { fontSize: "13px", fontWeight: "700", color: textHex },
      company:  { fontSize: "12px", color: textHex + "99", fontStyle: "italic", marginBottom: "6px" },
      bullet:   { fontSize: "12px", color: isDark ? "#c8c0b0" : "#444444", lineHeight: "1.7", marginBottom: "4px", paddingLeft: "14px", position: "relative" },
      summary:  { fontSize: "12px", color: isDark ? "#c8c0b0" : "#555555", lineHeight: "1.8" },
      skillTag: { background: skillBg, color: skillColor, border: skillBorder, fontSize: "10px", padding: "3px 10px", borderRadius: skillRadius, letterSpacing: "0.5px" },
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { imageBase64, mimeType } = req.body;
  if (!imageBase64 || !mimeType) return res.status(400).json({ error: "Missing image data" });

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey === "your_key_here") {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured in Vercel environment variables" });
  }

  const prompt = `You are analyzing a resume template image. Extract its exact visual design. Output ONLY these lines — no explanation, no markdown:

PAGE_BG: [hex color of page background]
PAGE_COLOR: [hex color of main body text]
ACCENT: [hex color used for name, section titles, or highlights]
FONT_TYPE: [serif | sans-serif | monospace]
NAME_SIZE: [e.g. 32px]
NAME_WEIGHT: [700 or 400]
NAME_CAPS: [yes | no — is the name in ALL CAPS?]
NAME_ITALIC: [yes | no]
NAME_CENTERED: [yes | no]
SECTION_DIVIDER: [underline | leftbar | thick | colored | none — how are section titles divided?]
SKILL_STYLE: [pill | box | filled | plain — shape of skill tags]
HAS_SIDEBAR: [yes | no — does it have a colored left column?]
SIDEBAR_COLOR: [hex color of sidebar if present, else leave blank]`;

  const MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-latest"];

  for (const model of MODELS) {
    try {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mimeType, data: imageBase64 } },
                { text: prompt },
              ],
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
          }),
        }
      );

      if (!geminiRes.ok) {
        const err = await geminiRes.json().catch(() => ({}));
        const msg = err?.error?.message || "";
        // Try next model on quota or not-found errors
        if (geminiRes.status === 429 || geminiRes.status === 404 || msg.includes("not found") || msg.includes("quota")) continue;
        return res.status(geminiRes.status).json({ error: msg || "Gemini error" });
      }

      const data = await geminiRes.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (!text) continue;

      const theme = parseTheme(text);
      return res.status(200).json(theme);

    } catch {
      continue;
    }
  }

  return res.status(500).json({ error: "All Gemini models failed. Check your GEMINI_API_KEY in Vercel." });
}
