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

      {/* Features */}
      <div className="lp-section-pad" style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "#7c3aed", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>Why ResumeJD</div>
            <h2 style={{ fontSize: "36px", fontWeight: "800", letterSpacing: "-1px", color: "#0f0f0f" }}>Built differently from other resume tools</h2>
          </div>

          <div className="lp-feat-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {[
              { icon: icons.target,  title: "Match Score",           desc: "Get a 0–100 score showing exactly how well your background fits the role. Know before you apply." },
              { icon: icons.shield,  title: "No Fabrication",        desc: "We never invent jobs, fake credentials, or add experience you don't have. Only your real background, reframed." },
              { icon: icons.zap,     title: "ATS Optimized",         desc: "Every bullet is rewritten using the job description's exact keywords — so you pass the automated screening." },
              { icon: icons.layers,  title: "Learns Your Background",desc: "Sign in and the AI remembers every resume you've uploaded — getting better the more you use it." },
              { icon: icons.bar,     title: "Gap Analysis",          desc: "See exactly which requirements you cover, which you partially bridge, and which are genuine gaps to address." },
              { icon: icons.export,  title: "PDF & DOCX Export",     desc: "Download your tailored resume as a professionally formatted PDF or Word document, ready to submit." },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="lp-feat-card">
                <div style={{ background: "#fff", borderRadius: "10px", padding: "10px", display: "inline-flex", marginBottom: "16px", border: "1px solid #ede9ff" }}>{icon}</div>
                <div style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px", color: "#0f0f0f" }}>{title}</div>
                <div style={{ fontSize: "13px", color: "#777", lineHeight: "1.7" }}>{desc}</div>
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
