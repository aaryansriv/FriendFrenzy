# FriendFrenzy ⚡️ - The AI Social Verdict Engine

**FriendFrenzy** is a high-octane, anonymous social polling platform designed to spill the tea with surgical precision. It combines the raw honesty of anonymous voting with a "Savage AI" personality that analyzes your friend group's dynamics, roasts the results, and even curates a soul-mate Spotify playlist for the squad.

---

## 🚀 The Hook: Why it's Different
Most poll apps are boring. FriendFrenzy is a **Social Verdict Engine**.
- **The "Frenzy AI":** Unlike vanilla charts, our AI (powered by OpenRouter/Gemma-3) analyzes voting patterns to assign unhinged archetypes (like *Chaos Gremlin* or *NPC Energy*) and generates "Character Files" for every participant.
- **Sonic Personality Match:** The AI curates a Irony-rich Spotify playlist where each friend is assigned a song that matches their "questionable vibes" based on the poll data.
- **Zero-Friction Anonymity:** No accounts required for voters. Just pure, unadulterated chaos.

---

## 🛠 Tech Stack (The "Secret Sauce")
- **Frontend:** Next.js 15 (App Router) + Tailwind CSS + Lucide Icons.
- **Backend:** Supabase (PostgreSQL) for real-time data and status tracking.
- **Auth:** Clerk (for Admin Dashboard users).
- **AI Engine:** OpenRouter API (Gemma-3-4b-it) for unhinged social analysis.
- **Animations:** Custom CSS micro-animations + Framer Motion for that "premium" feel.

---

## 💎 Key Features
- **Pair Frenzy:** A unique mode where you compare two friends (e.g., "75% Brad vs 25% Chad") to analyze specific social dynamics.
- **Anonymous Confessions:** Voters can drop "leaked lore" into the poll, which the AI then incorporates into the final roasts.
- **Admin Dashboard:** Creators get a private link to close the poll, check detailed stats, and share the final "Verdict" with the group.
- **Savage Roasts:** The AI doesn't hold back—using Indian cultural references and group-chat-style humor to make the results screenshot-worthy.

---

## 🧠 Smart Implementation
- **API Optimization:** Each poll is limited to exactly ONE AI Roast to maintain high-quality outputs and keep API calls efficient.
- **Data Integrity:** Implemented a robust "Creator-User" linking system that merges session data with authenticated accounts.
- **Mobile First:** Designed for the group chat—perfectly responsive for the "link-in-bio" or WhatsApp-forward use case.

---

## ⚡️ Prompt for ChatGPT (To generate your LinkedIn Post)
> *Copy-paste this README into ChatGPT and ask:*
> "I built this project called FriendFrenzy. Based on this README, create a high-engagement LinkedIn post. Make it sound professional yet exciting, focus on the 'Frenzy AI' feature, and highlight the tech stack (Next.js 15, Supabase, OpenRouter). Include a 'Build in Public' vibe and talk about how I solved the problem of making anonymous polls fun again."

---

## 🏗 Setup & Installation
1. `npm install`
2. Configure `.env.local` with Supabase, Clerk, and OpenRouter keys.
3. `npm run dev`
4. Prepare for emotional damage from the AI.
