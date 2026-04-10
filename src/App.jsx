import { useState, useRef, useCallback } from "react";
import mammoth from "mammoth";

const THEMES = [
  {
    id: "executive",
    name: "Executive",
    desc: "Dark navy, gold accents",
    preview: { bg: "#0f1923", accent: "#c9a84c", text: "#e8e0d0" },
    styles: {
      page: { background: "#0f1923", color: "#e8e0d0", fontFamily: "'Georgia', serif", padding: "48px 56px", minHeight: "560mm" },
      name: { fontSize: "32px", fontWeight: "700", color: "#c9a84c", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "4px" },
      contact: { fontSize: "11px", color: "#9a8f7e", letterSpacing: "1.5px", marginBottom: "32px", textTransform: "uppercase" },
      sectionTitle: { fontSize: "10px", fontWeight: "700", color: "#c9a84c", letterSpacing: "3px", textTransform: "uppercase", borderBottom: "1px solid #c9a84c33", paddingBottom: "6px", marginBottom: "14px", marginTop: "28px" },
      jobTitle: { fontSize: "14px", fontWeight: "700", color: "#e8e0d0" },
      company: { fontSize: "12px", color: "#9a8f7e", fontStyle: "italic", marginBottom: "8px" },
      bullet: { fontSize: "12px", color: "#c8c0b0", lineHeight: "1.7", marginBottom: "4px", paddingLeft: "14px", position: "relative" },
      summary: { fontSize: "13px", color: "#c8c0b0", lineHeight: "1.8", fontStyle: "italic" },
      skillTag: { background: "#c9a84c22", border: "1px solid #c9a84c44", color: "#c9a84c", fontSize: "10px", padding: "3px 10px", borderRadius: "2px", letterSpacing: "1px" },
    },
  },
  {
    id: "minimal",
    name: "Minimalist",
    desc: "Stark white, pure typography",
    preview: { bg: "#ffffff", accent: "#111111", text: "#333333" },
    styles: {
      page: { background: "#ffffff", color: "#1a1a1a", fontFamily: "'Helvetica Neue', Helvetica, sans-serif", padding: "48px 56px", minHeight: "560mm" },
      name: { fontSize: "28px", fontWeight: "300", color: "#111111", letterSpacing: "6px", textTransform: "uppercase", marginBottom: "4px" },
      contact: { fontSize: "11px", color: "#888888", letterSpacing: "1px", marginBottom: "36px" },
      sectionTitle: { fontSize: "9px", fontWeight: "700", color: "#111111", letterSpacing: "4px", textTransform: "uppercase", borderBottom: "0.5px solid #111111", paddingBottom: "6px", marginBottom: "16px", marginTop: "28px" },
      jobTitle: { fontSize: "13px", fontWeight: "600", color: "#111111" },
      company: { fontSize: "11px", color: "#888888", marginBottom: "8px" },
      bullet: { fontSize: "12px", color: "#444444", lineHeight: "1.75", marginBottom: "4px", paddingLeft: "12px", position: "relative" },
      summary: { fontSize: "12px", color: "#555555", lineHeight: "1.8" },
      skillTag: { background: "transparent", border: "0.5px solid #111111", color: "#111111", fontSize: "9px", padding: "3px 10px", borderRadius: "0px", letterSpacing: "1.5px" },
    },
  },
  {
    id: "corporate",
    name: "Corporate",
    desc: "Classic blue, structured",
    preview: { bg: "#f5f7fb", accent: "#1e4d8c", text: "#2d2d2d" },
    styles: {
      page: { background: "#f5f7fb", color: "#2d2d2d", fontFamily: "'Cambria', Georgia, serif", padding: "48px 56px", minHeight: "560mm" },
      name: { fontSize: "30px", fontWeight: "700", color: "#1e4d8c", marginBottom: "4px" },
      contact: { fontSize: "11px", color: "#666666", marginBottom: "28px", borderBottom: "2px solid #1e4d8c", paddingBottom: "16px" },
      sectionTitle: { fontSize: "12px", fontWeight: "700", color: "#1e4d8c", textTransform: "uppercase", letterSpacing: "1.5px", borderLeft: "3px solid #1e4d8c", paddingLeft: "10px", marginBottom: "14px", marginTop: "24px" },
      jobTitle: { fontSize: "14px", fontWeight: "700", color: "#1e4d8c" },
      company: { fontSize: "12px", color: "#555555", fontStyle: "italic", marginBottom: "8px" },
      bullet: { fontSize: "12px", color: "#3d3d3d", lineHeight: "1.7", marginBottom: "5px", paddingLeft: "16px", position: "relative" },
      summary: { fontSize: "13px", color: "#3d3d3d", lineHeight: "1.8", background: "#e8eef7", padding: "14px 16px", borderLeft: "3px solid #1e4d8c" },
      skillTag: { background: "#1e4d8c", color: "#ffffff", fontSize: "10px", padding: "3px 10px", borderRadius: "3px", letterSpacing: "0.5px" },
    },
  },
  {
    id: "contemporary",
    name: "Contemporary",
    desc: "Warm slate, modern",
    preview: { bg: "#faf9f7", accent: "#d4614a", text: "#2c2825" },
    styles: {
      page: { background: "#faf9f7", color: "#2c2825", fontFamily: "'Palatino Linotype', Palatino, serif", padding: "48px 56px", minHeight: "560mm" },
      name: { fontSize: "34px", fontWeight: "700", color: "#2c2825", marginBottom: "2px", letterSpacing: "-0.5px" },
      contact: { fontSize: "11px", color: "#9a8e85", marginBottom: "32px" },
      sectionTitle: { fontSize: "10px", fontWeight: "700", color: "#d4614a", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "14px", marginTop: "28px" },
      jobTitle: { fontSize: "14px", fontWeight: "700", color: "#2c2825" },
      company: { fontSize: "12px", color: "#d4614a", marginBottom: "8px" },
      bullet: { fontSize: "12px", color: "#4a4240", lineHeight: "1.75", marginBottom: "5px", paddingLeft: "14px", position: "relative" },
      summary: { fontSize: "13px", color: "#4a4240", lineHeight: "1.9", borderTop: "2px solid #d4614a", paddingTop: "14px" },
      skillTag: { background: "#d4614a18", border: "1px solid #d4614a44", color: "#d4614a", fontSize: "10px", padding: "4px 12px", borderRadius: "20px", letterSpacing: "0.5px" },
    },
  },
  {
    id: "tech",
    name: "Tech Dark",
    desc: "Charcoal, cyan accents",
    preview: { bg: "#1a1d23", accent: "#00d4aa", text: "#e0e6f0" },
    styles: {
      page: { background: "#1a1d23", color: "#e0e6f0", fontFamily: "'Courier New', monospace", padding: "48px 56px", minHeight: "560mm" },
      name: { fontSize: "26px", fontWeight: "700", color: "#00d4aa", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "4px" },
      contact: { fontSize: "11px", color: "#6b7a8d", letterSpacing: "1px", marginBottom: "32px" },
      sectionTitle: { fontSize: "10px", fontWeight: "700", color: "#00d4aa", letterSpacing: "3px", textTransform: "uppercase", borderBottom: "1px solid #00d4aa33", paddingBottom: "6px", marginBottom: "14px", marginTop: "28px" },
      jobTitle: { fontSize: "13px", fontWeight: "700", color: "#e0e6f0" },
      company: { fontSize: "11px", color: "#00d4aa88", marginBottom: "8px" },
      bullet: { fontSize: "11px", color: "#b0bac8", lineHeight: "1.8", marginBottom: "4px", paddingLeft: "16px", position: "relative" },
      summary: { fontSize: "12px", color: "#b0bac8", lineHeight: "1.8", background: "#00d4aa0d", padding: "14px 16px", borderLeft: "2px solid #00d4aa" },
      skillTag: { background: "#00d4aa18", border: "1px solid #00d4aa55", color: "#00d4aa", fontSize: "10px", padding: "3px 10px", borderRadius: "4px", fontFamily: "'Courier New', monospace", letterSpacing: "1px" },
    },
  },
  {
    id: "elegant",
    name: "Elegant",
    desc: "Cream, forest green",
    preview: { bg: "#f8f4ed", accent: "#2d5a3d", text: "#1a1a15" },
    styles: {
      page: { background: "#f8f4ed", color: "#1a1a15", fontFamily: "'Garamond', 'EB Garamond', Georgia, serif", padding: "48px 56px", minHeight: "560mm" },
      name: { fontSize: "36px", fontWeight: "400", color: "#1a1a15", letterSpacing: "1px", marginBottom: "4px", fontStyle: "italic" },
      contact: { fontSize: "11px", color: "#7a7060", letterSpacing: "0.5px", marginBottom: "32px" },
      sectionTitle: { fontSize: "10px", fontWeight: "700", color: "#2d5a3d", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "14px", marginTop: "28px", borderBottom: "1px solid #2d5a3d55", paddingBottom: "6px" },
      jobTitle: { fontSize: "15px", fontWeight: "600", color: "#1a1a15" },
      company: { fontSize: "12px", color: "#2d5a3d", fontStyle: "italic", marginBottom: "8px" },
      bullet: { fontSize: "13px", color: "#3a3830", lineHeight: "1.75", marginBottom: "5px", paddingLeft: "14px", position: "relative" },
      summary: { fontSize: "13px", color: "#3a3830", lineHeight: "1.9", fontStyle: "italic" },
      skillTag: { background: "#2d5a3d18", border: "1px solid #2d5a3d44", color: "#2d5a3d", fontSize: "10px", padding: "4px 12px", borderRadius: "2px", letterSpacing: "1px" },
    },
  },
];

const STEPS = ["Resume", "Job Description", "Theme", "Generate"];

const generateResume = async (resumeText, jobDescription) => {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText, jobDescription }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error || `Server error ${response.status}`);
  }

  return response.json();
};

const ResumePreview = ({ data, theme }) => {
  const s = theme.styles;
  return (
    <div style={s.page} id="resume-output">
      <div style={s.name}>{data.name}</div>
      <div style={s.contact}>{data.contact}</div>

      <div style={s.sectionTitle}>Professional Summary</div>
      <div style={s.summary}>{data.summary}</div>

      <div style={s.sectionTitle}>Key Skills</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "4px" }}>
        {data.skills.map((sk, i) => (
          <span key={i} style={s.skillTag}>{sk}</span>
        ))}
      </div>

      <div style={s.sectionTitle}>Professional Experience</div>
      {data.experience.map((job, i) => (
        <div key={i} style={{ marginBottom: "22px" }}>
          <div style={s.jobTitle}>{job.title}</div>
          <div style={s.company}>{job.company}</div>
          {job.bullets.map((b, j) => (
            <div key={j} style={{ ...s.bullet, marginBottom: "6px" }}>
              <span style={{ position: "absolute", left: "0", color: theme.preview.accent }}>•</span>
              {b}
            </div>
          ))}
        </div>
      ))}

      <div style={s.sectionTitle}>Education</div>
      {data.education.map((edu, i) => (
        <div key={i} style={{ marginBottom: "16px" }}>
          <div style={s.jobTitle}>{edu.degree}</div>
          <div style={s.company}>{edu.school}</div>
          {edu.bullets.map((b, j) => (
            <div key={j} style={{ ...s.bullet, marginBottom: "6px" }}>
              <span style={{ position: "absolute", left: "0", color: theme.preview.accent }}>•</span>
              {b}
            </div>
          ))}
        </div>
      ))}

      <div style={{ marginTop: "40px", textAlign: "center", fontSize: "10px", color: theme.preview.accent + "66", letterSpacing: "2px" }}>
        REFERENCES AVAILABLE UPON REQUEST
      </div>
    </div>
  );
};

export default function App() {
  const [step, setStep] = useState(0);
  const [resumeText, setResumeText] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [customTheme, setCustomTheme] = useState(null);
  const [customThemePreview, setCustomThemePreview] = useState(null);
  const [customThemeLoading, setCustomThemeLoading] = useState(false);
  const [customThemeError, setCustomThemeError] = useState(null);
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();
  const themeFileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "docx") {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setResumeText(result.value);
    } else if (ext === "pdf") {
      setResumeText("");
      setError("PDF upload is not supported. Please copy-paste your resume text into the box below.");
    } else {
      const reader = new FileReader();
      reader.onload = (e) => setResumeText(e.target.result);
      reader.readAsText(file);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const buildThemeFromColors = (bgHex, textHex, accentHex) => {
    const toRgb = h => ({ r: parseInt(h.slice(1,3),16), g: parseInt(h.slice(3,5),16), b: parseInt(h.slice(5,7),16) });
    const lum = ({r,g,b}) => (0.299*r + 0.587*g + 0.114*b)/255;
    const acc = toRgb(accentHex);
    const isDark = lum(toRgb(bgHex)) < 0.4;
    const hue = Math.atan2(Math.sqrt(3)*(acc.g-acc.b), 2*acc.r-acc.g-acc.b)*180/Math.PI;
    const isWarm = hue > -30 && hue < 90;
    const font = isWarm ? "'Georgia', serif" : "'Helvetica Neue', Helvetica, sans-serif";
    const muted = textHex + "99";
    const a38 = accentHex + "38";
    const a70 = accentHex + "70";
    const bodyText = isDark ? "#c8c0b0" : "#444444";
    return {
      id: "custom", name: "Custom", desc: "Matched from your image",
      preview: { bg: bgHex, accent: accentHex, text: textHex },
      styles: {
        page: { background: bgHex, color: textHex, fontFamily: font, padding: "48px 56px", minHeight: "560mm" },
        name: { fontSize: "30px", fontWeight: "700", color: accentHex, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px" },
        contact: { fontSize: "11px", color: muted, letterSpacing: "1px", marginBottom: "28px" },
        sectionTitle: { fontSize: "10px", fontWeight: "700", color: accentHex, letterSpacing: "3px", textTransform: "uppercase", borderBottom: `1px solid ${a70}`, paddingBottom: "6px", marginBottom: "14px", marginTop: "28px" },
        jobTitle: { fontSize: "14px", fontWeight: "700", color: textHex },
        company: { fontSize: "12px", color: muted, fontStyle: "italic", marginBottom: "8px" },
        bullet: { fontSize: "12px", color: bodyText, lineHeight: "1.7", marginBottom: "4px", paddingLeft: "14px", position: "relative" },
        summary: { fontSize: "13px", color: bodyText, lineHeight: "1.8" },
        skillTag: { background: a38, border: `1px solid ${a70}`, color: accentHex, fontSize: "10px", padding: "3px 10px", borderRadius: "3px", letterSpacing: "0.5px" },
      },
    };
  };

  const extractThemeFromImage = (file) => new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const SIZE = 300;
        const canvas = document.createElement("canvas");
        const scale = Math.min(SIZE / img.width, SIZE / img.height);
        const W = Math.floor(img.width * scale);
        const H = Math.floor(img.height * scale);
        canvas.width = W; canvas.height = H;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, W, H);

        const toHex = (r,g,b) => "#"+[r,g,b].map(v=>v.toString(16).padStart(2,"0")).join("");
        const lum = (r,g,b) => (0.299*r+0.587*g+0.114*b)/255;
        const sat = (r,g,b) => { const mx=Math.max(r,g,b),mn=Math.min(r,g,b); return mx===0?0:(mx-mn)/mx; };

        const getBuckets = (imageData) => {
          const bk = {};
          for (let i=0; i<imageData.data.length; i+=4) {
            if (imageData.data[i+3]<128) continue;
            const r=Math.round(imageData.data[i]/8)*8,
                  g=Math.round(imageData.data[i+1]/8)*8,
                  b=Math.round(imageData.data[i+2]/8)*8;
            const k=`${r},${g},${b}`; bk[k]=(bk[k]||0)+1;
          }
          return Object.entries(bk)
            .map(([k,count])=>{ const [r,g,b]=k.split(",").map(Number); return {r,g,b,count,lum:lum(r,g,b),sat:sat(r,g,b)}; })
            .sort((a,b)=>b.count-a.count);
        };

        // Sample full image for bg + text
        const allEntries = getBuckets(ctx.getImageData(0, 0, W, H));
        // Sample top 30% of image — this is where name/header accent usually lives
        const headerEntries = getBuckets(ctx.getImageData(0, 0, W, Math.floor(H*0.3)));
        // Sample left 20% strip — often a sidebar with accent color
        const sideEntries = getBuckets(ctx.getImageData(0, 0, Math.floor(W*0.2), H));

        const bg = allEntries.find(c=>c.lum>0.80) || {r:255,g:255,b:255};
        const textCol = allEntries.find(c=>c.lum<0.22) || {r:30,g:30,b:30};

        // Look for accent in header first, then sidebar, then full image
        const findAccent = (entries) => {
          const cands = entries.filter(c=>c.sat>0.2&&c.lum>0.08&&c.lum<0.9&&c.count>2);
          return cands.sort((a,b)=>(b.sat*Math.sqrt(b.count))-(a.sat*Math.sqrt(a.count)))[0];
        };
        const accent = findAccent(headerEntries) || findAccent(sideEntries) || findAccent(allEntries) || {r:50,g:80,b:160};

        resolve(buildThemeFromColors(toHex(bg.r,bg.g,bg.b), toHex(textCol.r,textCol.g,textCol.b), toHex(accent.r,accent.g,accent.b)));
      } catch(e) { reject(e); }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = url;
  });

  const handleThemeUpload = async (file) => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setCustomThemeError("Please upload a JPG, PNG, or WebP image.");
      return;
    }
    setCustomThemeLoading(true);
    setCustomThemeError(null);
    setCustomThemePreview(URL.createObjectURL(file));

    // Try Gemini vision API first (full analysis: fonts, layout, dividers, etc.)
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = e => resolve(e.target.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/analyze-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });

      if (res.ok) {
        const theme = await res.json();
        setCustomTheme(theme);
        setSelectedTheme(theme);
        setCustomThemeLoading(false);
        return;
      }
    } catch {}

    // Fallback: Canvas color extraction (colors only)
    try {
      const theme = await extractThemeFromImage(file);
      setCustomTheme(theme);
      setSelectedTheme(theme);
      setCustomThemeError("Colors matched. For full font/layout matching, add GEMINI_API_KEY to Vercel.");
    } catch {
      setCustomThemeError("Could not read the image. Try a clearer screenshot.");
    }
    setCustomThemeLoading(false);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateResume(resumeText, jobDesc);
      setGenerated(result);
      setStep(4);
    } catch (err) {
      setError(err.message || "Generation failed. Please try again.");
    }
    setLoading(false);
  };

  const handlePrint = () => window.print();

  const canNext = () => {
    if (step === 0) return resumeText.trim().length > 50;
    if (step === 1) return jobDesc.trim().length > 50;
    return true;
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f4f5f7", fontFamily: "'Helvetica Neue', Helvetica, sans-serif", color: "#1a1a1a" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #eee; }
        ::-webkit-scrollbar-thumb { background: #ccc; }
        .btn-primary {
          background: #1a1a1a; color: #fff; border: none;
          padding: 11px 28px; border-radius: 6px; font-size: 13px;
          font-weight: 600; cursor: pointer; letter-spacing: 0.3px;
          transition: opacity 0.15s;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.8; }
        .btn-primary:disabled { opacity: 0.35; cursor: not-allowed; }
        .btn-ghost {
          background: transparent; color: #555; border: 1px solid #d0d0d0;
          padding: 10px 22px; border-radius: 6px; font-size: 13px;
          cursor: pointer; transition: border-color 0.15s, color 0.15s;
        }
        .btn-ghost:hover { border-color: #888; color: #1a1a1a; }
        .theme-card {
          border: 1.5px solid #e0e0e0; border-radius: 10px;
          padding: 14px; cursor: pointer; transition: border-color 0.15s;
          background: #fff;
        }
        .theme-card:hover { border-color: #888; }
        .theme-card.selected { border-color: #1a1a1a; }
        textarea, input[type="password"], input[type="text"] {
          width: 100%; background: #fff; border: 1px solid #d8d8d8;
          color: #1a1a1a; padding: 14px; border-radius: 6px;
          font-size: 13px; line-height: 1.7; outline: none;
          font-family: inherit; transition: border-color 0.15s;
        }
        textarea:focus, input[type="password"]:focus, input[type="text"]:focus { border-color: #888; }
        .spinner {
          width: 32px; height: 32px; border: 2.5px solid #e0e0e0;
          border-top-color: #1a1a1a; border-radius: 50%;
          animation: spin 0.8s linear infinite; margin: 0 auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media print {
          body > * { display: none !important; }
          #resume-output {
            display: block !important;
            position: absolute; top: 0; left: 0;
            width: 210mm; min-height: 560mm;
            padding: 18mm 20mm !important;
            font-size: 11pt !important;
            box-sizing: border-box;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #e4e4e4", background: "#fff", padding: "0 32px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontWeight: "700", fontSize: "16px", letterSpacing: "-0.3px" }}>Resume Tailor</span>
            <span style={{ fontSize: "12px", color: "#888", letterSpacing: "0.2px" }}>AI-powered</span>
          </div>
          {step > 0 && step < 4 && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{
                    width: "24px", height: "24px", borderRadius: "50%", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "600",
                    background: i < step ? "#1a1a1a" : i === step ? "#1a1a1a" : "#e8e8e8",
                    color: i <= step ? "#fff" : "#999",
                  }}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ width: "20px", height: "1px", background: i < step ? "#1a1a1a" : "#e0e0e0" }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: step === 4 ? "860px" : "640px", margin: "0 auto", padding: "40px 24px 80px" }}>


        {/* STEP 0: Upload Resume */}
        {step === 0 && (
          <div className="fade-in">
            <h1 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "6px" }}>Upload Your Resume</h1>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "28px" }}>Upload a text file or paste your resume content below.</p>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current.click()}
              style={{
                border: `1.5px dashed ${dragOver ? "#555" : "#d0d0d0"}`,
                borderRadius: "8px", padding: "32px", textAlign: "center",
                cursor: "pointer", background: dragOver ? "#f8f8f8" : "#fff",
                transition: "all 0.15s", marginBottom: "20px",
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "10px" }}>📄</div>
              <div style={{ color: "#555", fontSize: "13px", marginBottom: "4px" }}>
                Drop file here or <span style={{ textDecoration: "underline" }}>click to browse</span>
              </div>
              <div style={{ color: "#aaa", fontSize: "11px" }}>Supports .txt, .pdf, .docx</div>
              <input ref={fileRef} type="file" accept=".txt,.pdf,.docx" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
            </div>

            <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>Or paste your resume text:</div>
            <textarea rows={14} value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="Paste your full resume here..." />

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button className="btn-primary" onClick={() => setStep(1)} disabled={!canNext()}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Job Description */}
        {step === 1 && (
          <div className="fade-in">
            <h1 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "6px" }}>Job Description</h1>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "28px" }}>Paste the full posting — responsibilities, qualifications, requirements.</p>

            <textarea rows={18} value={jobDesc} onChange={(e) => setJobDesc(e.target.value)} placeholder="Paste the full job description here..." />

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px" }}>
              <button className="btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button className="btn-primary" onClick={() => setStep(2)} disabled={!canNext()}>Continue →</button>
            </div>
          </div>
        )}

        {/* STEP 2: Choose Theme */}
        {step === 2 && (
          <div className="fade-in">
            <h1 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "6px" }}>Choose a Theme</h1>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "24px" }}>Pick a preset style or upload any resume image to match its exact design.</p>

            {/* Custom theme upload */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#444", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Upload a template
              </div>
              <div
                onClick={() => themeFileRef.current.click()}
                style={{
                  border: `1.5px dashed ${selectedTheme.id === "custom" ? "#1a1a1a" : "#d0d0d0"}`,
                  borderRadius: "8px", padding: "18px 20px", cursor: "pointer",
                  background: selectedTheme.id === "custom" ? "#f8f8f8" : "#fff",
                  display: "flex", alignItems: "center", gap: "16px",
                  transition: "all 0.15s",
                }}
              >
                {customThemePreview ? (
                  <img src={customThemePreview} alt="Template preview" style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "4px", flexShrink: 0, border: "1px solid #e0e0e0" }} />
                ) : (
                  <div style={{ width: "72px", height: "72px", background: "#f0f0f0", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "24px" }}>
                    🖼
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  {customThemeLoading ? (
                    <div>
                      <div className="spinner" style={{ width: "20px", height: "20px", borderWidth: "2px", margin: "0 0 6px 0" }} />
                      <div style={{ fontSize: "12px", color: "#888" }}>Analyzing design...</div>
                    </div>
                  ) : customTheme ? (
                    <div style={{ flex: 1 }} onClick={e => e.stopPropagation()}>
                      <div style={{ fontWeight: "600", fontSize: "13px", marginBottom: "8px" }}>
                        {selectedTheme.id === "custom" ? "✓ Custom theme active" : "Custom theme extracted"}
                      </div>
                      {/* Color fine-tune pickers */}
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                        {[
                          { label: "Background", key: "bg" },
                          { label: "Text", key: "text" },
                          { label: "Accent", key: "accent" },
                        ].map(({ label, key }) => (
                          <label key={key} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                            <input
                              type="color"
                              value={customTheme.preview[key]}
                              onChange={e => {
                                const updated = buildThemeFromColors(
                                  key === "bg" ? e.target.value : customTheme.preview.bg,
                                  key === "text" ? e.target.value : customTheme.preview.text,
                                  key === "accent" ? e.target.value : customTheme.preview.accent,
                                );
                                setCustomTheme(updated);
                                setSelectedTheme(updated);
                              }}
                              style={{ width: "24px", height: "24px", border: "none", borderRadius: "4px", cursor: "pointer", padding: "1px" }}
                            />
                            <span style={{ fontSize: "11px", color: "#555" }}>{label}</span>
                          </label>
                        ))}
                      </div>
                      <button
                        onClick={() => setSelectedTheme(customTheme)}
                        style={{
                          fontSize: "11px", padding: "3px 10px", borderRadius: "4px", cursor: "pointer",
                          border: `1px solid ${selectedTheme.id === "custom" ? "#1a1a1a" : "#d0d0d0"}`,
                          background: selectedTheme.id === "custom" ? "#1a1a1a" : "#fff",
                          color: selectedTheme.id === "custom" ? "#fff" : "#555",
                        }}
                      >
                        {selectedTheme.id === "custom" ? "✓ Selected" : "Use this theme"}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "13px", marginBottom: "3px" }}>Upload a resume screenshot</div>
                      <div style={{ fontSize: "11px", color: "#888" }}>JPG, PNG, or WebP · max 4MB · AI will match the exact style</div>
                    </div>
                  )}
                  {customThemeError && (
                    <div style={{ fontSize: "11px", color: "#dc2626", marginTop: "4px" }}>{customThemeError}</div>
                  )}
                </div>
              </div>
              <input
                ref={themeFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={(e) => handleThemeUpload(e.target.files[0])}
              />
            </div>

            {/* Preset themes */}
            <div style={{ fontSize: "12px", fontWeight: "600", color: "#444", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Preset themes
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "12px", marginBottom: "28px" }}>
              {THEMES.map((theme) => (
                <div
                  key={theme.id}
                  className={`theme-card ${selectedTheme.id === theme.id ? "selected" : ""}`}
                  onClick={() => setSelectedTheme(theme)}
                >
                  <div style={{
                    height: "70px", background: theme.preview.bg, borderRadius: "6px",
                    marginBottom: "10px", padding: "10px", position: "relative", overflow: "hidden",
                  }}>
                    <div style={{ width: "55%", height: "7px", background: theme.preview.accent, borderRadius: "2px", marginBottom: "5px", opacity: 0.9 }} />
                    <div style={{ width: "35%", height: "4px", background: theme.preview.text, borderRadius: "2px", marginBottom: "7px", opacity: 0.3 }} />
                    <div style={{ width: "85%", height: "3px", background: theme.preview.text, borderRadius: "2px", marginBottom: "3px", opacity: 0.15 }} />
                    <div style={{ width: "70%", height: "3px", background: theme.preview.text, borderRadius: "2px", opacity: 0.15 }} />
                  </div>
                  <div style={{ fontWeight: "600", fontSize: "13px", marginBottom: "3px" }}>{theme.name}</div>
                  <div style={{ fontSize: "11px", color: "#888", lineHeight: "1.4" }}>{theme.desc}</div>
                  {selectedTheme.id === theme.id && (
                    <div style={{ marginTop: "8px", fontSize: "11px", color: "#1a1a1a", fontWeight: "600" }}>✓ Selected</div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-primary" onClick={() => setStep(3)} disabled={customThemeLoading}>Continue →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Generate */}
        {step === 3 && (
          <div className="fade-in" style={{ textAlign: "center", padding: "32px 0" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "8px" }}>Ready to Generate</h1>
            <p style={{ color: "#666", fontSize: "14px", maxWidth: "380px", margin: "0 auto 24px", lineHeight: "1.6" }}>
              AI will rewrite your resume using the job description's exact keywords and language.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
              {[
                { label: "Theme", value: selectedTheme.name },
                { label: "Resume", value: `${resumeText.trim().split(/\s+/).length} words` },
                { label: "Job Description", value: `${jobDesc.trim().split(/\s+/).length} words` },
              ].map((item, i) => (
                <div key={i} style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "12px 20px", minWidth: "120px" }}>
                  <div style={{ fontSize: "16px", fontWeight: "700" }}>{item.value}</div>
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</div>
                </div>
              ))}
            </div>

            {loading && (
              <div style={{ margin: "24px 0" }}>
                <div className="spinner" />
                <p style={{ color: "#888", fontSize: "13px", marginTop: "12px" }}>Tailoring your resume...</p>
              </div>
            )}

            {error && (
              <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: "6px", padding: "12px 16px", color: "#b91c1c", fontSize: "13px", margin: "16px auto", maxWidth: "420px", textAlign: "left" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "8px" }}>
              <button className="btn-ghost" onClick={() => setStep(2)}>← Back</button>
              <button className="btn-primary" onClick={handleGenerate} disabled={loading}>
                {loading ? "Generating..." : "Generate Resume"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Result */}
        {step === 4 && generated && (
          <div className="fade-in">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h1 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "3px" }}>Your Tailored Resume</h1>
                <p style={{ color: "#888", fontSize: "13px" }}>Theme: {selectedTheme.name}</p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button className="btn-ghost" onClick={() => { setGenerated(null); setStep(2); }}>Change Theme</button>
                <button className="btn-ghost" onClick={() => { setGenerated(null); setStep(1); }}>Edit JD</button>
                <button className="btn-primary" onClick={handlePrint}>Download PDF</button>
              </div>
            </div>

            {/* Match Analysis Card */}
            {(generated.matchScore > 0 || generated.recommendation) && (() => {
              const rec = generated.recommendation;
              const isApply = rec === "APPLY";
              const isCaution = rec === "APPLY_WITH_CAUTION";
              const recColor = isApply ? "#16a34a" : isCaution ? "#ca8a04" : "#dc2626";
              const recBg = isApply ? "#dcfce7" : isCaution ? "#fef9c3" : "#fee2e2";
              const recBorder = isApply ? "#bbf7d0" : isCaution ? "#fde68a" : "#fecaca";
              const recLabel = isApply ? "Apply with confidence" : isCaution ? "Apply with caution" : "Reconsider applying";
              const recIcon = isApply ? "✓" : isCaution ? "!" : "✗";
              const scoreColor = generated.matchScore >= 70 ? "#16a34a" : generated.matchScore >= 50 ? "#ca8a04" : "#dc2626";

              return (
                <div style={{ background: "#fff", border: "1px solid #e0e0e0", borderRadius: "10px", overflow: "hidden", marginBottom: "20px" }}>

                  {/* Recommendation banner */}
                  <div style={{ background: recBg, borderBottom: `1px solid ${recBorder}`, padding: "14px 20px", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%", background: recColor,
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", fontWeight: "700", flexShrink: 0,
                    }}>{recIcon}</div>
                    <div>
                      <div style={{ fontWeight: "700", fontSize: "14px", color: recColor, marginBottom: "3px" }}>{recLabel}</div>
                      {generated.recommendationReason && (
                        <div style={{ fontSize: "12px", color: "#444", lineHeight: "1.6" }}>{generated.recommendationReason}</div>
                      )}
                    </div>
                  </div>

                  {/* Score + breakdown */}
                  <div style={{ padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                      <div style={{ textAlign: "center", flexShrink: 0 }}>
                        <div style={{
                          width: "64px", height: "64px", borderRadius: "50%",
                          border: `3px solid ${scoreColor}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{ fontSize: "17px", fontWeight: "700", color: scoreColor }}>{generated.matchScore}%</span>
                        </div>
                        <div style={{ fontSize: "10px", color: "#888", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>JD Match</div>
                      </div>
                      <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.6" }}>
                        Resume rewritten to maximally cover what you genuinely have. No skills fabricated.
                        {generated.bridgedGaps?.length > 0 && ` ${generated.bridgedGaps.length} gap(s) partially addressed with transferable experience.`}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                      {generated.covered?.length > 0 && (
                        <div>
                          <div style={{ fontSize: "10px", fontWeight: "700", color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                            Covered ({generated.covered.length})
                          </div>
                          {generated.covered.map((item, i) => (
                            <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "5px", alignItems: "flex-start" }}>
                              <span style={{ color: "#16a34a", fontSize: "11px", flexShrink: 0, marginTop: "2px" }}>✓</span>
                              <span style={{ fontSize: "12px", color: "#333", lineHeight: "1.4" }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {generated.bridgedGaps?.length > 0 && (
                        <div>
                          <div style={{ fontSize: "10px", fontWeight: "700", color: "#ca8a04", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                            Partially covered ({generated.bridgedGaps.length})
                          </div>
                          {generated.bridgedGaps.map((item, i) => (
                            <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "5px", alignItems: "flex-start" }}>
                              <span style={{ color: "#ca8a04", fontSize: "11px", flexShrink: 0, marginTop: "2px" }}>~</span>
                              <span style={{ fontSize: "12px", color: "#333", lineHeight: "1.4" }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {generated.gaps?.length > 0 && (
                        <div>
                          <div style={{ fontSize: "10px", fontWeight: "700", color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
                            Gaps ({generated.gaps.length})
                          </div>
                          {generated.gaps.map((item, i) => (
                            <div key={i} style={{ display: "flex", gap: "6px", marginBottom: "5px", alignItems: "flex-start" }}>
                              <span style={{ color: "#dc2626", fontSize: "11px", flexShrink: 0, marginTop: "2px" }}>✗</span>
                              <span style={{ fontSize: "12px", color: "#333", lineHeight: "1.4" }}>{item}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Inline theme switcher */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
              {[...THEMES, ...(customTheme ? [customTheme] : [])].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTheme(t)}
                  style={{
                    padding: "5px 14px", borderRadius: "20px", cursor: "pointer",
                    border: `1px solid ${selectedTheme.id === t.id ? "#1a1a1a" : "#d0d0d0"}`,
                    background: selectedTheme.id === t.id ? "#1a1a1a" : "#fff",
                    color: selectedTheme.id === t.id ? "#fff" : "#555",
                    fontSize: "12px", transition: "all 0.15s",
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <div style={{ borderRadius: "8px", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
              <ResumePreview data={generated} theme={selectedTheme} />
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: "28px" }}>
              <button className="btn-ghost" onClick={() => { setStep(0); setGenerated(null); setResumeText(""); setJobDesc(""); }}>
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
