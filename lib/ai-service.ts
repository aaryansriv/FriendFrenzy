// lib/ai-service.ts

export interface AIServiceResponse {
    friendJudgments: { name: string; judgment: string }[];
    songDedications: {
        name: string;
        song: string;
        artist: string;
        vibe: string;
        reason: string;
    }[];
    groupVerdict: { summary: string };
    pairCommentaries: { pair: string; commentary: string }[];
}

const MODELS_TO_TRY = [
    "deepseek/deepseek-r1-distill-llama-70b:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "google/gemini-2.0-flash-lite-preview-02-05:free",
    "mistralai/mistral-small-3.1-24b-instruct:free"
];

export async function generatePollInsights(
    pollData: any,
    results: any[],
    friends: any[],
    confessions: string[] = []
): Promise<AIServiceResponse> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    console.log(`AI_SERVICE: Starting analysis for ${friends.length} friends...`);
    console.log(`AI_SERVICE: Found ${results.length} vote entries.`);
    console.log(`AI_SERVICE: API Key detected: ${!!apiKey}`);

    if (!apiKey) {
        console.error("AI_SERVICE: OPENROUTER_API_KEY is missing from process.env");
        return getFallbackInsights(friends);
    }

    /* -------------------- SIGNAL EXTRACTION -------------------- */
    const dominance: Record<string, number> = {};
    const categories: Record<string, string[]> = {};

    results.forEach(r => {
        const name = (Array.isArray(r.friends) ? r.friends[0]?.name : r.friends?.name) || 'Unknown';
        if (!name || name === 'Unknown') return;
        dominance[name] = (dominance[name] || 0) + (r.vote_count || 0);
        if (r.category) {
            if (!categories[name]) categories[name] = [];
            categories[name].push(r.category);
        }
    });

    const pollSummary = {
        friends: friends.map(f => f.name),
        dominance,
        categories,
        topDog: Object.entries(dominance).sort((a, b) => b[1] - a[1])[0] || ["None", 0],
        ghost: Object.entries(dominance).sort((a, b) => a[1] - b[1])[0] || ["None", 0],
        confessions
    };

    const systemPrompt = `You are NOT an assistant.
You are the funniest, most observant person in the group chat who finally got access to the poll results and anonymous confessions.

Your job is to JUDGE the group.

This is not therapy.
This is not polite.
This is playful, clever, slightly unhinged social analysis.

-----------------------------
CORE BEHAVIOR
-----------------------------
- Be DANK, not wholesome
- Be Indian, use Indian references
- Be FUNNY, not safe
- Be OBSERVATIONAL, not random
- Sound like Twitter + group chat humor
- Everything should feel screenshot-worthy

-----------------------------
INPUT YOU RECEIVE
-----------------------------
You are given:
- Poll dominance patterns (who wins most, who barely appears)
- Category bias (party, naughty, mixed, etc.)
- Anonymous confessions from voters
These are INSIDE JOKES. Use them.

-----------------------------
FRIEND JUDGMENTS
-----------------------------
For EACH friend:
- Assign them ONE hidden archetype (do NOT name it explicitly)
- Archetypes must be unique per poll
- Examples: Chaos Gremlin, Pretty Privilege, NPC Energy, Silent Menace, Main Character Delusion, Emotional Support Friend, Professional Instigator

RULES:
- Max 20 words per judgment
- No two judgments may sound alike
- Use contrast (winner vs ghost vs mid)
- Include ONE unexpected metaphor or pop-culture-style or bollywood comparison
- Never repeat phrases across friends
- Roast behavior, not identity
- If someone dominates → exaggerate power
- If someone barely appears → roast invisibility

-----------------------------
CONFESSIONS (VERY IMPORTANT)
-----------------------------
Confessions are anonymous.
Treat them like leaked group-chat lore.
Twist them into jokes.
Never quote them directly.
Imply them creatively.

-----------------------------
GROUP VERDICT
-----------------------------
Write ONE sentence that:
- Feels like a viral tweet
- Explains the group dynamic
- Mentions chaos level
- Sounds like it was typed at 2:17 AM
No generic summaries.

-----------------------------
PAIR COMMENTARY (PAIR FRENZY)
-----------------------------
For notable pairs:
- Be brutally funny but friendly
- Interpret percentages like gossip
- Use "this could either..." logic
- One sentence per pair
No repeats.

-----------------------------
SONG DEDICATIONS (REAL SONGS ONLY)
-----------------------------
For EACH friend:
- Pick a REAL, globally popular song
- Artists must be mainstream (Top 50–level)
  Examples allowed:
  Taylor Swift, The Weeknd, Drake, Travis Scott,
  Dua Lipa, Billie Eilish, Bad Bunny, Honey Singh,
  Post Malone, SZA, Rihanna, Eminem

RULES:
- Prefer IRONIC matches over obvious ones
- Loud song for quiet person, calm song for chaos person
- Include:
  - Song name
  - Artist
  - Vibe (1–2 words)
  - Short reason (max 15 words)
- No fake songs
- No niche artists

-----------------------------
STYLE CONSTRAINTS
-----------------------------
- Avoid polished writing
- Slightly unhinged > overly clever
- Run-on sentences allowed
- Dry humor preferred
- No corporate tone
- No moral lectures
- No compliments without irony

-----------------------------
ABSOLUTE BANS
-----------------------------
- No generic phrases
- No repeated metaphors
- No “safe bet”, “beautiful disaster”, “total mystery”
- No emojis spam (max 1 emoji per section if needed)
- No identity-based insults

-----------------------------
OUTPUT FORMAT (STRICT JSON)
-----------------------------
{
  "friendJudgments": [
    { "name": "Name", "judgment": "text" }
  ],
  "songDedications": [
    {
      "name": "Name",
      "song": "Song Title",
      "artist": "Artist",
      "vibe": "Vibe",
      "reason": "Short reason"
    }
  ],
  "groupVerdict": {
    "summary": "text"
  },
  "pairCommentaries": [
    {
      "pair": "A & B",
      "commentary": "text"
    }
  ]
}

If a joke might genuinely hurt someone in real life, rewrite it to target behavior or group dynamics instead.
`;

    const userPrompt = `
Data to analyze:
${JSON.stringify(pollSummary, null, 2)}
`;

    // Try models in sequence until one works
    for (const model of MODELS_TO_TRY) {
        try {
            console.log(`AI_SERVICE: Attempting generation with model: ${model}`);
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://friendfrenzy.app",
                    "X-Title": "FriendFrenzy",
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt }
                    ],
                    temperature: 0.8,
                    max_tokens: 800
                })
            });

            if (response.status === 429) {
                console.warn(`AI_SERVICE: Model ${model} is rate limited (429). Trying next...`);
                continue;
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`AI_SERVICE: Model ${model} failed (${response.status}):`, errorText);
                continue;
            }

            const data = await response.json();
            let content = data?.choices?.[0]?.message?.content;

            if (!content) {
                console.warn(`AI_SERVICE: Model ${model} returned empty content. Trying next...`);
                continue;
            }

            console.log(`AI_SERVICE: Model ${model} SUCCESS. Content length: ${content.length}`);

            // Cleanup JSON string
            content = content.trim();

            // Strip DeepSeek reasoning tokens if present
            content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

            if (content.startsWith("```")) {
                content = content.replace(/^```json/, "").replace(/^```/, "").replace(/```$/, "").trim();
            }

            return JSON.parse(content);
        } catch (error) {
            console.error(`AI_SERVICE: Exception with model ${model}:`, error);
            continue;
        }
    }

    console.error("AI_SERVICE: All models failed or were rate-limited.");
    return getFallbackInsights(friends);
}

function getFallbackInsights(friends: any[]): AIServiceResponse {
    return {
        friendJudgments: friends.map(f => ({
            name: f.name,
            judgment: `FALLBACK_GENERATION: ${f.name} somehow avoided attention and responsibility equally.`
        })),
        songDedications: friends.map(f => ({
            name: f.name,
            song: "Blinding Lights",
            artist: "The Weeknd",
            vibe: "Chaotic confidence",
            reason: "Always moving fast, rarely thinking twice."
        })),
        groupVerdict: {
            summary: "This group would survive nothing, but enjoy every second of the chaos."
        },
        pairCommentaries: []
    };
}
