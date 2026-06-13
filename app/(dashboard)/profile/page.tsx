'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,300;1,400;1,500&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
  @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css');

  .pf * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }

  /* ── Root + Animated Background ── */
  .pf {
    min-height: 100vh;
    background: #fdf7f4;
    padding: clamp(20px, 4vw, 40px);
    color: #2e1f28;
    position: relative;
    overflow-x: hidden;
  }

  /* Floating orbs */
  .pf-orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(70px);
    pointer-events: none;
    z-index: 0;
    animation: pf-drift linear infinite;
  }
  .pf-orb-1 {
    width: 480px; height: 480px;
    background: radial-gradient(circle, rgba(200,92,120,0.13) 0%, transparent 70%);
    top: -100px; right: -80px;
    animation-duration: 22s;
  }
  .pf-orb-2 {
    width: 360px; height: 360px;
    background: radial-gradient(circle, rgba(139,122,192,0.1) 0%, transparent 70%);
    bottom: 100px; left: -60px;
    animation-duration: 28s; animation-delay: -9s;
  }
  .pf-orb-3 {
    width: 260px; height: 260px;
    background: radial-gradient(circle, rgba(200,160,120,0.09) 0%, transparent 70%);
    top: 40%; right: 20%;
    animation-duration: 18s; animation-delay: -4s;
  }
  @keyframes pf-drift {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33% { transform: translate(18px, -22px) scale(1.05); }
    66% { transform: translate(-14px, 12px) scale(0.97); }
  }

  .pf > *:not(.pf-orb) { position: relative; z-index: 1; }

  /* ── Header ── */
  .pf-header { margin-bottom: 32px; }
  .pf-eyebrow {
    font-size: 10px; font-weight: 700; letter-spacing: 4px;
    text-transform: uppercase; color: rgba(200,92,120,0.55);
    display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
  }
  .pf-eyebrow-line {
    display: block; height: 1px; width: 28px;
    background: linear-gradient(90deg, #c85c78, transparent);
  }
  .pf-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(28px, 5.5vw, 44px); font-weight: 400; font-style: italic;
    color: #2e1f28; letter-spacing: -0.5px; line-height: 1.1;
  }
  .pf-title span {
    background: linear-gradient(135deg, #c85c78 0%, #a8417e 60%, #8b7ac0 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .pf-subtitle {
    font-size: 13px; color: rgba(46,31,40,0.38); margin-top: 5px;
    font-weight: 400; letter-spacing: 0.1px;
  }

  /* ── Grid ── */
  .pf-grid {
    display: grid;
    grid-template-columns: 268px 1fr;
    gap: 18px; align-items: start;
  }

  /* ── Card ── */
  .pf-card {
    background: rgba(255,255,255,0.82);
    backdrop-filter: blur(18px) saturate(160%);
    -webkit-backdrop-filter: blur(18px) saturate(160%);
    border: 1px solid rgba(200,92,120,0.1);
    border-radius: 22px; overflow: hidden;
    box-shadow:
      0 1px 0 rgba(255,255,255,0.9) inset,
      0 4px 24px rgba(46,31,40,0.05),
      0 1px 3px rgba(46,31,40,0.04);
    transition: box-shadow 0.25s, transform 0.25s;
  }
  .pf-card:hover {
    box-shadow:
      0 1px 0 rgba(255,255,255,0.9) inset,
      0 8px 36px rgba(200,92,120,0.09),
      0 2px 6px rgba(46,31,40,0.05);
    transform: translateY(-1px);
  }

  .pf-card-header {
    padding: 14px 20px;
    border-bottom: 1px solid rgba(200,92,120,0.07);
    display: flex; align-items: center; gap: 10px;
    background: linear-gradient(180deg, rgba(200,92,120,0.025) 0%, transparent 100%);
  }
  .pf-card-header-icon {
    width: 32px; height: 32px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center; font-size: 15px;
    box-shadow: 0 2px 6px rgba(46,31,40,0.06);
  }
  .pf-card-header-title {
    font-family: 'Playfair Display', serif; font-style: italic;
    font-size: 14.5px; font-weight: 400; color: #2e1f28; flex: 1;
  }
  .pf-card-body { padding: 22px 24px 24px; }

  /* ── Avatar section ── */
  .pf-avatar-section {
    display: flex; flex-direction: column; align-items: center;
    padding: 32px 22px 24px; text-align: center;
    border-bottom: 1px solid rgba(200,92,120,0.06);
    background: linear-gradient(180deg, rgba(200,92,120,0.03) 0%, transparent 60%);
    position: relative; overflow: hidden;
  }
  .pf-avatar-section::before {
    content: '';
    position: absolute; top: -30px; left: 50%;
    transform: translateX(-50%);
    width: 200px; height: 200px; border-radius: 50%;
    background: radial-gradient(circle, rgba(200,92,120,0.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .pf-avatar-wrap {
    position: relative; margin-bottom: 16px; cursor: pointer;
    width: 92px; height: 92px;
  }
  .pf-avatar-glow {
    position: absolute; inset: -5px; border-radius: 50%;
    background: conic-gradient(from 0deg, #c85c78, #8b7ac0, #e8a4b8, #c85c78);
    animation: pf-spin-ring 4s linear infinite;
    opacity: 0.7;
  }
  @keyframes pf-spin-ring {
    to { transform: rotate(360deg); }
  }
  .pf-avatar-ring {
    position: relative; z-index: 1;
    width: 92px; height: 92px; border-radius: 50%;
    background: #fdf7f4; padding: 3px;
  }
  .pf-avatar-img {
    width: 100%; height: 100%; border-radius: 50%;
    object-fit: cover; display: block;
  }
  .pf-avatar-placeholder {
    width: 100%; height: 100%; border-radius: 50%;
    background: linear-gradient(135deg, #f2c4ce 0%, #e0d5f4 100%);
    display: flex; align-items: center; justify-content: center;
    font-size: 30px; font-weight: 700; color: #c85c78;
    font-family: 'Playfair Display', serif;
  }
  .pf-avatar-overlay {
    position: absolute; inset: 3px; border-radius: 50%; z-index: 2;
    background: rgba(46,31,40,0.52);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.2s;
    font-size: 19px; color: white;
  }
  .pf-avatar-wrap:hover .pf-avatar-overlay { opacity: 1; }
  .pf-avatar-uploading {
    position: absolute; inset: 3px; border-radius: 50%; z-index: 2;
    background: rgba(200,92,120,0.65);
    display: flex; align-items: center; justify-content: center;
    font-size: 19px; color: white;
  }
  .pf-avatar-info {
    display: flex; flex-direction: column; align-items: center;
  }

  .pf-avatar-hint {
    font-size: 10.5px; color: rgba(46,31,40,0.28); margin-bottom: 12px;
    letter-spacing: 0.3px;
  }
  .pf-avatar-status {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; color: #4d9058; font-weight: 700;
    background: rgba(77,144,88,0.08); border-radius: 99px;
    padding: 3px 9px; margin-bottom: 10px;
  }
  .pf-status-dot {
    width: 6px; height: 6px; border-radius: 50%; background: #4d9058;
    animation: pf-pulse 2s ease-in-out infinite;
  }
  @keyframes pf-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
  .pf-display-name {
    font-family: 'Playfair Display', serif; font-weight: 500;
    font-size: 20px; color: #2e1f28; margin-bottom: 2px; letter-spacing: -0.2px;
  }
  .pf-display-handle { font-size: 11.5px; color: #c85c78; margin-bottom: 3px; font-weight: 600; }
  .pf-display-email { font-size: 11px; color: rgba(46,31,40,0.35); margin-bottom: 13px; }
  .pf-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: linear-gradient(135deg, rgba(200,92,120,0.1), rgba(139,122,192,0.1));
    border: 1px solid rgba(200,92,120,0.2);
    border-radius: 999px; padding: 5px 14px;
    font-size: 10.5px; font-weight: 700; color: #c85c78; letter-spacing: 0.5px;
    box-shadow: 0 2px 8px rgba(200,92,120,0.08);
  }

  /* ── Stats ── */
  .pf-stats {
    display: grid; grid-template-columns: repeat(3, 1fr);
    border-top: 1px solid rgba(200,92,120,0.07);
  }
  .pf-stat {
    padding: 16px 8px; text-align: center;
    border-right: 1px solid rgba(200,92,120,0.07);
    transition: background 0.2s;
    cursor: default;
  }
  .pf-stat:last-child { border-right: none; }
  .pf-stat:hover { background: rgba(200,92,120,0.03); }
  .pf-stat-val {
    font-family: 'Playfair Display', serif; font-weight: 500;
    font-size: 26px; line-height: 1; margin-bottom: 3px;
    background: linear-gradient(135deg, #c85c78, #8b7ac0);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .pf-stat-lbl {
    font-size: 9px; font-weight: 700; letter-spacing: 2.5px;
    text-transform: uppercase; color: rgba(46,31,40,0.28);
  }

  /* ── Week dots ── */
  .pf-week-section {
    padding: 14px 20px;
    border-top: 1px solid rgba(200,92,120,0.07);
  }
  .pf-week-label {
    font-size: 9px; font-weight: 700; letter-spacing: 2px;
    text-transform: uppercase; color: rgba(46,31,40,0.25); margin-bottom: 9px;
    display: flex; align-items: center; gap: 6px;
  }
  .pf-week-label::after { content: ''; flex: 1; height: 1px; background: rgba(200,92,120,0.08); }
  .pf-streak-row { display: flex; gap: 5px; }
  .pf-streak-dot {
    flex: 1; height: 24px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700;
    background: rgba(200,92,120,0.07); color: rgba(46,31,40,0.28);
    transition: all 0.25s;
  }
  .pf-streak-dot.active {
    background: linear-gradient(135deg, #c85c78, #a8417e);
    color: white;
    box-shadow: 0 3px 10px rgba(200,92,120,0.3);
  }

  /* ── Quick nav ── */
  .pf-quick { padding: 8px 10px; display: flex; flex-direction: column; gap: 2px; }
  .pf-quick-btn {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 12px;
    background: transparent; border: none;
    color: rgba(46,31,40,0.48); font-size: 13px; font-weight: 500;
    cursor: pointer; text-align: left; width: 100%;
    transition: all 0.18s; font-family: 'DM Sans', sans-serif;
  }
  .pf-quick-btn:hover {
    background: linear-gradient(90deg, rgba(200,92,120,0.07), rgba(139,122,192,0.05));
    color: #c85c78;
    transform: translateX(3px);
  }
  .pf-quick-btn i { font-size: 16px; color: rgba(46,31,40,0.22); transition: color 0.18s; width: 20px; }
  .pf-quick-btn:hover i { color: #c85c78; }
  .pf-quick-btn-arrow {
    margin-left: auto; font-size: 12px;
    opacity: 0; transform: translateX(-4px);
    transition: all 0.18s; color: #c85c78;
  }
  .pf-quick-btn:hover .pf-quick-btn-arrow { opacity: 1; transform: translateX(0); }

  /* ── Tabs ── */
  .pf-tabs {
    display: flex; gap: 3px; padding: 5px;
    background: rgba(200,92,120,0.07); border-radius: 15px;
    margin-bottom: 2px;
  }
  .pf-tab {
    flex: 1; padding: 9px 10px; border-radius: 11px;
    background: transparent; border: none;
    color: rgba(46,31,40,0.4); font-size: 12px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.18s;
    display: flex; align-items: center; justify-content: center; gap: 5px;
  }
  .pf-tab i { font-size: 14px; }
  .pf-tab.active {
    background: #fff; color: #2e1f28;
    box-shadow: 0 2px 8px rgba(46,31,40,0.07), 0 1px 2px rgba(46,31,40,0.04);
  }

  /* ── Form fields ── */
  .pf-field { margin-bottom: 16px; }
  .pf-label {
    font-size: 10px; font-weight: 700; letter-spacing: 1.8px;
    text-transform: uppercase; color: rgba(46,31,40,0.35);
    display: flex; align-items: center; gap: 5px; margin-bottom: 7px;
  }
  .pf-label i { font-size: 12px; color: #c85c78; }
  .pf-label-row {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px;
  }
  .pf-label-row .pf-label { margin-bottom: 0; }
  .pf-char-count { font-size: 10px; color: rgba(46,31,40,0.25); font-weight: 600; }
  .pf-input {
    width: 100%; padding: 11px 14px;
    background: rgba(200,92,120,0.04);
    border: 1.5px solid rgba(200,92,120,0.1);
    border-radius: 12px; color: #2e1f28;
    font-size: 13.5px; font-family: 'DM Sans', sans-serif;
    outline: none; transition: all 0.18s;
  }
  .pf-input::placeholder { color: rgba(46,31,40,0.22); }
  .pf-input:focus {
    border-color: rgba(200,92,120,0.4);
    background: rgba(200,92,120,0.05);
    box-shadow: 0 0 0 3px rgba(200,92,120,0.08);
  }
  .pf-input:disabled { opacity: 0.42; cursor: not-allowed; }
  .pf-input.error { border-color: rgba(200,92,120,0.6) !important; background: rgba(200,92,120,0.06) !important; }
  .pf-input-note { font-size: 11px; color: rgba(46,31,40,0.3); margin-top: 5px; }
  .pf-field-error { font-size: 11px; color: #c85c78; margin-top: 4px; font-weight: 600; }
  .pf-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(200,92,120,0.12), transparent); margin: 18px 0; }

  /* ── Buttons ── */
  .pf-save-btn {
    width: 100%; padding: 12px 20px;
    background: linear-gradient(135deg, #c85c78, #a8417e);
    border: none; border-radius: 12px;
    color: white; font-size: 13.5px; font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.18s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow: 0 4px 16px rgba(200,92,120,0.3), 0 1px 3px rgba(200,92,120,0.15);
    letter-spacing: 0.1px;
  }
  .pf-save-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 22px rgba(200,92,120,0.38), 0 2px 4px rgba(200,92,120,0.2);
  }
  .pf-save-btn:active { transform: translateY(0); }
  .pf-save-btn:disabled { opacity: 0.48; cursor: not-allowed; transform: none; box-shadow: none; }
  .pf-danger-btn {
    width: 100%; padding: 11px;
    background: transparent;
    border: 1.5px solid rgba(200,92,120,0.2);
    border-radius: 12px; color: #c85c78;
    font-size: 13px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.18s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .pf-danger-btn:hover { background: rgba(200,92,120,0.06); border-color: rgba(200,92,120,0.35); }
  .pf-danger-btn.confirm {
    background: linear-gradient(135deg, #c85c78, #a8417e);
    color: white; border-color: transparent;
    box-shadow: 0 4px 14px rgba(200,92,120,0.28);
  }
  .pf-outline-btn {
    padding: 10px 16px;
    background: transparent;
    border: 1.5px solid rgba(200,92,120,0.18);
    border-radius: 12px; color: rgba(46,31,40,0.5);
    font-size: 13px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.18s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .pf-outline-btn:hover { border-color: rgba(200,92,120,0.35); color: #2e1f28; background: rgba(200,92,120,0.03); }

  /* ── Toast ── */
  .pf-toast {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    padding: 12px 22px; border-radius: 13px;
    font-size: 13px; font-weight: 600;
    display: flex; align-items: center; gap: 9px;
    box-shadow: 0 8px 28px rgba(46,31,40,0.18), 0 2px 6px rgba(46,31,40,0.08);
    z-index: 9999; white-space: nowrap; backdrop-filter: blur(12px);
  }

  /* ── Activity ── */
  .pf-mood-item {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 0; border-bottom: 1px solid rgba(200,92,120,0.05);
    transition: transform 0.18s;
  }
  .pf-mood-item:last-child { border-bottom: none; }
  .pf-mood-item:hover { transform: translateX(3px); }
  .pf-mood-emoji {
    font-size: 22px; flex-shrink: 0;
    width: 38px; height: 38px; border-radius: 10px;
    background: rgba(200,92,120,0.06);
    display: flex; align-items: center; justify-content: center;
  }
  .pf-mood-label { font-size: 13px; font-weight: 600; color: #2e1f28; text-transform: capitalize; }
  .pf-mood-note { font-size: 11px; color: rgba(46,31,40,0.38); margin-top: 2px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pf-mood-date { margin-left: auto; font-size: 11px; color: rgba(46,31,40,0.28); font-weight: 600; white-space: nowrap; }

  /* ── Preference row ── */
  .pf-pref-row {
    display: flex; align-items: center; gap: 13px;
    padding: 14px 0; border-bottom: 1px solid rgba(200,92,120,0.05);
    transition: transform 0.18s;
  }
  .pf-pref-row:last-child { border-bottom: none; }
  .pf-pref-row:hover { transform: translateX(2px); }
  .pf-pref-icon {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
    box-shadow: 0 2px 6px rgba(46,31,40,0.06);
  }
  .pf-pref-name { font-size: 13px; font-weight: 600; color: #2e1f28; }
  .pf-pref-sub { font-size: 11px; color: rgba(46,31,40,0.38); margin-top: 2px; }

  /* ── Joined card ── */
  .pf-joined {
    display: flex; align-items: center; gap: 13px; padding: 17px 20px;
    background: linear-gradient(135deg, rgba(200,92,120,0.03), rgba(139,122,192,0.03));
  }
  .pf-joined-icon {
    width: 38px; height: 38px; border-radius: 11px;
    background: linear-gradient(135deg, rgba(200,92,120,0.1), rgba(139,122,192,0.1));
    display: flex; align-items: center; justify-content: center;
    font-size: 17px; color: #c85c78; flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(200,92,120,0.1);
  }
  .pf-joined-name { font-size: 13px; font-weight: 600; color: #2e1f28; }
  .pf-joined-sub { font-size: 11px; color: rgba(46,31,40,0.32); margin-top: 2px; }

  /* ── AI Insight ── */
  .pf-insight {
    padding: 20px;
    background: linear-gradient(135deg, rgba(200,92,120,0.06) 0%, rgba(139,122,192,0.09) 50%, rgba(200,160,120,0.05) 100%);
    border-radius: 14px; position: relative; overflow: hidden;
    border: 1px solid rgba(200,92,120,0.1);
  }
  .pf-insight::before {
    content: '';
    position: absolute; inset: 0; border-radius: 14px;
    background: linear-gradient(135deg, rgba(200,92,120,0.12), rgba(139,122,192,0.12), rgba(200,92,120,0.05));
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    padding: 1px;
    animation: pf-border-glow 4s ease-in-out infinite;
  }
  @keyframes pf-border-glow {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  .pf-insight::after {
    content: '✦';
    position: absolute; top: 12px; right: 16px;
    font-size: 26px; color: rgba(200,92,120,0.08);
    line-height: 1;
  }
  .pf-insight-label {
    font-size: 9px; font-weight: 700; letter-spacing: 2.5px;
    text-transform: uppercase; color: #c85c78; margin-bottom: 10px;
    display: flex; align-items: center; gap: 5px;
  }
  .pf-insight-text {
    font-size: 13.5px; color: rgba(46,31,40,0.72); line-height: 1.65;
    font-style: italic; font-family: 'Playfair Display', serif; font-weight: 400;
  }
  .pf-insight-loading {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: rgba(46,31,40,0.32); font-style: italic;
  }

  /* ── Modal ── */
  .pf-modal-overlay {
    position: fixed; inset: 0;
    background: rgba(46,31,40,0.45);
    backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    z-index: 9998; padding: 20px;
  }
  .pf-modal {
    background: rgba(255,255,255,0.95); border-radius: 22px;
    padding: 30px; max-width: 370px; width: 100%;
    box-shadow: 0 24px 70px rgba(46,31,40,0.22), 0 4px 12px rgba(46,31,40,0.08);
    border: 1px solid rgba(200,92,120,0.1);
  }
  .pf-modal-title {
    font-family: 'Playfair Display', serif; font-size: 21px;
    color: #2e1f28; margin-bottom: 10px; font-weight: 500;
  }
  .pf-modal-body { font-size: 13px; color: rgba(46,31,40,0.52); line-height: 1.65; margin-bottom: 20px; }
  .pf-modal-actions { display: flex; gap: 10px; }

  /* ── Password strength ── */
  .pf-pw-strength { margin-top: 7px; display: flex; gap: 4px; }
  .pf-pw-bar {
    flex: 1; height: 3px; border-radius: 3px;
    background: rgba(200,92,120,0.1); transition: background 0.25s;
  }
  .pf-pw-bar.filled { background: linear-gradient(90deg, #c85c78, #e88ca0); }
  .pf-pw-bar.medium { background: linear-gradient(90deg, #b07a10, #d4a020); }
  .pf-pw-bar.strong { background: linear-gradient(90deg, #4d9058, #6ab878); }
  .pf-pw-label { font-size: 10.5px; color: rgba(46,31,40,0.38); margin-top: 4px; font-weight: 600; }

  /* ── Section title ── */
  .pf-section-title {
    font-size: 10px; font-weight: 700; letter-spacing: 2.5px;
    text-transform: uppercase; color: rgba(46,31,40,0.25);
    margin: 18px 0 11px;
    display: flex; align-items: center; gap: 8px;
  }
  .pf-section-title::after { content: ''; flex: 1; height: 1px; background: rgba(200,92,120,0.08); }

  /* ── Skeleton ── */
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .pf-skeleton {
    background: linear-gradient(90deg, rgba(200,92,120,0.06) 25%, rgba(200,92,120,0.11) 50%, rgba(200,92,120,0.06) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 7px; height: 14px;
  }

  /* ══════════════════════════════════════
     RESPONSIVE — tablet & mobile
  ══════════════════════════════════════ */

  @media (max-width: 880px) {
    .pf-grid { grid-template-columns: 1fr; }
    .pf-avatar-section {
      flex-direction: row; text-align: left;
      padding: 22px 20px; gap: 18px; align-items: flex-start;
    }
    .pf-avatar-section::before { display: none; }
    .pf-avatar-wrap { margin-bottom: 0; flex-shrink: 0; }
    .pf-avatar-hint { display: none; }
    .pf-avatar-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .pf-avatar-status { align-self: flex-start; }
    .pf-display-name { font-size: 18px; }
    .pf-display-email { font-size: 11px; margin-bottom: 8px; }
    .pf-badge { align-self: flex-start; }
    .pf-stats { grid-template-columns: repeat(3, 1fr); }
  }

  @media (max-width: 600px) {
    .pf { padding: 14px 14px 90px; }
    .pf-header { margin-bottom: 22px; }
    .pf-title { font-size: clamp(24px, 8vw, 32px); }
    .pf-subtitle { font-size: 12px; }
    .pf-grid { gap: 12px; }
    .pf-avatar-section {
      flex-direction: column; align-items: center;
      text-align: center; padding: 26px 16px 20px;
    }
    .pf-avatar-wrap { margin-bottom: 12px; }
    .pf-avatar-hint { display: block; }
    .pf-avatar-info { align-items: center; }
    .pf-avatar-status { align-self: center; }
    .pf-display-name { font-size: 19px; }
    .pf-badge { align-self: center; }
    .pf-card { border-radius: 18px; }
    .pf-card-body { padding: 16px 16px 18px; }
    .pf-card-header { padding: 12px 16px; }
    .pf-stat { padding: 13px 4px; }
    .pf-stat-val { font-size: 22px; }
    .pf-stat-lbl { font-size: 8px; letter-spacing: 1.5px; }
    .pf-week-section { padding: 12px 16px; }
    .pf-streak-dot { height: 22px; font-size: 9px; border-radius: 6px; }
    .pf-quick { padding: 6px 8px; }
    .pf-quick-btn { font-size: 12.5px; padding: 9px 10px; }
    .pf-tabs { padding: 4px; border-radius: 13px; }
    .pf-tab { font-size: 11.5px; padding: 8px 6px; gap: 4px; border-radius: 10px; }
    .pf-row { grid-template-columns: 1fr !important; gap: 0 !important; }
    .pf-input { font-size: 16px !important; }
    .pf-field { margin-bottom: 13px; }
    .pf-save-btn { padding: 13px 16px; font-size: 14px; border-radius: 13px; }
    .pf-danger-btn { padding: 12px; font-size: 13px; }
    .pf-outline-btn { padding: 11px 14px; font-size: 13px; }
    .pf-modal-overlay { align-items: flex-end; padding: 0; }
    .pf-modal {
      border-radius: 22px 22px 0 0; max-width: 100%;
      padding: 26px 22px 36px; width: 100%;
    }
    .pf-toast {
      bottom: 16px; left: 14px; right: 14px; transform: none;
      justify-content: center; white-space: normal; text-align: center;
    }
    .pf-insight { padding: 16px; }
    .pf-insight-text { font-size: 13px; }
    .pf-mood-note { max-width: 140px; }
    .pf-pref-sub { font-size: 10.5px; }
    .pf-orb-1 { width: 260px; height: 260px; }
    .pf-orb-2 { width: 200px; height: 200px; }
    .pf-orb-3 { display: none; }
  }

  @media (max-width: 380px) {
    .pf { padding: 12px 12px 80px; }
    .pf-title { font-size: 22px; }
    .pf-tab i { display: none; }
    .pf-tab { font-size: 11px; padding: 8px 4px; }
    .pf-stat-val { font-size: 20px; }
  }

  @keyframes spin { to { transform: rotate(360deg); } }
`

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊', sad: '😢', anxious: '😰', calm: '😌',
  excited: '🤩', tired: '😴', angry: '😤', grateful: '🙏',
  neutral: '😐', content: '🥲', overwhelmed: '😵', hopeful: '🌱',
}

export default function ProfilePage() {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [college, setCollege] = useState('')
  const [year, setYear] = useState('')
  const [handle, setHandle] = useState('')
  const [birthday, setBirthday] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwErrors, setPwErrors] = useState<string[]>([])

  const [saving, setSaving] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'preferences'>('info')
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

  const [moodCount, setMoodCount] = useState(0)
  const [habitCount, setHabitCount] = useState(0)
  const [streakCount, setStreakCount] = useState(0)
  const [joinDate, setJoinDate] = useState('')
  const [recentMoods, setRecentMoods] = useState<any[]>([])
  const [weekDots, setWeekDots] = useState<boolean[]>([false, false, false, false, false, false, false])

  const [prefs, setPrefs] = useState({
    daily_reminder: false,
    dark_mode: false,
    weekly_report: false,
    private_mode: false,
  })
  const [savingPrefs, setSavingPrefs] = useState(false)

  const [insight, setInsight] = useState('')
  const [loadingInsight, setLoadingInsight] = useState(false)
  const [insightLoaded, setInsightLoaded] = useState(false)

  const [nameError, setNameError] = useState('')
  const [handleError, setHandleError] = useState('')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUser(user)
    setJoinDate(new Date(user.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }))

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (prof) {
      const p = prof as any
      setProfile(p)
      setFullName(p.full_name || user.user_metadata?.full_name || '')
      setBio(p.bio || '')
      setCollege(p.college || '')
      setYear(p.year || '')
      setHandle(p.handle || '')
      setBirthday(p.birthday || '')
      setAvatarUrl(p.avatar_url || '')
      if (p.preferences) setPrefs(prev => ({ ...prev, ...p.preferences }))
    } else {
      setFullName(user.user_metadata?.full_name || '')
    }

    const { count: mc, data: moodData } = await supabase
      .from('mood_entries').select('id, mood, note, created_at', { count: 'exact' })
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
    setMoodCount(mc || 0)
    setRecentMoods(moodData || [])

    const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const { data: streakData } = await supabase.from('mood_entries').select('created_at')
      .eq('user_id', user.id).gte('created_at', sevenDaysAgo.toISOString())
    const loggedDays = new Set((streakData || []).map(e => new Date(e.created_at!).toDateString()))
    const dots: boolean[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      dots.push(loggedDays.has(d.toDateString()))
    }
    setWeekDots(dots)
    setStreakCount(dots.filter(Boolean).length)

    const { count: hc } = await supabase.from('habit_logs').select('id', { count: 'exact' }).eq('user_id', user.id)
    setHabitCount(hc || 0)
  }

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg); setToastType(type)
    setTimeout(() => setToast(''), 3200)
  }

  const validateInfo = () => {
    let valid = true
    if (!fullName.trim()) { setNameError('Name is required'); valid = false } else setNameError('')
    if (handle && !/^[a-z0-9_]{3,20}$/.test(handle)) {
      setHandleError('3–20 chars, lowercase letters, numbers, underscores only'); valid = false
    } else setHandleError('')
    return valid
  }

  const validatePassword = () => {
    const errors: string[] = []
    if (newPassword.length < 8) errors.push('At least 8 characters')
    if (!/[A-Z]/.test(newPassword)) errors.push('One uppercase letter')
    if (!/[0-9]/.test(newPassword)) errors.push('One number')
    if (newPassword !== confirmPassword) errors.push('Passwords do not match')
    setPwErrors(errors)
    return errors.length === 0
  }

  const pwStrength = (pw: string) => {
    let score = 0
    if (pw.length >= 8) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^a-zA-Z0-9]/.test(pw)) score++
    return score
  }
  const strength = pwStrength(newPassword)
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength]
  const strengthClass = strength <= 1 ? 'filled' : strength === 2 ? 'medium' : 'strong'

  const handleSave = async () => {
    if (!user || !validateInfo()) return
    setSaving(true)
    const { error } = await supabase.from('profiles').upsert({
      id: user.id, full_name: fullName, bio, college, year,
      handle: handle.toLowerCase(), birthday, avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    await supabase.auth.updateUser({ data: { full_name: fullName } })
    setSaving(false)
    if (error) showToast('Failed to save. Try again.', 'error')
    else showToast('Profile saved! 🌸')
  }

  const handleSavePassword = async () => {
    if (!validatePassword()) return
    setSavingPw(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPw(false)
    if (error) showToast(error.message || 'Failed to update password.', 'error')
    else { setNewPassword(''); setConfirmPassword(''); setPwErrors([]); showToast('Password updated! 🔒') }
  }

  const handleTogglePref = async (key: keyof typeof prefs) => {
    if (!user) return
    const updated = { ...prefs, [key]: !prefs[key] }
    setPrefs(updated); setSavingPrefs(true)
    await supabase.from('profiles').upsert({ id: user.id, preferences: updated, updated_at: new Date().toISOString() })
    setSavingPrefs(false)
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    setDeletingAccount(true)
    await supabase.from('profiles').delete().eq('id', user.id)
    await supabase.from('mood_entries').delete().eq('user_id', user.id)
    await supabase.auth.signOut()
    setDeletingAccount(false); setDeleteModal(false)
    window.location.href = '/goodbye'
  }

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      showToast('Only images allowed!', 'error'); return
    }
    if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2MB', 'error'); return }
    setUploading(true)
    if (avatarUrl) {
      const oldPath = avatarUrl.split('/avatars/')[1]
      if (oldPath) await supabase.storage.from('avatars').remove([oldPath])
    }
    const ext = file.name.split('.').pop()
    const filePath = `${user.id}/avatar-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
    if (uploadError) { showToast('Upload failed. Try again.', 'error'); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)
    setAvatarUrl(publicUrl)
    await supabase.from('profiles').upsert({
      id: user.id, full_name: fullName, bio, college, year,
      avatar_url: publicUrl, updated_at: new Date().toISOString(),
    })
    setUploading(false); showToast('Photo updated! 📸')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const loadInsight = async () => {
    if (insightLoaded || loadingInsight) return
    setLoadingInsight(true)
    try {
      const { data: moods } = await supabase.from('mood_entries').select('mood, note, created_at')
        .eq('user_id', user?.id).order('created_at', { ascending: false }).limit(10)
      const moodSummary = (moods || [])
        .map((m: any) => `${m.mood}${m.note ? ` (note: "${m.note}")` : ''} on ${new Date(m.created_at).toLocaleDateString()}`)
        .join('; ')
      const prompt = moodSummary.length
        ? `You are a warm, supportive wellness companion. Based on these recent mood logs: ${moodSummary}. Write a brief 1–2 sentence personal insight that's encouraging and specific. Be gentle, personal and uplifting. No generic advice.`
        : `You are a warm wellness companion. Write a single encouraging sentence for someone just starting to track their moods. Make it feel like a warm welcome, not a tutorial.`
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      const text = data.content?.map((b: any) => b.text || '').join('') || ''
      setInsight(text.trim())
    } catch {
      setInsight('Every day you show up is a small act of self-love. Keep going. 🌸')
    }
    setLoadingInsight(false); setInsightLoaded(true)
  }

  useEffect(() => {
    if (user && moodCount >= 0 && !insightLoaded) loadInsight()
  }, [user, moodCount])

  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?'

  const displayName = fullName || 'Student'
  const email = user?.email || ''
  const age = birthday ? Math.floor((Date.now() - new Date(birthday).getTime()) / (365.25 * 24 * 3600 * 1000)) : null

  const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const today = new Date().getDay()
  const reorderedDays = Array.from({ length: 7 }, (_, i) => WEEK_DAYS[(today - 6 + i + 7) % 7])

  return (
    <>
      <style>{css}</style>
      <div className="pf">

        {/* Ambient orbs */}
        <div className="pf-orb pf-orb-1" />
        <div className="pf-orb pf-orb-2" />
        <div className="pf-orb pf-orb-3" />

        {/* ── Header — slides up from below ── */}
        <motion.div
          className="pf-header"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="pf-eyebrow">
            <span className="pf-eyebrow-line" />
            your space
          </p>
          <h1 className="pf-title">
            hey, <span>{displayName.split(' ')[0]}</span> 🌸
          </h1>
          <p className="pf-subtitle">your profile, your story — beautifully yours</p>
        </motion.div>

        <div className="pf-grid">

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Avatar card — slides up from below */}
            <motion.div
              className="pf-card"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >

              <div className="pf-avatar-section">
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }} onChange={handleFileChange} />

                <div className="pf-avatar-wrap" onClick={handleAvatarClick} title="Click to change photo">
                  <div className="pf-avatar-glow" />
                  <div className="pf-avatar-ring">
                    {avatarUrl
                      ? <img src={avatarUrl} alt="avatar" className="pf-avatar-img" />
                      : <div className="pf-avatar-placeholder">{initials}</div>}
                  </div>
                  {uploading
                    ? <div className="pf-avatar-uploading"><i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite' }} /></div>
                    : <div className="pf-avatar-overlay"><i className="ti ti-camera" /></div>}
                </div>

                <div className="pf-avatar-hint">click to change photo</div>

                <div className="pf-avatar-info">
                  <div className="pf-avatar-status">
                    <div className="pf-status-dot" /> online
                  </div>
                  <div className="pf-display-name">{displayName}</div>
                  {handle && <div className="pf-display-handle">@{handle}</div>}
                  <div className="pf-display-email">{email}</div>

                  {(college || age) && (
                    <div style={{ fontSize: '11.5px', color: 'rgba(46,31,40,0.42)', marginBottom: '8px', lineHeight: 1.6 }}>
                      {college && `📚 ${college}`}{year && ` · ${year}`}
                      {age && ` · ${age} yrs`}
                    </div>
                  )}
                  {bio && (
                    <div style={{ fontSize: '12px', color: 'rgba(46,31,40,0.5)', fontStyle: 'italic', marginBottom: '14px', maxWidth: '220px', lineHeight: 1.55, fontFamily: 'Playfair Display, serif' }}>
                      "{bio}"
                    </div>
                  )}
                  <div className="pf-badge">
                    <i className="ti ti-sparkles" style={{ fontSize: '10px' }} />
                    MoodOS Student
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="pf-stats">
                {[
                  { val: moodCount, lbl: 'moods' },
                  { val: habitCount, lbl: 'habits' },
                  { val: streakCount, lbl: 'streak' },
                ].map(s => (
                  <div key={s.lbl} className="pf-stat">
                    <div className="pf-stat-val">{s.val}</div>
                    <div className="pf-stat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>

              {/* Week dots */}
              <div className="pf-week-section">
                <div className="pf-week-label">this week</div>
                <div className="pf-streak-row">
                  {weekDots.map((active, i) => (
                    <div key={i} className={`pf-streak-dot${active ? ' active' : ''}`} title={reorderedDays[i]}>
                      {reorderedDays[i]}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick nav */}
              <div className="pf-quick">
                {[
                  { icon: 'ti-mood-smile', label: 'Mood history', href: '/mood' },
                  { icon: 'ti-checks', label: 'My habits', href: '/habits' },
                  { icon: 'ti-chart-bar', label: 'Weekly insights', href: '/insights' },
                ].map(item => (
                  <a key={item.label} href={item.href} style={{ textDecoration: 'none' }}>
                    <button className="pf-quick-btn">
                      <i className={`ti ${item.icon}`} />
                      {item.label}
                      <i className="ti ti-chevron-right pf-quick-btn-arrow" />
                    </button>
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Joined card — slides up from below */}
            <motion.div
              className="pf-card"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="pf-joined">
                <div className="pf-joined-icon"><i className="ti ti-calendar-heart" /></div>
                <div>
                  <div className="pf-joined-name">Joined {joinDate}</div>
                  <div className="pf-joined-sub">blooming since day one 🌸</div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* ── RIGHT COLUMN — slides up from below ── */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >

            {/* Tabs */}
            <div className="pf-tabs">
              {(['info', 'security', 'preferences'] as const).map(tab => (
                <button
                  key={tab}
                  className={`pf-tab${activeTab === tab ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab)}>
                  <i className={`ti ${tab === 'info' ? 'ti-user' : tab === 'security' ? 'ti-lock' : 'ti-settings'}`} />
                  {tab === 'info' ? 'profile' : tab === 'security' ? 'security' : 'preferences'}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">

              {/* INFO TAB */}
              {activeTab === 'info' && (
                <motion.div key="info" className="pf-card"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.22 }}>
                  <div className="pf-card-header">
                    <div className="pf-card-header-icon" style={{ background: 'rgba(200,92,120,0.08)' }}>
                      <i className="ti ti-user" style={{ color: '#c85c78' }} />
                    </div>
                    <span className="pf-card-header-title">personal info</span>
                  </div>
                  <div className="pf-card-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '13px' }} className="pf-row">
                      <div className="pf-field">
                        <label className="pf-label"><i className="ti ti-user" /> full name *</label>
                        <input className={`pf-input${nameError ? ' error' : ''}`} value={fullName}
                          onChange={e => { setFullName(e.target.value); setNameError('') }} placeholder="Your full name" />
                        {nameError && <p className="pf-field-error">{nameError}</p>}
                      </div>
                      <div className="pf-field">
                        <label className="pf-label"><i className="ti ti-at" /> username</label>
                        <input className={`pf-input${handleError ? ' error' : ''}`} value={handle}
                          onChange={e => { setHandle(e.target.value.toLowerCase()); setHandleError('') }} placeholder="your_handle" />
                        {handleError && <p className="pf-field-error">{handleError}</p>}
                      </div>
                    </div>

                    <div className="pf-field">
                      <label className="pf-label"><i className="ti ti-mail" /> email</label>
                      <input className="pf-input" value={email} disabled />
                      <p className="pf-input-note">Email cannot be changed here.</p>
                    </div>

                    <div className="pf-field">
                      <div className="pf-label-row">
                        <label className="pf-label"><i className="ti ti-writing" /> bio</label>
                        <span className="pf-char-count">{bio.length}/120</span>
                      </div>
                      <input className="pf-input" value={bio} maxLength={120}
                        onChange={e => setBio(e.target.value)} placeholder="Something about you..." />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '13px' }} className="pf-row">
                      <div className="pf-field">
                        <label className="pf-label"><i className="ti ti-school" /> college</label>
                        <input className="pf-input" value={college} onChange={e => setCollege(e.target.value)} placeholder="Your college" />
                      </div>
                      <div className="pf-field">
                        <label className="pf-label"><i className="ti ti-calendar" /> year</label>
                        <input className="pf-input" value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. Final year" />
                      </div>
                      <div className="pf-field">
                        <label className="pf-label"><i className="ti ti-cake" /> birthday</label>
                        <input className="pf-input" type="date" value={birthday} onChange={e => setBirthday(e.target.value)} />
                      </div>
                    </div>

                    <div className="pf-divider" />
                    <button className="pf-save-btn" onClick={handleSave} disabled={saving}>
                      {saving
                        ? <><i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite' }} /> saving...</>
                        : <><i className="ti ti-device-floppy" /> save changes</>}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* SECURITY TAB */}
              {activeTab === 'security' && (
                <motion.div key="security" className="pf-card"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.22 }}>
                  <div className="pf-card-header">
                    <div className="pf-card-header-icon" style={{ background: 'rgba(139,122,192,0.1)' }}>
                      <i className="ti ti-lock" style={{ color: '#8b7ac0' }} />
                    </div>
                    <span className="pf-card-header-title">security</span>
                  </div>
                  <div className="pf-card-body">
                    <div className="pf-section-title">change password</div>

                    <div className="pf-field">
                      <label className="pf-label"><i className="ti ti-lock" /> new password</label>
                      <input className="pf-input" type="password" value={newPassword}
                        onChange={e => { setNewPassword(e.target.value); setPwErrors([]) }}
                        placeholder="At least 8 characters" />
                      {newPassword && (
                        <>
                          <div className="pf-pw-strength">
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} className={`pf-pw-bar${i <= strength ? ` ${strengthClass}` : ''}`} />
                            ))}
                          </div>
                          <div className="pf-pw-label">{strengthLabel}</div>
                        </>
                      )}
                    </div>

                    <div className="pf-field">
                      <label className="pf-label"><i className="ti ti-lock-check" /> confirm password</label>
                      <input className={`pf-input${confirmPassword && confirmPassword !== newPassword ? ' error' : ''}`}
                        type="password" value={confirmPassword}
                        onChange={e => { setConfirmPassword(e.target.value); setPwErrors([]) }}
                        placeholder="Confirm new password" />
                      {confirmPassword && confirmPassword !== newPassword && (
                        <p className="pf-field-error">Passwords do not match</p>
                      )}
                    </div>

                    {pwErrors.length > 0 && (
                      <div style={{ padding: '11px 14px', background: 'rgba(200,92,120,0.06)', borderRadius: '11px', marginBottom: '13px', border: '1px solid rgba(200,92,120,0.12)' }}>
                        {pwErrors.map((e, i) => (
                          <div key={i} style={{ fontSize: '12px', color: '#c85c78', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: i < pwErrors.length - 1 ? '4px' : 0 }}>
                            <i className="ti ti-x" style={{ fontSize: '11px' }} /> {e}
                          </div>
                        ))}
                      </div>
                    )}

                    <button className="pf-save-btn" style={{ marginBottom: '24px' }}
                      onClick={handleSavePassword} disabled={savingPw || !newPassword}>
                      {savingPw
                        ? <><i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite' }} /> updating...</>
                        : <><i className="ti ti-lock" /> update password</>}
                    </button>

                    <div className="pf-section-title">session</div>
                    <button className="pf-outline-btn" style={{ width: '100%', marginBottom: '20px' }}
                      onClick={async () => { await supabase.auth.signOut(); window.location.href = '/login' }}>
                      <i className="ti ti-logout" /> sign out of all devices
                    </button>

                    <div style={{ padding: '16px', background: 'rgba(200,92,120,0.03)', border: '1.5px solid rgba(200,92,120,0.12)', borderRadius: '14px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#c85c78', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1.8px' }}>
                        ⚠ Danger zone
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(46,31,40,0.4)', marginBottom: '13px', lineHeight: 1.6 }}>
                        Deleting your account is permanent and cannot be undone. All your mood logs, habits, and profile data will be erased.
                      </div>
                      <button className="pf-danger-btn" onClick={() => setDeleteModal(true)}>
                        <i className="ti ti-trash" /> delete my account
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PREFERENCES TAB */}
              {activeTab === 'preferences' && (
                <motion.div key="preferences" className="pf-card"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.22 }}>
                  <div className="pf-card-header">
                    <div className="pf-card-header-icon" style={{ background: 'rgba(77,144,88,0.1)' }}>
                      <i className="ti ti-settings" style={{ color: '#4d9058' }} />
                    </div>
                    <span className="pf-card-header-title">preferences</span>
                    {savingPrefs && (
                      <i className="ti ti-loader-2" style={{ fontSize: '13px', color: '#c85c78', animation: 'spin 0.8s linear infinite', marginLeft: 'auto' }} />
                    )}
                  </div>
                  <div className="pf-card-body">
                    {[
                      { key: 'daily_reminder', icon: 'ti-bell', label: 'Daily mood reminder', sub: 'Nudge to log your mood each evening', color: '#c85c78' },
                      { key: 'dark_mode', icon: 'ti-moon', label: 'Dark mode', sub: 'Switch to a darker theme', color: '#8b7ac0' },
                      { key: 'weekly_report', icon: 'ti-chart-bar', label: 'Weekly AI report', sub: 'Get an AI-powered weekly mood summary', color: '#4d9058' },
                      { key: 'private_mode', icon: 'ti-eye-off', label: 'Private mode', sub: 'Blur sensitive data on-screen', color: '#b07a10' },
                    ].map(pref => (
                      <div key={pref.key} className="pf-pref-row">
                        <div className="pf-pref-icon" style={{ background: `${pref.color}14`, color: pref.color }}>
                          <i className={`ti ${pref.icon}`} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="pf-pref-name">{pref.label}</div>
                          <div className="pf-pref-sub">{pref.sub}</div>
                        </div>
                        <Toggle
                          color={pref.color}
                          value={prefs[pref.key as keyof typeof prefs]}
                          onChange={() => handleTogglePref(pref.key as keyof typeof prefs)}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Insight card — slides up from below */}
            <motion.div
              className="pf-card"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.30, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="pf-card-header">
                <div className="pf-card-header-icon" style={{ background: 'rgba(139,122,192,0.1)' }}>
                  <i className="ti ti-sparkles" style={{ color: '#8b7ac0' }} />
                </div>
                <span className="pf-card-header-title">your insight</span>
                <button onClick={() => { setInsightLoaded(false); setInsight(''); loadInsight() }}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'rgba(46,31,40,0.28)', padding: '4px', borderRadius: '7px', transition: 'all 0.18s' }}
                  title="Refresh insight">
                  <i className="ti ti-refresh" />
                </button>
              </div>
              <div className="pf-card-body">
                <div className="pf-insight">
                  <div className="pf-insight-label">
                    <i className="ti ti-sparkles" style={{ fontSize: '11px' }} />
                    ai reflection
                  </div>
                  {loadingInsight ? (
                    <div className="pf-insight-loading">
                      <i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite' }} />
                      reflecting on your journey...
                    </div>
                  ) : insight ? (
                    <div className="pf-insight-text">{insight}</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                      <div className="pf-skeleton" style={{ width: '100%' }} />
                      <div className="pf-skeleton" style={{ width: '75%' }} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Recent mood logs — slides up from below */}
            <motion.div
              className="pf-card"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="pf-card-header">
                <div className="pf-card-header-icon" style={{ background: 'rgba(176,122,16,0.08)' }}>
                  <i className="ti ti-activity" style={{ color: '#b07a10' }} />
                </div>
                <span className="pf-card-header-title">recent mood logs</span>
                {moodCount > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'rgba(46,31,40,0.28)', fontWeight: 700 }}>
                    {moodCount} total
                  </span>
                )}
              </div>
              <div className="pf-card-body">
                {recentMoods.length > 0 ? (
                  recentMoods.map((m: any) => (
                    <div key={m.id} className="pf-mood-item">
                      <div className="pf-mood-emoji">
                        {MOOD_EMOJIS[m.mood?.toLowerCase()] || '🌸'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="pf-mood-label">{m.mood}</div>
                        {m.note && <div className="pf-mood-note">{m.note}</div>}
                      </div>
                      <div className="pf-mood-date">
                        {new Date(m.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '28px 16px', color: 'rgba(46,31,40,0.25)', fontSize: '12.5px' }}>
                    <div style={{ fontSize: '30px', marginBottom: '8px' }}>🌱</div>
                    start logging moods to see your activity
                  </div>
                )}
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div className="pf-modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setDeleteModal(false) }}>
            <motion.div className="pf-modal"
              initial={{ scale: 0.9, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}>
              <div style={{ fontSize: '30px', marginBottom: '11px' }}>💔</div>
              <div className="pf-modal-title">Delete your account?</div>
              <div className="pf-modal-body">
                This will permanently delete all your mood logs, habits, and profile data. This action <strong>cannot be undone</strong>.<br /><br />
                Type <strong>DELETE</strong> to confirm.
              </div>
              <input className="pf-input" style={{ marginBottom: '16px' }} value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)} placeholder="Type DELETE to confirm" />
              <div className="pf-modal-actions">
                <button className="pf-outline-btn" style={{ flex: 1 }} onClick={() => { setDeleteModal(false); setDeleteConfirmText('') }}>
                  cancel
                </button>
                <button className={`pf-danger-btn${deleteConfirmText === 'DELETE' ? ' confirm' : ''}`} style={{ flex: 1 }}
                  disabled={deleteConfirmText !== 'DELETE' || deletingAccount} onClick={handleDeleteAccount}>
                  {deletingAccount
                    ? <><i className="ti ti-loader-2" style={{ animation: 'spin 0.8s linear infinite' }} /> deleting...</>
                    : <><i className="ti ti-trash" /> delete</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className="pf-toast"
            initial={{ opacity: 0, y: 18, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 18, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            style={{ background: toastType === 'error' ? 'rgba(61,30,30,0.96)' : 'rgba(46,31,40,0.96)' }}>
            <i className={`ti ${toastType === 'error' ? 'ti-x' : 'ti-check'}`}
              style={{ color: toastType === 'error' ? '#f09595' : '#8fc49a' }} />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Toggle({ color, value, onChange }: { color: string; value: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange} style={{
      width: '40px', height: '22px', borderRadius: '11px',
      background: value ? color : 'rgba(46,31,40,0.1)',
      position: 'relative', cursor: 'pointer',
      transition: 'background 0.22s', flexShrink: 0,
      boxShadow: value ? `0 2px 8px ${color}44` : 'none',
    }}>
      <div style={{
        position: 'absolute', top: '3px',
        left: value ? '21px' : '3px',
        width: '16px', height: '16px', borderRadius: '50%',
        background: 'white',
        boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
        transition: 'left 0.22s',
      }} />
    </div>
  )
}