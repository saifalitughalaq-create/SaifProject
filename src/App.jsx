import { useState, useRef, useCallback, useEffect } from "react";
import mammoth from "mammoth";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, increment } from "firebase/firestore";
import { auth, db, googleProvider, isFirebaseReady } from "./firebase";

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
    name: "Word: Ion",
    desc: "Word Ion — blue accents, clean",
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
    name: "Word: Crisp",
    desc: "Word Crisp — orange, airy sans",
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
    name: "Word: Polished",
    desc: "Word Polished — navy, serif, traditional",
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
    name: "Word: Swiss",
    desc: "Word Swiss — red, bold, Helvetica",
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
    name: "Word: Urban",
    desc: "Word Urban — charcoal header block",
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
    name: "Word: Spearmint",
    desc: "Word Spearmint — fresh teal, modern",
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
    name: "Word: Bold",
    desc: "Word Bold — oversized name, minimal",
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
    name: "Word: Modern Chronological",
    desc: "Word Modern — teal highlights, classic layout",
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
const FREE_LIMIT = 10;
const LS_KEY = "rt_gens";

const getLocalCount = () => parseInt(localStorage.getItem(LS_KEY) || "0", 10);
const incLocalCount = () => localStorage.setItem(LS_KEY, getLocalCount() + 1);

async function getFirestoreCount(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data().gens || 0) : 0;
}
async function incFirestoreCount(uid) {
  await setDoc(doc(db, "users", uid), { gens: increment(1) }, { merge: true });
}

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
      <div style={{ ...s.summary, marginBottom: "4px" }}>
        {data.skills.map((sk, i) => (
          <span key={i}>
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
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [genCount, setGenCount] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  const fileRef = useRef();
  const themeFileRef = useRef();

  // Auth listener
  useEffect(() => {
    if (!isFirebaseReady) { setAuthLoading(false); return; }
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const c = await getFirestoreCount(u.uid);
        setGenCount(c);
      } else {
        setGenCount(getLocalCount());
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
    const el = document.getElementById("resume-output");
    if (!el) return;
    setPdfLoading(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: el.style.background || "#ffffff" });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pw = 210; // A4 width mm
      const ph = (canvas.height / canvas.width) * pw;
      const pageH = 297;
      let yLeft = ph;
      let yPos = 0;
      pdf.addImage(imgData, "JPEG", 0, yPos, pw, ph);
      yLeft -= pageH;
      while (yLeft > 0) {
        yPos -= pageH;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, yPos, pw, ph);
        yLeft -= pageH;
      }
      pdf.save(`${(generated?.name || "Resume").replace(/\s+/g, "_")}_Resume.pdf`);
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

  const buildThemeFromColors = (bgHex, textHex, accentHex, opts = {}) => {
    const {
      font = "sans",
      nameCaps = false,
      nameItalic = false,
      nameCentered = false,
      divider = "underline",
      skillShape = "box",
    } = opts;

    const toRgb = h => ({ r: parseInt(h.slice(1,3),16), g: parseInt(h.slice(3,5),16), b: parseInt(h.slice(5,7),16) });
    const lum = ({r,g,b}) => (0.299*r + 0.587*g + 0.114*b)/255;
    const isDark = lum(toRgb(bgHex)) < 0.4;

    const fontFamily = font === "serif" ? "'Georgia', 'Cambria', serif"
      : font === "mono" ? "'Courier New', monospace"
      : "'Helvetica Neue', Helvetica, Arial, sans-serif";

    const muted = textHex + "99";
    const a40 = accentHex + "66";
    const a20 = accentHex + "33";
    const bodyText = isDark ? "#c8c0b0" : "#444444";

    const sectionBorderBottom = divider === "underline" ? `1px solid ${a40}`
      : divider === "thick" ? `2px solid ${accentHex}`
      : "none";
    const sectionBorderLeft = divider === "leftbar" ? `3px solid ${accentHex}` : "none";
    const sectionPL = divider === "leftbar" ? "10px" : "0";

    const skillBg     = skillShape === "filled" ? accentHex : skillShape !== "plain" ? a20 : "transparent";
    const skillColor  = skillShape === "filled" ? "#fff" : accentHex;
    const skillBorder = skillShape === "plain"  ? "none" : `1px solid ${a40}`;
    const skillRadius = skillShape === "pill"   ? "20px" : "3px";

    return {
      id: "custom", name: "Custom", desc: "Matched from your image",
      preview: { bg: bgHex, accent: accentHex, text: textHex },
      _opts: { font, nameCaps, nameItalic, nameCentered, divider, skillShape },
      styles: {
        page:         { background: bgHex, color: textHex, fontFamily, padding: "48px 56px", minHeight: "560mm" },
        name:         { fontSize: "30px", fontWeight: "700", color: accentHex, letterSpacing: nameCaps ? "3px" : "0px", textTransform: nameCaps ? "uppercase" : "none", fontStyle: nameItalic ? "italic" : "normal", textAlign: nameCentered ? "center" : "left", marginBottom: "4px" },
        contact:      { fontSize: "11px", color: muted, letterSpacing: "0.5px", marginBottom: "28px", textAlign: nameCentered ? "center" : "left" },
        sectionTitle: { fontSize: "10px", fontWeight: "700", color: accentHex, textTransform: "uppercase", letterSpacing: "2px", borderBottom: sectionBorderBottom, borderLeft: sectionBorderLeft, paddingLeft: sectionPL, paddingBottom: divider !== "none" ? "5px" : "0", marginBottom: "12px", marginTop: "26px" },
        jobTitle:     { fontSize: "14px", fontWeight: "700", color: textHex },
        company:      { fontSize: "12px", color: muted, fontStyle: "italic", marginBottom: "6px" },
        bullet:       { fontSize: "12px", color: bodyText, lineHeight: "1.7", marginBottom: "4px", paddingLeft: "14px", position: "relative" },
        summary:      { fontSize: "12px", color: bodyText, lineHeight: "1.8" },
        skillTag:     { background: skillBg, color: skillColor, border: skillBorder, fontSize: "10px", padding: "3px 10px", borderRadius: skillRadius, letterSpacing: "0.5px" },
      },
    };
  };

  const extractThemeFromDocx = async (file) => {
    const arrayBuffer = await file.arrayBuffer();

    // Extract styled HTML from DOCX
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer }, {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
      ]
    });
    const html = htmlResult.value;

    // Parse HTML to extract colors and fonts
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, "text/html");

    const hexColors = new Set();
    const fontNames = new Set();

    doc.querySelectorAll("[style]").forEach(el => {
      const style = el.getAttribute("style") || "";
      // Extract hex colors
      for (const m of style.matchAll(/color\s*:\s*(#[0-9a-fA-F]{3,6})/gi)) {
        hexColors.add(m[1].toLowerCase());
      }
      // Extract font families
      for (const m of style.matchAll(/font-family\s*:\s*["']?([^;,"']+)/gi)) {
        fontNames.add(m[1].trim().toLowerCase());
      }
    });

    // Classify colors
    const toRgb = h => {
      const s = h.replace("#","");
      const full = s.length === 3 ? s.split("").map(c=>c+c).join("") : s;
      return { r: parseInt(full.slice(0,2),16), g: parseInt(full.slice(2,4),16), b: parseInt(full.slice(4,6),16) };
    };
    const lum = ({r,g,b}) => (0.299*r + 0.587*g + 0.114*b) / 255;
    const sat = ({r,g,b}) => { const mx=Math.max(r,g,b),mn=Math.min(r,g,b); return mx===0?0:(mx-mn)/mx; };

    const colorList = [...hexColors].map(h => ({ h, ...toRgb(h) }))
      .map(c => ({ ...c, lum: lum(c), sat: sat(c) }));

    const bg      = colorList.find(c => c.lum > 0.85) || { h: "#ffffff" };
    const textCol = colorList.find(c => c.lum < 0.2)  || { h: "#1a1a1a" };
    const accent  = colorList
      .filter(c => c.sat > 0.2 && c.lum > 0.1 && c.lum < 0.85)
      .sort((a,b) => b.sat - a.sat)[0] || { h: "#2563eb" };

    // Detect font type
    const fontStr = [...fontNames].join(" ").toLowerCase();
    const font = fontStr.includes("georgia") || fontStr.includes("garamond") || fontStr.includes("times") || fontStr.includes("cambria") || fontStr.includes("palatino")
      ? "serif"
      : fontStr.includes("courier") || fontStr.includes("consolas") || fontStr.includes("mono")
        ? "mono"
        : "sans";

    // Detect name style from first heading
    const h1 = doc.querySelector("h1, strong");
    const h1Style = h1 ? (h1.getAttribute("style") || "") : "";
    const nameCaps = h1 ? h1.textContent === h1.textContent.toUpperCase() && h1.textContent.trim().length > 0 : false;
    const nameItalic = h1Style.includes("italic");
    const nameCentered = h1Style.includes("center") || (h1 && h1.closest("p")?.getAttribute("style")?.includes("center"));

    return buildThemeFromColors(bg.h, textCol.h, accent.h, { font, nameCaps, nameItalic, nameCentered, divider: "underline", skillShape: "box" });
  };

  const handleThemeUpload = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (ext !== "docx") {
      setCustomThemeError("Please upload a .docx file.");
      return;
    }
    setCustomThemeLoading(true);
    setCustomThemeError(null);
    setCustomThemePreview(null);
    try {
      const theme = await extractThemeFromDocx(file);
      setCustomTheme(theme);
      setSelectedTheme(theme);
    } catch (err) {
      setCustomThemeError("Could not read the file. Make sure it's a valid .docx resume.");
    }
    setCustomThemeLoading(false);
  };

  const handleGenerate = async () => {
    // Check generation limit
    const currentCount = user ? await getFirestoreCount(user.uid) : getLocalCount();
    if (currentCount >= FREE_LIMIT) { setShowPaywall(true); return; }

    setLoading(true);
    setError(null);
    try {
      const result = await generateResume(resumeText, jobDesc);
      if (user) { await incFirestoreCount(user.uid); setGenCount(currentCount + 1); }
      else { incLocalCount(); setGenCount(currentCount + 1); }
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

      {/* Paywall Modal */}
      {showPaywall && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}
          onClick={() => setShowPaywall(false)}>
          <div style={{ background: "#fff", borderRadius: "14px", padding: "36px", maxWidth: "420px", width: "100%", textAlign: "center" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>⚡</div>
            <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>You've used {FREE_LIMIT} free generations</h2>
            <p style={{ color: "#666", fontSize: "13px", lineHeight: "1.6", marginBottom: "24px" }}>
              {user ? "Upgrade to Pro for unlimited tailored resumes." : "Sign in with Google to continue free, or upgrade for unlimited access."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {!user && isFirebaseReady && (
                <button onClick={async () => { await handleGoogleSignIn(); setShowPaywall(false); }}
                  style={{ background: "#fff", border: "1px solid #d0d0d0", borderRadius: "8px", padding: "11px 20px", fontSize: "13px", cursor: "pointer", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2a10.3 10.3 0 0 0-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92a8.78 8.78 0 0 0 2.68-6.62z"/><path fill="#34A853" d="M9 18a8.6 8.6 0 0 0 5.96-2.18l-2.91-2.26a5.4 5.4 0 0 1-8.07-2.85H.96v2.33A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.98 10.71a5.41 5.41 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3.02-2.33z"/><path fill="#EA4335" d="M9 3.58a4.86 4.86 0 0 1 3.44 1.35l2.58-2.58A8.64 8.64 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.02 2.33A5.36 5.36 0 0 1 9 3.58z"/></svg>
                  Continue free with Google
                </button>
              )}
              <button style={{ background: "#1a1a1a", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 20px", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}
                onClick={() => setShowPaywall(false)}>
                Upgrade to Pro — Coming Soon
              </button>
              <button style={{ background: "transparent", border: "none", color: "#888", fontSize: "12px", cursor: "pointer", padding: "4px" }}
                onClick={() => setShowPaywall(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: "1px solid #e4e4e4", background: "#fff", padding: "0 32px" }}>
        <div style={{ maxWidth: "760px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontWeight: "700", fontSize: "16px", letterSpacing: "-0.3px" }}>Resume Tailor</span>
            <span style={{ fontSize: "12px", color: "#888", letterSpacing: "0.2px" }}>AI-powered</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
            {/* Gen counter */}
            {!authLoading && (
              <span style={{ fontSize: "11px", color: genCount >= FREE_LIMIT ? "#dc2626" : "#888", background: "#f4f4f4", padding: "3px 8px", borderRadius: "20px" }}>
                {genCount}/{FREE_LIMIT} free
              </span>
            )}
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
                Match a template style
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
                <div style={{ width: "56px", height: "56px", background: customTheme ? "#f0fdf4" : "#f0f0f0", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "22px", border: customTheme ? "1px solid #bbf7d0" : "1px solid #e0e0e0" }}>
                  {customTheme ? "✓" : "📄"}
                </div>
                <div style={{ flex: 1 }}>
                  {customThemeLoading ? (
                    <div>
                      <div className="spinner" style={{ width: "20px", height: "20px", borderWidth: "2px", margin: "0 0 6px 0" }} />
                      <div style={{ fontSize: "12px", color: "#888" }}>Analyzing design...</div>
                    </div>
                  ) : customTheme ? (
                    <div style={{ flex: 1 }} onClick={e => e.stopPropagation()}>
                      <div style={{ fontWeight: "600", fontSize: "13px", marginBottom: "10px" }}>✓ Custom theme — adjust to match your template</div>

                      {/* Colors */}
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "10px" }}>
                        {[{ label: "Background", key: "bg" }, { label: "Text", key: "text" }, { label: "Accent", key: "accent" }].map(({ label, key }) => (
                          <label key={key} style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                            <input type="color" value={customTheme.preview[key]}
                              onChange={e => {
                                const opts = customTheme._opts || {};
                                const updated = buildThemeFromColors(
                                  key === "bg" ? e.target.value : customTheme.preview.bg,
                                  key === "text" ? e.target.value : customTheme.preview.text,
                                  key === "accent" ? e.target.value : customTheme.preview.accent,
                                  opts
                                );
                                setCustomTheme(updated); setSelectedTheme(updated);
                              }}
                              style={{ width: "22px", height: "22px", border: "none", borderRadius: "3px", cursor: "pointer", padding: "1px" }}
                            />
                            <span style={{ fontSize: "11px", color: "#555" }}>{label}</span>
                          </label>
                        ))}
                      </div>

                      {/* Style controls */}
                      {[
                        { label: "Font", key: "font", options: [["sans","Sans-serif"],["serif","Serif"],["mono","Monospace"]] },
                        { label: "Divider", key: "divider", options: [["underline","Underline"],["leftbar","Left bar"],["thick","Thick line"],["none","None"]] },
                        { label: "Skills", key: "skillShape", options: [["box","Box"],["pill","Pill"],["filled","Filled"],["plain","Plain text"]] },
                      ].map(({ label, key, options }) => (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "7px" }}>
                          <span style={{ fontSize: "11px", color: "#666", width: "52px", flexShrink: 0 }}>{label}</span>
                          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                            {options.map(([val, lbl]) => {
                              const current = (customTheme._opts || {})[key] || options[0][0];
                              const active = current === val;
                              return (
                                <button key={val} onClick={() => {
                                  const opts = { ...(customTheme._opts || {}), [key]: val };
                                  const updated = buildThemeFromColors(customTheme.preview.bg, customTheme.preview.text, customTheme.preview.accent, opts);
                                  setCustomTheme(updated); setSelectedTheme(updated);
                                }} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "3px", cursor: "pointer", border: `1px solid ${active ? "#1a1a1a" : "#d0d0d0"}`, background: active ? "#1a1a1a" : "#fff", color: active ? "#fff" : "#555" }}>
                                  {lbl}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Toggles */}
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "10px" }}>
                        {[["nameCaps","ALL CAPS name"],["nameItalic","Italic name"],["nameCentered","Centered name"]].map(([key, lbl]) => {
                          const active = !!(customTheme._opts || {})[key];
                          return (
                            <button key={key} onClick={() => {
                              const opts = { ...(customTheme._opts || {}), [key]: !active };
                              const updated = buildThemeFromColors(customTheme.preview.bg, customTheme.preview.text, customTheme.preview.accent, opts);
                              setCustomTheme(updated); setSelectedTheme(updated);
                            }} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "3px", cursor: "pointer", border: `1px solid ${active ? "#1a1a1a" : "#d0d0d0"}`, background: active ? "#1a1a1a" : "#fff", color: active ? "#fff" : "#555" }}>
                              {lbl}
                            </button>
                          );
                        })}
                      </div>

                      <button onClick={() => setSelectedTheme(customTheme)} style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "4px", cursor: "pointer", border: `1px solid ${selectedTheme.id === "custom" ? "#1a1a1a" : "#d0d0d0"}`, background: selectedTheme.id === "custom" ? "#1a1a1a" : "#fff", color: selectedTheme.id === "custom" ? "#fff" : "#555" }}>
                        {selectedTheme.id === "custom" ? "✓ Selected" : "Use this theme"}
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "13px", marginBottom: "3px" }}>Upload a resume template</div>
                      <div style={{ fontSize: "11px", color: "#888" }}>.docx only · extracts fonts and colors automatically</div>
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
                accept=".docx"
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
