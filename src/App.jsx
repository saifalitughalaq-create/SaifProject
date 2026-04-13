import { useState, useRef, useCallback, useEffect } from "react";
import mammoth from "mammoth";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, increment } from "firebase/firestore";
import { auth, db, googleProvider, isFirebaseReady } from "./firebase";
import LandingPage from "./LandingPage";

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
  {
    id: "word-ion",
    name: "Ion",
    desc: "Blue accents, clean sans",
    preview: { bg: "#ffffff", accent: "#2e74b5", text: "#333333" },
    styles: {
      page: { background: "#ffffff", color: "#333333", fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif", padding: "48px 56px", minHeight: "560mm" },
      name: { fontSize: "32px", fontWeight: "300", color: "#2e74b5", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "4px" },
      contact: { fontSize: "11px", color: "#595959", letterSpacing: "0.5px", marginBottom: "28px" },
      sectionTitle: { fontSize: "13px", fontWeight: "700", color: "#2e74b5", textTransform: "uppercase", letterSpacing: "2px", borderBottom: "1px solid #2e74b5", paddingBottom: "4px", marginBottom: "12px", marginTop: "24px" },
      jobTitle: { fontSize: "13px", fontWeight: "700", color: "#2e74b5" },
      company: { fontSize: "12px", color: "#595959", fontStyle: "italic", marginBottom: "6px" },
      bullet: { fontSize: "12px", color: "#333333", lineHeight: "1.7", marginBottom: "4px", paddingLeft: "14px", position: "relative" },
      summary: { fontSize: "12px", color: "#333333", lineHeight: "1.8" },
      skillTag: { background: "#2e74b518", border: "1px solid #2e74b555", color: "#2e74b5", fontSize: "10px", padding: "3px 10px", borderRadius: "3px", letterSpacing: "0.5px" },
    },
  },
  {
    id: "word-crisp",
    name: "Crisp",
    desc: "Orange, airy light sans",
    preview: { bg: "#ffffff", accent: "#e07b00", text: "#1a1a1a" },
    styles: {
      page: { background: "#ffffff", color: "#1a1a1a", fontFamily: "'Calibri Light', 'Segoe UI Light', Arial, sans-serif", padding: "56px 64px", minHeight: "560mm" },
      name: { fontSize: "36px", fontWeight: "300", color: "#1a1a1a", letterSpacing: "1px", marginBottom: "2px" },
      contact: { fontSize: "11px", color: "#e07b00", letterSpacing: "1px", marginBottom: "32px", textTransform: "uppercase" },
      sectionTitle: { fontSize: "11px", fontWeight: "700", color: "#e07b00", textTransform: "uppercase", letterSpacing: "3px", marginBottom: "12px", marginTop: "28px" },
      jobTitle: { fontSize: "13px", fontWeight: "700", color: "#1a1a1a" },
      company: { fontSize: "11px", color: "#7a7a7a", marginBottom: "6px" },
      bullet: { fontSize: "12px", color: "#333333", lineHeight: "1.75", marginBottom: "4px", paddingLeft: "14px", position: "relative" },
      summary: { fontSize: "12px", color: "#333333", lineHeight: "1.8" },
      skillTag: { background: "transparent", border: "1px solid #e07b00", color: "#e07b00", fontSize: "10px", padding: "3px 10px", borderRadius: "0px", letterSpacing: "1px" },
    },
  },
  {
    id: "word-polished",
    name: "Polished",
    desc: "Navy, serif, traditional",
    preview: { bg: "#ffffff", accent: "#1f3864", text: "#262626" },
    styles: {
      page: { background: "#ffffff", color: "#262626", fontFamily: "'Georgia', 'Cambria', serif", padding: "48px 56px", minHeight: "560mm" },
      name: { fontSize: "30px", fontWeight: "700", color: "#1f3864", letterSpacing: "1px", marginBottom: "4px" },
      contact: { fontSize: "11px", color: "#595959", marginBottom: "24px", borderBottom: "1px solid #1f3864", paddingBottom: "14px" },
      sectionTitle: { fontSize: "12px", fontWeight: "700", color: "#1f3864", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px", marginTop: "24px", borderBottom: "0.5px solid #1f386455", paddingBottom: "4px" },
      jobTitle: { fontSize: "14px", fontWeight: "700", color: "#262626" },
      company: { fontSize: "12px", color: "#1f3864", fontStyle: "italic", marginBottom: "6px" },
      bullet: { fontSize: "12px", color: "#333333", lineHeight: "1.7", marginBottom: "4px", paddingLeft: "14px", position: "relative" },
      summary: { fontSize: "12px", color: "#333333", lineHeight: "1.8" },
      skillTag: { background: "#1f386418", border: "1px solid #1f386444", color: "#1f3864", fontSize: "10px", padding: "3px 10px", borderRadius: "2px", letterSpacing: "0.5px" },
    },
  },
  {
    id: "word-swiss",
    name: "Swiss",
    desc: "Red, bold Helvetica",
    preview: { bg: "#ffffff", accent: "#c00000", text: "#1a1a1a" },
    styles: {
      page: { background: "#ffffff", color: "#1a1a1a", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", padding: "48px 56px", minHeight: "560mm" },
      name: { fontSize: "36px", fontWeight: "900", color: "#1a1a1a", letterSpacing: "-1px", textTransform: "uppercase", marginBottom: "2px" },
      contact: { fontSize: "11px", color: "#595959", marginBottom: "28px", borderTop: "3px solid #c00000", paddingTop: "10px" },
      sectionTitle: { fontSize: "13px", fontWeight: "900", color: "#c00000", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "10px", marginTop: "24px" },
      jobTitle: { fontSize: "13px", fontWeight: "700", color: "#1a1a1a" },
      company: { fontSize: "12px", color: "#595959", marginBottom: "6px" },
      bullet: { fontSize: "12px", color: "#333333", lineHeight: "1.65", marginBottom: "4px", paddingLeft: "14px", position: "relative" },
      summary: { fontSize: "12px", color: "#333333", lineHeight: "1.7" },
      skillTag: { background: "#c00000", color: "#ffffff", fontSize: "10px", padding: "3px 10px", borderRadius: "0px", fontWeight: "700", letterSpacing: "0.5px" },
    },
  },
  {
    id: "word-urban",
    name: "Urban",
    desc: "Charcoal header block",
    preview: { bg: "#ffffff", accent: "#3b3b3b", text: "#262626" },
    styles: {
      page: { background: "#ffffff", color: "#262626", fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif", padding: "0", minHeight: "560mm" },
      name: { fontSize: "34px", fontWeight: "300", color: "#ffffff", letterSpacing: "4px", textTransform: "uppercase", marginBottom: "4px", background: "#3b3b3b", padding: "36px 56px 6px" },
      contact: { fontSize: "11px", color: "#d0d0d0", letterSpacing: "1px", background: "#3b3b3b", padding: "0 56px 32px", marginBottom: "24px" },
      sectionTitle: { fontSize: "12px", fontWeight: "700", color: "#3b3b3b", textTransform: "uppercase", letterSpacing: "3px", marginBottom: "12px", marginTop: "24px", marginLeft: "56px", marginRight: "56px", borderBottom: "1px solid #3b3b3b", paddingBottom: "4px" },
      jobTitle: { fontSize: "13px", fontWeight: "700", color: "#262626", marginLeft: "56px", marginRight: "56px" },
      company: { fontSize: "11px", color: "#7a7a7a", fontStyle: "italic", marginBottom: "6px", marginLeft: "56px", marginRight: "56px" },
      bullet: { fontSize: "12px", color: "#333333", lineHeight: "1.7", marginBottom: "4px", paddingLeft: "14px", position: "relative", marginLeft: "56px", marginRight: "56px" },
      summary: { fontSize: "12px", color: "#333333", lineHeight: "1.8", marginLeft: "56px", marginRight: "56px" },
      skillTag: { background: "#3b3b3b", color: "#ffffff", fontSize: "10px", padding: "3px 10px", borderRadius: "2px", letterSpacing: "0.5px" },
    },
  },
  {
    id: "word-spearmint",
    name: "Spearmint",
    desc: "Fresh teal, modern",
    preview: { bg: "#ffffff", accent: "#2e9d8a", text: "#262626" },
    styles: {
      page: { background: "#ffffff", color: "#262626", fontFamily: "'Calibri', 'Segoe UI', Arial, sans-serif", padding: "48px 56px", minHeight: "560mm" },
      name: { fontSize: "34px", fontWeight: "700", color: "#2e9d8a", letterSpacing: "1px", marginBottom: "4px" },
      contact: { fontSize: "11px", color: "#595959", marginBottom: "24px", borderBottom: "2px solid #2e9d8a", paddingBottom: "12px" },
      sectionTitle: { fontSize: "12px", fontWeight: "700", color: "#2e9d8a", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px", marginTop: "24px" },
      jobTitle: { fontSize: "13px", fontWeight: "700", color: "#262626" },
      company: { fontSize: "12px", color: "#2e9d8a", marginBottom: "6px" },
      bullet: { fontSize: "12px", color: "#333333", lineHeight: "1.7", marginBottom: "4px", paddingLeft: "14px", position: "relative" },
      summary: { fontSize: "12px", color: "#333333", lineHeight: "1.8" },
      skillTag: { background: "#2e9d8a22", border: "1px solid #2e9d8a55", color: "#2e9d8a", fontSize: "10px", padding: "4px 12px", borderRadius: "20px", letterSpacing: "0.5px" },
    },
  },
  {
    id: "word-bold",
    name: "Bold",
    desc: "Oversized name, minimal",
    preview: { bg: "#ffffff", accent: "#111111", text: "#262626" },
    styles: {
      page: { background: "#ffffff", color: "#262626", fontFamily: "'Arial Black', 'Arial', sans-serif", padding: "48px 56px", minHeight: "560mm" },
      name: { fontSize: "44px", fontWeight: "900", color: "#111111", letterSpacing: "-1px", textTransform: "uppercase", marginBottom: "6px", lineHeight: "1" },
      contact: { fontSize: "11px", color: "#595959", letterSpacing: "2px", marginBottom: "32px", textTransform: "uppercase" },
      sectionTitle: { fontSize: "14px", fontWeight: "900", color: "#111111", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px", marginTop: "28px", borderBottom: "3px solid #111111", paddingBottom: "4px" },
      jobTitle: { fontSize: "13px", fontWeight: "900", color: "#111111", textTransform: "uppercase" },
      company: { fontSize: "11px", color: "#7a7a7a", marginBottom: "6px" },
      bullet: { fontSize: "12px", color: "#333333", lineHeight: "1.7", marginBottom: "4px", paddingLeft: "14px", position: "relative", fontFamily: "'Arial', sans-serif" },
      summary: { fontSize: "12px", color: "#333333", lineHeight: "1.8", fontFamily: "'Arial', sans-serif" },
      skillTag: { background: "#111111", color: "#ffffff", fontSize: "10px", padding: "4px 12px", borderRadius: "0px", fontWeight: "900", letterSpacing: "1px", textTransform: "uppercase" },
    },
  },
  {
    id: "word-modern-chrono",
    name: "Modern Chronological",
    desc: "Teal highlights, classic layout",
    preview: { bg: "#ffffff", accent: "#1f6e8c", text: "#262626" },
    styles: {
      page: { background: "#ffffff", color: "#262626", fontFamily: "'Cambria', Georgia, serif", padding: "48px 56px", minHeight: "560mm" },
      name: { fontSize: "32px", fontWeight: "400", color: "#1f6e8c", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "4px", textAlign: "center" },
      contact: { fontSize: "11px", color: "#595959", marginBottom: "28px", textAlign: "center", letterSpacing: "0.5px" },
      sectionTitle: { fontSize: "12px", fontWeight: "700", color: "#ffffff", background: "#1f6e8c", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px", marginTop: "22px", padding: "5px 12px" },
      jobTitle: { fontSize: "13px", fontWeight: "700", color: "#262626" },
      company: { fontSize: "12px", color: "#1f6e8c", fontStyle: "italic", marginBottom: "6px" },
      bullet: { fontSize: "12px", color: "#333333", lineHeight: "1.7", marginBottom: "4px", paddingLeft: "14px", position: "relative" },
      summary: { fontSize: "12px", color: "#333333", lineHeight: "1.8" },
      skillTag: { background: "#1f6e8c18", border: "1px solid #1f6e8c55", color: "#1f6e8c", fontSize: "10px", padding: "3px 10px", borderRadius: "2px", letterSpacing: "0.5px" },
    },
  },

  // ── Minimalist professional ─────────────────────────────────────────────
  {
    id: "min-ink",
    name: "Minimal Ink",
    desc: "Pure white, typography only",
    preview: { bg: "#ffffff", accent: "#111111", text: "#111111" },
    styles: {
      page: { background: "#ffffff", color: "#111111", fontFamily: "'Georgia', serif", padding: "52px 64px", minHeight: "560mm" },
      name: { fontSize: "28px", fontWeight: "700", color: "#111111", letterSpacing: "0.5px", marginBottom: "4px" },
      contact: { fontSize: "11px", color: "#666666", marginBottom: "32px" },
      sectionTitle: { fontSize: "10px", fontWeight: "700", color: "#111111", textTransform: "uppercase", letterSpacing: "3px", borderBottom: "0.5px solid #cccccc", paddingBottom: "5px", marginBottom: "14px", marginTop: "28px" },
      jobTitle: { fontSize: "13px", fontWeight: "700", color: "#111111" },
      company: { fontSize: "11px", color: "#666666", marginBottom: "7px" },
      bullet: { fontSize: "12px", color: "#333333", lineHeight: "1.8", marginBottom: "4px", paddingLeft: "14px", position: "relative" },
      summary: { fontSize: "12px", color: "#333333", lineHeight: "1.9" },
      skillTag: { background: "transparent", border: "none", color: "#333333", fontSize: "12px", padding: "0", borderRadius: "0", letterSpacing: "0" },
    },
  },
  {
    id: "min-newsprint",
    name: "Newsprint",
    desc: "Off-white, serif, editorial",
    preview: { bg: "#f9f8f5", accent: "#1a1a1a", text: "#2a2a2a" },
    styles: {
      page: { background: "#f9f8f5", color: "#2a2a2a", fontFamily: "'Times New Roman', Times, serif", padding: "52px 64px", minHeight: "560mm" },
      name: { fontSize: "32px", fontWeight: "900", color: "#1a1a1a", letterSpacing: "-0.5px", marginBottom: "2px" },
      contact: { fontSize: "11px", color: "#666666", marginBottom: "20px", borderBottom: "2px solid #1a1a1a", paddingBottom: "14px" },
      sectionTitle: { fontSize: "10px", fontWeight: "700", color: "#1a1a1a", textTransform: "uppercase", letterSpacing: "3px", marginBottom: "12px", marginTop: "26px" },
      jobTitle: { fontSize: "14px", fontWeight: "700", color: "#1a1a1a" },
      company: { fontSize: "11px", color: "#555555", marginBottom: "7px" },
      bullet: { fontSize: "12px", color: "#3a3a3a", lineHeight: "1.8", marginBottom: "4px", paddingLeft: "14px", position: "relative" },
      summary: { fontSize: "13px", color: "#3a3a3a", lineHeight: "1.9", fontStyle: "italic" },
      skillTag: { background: "transparent", border: "none", color: "#3a3a3a", fontSize: "12px", padding: "0", borderRadius: "0", letterSpacing: "0" },
    },
  },
  {
    id: "min-arctic",
    name: "Arctic",
    desc: "White, icy blue, ultra-clean",
    preview: { bg: "#ffffff", accent: "#3a7bd5", text: "#1c2b3a" },
    styles: {
      page: { background: "#ffffff", color: "#1c2b3a", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", padding: "52px 64px", minHeight: "560mm" },
      name: { fontSize: "30px", fontWeight: "300", color: "#1c2b3a", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "4px" },
      contact: { fontSize: "11px", color: "#6b8099", letterSpacing: "0.5px", marginBottom: "32px" },
      sectionTitle: { fontSize: "9px", fontWeight: "700", color: "#3a7bd5", textTransform: "uppercase", letterSpacing: "4px", marginBottom: "12px", marginTop: "28px" },
      jobTitle: { fontSize: "13px", fontWeight: "600", color: "#1c2b3a" },
      company: { fontSize: "11px", color: "#6b8099", marginBottom: "7px" },
      bullet: { fontSize: "12px", color: "#2d3f52", lineHeight: "1.75", marginBottom: "4px", paddingLeft: "14px", position: "relative" },
      summary: { fontSize: "12px", color: "#2d3f52", lineHeight: "1.85" },
      skillTag: { background: "transparent", border: "none", color: "#2d3f52", fontSize: "12px", padding: "0", borderRadius: "0", letterSpacing: "0" },
    },
  },
  {
    id: "min-studio",
    name: "Studio",
    desc: "Light gray, black, modern",
    preview: { bg: "#f3f3f3", accent: "#000000", text: "#1a1a1a" },
    styles: {
      page: { background: "#f3f3f3", color: "#1a1a1a", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", padding: "52px 64px", minHeight: "560mm" },
      name: { fontSize: "34px", fontWeight: "200", color: "#000000", letterSpacing: "5px", textTransform: "uppercase", marginBottom: "4px" },
      contact: { fontSize: "11px", color: "#888888", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "36px" },
      sectionTitle: { fontSize: "8px", fontWeight: "700", color: "#000000", textTransform: "uppercase", letterSpacing: "5px", marginBottom: "14px", marginTop: "28px" },
      jobTitle: { fontSize: "13px", fontWeight: "600", color: "#000000" },
      company: { fontSize: "11px", color: "#888888", marginBottom: "8px" },
      bullet: { fontSize: "12px", color: "#333333", lineHeight: "1.8", marginBottom: "4px", paddingLeft: "14px", position: "relative" },
      summary: { fontSize: "12px", color: "#333333", lineHeight: "1.9" },
      skillTag: { background: "transparent", border: "none", color: "#333333", fontSize: "12px", padding: "0", borderRadius: "0", letterSpacing: "0" },
    },
  },
  {
    id: "min-reed",
    name: "Reed",
    desc: "Warm white, slate blue, professional",
    preview: { bg: "#fafaf8", accent: "#3d5a80", text: "#2c3240" },
    styles: {
      page: { background: "#fafaf8", color: "#2c3240", fontFamily: "'Cambria', Georgia, serif", padding: "52px 64px", minHeight: "560mm" },
      name: { fontSize: "30px", fontWeight: "700", color: "#3d5a80", letterSpacing: "0.5px", marginBottom: "4px" },
      contact: { fontSize: "11px", color: "#7a8694", marginBottom: "28px" },
      sectionTitle: { fontSize: "10px", fontWeight: "700", color: "#3d5a80", textTransform: "uppercase", letterSpacing: "2.5px", borderBottom: "1px solid #3d5a8033", paddingBottom: "5px", marginBottom: "14px", marginTop: "26px" },
      jobTitle: { fontSize: "13px", fontWeight: "700", color: "#2c3240" },
      company: { fontSize: "11px", color: "#7a8694", fontStyle: "italic", marginBottom: "7px" },
      bullet: { fontSize: "12px", color: "#3a4252", lineHeight: "1.8", marginBottom: "4px", paddingLeft: "14px", position: "relative" },
      summary: { fontSize: "12px", color: "#3a4252", lineHeight: "1.9" },
      skillTag: { background: "transparent", border: "none", color: "#3a4252", fontSize: "12px", padding: "0", borderRadius: "0", letterSpacing: "0" },
    },
  },
];

const STEPS = ["Resume", "Job Description", "Theme", "Generate"];
const GUEST_LIMIT = 5;    // daily generations without sign-in
const AUTH_LIMIT  = 5;    // daily generations after sign-in (5 more on top of guest)
const LS_KEY = "rt_gens_v2";      // bump to force-reset all guest browser counts
const RESET_EPOCH = "v2";         // bump to force-reset all Firestore user counts

const todayStr = () => new Date().toISOString().slice(0, 10);

function getResetCountdown() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

const getLocalCount = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
    if (stored.date !== todayStr()) return 0;
    return stored.count || 0;
  } catch { return 0; }
};
const incLocalCount = () => {
  const count = getLocalCount();
  localStorage.setItem(LS_KEY, JSON.stringify({ count: count + 1, date: todayStr() }));
};

async function getFirestoreCount(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return 0;
  const data = snap.data();
  if (data.resetEpoch !== RESET_EPOCH) return 0; // force-reset: old epoch = start fresh
  if (data.date !== todayStr()) return 0;
  return data.gens || 0;
}
async function incFirestoreCount(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  const data = snap.exists() ? snap.data() : {};
  // If epoch doesn't match, treat prior count as 0 (force-reset)
  const prevGens = data.resetEpoch === RESET_EPOCH && data.date === todayStr() ? (data.gens || 0) : 0;
  const todayCount = prevGens + 1;
  const totalGens = (data.totalGens || 0) + 1;
  await setDoc(doc(db, "users", uid), { gens: todayCount, date: todayStr(), totalGens, resetEpoch: RESET_EPOCH }, { merge: true });
  return totalGens;
}

async function saveResumeToHistory(uid, text) {
  const snap = await getDoc(doc(db, "users", uid));
  const data = snap.exists() ? snap.data() : {};
  const existing = data.resumes || [];
  const trimmed = text.slice(0, 4000);

  // Check similarity — same if first 300 chars match (catches minor whitespace diffs)
  const isSame = existing.length > 0 && existing[0].text.slice(0, 300) === trimmed.slice(0, 300);
  if (isSame) return { saved: false, resumeCount: data.resumeCount || existing.length };

  const updated = [{ text: trimmed, savedAt: Date.now() }, ...existing].slice(0, 5);
  const resumeCount = (data.resumeCount || 0) + 1;
  await setDoc(doc(db, "users", uid), { resumes: updated, resumeCount }, { merge: true });
  return { saved: true, resumeCount };
}

async function getPastResumes(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data().resumes || []) : [];
}

const generateResume = async (resumeText, jobDescription, pastResumes = []) => {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeText, jobDescription, pastResumes }),
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
      <div style={s.contact}>
        {data.contact.split(/\s*[|,]\s*/).map((item, i, arr) => (
          <span key={i}>
            {item.trim()}
            {i < arr.length - 1 && (
              <span style={{ margin: "0 10px", opacity: 0.4 }}>·</span>
            )}
          </span>
        ))}
      </div>

      <div style={s.sectionTitle}>Professional Summary</div>
      <div style={s.summary}>{data.summary}</div>

      <div style={s.sectionTitle}>Key Skills</div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", marginBottom: "4px", fontSize: s.summary.fontSize, color: s.summary.color, lineHeight: "2" }}>
        {data.skills.map((sk, i) => (
          <span key={i} style={{ whiteSpace: "nowrap" }}>
            {i > 0 && <span style={{ color: theme.preview.accent, margin: "0 8px", fontWeight: 700 }}>·</span>}
            {sk}
          </span>
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
  const [showLanding, setShowLanding] = useState(true);
  const [step, setStep] = useState(0);
  const [resumeText, setResumeText] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [genCount, setGenCount] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const [showMemoryPromo, setShowMemoryPromo] = useState(false);
  const [savedResumeCount, setSavedResumeCount] = useState(0);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  const LOADING_MESSAGES = [
    "Crafting your masterpiece...",
    "Reading the job description...",
    "Analyzing your experience...",
    "Matching keywords to the role...",
    "Rewriting every bullet point...",
    "Work in progress...",
    "Optimizing for ATS filters...",
    "Polishing the final draft...",
    "Almost there — making it perfect...",
  ];
  const [savedToast, setSavedToast] = useState(null); // { count: N }
  const [resetCountdown, setResetCountdown] = useState(getResetCountdown());
  const fileRef = useRef();

  // Update reset countdown every minute
  useEffect(() => {
    const id = setInterval(() => setResetCountdown(getResetCountdown()), 60000);
    return () => clearInterval(id);
  }, []);

  // Cycle loading messages while generating
  useEffect(() => {
    if (!loading) { setLoadingMsgIdx(0); return; }
    setLoadingMsgIdx(0);
    const id = setInterval(() => setLoadingMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 2800);
    return () => clearInterval(id);
  }, [loading]);

  // Auth listener
  useEffect(() => {
    if (!isFirebaseReady) { setAuthLoading(false); return; }
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const c = await getFirestoreCount(u.uid);
        setGenCount(c);
        const snap = await getDoc(doc(db, "users", u.uid));
        setSavedResumeCount(snap.exists() ? (snap.data().resumes?.length || 0) : 0);
      } else {
        setGenCount(getLocalCount());
        setSavedResumeCount(0);
      }
      setAuthLoading(false);
    });
  }, []);

  const handleGoogleSignIn = async () => {
    if (!isFirebaseReady) return;
    try { await signInWithPopup(auth, googleProvider); } catch {}
  };

  const handleSignOut = async () => {
    if (!isFirebaseReady) return;
    await signOut(auth);
    setGenCount(getLocalCount());
  };

  const handleDownloadPDF = async () => {
    if (!generated) return;
    setPdfLoading(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageW = 210, pageH = 297;
      const mL = 20, mR = 20, mT = 24;
      const cW = pageW - mL - mR;
      let y = mT;

      const hexRgb = (hex) => {
        const h = hex.replace("#", "");
        return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
      };
      const [ar, ag, ab] = hexRgb(selectedTheme.preview.accent);

      const newPage = (need = 8) => {
        if (y + need > pageH - 16) { pdf.addPage(); y = mT; }
      };

      const sectionHeader = (title) => {
        newPage(12);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(ar, ag, ab);
        pdf.text(title.toUpperCase(), mL, y);
        y += 2;
        pdf.setDrawColor(ar, ag, ab);
        pdf.setLineWidth(0.25);
        pdf.line(mL, y, pageW - mR, y);
        y += 5;
        pdf.setTextColor(40, 40, 40);
      };

      const bodyText = (text, indent = 0, italic = false) => {
        pdf.setFont("helvetica", italic ? "italic" : "normal");
        pdf.setFontSize(10);
        const lines = pdf.splitTextToSize(text, cW - indent);
        newPage(lines.length * 4.8 + 1);
        pdf.text(lines, mL + indent, y);
        y += lines.length * 4.8 + 1;
      };

      // ── Name ──
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(ar, ag, ab);
      pdf.text(generated.name || "", mL, y);
      y += 7;

      // ── Contact ──
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(110, 110, 110);
      const contactStr = (generated.contact || "").replace(/\s*\|\s*/g, "   ·   ");
      const contactLines = pdf.splitTextToSize(contactStr, cW);
      pdf.text(contactLines, mL, y);
      y += contactLines.length * 4.5 + 2;

      // ── Divider ──
      pdf.setDrawColor(ar, ag, ab);
      pdf.setLineWidth(0.3);
      pdf.line(mL, y, pageW - mR, y);
      y += 7;

      // ── Summary ──
      if (generated.summary) {
        sectionHeader("Professional Summary");
        pdf.setTextColor(50, 50, 50);
        bodyText(generated.summary);
        y += 3;
      }

      // ── Skills ──
      if (generated.skills?.length) {
        sectionHeader("Key Skills");
        pdf.setTextColor(50, 50, 50);
        bodyText(generated.skills.join("   ·   "));
        y += 3;
      }

      // ── Experience ──
      if (generated.experience?.length) {
        sectionHeader("Professional Experience");
        for (const job of generated.experience) {
          newPage(14);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          pdf.setTextColor(30, 30, 30);
          const titleLines = pdf.splitTextToSize(job.title || "", cW);
          pdf.text(titleLines, mL, y);
          y += titleLines.length * 5;

          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(9.5);
          pdf.setTextColor(110, 110, 110);
          const companyLines = pdf.splitTextToSize(job.company || "", cW);
          pdf.text(companyLines, mL, y);
          y += companyLines.length * 4.5 + 2;

          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(10);
          pdf.setTextColor(50, 50, 50);
          for (const b of job.bullets || []) {
            const textIndent = 5; // mm — hanging indent after bullet
            const bLines = pdf.splitTextToSize(b, cW - textIndent - 2);
            newPage(bLines.length * 4.8 + 1);
            pdf.text("\u2022", mL + 2, y);
            pdf.text(bLines, mL + 2 + textIndent, y);
            y += bLines.length * 4.8 + 1.5;
          }
          y += 4;
        }
      }

      // ── Education ──
      if (generated.education?.length) {
        sectionHeader("Education");
        for (const edu of generated.education) {
          newPage(12);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(11);
          pdf.setTextColor(30, 30, 30);
          pdf.text(edu.degree || "", mL, y);
          y += 5;

          pdf.setFont("helvetica", "italic");
          pdf.setFontSize(9.5);
          pdf.setTextColor(110, 110, 110);
          pdf.text(edu.school || "", mL, y);
          y += 5;

          if (edu.bullets?.length) {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(10);
            pdf.setTextColor(50, 50, 50);
            for (const b of edu.bullets) {
              const textIndent = 5;
              const bLines = pdf.splitTextToSize(b, cW - textIndent - 2);
              newPage(bLines.length * 4.8 + 1);
              pdf.text("\u2022", mL + 2, y);
              pdf.text(bLines, mL + 2 + textIndent, y);
              y += bLines.length * 4.8 + 1.5;
            }
          }
          y += 4;
        }
      }

      pdf.save(`${(generated.name || "Resume").replace(/\s+/g, "_")}_Resume.pdf`);
    } catch (e) { console.error("PDF error:", e); }
    setPdfLoading(false);
  };

  const handleDownloadDOCX = async () => {
    if (!generated) return;
    setDocxLoading(true);
    try {
      const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, WidthType, TableRow, TableCell, Table, VerticalAlign } = await import("docx");
      const accent = selectedTheme.preview.accent.replace("#", "").toUpperCase();
      const darkText = "111111";

      const hr = () => new Paragraph({
        border: { bottom: { color: accent, space: 1, style: BorderStyle.SINGLE, size: 8 } },
        spacing: { before: 160, after: 80 },
      });

      const sectionHead = (text) => new Paragraph({
        children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 20, color: accent, characterSpacing: 80 })],
        spacing: { before: 300, after: 120 },
      });

      const bullet = (text) => new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun({ text, size: 22, color: darkText })],
        spacing: { before: 40, after: 40 },
      });

      const children = [
        new Paragraph({
          children: [new TextRun({ text: generated.name, bold: true, size: 52, color: accent })],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [new TextRun({ text: generated.contact, size: 20, color: "595959" })],
          spacing: { after: 320 },
        }),
      ];

      if (generated.summary) {
        children.push(sectionHead("Professional Summary"), hr());
        children.push(new Paragraph({ children: [new TextRun({ text: generated.summary, size: 22, color: darkText, italics: true })], spacing: { after: 200 } }));
      }

      if (generated.skills?.length) {
        children.push(sectionHead("Key Skills"), hr());
        children.push(new Paragraph({ children: [new TextRun({ text: generated.skills.join("  ·  "), size: 22, color: darkText })], spacing: { after: 200 } }));
      }

      if (generated.experience?.length) {
        children.push(sectionHead("Professional Experience"), hr());
        for (const job of generated.experience) {
          children.push(new Paragraph({ children: [new TextRun({ text: job.title, bold: true, size: 24, color: darkText })], spacing: { before: 120, after: 40 } }));
          if (job.company) children.push(new Paragraph({ children: [new TextRun({ text: job.company, size: 22, color: "595959", italics: true })], spacing: { after: 80 } }));
          for (const b of job.bullets || []) children.push(bullet(b));
        }
      }

      if (generated.education?.length) {
        children.push(sectionHead("Education"), hr());
        for (const edu of generated.education) {
          children.push(new Paragraph({ children: [new TextRun({ text: edu.degree, bold: true, size: 24, color: darkText })], spacing: { before: 120, after: 40 } }));
          if (edu.school) children.push(new Paragraph({ children: [new TextRun({ text: edu.school, size: 22, color: "595959", italics: true })], spacing: { after: 80 } }));
          for (const b of edu.bullets || []) children.push(bullet(b));
        }
      }

      const docxDoc = new Document({
        styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
        sections: [{ properties: { page: { margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } }, children }],
      });

      const blob = await Packer.toBlob(docxDoc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${(generated.name || "Resume").replace(/\s+/g, "_")}_Resume.docx`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e) { console.error("DOCX error:", e); }
    setDocxLoading(false);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError(null);
    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "docx") {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setResumeText(result.value);
    } else if (ext === "pdf") {
      try {
        const text = await extractTextFromPDF(file);
        if (!text.trim()) throw new Error("empty");
        setResumeText(text);
      } catch {
        setError("Could not extract text from this PDF. Please paste your resume below instead.");
      }
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

  // ── PDF text extraction ───────────────────────────────────────────────────
  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url
    ).toString();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = await Promise.all(
      Array.from({ length: pdf.numPages }, (_, i) => pdf.getPage(i + 1))
    );
    const texts = await Promise.all(
      pages.map(async (page) => {
        const content = await page.getTextContent();
        return content.items.map(item => item.str).join(" ");
      })
    );
    return texts.join("\n");
  };

  const handleGenerate = async () => {
    // Check generation limit
    const currentCount = user ? await getFirestoreCount(user.uid) : getLocalCount();
    const limit = user ? AUTH_LIMIT : GUEST_LIMIT;
    if (currentCount >= limit) { setShowPaywall(true); return; }

    setLoading(true);
    setError(null);
    try {
      // Load past resumes for signed-in users to improve tailoring
      let pastResumes = [];
      if (user && isFirebaseReady) {
        const history = await getPastResumes(user.uid);
        // Exclude current resume if already in history; pass previous ones
        pastResumes = history
          .filter(r => r.text !== resumeText.slice(0, 4000))
          .slice(0, 3)
          .map(r => r.text);
      }

      const result = await generateResume(resumeText, jobDesc, pastResumes);

      // Save resume to history and update count
      if (user) {
        const [, saveResult] = await Promise.all([
          incFirestoreCount(user.uid),
          saveResumeToHistory(user.uid, resumeText),
        ]);
        setGenCount(currentCount + 1);
        setSavedToast(saveResult || { saved: false, resumeCount: 1 });
        if (saveResult?.saved) setSavedResumeCount(c => c + 1);
        setTimeout(() => setSavedToast(null), 4000);
      } else {
        incLocalCount();
        setGenCount(currentCount + 1);
        // Show memory promo to guests after first generation (once only)
        if (!localStorage.getItem("rt_memory_seen")) {
          setTimeout(() => setShowMemoryPromo(true), 1500);
        }
      }
      setGenerated(result);
      setStep(4);
    } catch (err) {
      setError(err.message || "Generation failed. Please try again.");
    }
    setLoading(false);
  };

  const canNext = () => {
    if (step === 0) return resumeText.trim().length > 50;
    if (step === 1) return jobDesc.trim().length > 50;
    return true;
  };

  if (showLanding) {
    return (
      <LandingPage
        onStart={() => setShowLanding(false)}
        user={user}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: "#0f0f0f" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #f4f4f4; }
        ::-webkit-scrollbar-thumb { background: #d0d0d0; border-radius: 4px; }
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .btn-primary {
          background: #7c3aed; color: #fff; border: none;
          padding: 11px 28px; border-radius: 8px; font-size: 13px;
          font-weight: 700; cursor: pointer; letter-spacing: -0.1px;
          transition: background 0.15s, transform 0.1s;
          font-family: inherit;
        }
        .btn-primary:hover:not(:disabled) { background: #6d28d9; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
        .btn-ghost {
          background: transparent; color: #444; border: 1px solid #e0e0e0;
          padding: 10px 22px; border-radius: 8px; font-size: 13px;
          cursor: pointer; transition: border-color 0.15s, color 0.15s;
          font-family: inherit; font-weight: 600;
        }
        .btn-ghost:hover { border-color: #7c3aed; color: #7c3aed; }
        .theme-card {
          border: 1.5px solid #ebebeb; border-radius: 12px;
          padding: 14px; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s;
          background: #fff;
        }
        .theme-card:hover { border-color: #c4b5fd; box-shadow: 0 4px 16px rgba(124,58,237,0.08); }
        .theme-card.selected { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.12); }
        textarea, input[type="password"], input[type="text"] {
          width: 100%; background: #fff; border: 1.5px solid #e8e8e8;
          color: #0f0f0f; padding: 14px; border-radius: 8px;
          font-size: 13px; line-height: 1.7; outline: none;
          font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s;
        }
        textarea:focus, input[type="password"]:focus, input[type="text"]:focus {
          border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
        }
        .spinner {
          width: 40px; height: 40px; border: 3px solid #ede9ff;
          border-top-color: #7c3aed; border-radius: 50%;
          animation: spin 0.75s linear infinite; margin: 0 auto;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes msgFade {
          0% { opacity: 0; transform: translateY(6px); }
          15% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-6px); }
        }
        .loading-msg { animation: msgFade 2.8s ease forwards; }
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
        /* ── Responsive ── */
        @media (max-width: 640px) {
          .header-tagline { display: none; }
          .header-inner { height: auto !important; padding: 10px 0 !important; flex-wrap: wrap; gap: 8px; }
          .header-right { flex-wrap: wrap; gap: 6px !important; }
          .feature-grid { grid-template-columns: 1fr !important; }
          .main-container { padding: 20px 14px 60px !important; }
          .step4-top { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .step4-buttons { width: 100%; display: grid !important; grid-template-columns: 1fr 1fr; gap: 8px; }
          .resume-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .resume-scroll > * { min-width: 520px; }
          .gen-counter { max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .btn-primary, .btn-ghost { padding: 10px 16px !important; font-size: 12px !important; }
          h1 { font-size: 20px !important; }
        }
        @media (max-width: 400px) {
          .header-right { gap: 4px !important; }
          .step4-buttons { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Paywall Modal */}
      {showPaywall && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          onClick={() => setShowPaywall(false)}>
          <div style={{ background: "#fff", borderRadius: "14px", padding: "36px", maxWidth: "420px", width: "100%", textAlign: "center" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: "48px", height: "48px", background: "#faf8ff", border: "1px solid #ede9ff", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              </div>
            <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>
              {user ? `Daily limit reached` : `You've used today's ${GUEST_LIMIT} free generations`}
            </h2>
            <p style={{ color: "#666", fontSize: "13px", lineHeight: "1.6", marginBottom: "8px" }}>
              {user
                ? `You've used all ${AUTH_LIMIT} generations for today. Come back tomorrow for ${AUTH_LIMIT} more free, or upgrade to Pro for unlimited.`
                : `Sign in with Google to get ${AUTH_LIMIT} more free generations today. Limits reset daily.`}
            </p>
            <div style={{ display: "inline-block", background: "#f4f4f4", borderRadius: "20px", padding: "4px 14px", fontSize: "12px", color: "#666", marginBottom: "20px" }}>
              Resets in <strong style={{ color: "#1a1a1a" }}>{resetCountdown}</strong>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {!user && isFirebaseReady && (
                <button onClick={async () => { await handleGoogleSignIn(); setShowPaywall(false); }}
                  style={{ background: "#fff", border: "1px solid #d0d0d0", borderRadius: "8px", padding: "11px 20px", fontSize: "13px", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2a10.3 10.3 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z"/><path fill="#34A853" d="M9 18a8.6 8.6 0 0 0 5.96-2.18l-2.91-2.26a5.4 5.4 0 0 1-8.07-2.85H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.98 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3.02-2.33z"/><path fill="#EA4335" d="M9 3.58a4.86 4.86 0 0 1 3.44 1.35l2.58-2.58A8.64 8.64 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.02 2.33A5.36 5.36 0 0 1 9 3.58z"/></svg>
                  Continue free with Google
                </button>
              )}
              <button style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 20px", fontSize: "13px", cursor: "pointer", fontWeight: "700" }}
                onClick={() => setShowPaywall(false)}>
                Upgrade to Pro — Coming Soon
              </button>
              <button style={{ background: "transparent", border: "none", color: "#888", fontSize: "12px", cursor: "pointer", padding: "4px" }}
                onClick={() => setShowPaywall(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Memory Promo Modal */}
      {showMemoryPromo && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          onClick={() => { setShowMemoryPromo(false); localStorage.setItem("rt_memory_seen", "1"); }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "40px 36px", maxWidth: "400px", width: "100%", textAlign: "center" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: "52px", height: "52px", background: "#faf8ff", border: "1px solid #ede9ff", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              </div>
            <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "10px", letterSpacing: "-0.3px" }}>
              Your resume gets smarter over time
            </h2>
            <p style={{ color: "#555", fontSize: "13px", lineHeight: "1.7", marginBottom: "8px" }}>
              Sign in with Google and the AI remembers every resume you upload.
            </p>
            <p style={{ color: "#555", fontSize: "13px", lineHeight: "1.7", marginBottom: "28px" }}>
              The more you use it, the better it knows your background — pulling skills and experience from past versions to build a stronger resume each time.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {isFirebaseReady && (
                <button onClick={async () => { await handleGoogleSignIn(); setShowMemoryPromo(false); localStorage.setItem("rt_memory_seen", "1"); }}
                  style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "8px", padding: "13px 20px", fontSize: "13px", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2a10.3 10.3 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z"/><path fill="#34A853" d="M9 18a8.6 8.6 0 0 0 5.96-2.18l-2.91-2.26a5.4 5.4 0 0 1-8.07-2.85H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.98 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3.02-2.33z"/><path fill="#EA4335" d="M9 3.58a4.86 4.86 0 0 1 3.44 1.35l2.58-2.58A8.64 8.64 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.02 2.33A5.36 5.36 0 0 1 9 3.58z"/></svg>
                  Sign in with Google — it's free
                </button>
              )}
              <button style={{ background: "transparent", border: "none", color: "#aaa", fontSize: "12px", cursor: "pointer", padding: "4px" }}
                onClick={() => { setShowMemoryPromo(false); localStorage.setItem("rt_memory_seen", "1"); }}>
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resume Saved Toast */}
      {savedToast && (
        <div style={{
          position: "fixed", bottom: "28px", left: "50%", transform: "translateX(-50%)",
          zIndex: 2000, background: "#111", color: "#fff", borderRadius: "12px",
          padding: "14px 22px", display: "flex", alignItems: "center", gap: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.22)", fontSize: "13px", fontWeight: "500",
          animation: "slideUp 0.3s ease",
        }}>
          <div style={{ width: "34px", height: "34px", background: "#fff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
            </div>
          <div>
            <div style={{ fontWeight: "700", marginBottom: "2px" }}>
              {savedToast.saved ? `Resume #${savedToast.resumeCount} saved to memory` : "Same resume detected"}
            </div>
            <div style={{ fontSize: "11px", color: "#aaa" }}>
              {savedToast.saved
                ? `${savedToast.resumeCount === 1 ? "First version stored" : `${savedToast.resumeCount} unique resumes`} — AI builds on all of them`
                : "Using your existing memory — update your resume to add more context"}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: "1px solid #f0f0f0", background: "#fff", padding: "0 16px", position: "sticky", top: 0, zIndex: 100 }}>
        <div className="header-inner" style={{ maxWidth: "760px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "58px" }}>
          <div
            style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}
            onClick={() => { setShowLanding(true); setStep(0); setGenerated(null); setResumeText(""); setJobDesc(""); }}
          >
            <span style={{ fontWeight: "900", fontSize: "17px", letterSpacing: "-0.5px", color: "#0f0f0f" }}>ResumeJD</span>
            <span style={{ background: "#f0eaff", color: "#7c3aed", fontSize: "10px", fontWeight: "700", padding: "2px 7px", borderRadius: "20px" }}>FREE</span>
            <span className="header-tagline" style={{ fontSize: "11px", color: "#999", letterSpacing: "0.1px" }}>AI resume tailored to your job description</span>
          </div>
          <div className="header-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {step > 0 && step < 4 && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {STEPS.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{
                      width: "24px", height: "24px", borderRadius: "50%", display: "flex",
                      alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700",
                      background: i < step ? "#7c3aed" : i === step ? "#7c3aed" : "#f0f0f0",
                      color: i <= step ? "#fff" : "#aaa",
                    }}>
                      {i < step ? "✓" : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ width: "20px", height: "1px", background: i < step ? "#7c3aed" : "#e8e8e8" }} />
                    )}
                  </div>
                ))}
              </div>
            )}
            {/* Gen counter */}
            {!authLoading && (() => {
              const limit = user ? AUTH_LIMIT : GUEST_LIMIT;
              return (
                <span className="gen-counter" style={{ fontSize: "11px", color: genCount >= limit ? "#dc2626" : "#7c3aed", background: genCount >= limit ? "#fee2e2" : "#f0eaff", padding: "3px 8px", borderRadius: "20px", fontWeight: "600" }}>
                  {genCount}/{limit} free{genCount >= limit ? ` · resets in ${resetCountdown}` : ""}
                </span>
              );
            })()}
            {/* Auth */}
            {isFirebaseReady && !authLoading && (
              user ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {user.photoURL && <img src={user.photoURL} alt="" style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid #e0e0e0" }} />}
                  <button onClick={handleSignOut} className="btn-ghost" style={{ padding: "5px 12px", fontSize: "12px" }}>Sign out</button>
                </div>
              ) : (
                <button onClick={handleGoogleSignIn} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", border: "1px solid #d0d0d0", borderRadius: "7px", padding: "6px 14px", fontSize: "12px", cursor: "pointer", fontWeight: "600" }}>
                  <svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2a10.3 10.3 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z"/><path fill="#34A853" d="M9 18a8.6 8.6 0 0 0 5.96-2.18l-2.91-2.26a5.4 5.4 0 0 1-8.07-2.85H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.98 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3.02-2.33z"/><path fill="#EA4335" d="M9 3.58a4.86 4.86 0 0 1 3.44 1.35l2.58-2.58A8.64 8.64 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.02 2.33A5.36 5.36 0 0 1 9 3.58z"/></svg>
                  Sign in with Google
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="main-container" style={{ maxWidth: step === 4 ? "860px" : "640px", margin: "0 auto", padding: "40px 24px 80px", background: "#fff" }}>


        {/* STEP 0: Upload Resume */}
        {step === 0 && (
          <div className="fade-in">
            <h1 style={{ fontSize: "28px", fontWeight: "900", marginBottom: "6px", letterSpacing: "-0.8px", color: "#0f0f0f" }}>Tailor your resume to any job</h1>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "28px", lineHeight: "1.6" }}>Paste your resume and a job description. AI rewrites every bullet using the role's exact keywords — honest, no fabrication.</p>

            {/* Feature highlights */}
            <div className="feature-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "28px" }}>
              {[
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>, title: "Tailored to the JD", desc: "Every bullet rewritten using the job's exact keywords." },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>, title: "Remembers You", desc: "Sign in and the AI builds on every resume you upload." },
                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>, title: "Honest Fit Score", desc: "See exactly what you cover, bridge, or miss." },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ background: "#faf8ff", border: "1px solid #ede9ff", borderRadius: "10px", padding: "16px 14px" }}>
                  <div style={{ marginBottom: "10px" }}>{icon}</div>
                  <div style={{ fontSize: "12px", fontWeight: "700", marginBottom: "4px", color: "#0f0f0f" }}>{title}</div>
                  <div style={{ fontSize: "11px", color: "#888", lineHeight: "1.6" }}>{desc}</div>
                </div>
              ))}
            </div>

            {/* Memory Status */}
            {!authLoading && (
              user ? (
                <div style={{ background: savedResumeCount > 0 ? "#faf8ff" : "#fafafa", border: `1px solid ${savedResumeCount > 0 ? "#ede9ff" : "#ebebeb"}`, borderRadius: "12px", padding: "16px 18px", marginBottom: "24px", display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <div style={{ width: "36px", height: "36px", background: savedResumeCount > 0 ? "#ede9ff" : "#f0f0f0", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={savedResumeCount > 0 ? "#7c3aed" : "#aaa"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: savedResumeCount > 0 ? "#7c3aed" : "#555", marginBottom: "3px" }}>
                      {savedResumeCount > 0 ? `Memory active — ${savedResumeCount} resume${savedResumeCount > 1 ? "s" : ""} stored` : "Memory ready"}
                    </div>
                    <div style={{ fontSize: "12px", color: "#888", lineHeight: "1.55" }}>
                      {savedResumeCount > 0
                        ? "AI will draw on all your past versions to build the strongest possible match for this role."
                        : "Upload your first resume and the AI will remember your background for every future application."}
                    </div>
                  </div>
                </div>
              ) : isFirebaseReady ? (
                <div style={{ background: "#fafafa", border: "1px solid #ebebeb", borderRadius: "12px", padding: "16px 18px", marginBottom: "24px", display: "flex", alignItems: "flex-start", gap: "14px" }}>
                  <div style={{ width: "36px", height: "36px", background: "#f0f0f0", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#333", marginBottom: "3px" }}>Sign in to unlock AI Memory</div>
                    <div style={{ fontSize: "12px", color: "#888", lineHeight: "1.55", marginBottom: "10px" }}>
                      The AI remembers every resume you upload — getting sharper with each application. Your 5 daily tailors become 10.
                    </div>
                    <button onClick={handleGoogleSignIn} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#fff", border: "1px solid #d0d0d0", borderRadius: "7px", padding: "7px 14px", fontSize: "12px", cursor: "pointer", fontWeight: "600", fontFamily: "inherit" }}>
                      <svg width="14" height="14" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2a10.3 10.3 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z"/><path fill="#34A853" d="M9 18a8.6 8.6 0 0 0 5.96-2.18l-2.91-2.26a5.4 5.4 0 0 1-8.07-2.85H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.98 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3.02-2.33z"/><path fill="#EA4335" d="M9 3.58a4.86 4.86 0 0 1 3.44 1.35l2.58-2.58A8.64 8.64 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.02 2.33A5.36 5.36 0 0 1 9 3.58z"/></svg>
                      Continue with Google — it's free
                    </button>
                  </div>
                </div>
              ) : null
            )}

            <h2 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "6px", color: "#0f0f0f" }}>Upload Your Resume</h2>
            <p style={{ color: "#777", fontSize: "13px", marginBottom: "14px" }}>Upload a file or paste your resume below.</p>

            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileRef.current.click()}
              style={{
                border: `1.5px dashed ${dragOver ? "#7c3aed" : "#ddd6fe"}`,
                borderRadius: "10px", padding: "32px", textAlign: "center",
                cursor: "pointer", background: dragOver ? "#faf8ff" : "#fdfcff",
                transition: "all 0.15s", marginBottom: "18px",
              }}
            >
              <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <div style={{ color: "#555", fontSize: "13px", marginBottom: "4px" }}>
                Drop file here or <span style={{ color: "#7c3aed", fontWeight: "600", textDecoration: "underline", textUnderlineOffset: "2px" }}>click to browse</span>
              </div>
              <div style={{ color: "#bbb", fontSize: "11px" }}>Supports .docx and .txt</div>
              <input ref={fileRef} type="file" accept=".docx,.txt" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
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
            <h1 style={{ fontSize: "24px", fontWeight: "900", marginBottom: "6px", letterSpacing: "-0.5px" }}>Job Description</h1>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "24px" }}>Paste the full posting — responsibilities, qualifications, requirements.</p>

            <textarea rows={18} value={jobDesc} onChange={(e) => setJobDesc(e.target.value.slice(0, 6000))} placeholder="Paste the full job description here..." />
            <div style={{ textAlign: "right", fontSize: "11px", color: jobDesc.length >= 6000 ? "#dc2626" : "#aaa", marginTop: "6px" }}>
              {jobDesc.length}/6000{jobDesc.length >= 6000 ? " — limit reached" : ""}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "14px" }}>
              <button className="btn-ghost" onClick={() => setStep(0)}>← Back</button>
              <button className="btn-primary" onClick={() => setStep(2)} disabled={!canNext()}>Continue →</button>
            </div>
          </div>
        )}

        {/* STEP 2: Choose Theme */}
        {step === 2 && (
          <div className="fade-in">
            <h1 style={{ fontSize: "24px", fontWeight: "900", marginBottom: "6px", letterSpacing: "-0.5px" }}>Choose a Theme</h1>
            <p style={{ color: "#666", fontSize: "14px", marginBottom: "22px" }}>Pick the style your resume should use.</p>
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
                    <div style={{ marginTop: "8px", fontSize: "11px", color: "#7c3aed", fontWeight: "700" }}>✓ Selected</div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="btn-primary" onClick={() => setStep(3)}>Continue →</button>
            </div>
          </div>
        )}

        {/* STEP 3: Generate */}
        {step === 3 && (
          <div className="fade-in" style={{ textAlign: "center", padding: "32px 0" }}>
            <h1 style={{ fontSize: "26px", fontWeight: "900", marginBottom: "8px", letterSpacing: "-0.5px" }}>Ready to Generate</h1>
            <p style={{ color: "#666", fontSize: "14px", maxWidth: "380px", margin: "0 auto 24px", lineHeight: "1.6" }}>
              AI will rewrite your resume using the job description's exact keywords and language.
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "28px", flexWrap: "wrap" }}>
              {[
                { label: "Theme", value: selectedTheme.name },
                { label: "Resume", value: `${resumeText.trim().split(/\s+/).length} words` },
                { label: "Job Description", value: `${jobDesc.trim().split(/\s+/).length} words` },
              ].map((item, i) => (
                <div key={i} style={{ background: "#faf8ff", border: "1px solid #ede9ff", borderRadius: "10px", padding: "12px 20px", minWidth: "120px" }}>
                  <div style={{ fontSize: "16px", fontWeight: "800", color: "#7c3aed" }}>{item.value}</div>
                  <div style={{ fontSize: "11px", color: "#999", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</div>
                </div>
              ))}
            </div>

            {loading && (
              <div style={{ margin: "32px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
                {/* Spinner ring */}
                <div style={{ position: "relative", width: "64px", height: "64px" }}>
                  <div className="spinner" style={{ width: "64px", height: "64px", border: "4px solid #ede9ff", borderTopColor: "#7c3aed" }} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "10px", height: "10px", background: "#7c3aed", borderRadius: "50%", opacity: 0.4 }} />
                  </div>
                </div>
                {/* Cycling message */}
                <div key={loadingMsgIdx} className="loading-msg" style={{
                  background: "#faf8ff", border: "1px solid #ede9ff", borderRadius: "24px",
                  padding: "10px 24px", fontSize: "13px", fontWeight: "600", color: "#7c3aed",
                  minWidth: "260px", textAlign: "center", letterSpacing: "-0.1px",
                }}>
                  {LOADING_MESSAGES[loadingMsgIdx]}
                </div>
                <p style={{ color: "#bbb", fontSize: "12px" }}>This takes about 20–30 seconds</p>
              </div>
            )}

            {error && (
              <div style={{ background: "#fff5f5", border: "1px solid #fca5a5", borderRadius: "6px", padding: "12px 16px", color: "#b91c1c", fontSize: "13px", margin: "16px auto", maxWidth: "420px", textAlign: "left" }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "8px" }}>
              <button className="btn-ghost" onClick={() => setStep(2)}>← Back</button>
              <button className="btn-primary" onClick={handleGenerate} disabled={loading} style={{ padding: "12px 32px", fontSize: "14px" }}>
                {loading ? "Generating..." : "Generate My Resume"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Result */}
        {step === 4 && generated && (
          <div className="fade-in">
            <div className="step4-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px" }}>
              <div>
                <h1 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "3px" }}>Your Tailored Resume</h1>
                <p style={{ color: "#888", fontSize: "13px" }}>Theme: {selectedTheme.name}</p>
              </div>
              <div className="step4-buttons" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button className="btn-ghost" onClick={() => { setGenerated(null); setStep(2); }}>Change Theme</button>
                <button className="btn-ghost" onClick={() => { setGenerated(null); setStep(1); }}>Edit JD</button>
                <button className="btn-ghost" onClick={handleDownloadDOCX} disabled={docxLoading}>
                  {docxLoading ? "Exporting..." : "Download DOCX"}
                </button>
                <button className="btn-primary" onClick={handleDownloadPDF} disabled={pdfLoading}>
                  {pdfLoading ? "Exporting..." : "Download PDF"}
                </button>
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
              {THEMES.map((t) => (
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

            <div className="resume-scroll" style={{ borderRadius: "8px", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}>
              <ResumePreview data={generated} theme={selectedTheme} />
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: "28px" }}>
              <button className="btn-ghost" onClick={() => { setShowLanding(true); setStep(0); setGenerated(null); setResumeText(""); setJobDesc(""); }}>
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
