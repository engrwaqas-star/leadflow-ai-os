# Kashi Agency - AI Client Acquisition & Outreach CRM

> **All-in-one AI-powered B2B lead generation, automated website audit engine, cold outreach pipeline, and agency co-pilot.**

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38bdf8)
![Gemini AI](https://img.shields.io/badge/Gemini_API-3.6_Flash-8e44ad)

---

## 🌟 Overview

**Kashi Agency** is a full-featured client acquisition platform built for agencies, freelancers, and B2B sales teams. It streamlines finding prospective clients, running automated UI/UX and SEO website audits, capturing real website screenshots, generating hyper-personalized cold emails, and closing deals using an AI Co-Pilot (**Agent Kashi**).

The application is engineered to work **100% free** using standard free-tier API keys, and includes **Offline Mode persistence** so you can manage your CRM database, outreach logs, and deal pipelines even without an active internet connection.

---

## 🚀 Key Features

### 1. 🔍 Lead Discovery & CRM Database
- **Client Finder**: Search prospective leads by industry, location, and web presence.
- **Pipeline Board**: Drag-and-drop Kanban board (*Not Contacted, Contacted, Negotiating, Closed Won, Closed Lost*).
- **Custom Client Management**: Store detailed contact records, estimated revenue, website audit status, and notes.

### 2. 📸 Automated Website Audit & Real Screenshot Capture
- **Real-Time Website Screenshots**: Dual-tier screenshot fetching engine (`thum.io` + WordPress `mshots` fallback) that loads clean, high-resolution website captures for any client URL.
- **AI Audit Scoring**: Analyzes client sites for mobile responsiveness, page speed, CTA clarity, and SEO metrics.

### 3. 🤖 Agent Kashi (AI Agency Co-Pilot)
- **AI Task Automation**: Delegate client research, email drafting, and pitch deck creation to your built-in agency assistant.
- **Smart Prompts & Quick Actions**: Generate audits, log team progress, or schedule follow-up emails in one click.

### 4. 📬 Cold Outreach & Inbox Suite
- **AI Email Generator**: Personalized cold outreach templates tailored to audit findings.
- **Follow-up Automation**: Schedule multi-touch email sequences and track open/reply rates.
- **WhatsApp & Meeting Tracker**: Log WhatsApp conversations and schedule client discovery calls.

### 5. 📽️ Team Activity & Proof of Work
- **Video Walkthrough Simulation**: Interactive video player demonstrating website audit teardowns for clients with real-time cursor navigation overlays.
- **Media Vault**: Organizes client audit files, screenshot previews, and shareable proposal links in structured folders.

### 6. 🌐 Zero-Cost & Full Offline Support
- **100% Free API Compatibility**: Operates seamlessly with free Google Gemini API keys.
- **Offline Persistence**: LocalStorage caching saves all lead updates, notes, email drafts, and outreach logs locally when working offline.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React Icons
- **AI Engine**: `@google/genai` (Gemini 3.6 Flash)
- **Data Persistence**: LocalStorage with automatic browser sync
- **Deployment**: Compatible with Vercel, Netlify, Cloud Run, and GitHub Pages

---

## 📦 Local Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/kashi-agency-crm.git
   cd kashi-agency-crm
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables** (Optional for AI Features)
   Create a `.env` file in the project root:
   ```env
   GEMINI_API_KEY=your_free_gemini_api_key_here
   ```
   > You can get a **free Gemini API key** from [Google AI Studio](https://aistudio.google.com/).

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Build for Production**
   ```bash
   npm run build
   ```

---

## ⚡ Deploying to GitHub Pages (100% Free Hosting)

This project includes a pre-configured **GitHub Actions Workflow** (`.github/workflows/deploy.yml`) that automatically builds and publishes the web application to GitHub Pages whenever code is pushed.

### Method A: Automatic Deployment via GitHub Actions
1. Go to your repository on GitHub: `https://github.com/engrwaqas-star/leadflow-ai-os`
2. Click **Settings** -> **Pages** (in the left sidebar under *Code and automation*).
3. Under **Build and deployment** -> **Source**, select **GitHub Actions**.
4. Push any commit or trigger the workflow manually in the **Actions** tab. Your live app will be published at:
   `https://engrwaqas-star.github.io/leadflow-ai-os/`

### Method B: Manual Command Line Deploy
If you want to deploy from your terminal:
```bash
npm run deploy
```
This builds the site and pushes the output directly to the `gh-pages` branch.

---

## 🔑 How to Use 100% Free Without Hosting Costs

1. **Free Hosting**: You can deploy this app for $0/month on:
   - **Vercel** (`vercel deploy`)
   - **Netlify** (`netlify deploy`)
   - **GitHub Pages** (Static SPA build)
2. **Free API Key**: Obtain a standard Gemini API Key from Google AI Studio at no cost.
3. **Offline Working**: When internet is disconnected, the top banner updates to **Offline Mode Ready**, preserving all changes locally in your browser!

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for details.
