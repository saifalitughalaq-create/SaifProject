// Clean SVG icons — stroke-based, consistent style
const Icon = ({ d, size = 20, stroke = "#7c3aed", sw = 1.5, vb = "0 0 24 24", fill = "none", extra = null }) => (
  <svg width={size} height={size} viewBox={vb} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
    {extra}
  </svg>
);

const icons = {
  file:     <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  clipboard:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12" y2="16"/></svg>,
  download: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  target:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  shield:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  zap:      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  layers:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  bar:      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
  export:   <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
};

export default function LandingPage({ onStart, user, onSignIn, onSignOut }) {
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: "#0f0f0f", background: "#fff", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .lp-btn-primary {
          background: #7c3aed; color: #fff; border: none; border-radius: 10px;
          padding: 15px 32px; font-size: 16px; font-weight: 700; cursor: pointer;
          letter-spacing: -0.2px; transition: background 0.15s, transform 0.1s;
          display: inline-flex; align-items: center; gap: 8px; font-family: inherit;
        }
        .lp-btn-primary:hover { background: #6d28d9; transform: translateY(-1px); }
        .lp-btn-ghost {
          background: transparent; color: #444; border: 1px solid #e0e0e0;
          border-radius: 8px; padding: 8px 18px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: border-color 0.15s, color 0.15s; font-family: inherit;
        }
        .lp-btn-ghost:hover { border-color: #7c3aed; color: #7c3aed; }
        .lp-step-card {
          background: #fff; border: 1px solid #ebebeb; border-radius: 16px;
          padding: 32px 28px; flex: 1;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .lp-step-card:hover { box-shadow: 0 8px 32px rgba(124,58,237,0.08); transform: translateY(-2px); }
        .lp-feat-card {
          background: #faf8ff; border: 1px solid #ede9ff; border-radius: 16px;
          padding: 28px 24px; transition: box-shadow 0.2s;
        }
        .lp-feat-card:hover { box-shadow: 0 4px 20px rgba(124,58,237,0.07); }
        .lp-cta-section {
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
          border-radius: 24px; padding: 72px 48px; text-align: center; color: #fff;
        }
        @media (max-width: 640px) {
          .lp-hero-headline { font-size: 36px !important; letter-spacing: -1px !important; }
          .lp-steps-grid { flex-direction: column !important; }
          .lp-feat-grid { grid-template-columns: 1fr !important; }
        .lp-memory-flex { flex-direction: column !important; }
          .lp-hero-pad { padding: 60px 20px 40px !important; }
          .lp-section-pad { padding: 56px 20px !important; }
          .lp-cta-section { padding: 48px 24px !important; }
          .lp-cta-section h2 { font-size: 26px !important; }
          .lp-hide-mobile { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #f0f0f0", padding: "0 24px", position: "sticky", top: 0, background: "#fff", zIndex: 100 }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "58px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: "900", fontSize: "18px", letterSpacing: "-0.5px", color: "#0f0f0f" }}>ResumeJD</span>
            <span style={{ background: "#f0eaff", color: "#7c3aed", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "20px", letterSpacing: "0.3px" }}>FREE</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {user ? (
              <>
                <span style={{ fontSize: "13px", color: "#666" }}>Hi, {user.displayName?.split(" ")[0]}</span>
                <button className="lp-btn-ghost" onClick={onStart}>Go to app</button>
              </>
            ) : (
              <>
                <button className="lp-btn-ghost lp-hide-mobile" onClick={onSignIn}>Sign in</button>
                <button onClick={onStart} style={{ background: "#0f0f0f", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 18px", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" }}>
                  Try Free
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="lp-hero-pad" style={{ maxWidth: "1000px", margin: "0 auto", padding: "88px 24px 64px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", background: "#f0eaff", border: "1px solid #ddd6fe", borderRadius: "20px", padding: "6px 16px", marginBottom: "32px" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="#7c3aed" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          <span style={{ fontSize: "12px", fontWeight: "600", color: "#7c3aed" }}>AI-Powered Resume Tailor</span>
        </div>

        <h1 className="lp-hero-headline" style={{ fontSize: "56px", fontWeight: "900", lineHeight: "1.08", letterSpacing: "-2px", marginBottom: "22px", color: "#0f0f0f" }}>
          Land More Interviews<br />
          <span style={{ color: "#7c3aed" }}>with a Resume Built</span><br />
          for Every Job
        </h1>

        <p style={{ fontSize: "18px", color: "#555", lineHeight: "1.65", maxWidth: "560px", margin: "0 auto 36px", fontWeight: "400" }}>
          Paste your resume and any job description. Our AI rewrites your resume using your real experience — optimized for ATS, tailored to the role.
        </p>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <button className="lp-btn-primary" onClick={onStart} style={{ fontSize: "17px", padding: "17px 40px" }}>
            Tailor My Resume — Free
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <span style={{ fontSize: "12px", color: "#aaa" }}>5 free per day · Sign in for 5 more</span>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: "48px", marginTop: "64px", paddingTop: "40px", borderTop: "1px solid #f0f0f0", flexWrap: "wrap" }}>
          {[
            { stat: "< 30s", label: "Resume rewritten" },
            { stat: "100%", label: "Your real experience" },
            { stat: "ATS", label: "Keyword optimized" },
            { stat: "Free", label: "No credit card" },
          ].map(({ stat, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "26px", fontWeight: "900", color: "#7c3aed", letterSpacing: "-0.5px" }}>{stat}</div>
              <div style={{ fontSize: "12px", color: "#999", marginTop: "3px" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="lp-section-pad" style={{ padding: "80px 24px", background: "#fafafa" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#7c3aed", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>How it works</div>
            <h2 style={{ fontSize: "36px", fontWeight: "800", letterSpacing: "-1px", color: "#0f0f0f" }}>Three steps to a tailored resume</h2>
          </div>

          <div className="lp-steps-grid" style={{ display: "flex", gap: "16px" }}>
            {[
              { n: "1", icon: icons.file,      title: "Paste Your Resume",       desc: "Upload a DOCX or paste your resume text directly. Any format works." },
              { n: "2", icon: icons.clipboard,  title: "Add the Job Description", desc: "Paste the full job posting. The more detail, the better the match." },
              { n: "3", icon: icons.download,   title: "Download Your Resume",    desc: "Get a rewritten resume with a match score, ATS keywords, and skill gaps." },
            ].map(({ n, icon, title, desc }) => (
              <div key={n} className="lp-step-card">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
                  <div style={{ width: "30px", height: "30px", background: "#7c3aed", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", flexShrink: 0 }}>{n}</div>
                  <div style={{ background: "#f0eaff", borderRadius: "10px", padding: "8px", display: "flex" }}>{icon}</div>
                </div>
                <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "8px", color: "#0f0f0f" }}>{title}</div>
                <div style={{ fontSize: "13px", color: "#777", lineHeight: "1.7" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Memory Feature — hero section */}
      <div className="lp-section-pad" style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div className="lp-memory-flex" style={{ display: "flex", alignItems: "center", gap: "60px", flexWrap: "wrap" }}>
            {/* Left: visual */}
            <div style={{ flex: "0 0 340px", maxWidth: "340px" }}>
              <div style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", borderRadius: "20px", padding: "32px 28px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#c4b5fd", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "20px" }}>Your AI Memory</div>
                {[
                  { label: "Software Engineer Resume", date: "Used 4×", active: true },
                  { label: "Product Manager Resume", date: "Used 2×", active: false },
                  { label: "Original Resume", date: "Base version", active: false },
                ].map((r, i) => (
                  <div key={i} style={{ background: i === 0 ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.07)", borderRadius: "10px", padding: "12px 14px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", background: i === 0 ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={i === 0 ? "#7c3aed" : "#c4b5fd"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: "600", color: "#fff", marginBottom: "2px" }}>{r.label}</div>
                      <div style={{ fontSize: "11px", color: "#c4b5fd" }}>{r.date}</div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: "16px", background: "rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 14px", fontSize: "11px", color: "#ddd6fe", lineHeight: "1.5" }}>
                  AI pulls the most relevant experience across all versions for each new role.
                </div>
              </div>
            </div>

            {/* Right: copy */}
            <div style={{ flex: 1, minWidth: "260px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "#7c3aed", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "14px" }}>AI Memory</div>
              <h2 style={{ fontSize: "34px", fontWeight: "900", letterSpacing: "-1px", lineHeight: "1.1", marginBottom: "18px", color: "#0f0f0f" }}>Gets smarter every time you use it</h2>
              <p style={{ fontSize: "15px", color: "#555", lineHeight: "1.7", marginBottom: "20px" }}>
                Sign in and every resume you upload is saved to your AI memory. When you apply to a new role, the AI draws on your entire history — picking the most relevant experience across all versions.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
                {[
                  "Had a marketing role 2 jobs ago? AI will surface it for a marketing JD.",
                  "Skills from older resumes automatically included in your master profile.",
                  "The more you use it, the stronger every new resume becomes.",
                ].map((point, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ width: "18px", height: "18px", background: "#ede9ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span style={{ fontSize: "13px", color: "#555", lineHeight: "1.6" }}>{point}</span>
                  </div>
                ))}
              </div>
              <button onClick={onSignIn} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#fff", border: "1.5px solid #ddd6fe", borderRadius: "9px", padding: "10px 18px", fontSize: "13px", cursor: "pointer", fontWeight: "600", color: "#7c3aed", fontFamily: "inherit", transition: "border-color 0.15s" }}>
                <svg width="15" height="15" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2a10.3 10.3 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z"/><path fill="#34A853" d="M9 18a8.6 8.6 0 0 0 5.96-2.18l-2.91-2.26a5.4 5.4 0 0 1-8.07-2.85H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.98 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3.02-2.33z"/><path fill="#EA4335" d="M9 3.58a4.86 4.86 0 0 1 3.44 1.35l2.58-2.58A8.64 8.64 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.02 2.33A5.36 5.36 0 0 1 9 3.58z"/></svg>
                Sign in free to enable Memory
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div className="lp-section-pad" style={{ padding: "80px 24px", background: "#fafafa" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#7c3aed", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>Why ResumeJD</div>
            <h2 style={{ fontSize: "36px", fontWeight: "800", letterSpacing: "-1px", color: "#0f0f0f" }}>Built differently from other resume tools</h2>
          </div>

          <div className="lp-feat-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            {[
              { icon: icons.target,  title: "Match Score",     desc: "Get a 0–100 score showing exactly how well your background fits the role." },
              { icon: icons.shield,  title: "No Fabrication",  desc: "Only your real experience, reframed. We never invent jobs or credentials." },
              { icon: icons.zap,     title: "ATS Optimized",   desc: "Every bullet rewritten using the job description's exact keywords." },
              { icon: icons.bar,     title: "Gap Analysis",    desc: "See which requirements you cover, bridge, or genuinely miss." },
              { icon: icons.export,  title: "PDF & DOCX",      desc: "Clean, ATS-readable text-based PDF and Word download." },
              { icon: icons.layers,  title: "Always Improving",desc: "Each application builds on the last. Your profile gets richer over time." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="lp-feat-card" style={{ background: "#fff", border: "1px solid #ebebeb" }}>
                <div style={{ background: "#f0eaff", borderRadius: "10px", padding: "9px", display: "inline-flex", marginBottom: "14px" }}>{icon}</div>
                <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "6px", color: "#0f0f0f" }}>{title}</div>
                <div style={{ fontSize: "12px", color: "#888", lineHeight: "1.65" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="lp-section-pad" style={{ padding: "80px 24px", background: "#fafafa" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <div className="lp-cta-section">
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#c4b5fd", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "18px" }}>Get started free</div>
            <h2 style={{ fontSize: "36px", fontWeight: "900", letterSpacing: "-1px", marginBottom: "16px", lineHeight: "1.1" }}>Stop sending the same resume to every job</h2>
            <p style={{ fontSize: "16px", color: "#c4b5fd", marginBottom: "40px", lineHeight: "1.65" }}>
              Every job is different. Your resume should be too.
            </p>
            <button className="lp-btn-primary" onClick={onStart} style={{ background: "#fff", color: "#7c3aed", fontSize: "16px", padding: "15px 36px" }}>
              Tailor My Resume Now
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <div style={{ marginTop: "18px", fontSize: "12px", color: "#a78bfa" }}>5 free per day · Sign in for 5 more · No credit card</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #f0f0f0", padding: "28px 24px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
          <span style={{ fontWeight: "900", fontSize: "15px", letterSpacing: "-0.3px" }}>ResumeJD</span>
          <span style={{ fontSize: "12px", color: "#bbb" }}>© 2026 ResumeJD. Free AI resume tailor.</span>
        </div>
      </div>
    </div>
  );
}
