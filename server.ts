import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Shared Gemini initialization
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim().length > 0) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Successfully initialized Gemini AI with provided process.env.GEMINI_API_KEY");
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI client:", err);
  }
} else {
  console.log("No valid GEMINI_API_KEY found, running in local fallback mode for offline/local parsing.");
}

// Check api health and API integration state
app.get("/api/state", (req, res) => {
  res.json({
    aiAvailable: !!ai,
    message: !!ai ? "Active" : "No API key loaded - Running robust local parsing"
  });
});

// Brain-dump parsing endpoint
app.post("/api/brain-dump", async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: "Please enter some thoughts first." });
  }

  // Try to use Gemini model
  if (ai) {
    try {
      const prompt = `Analyze the following chaotic brain dump of thoughts, worries, tasks, and notes from an ADHD user. 
Unravel them into discrete, highly actionable, human-sized, low-friction tasks.
Place each task into exactly one of these categories:
- 'today' (things to focus on right now or today)
- 'later' (non-urgent, someday)
- 'tiny-win' (extremely low friction tasks like drinking water, breathing, stretching, taking a pill, tidying 1 item)
- 'important' (highly critical, urgent, time-sensitive tasks)

Assign each an energy level:
- 'low' (low physical/mental focus required)
- 'medium' (average cognitive task)
- 'deep' (demands intense hyperfocus or quiet concentration)

Ensure you return a valid JSON array matching this exact schema block, with NO markdown ticks or extra text:
[
  {
    "text": "Clean computer screen",
    "category": "tiny-win",
    "energyLevel": "low"
  }
]

Keep descriptions very gentle, non-overwhelming, short, and starting with a clear action verb.

Brain Dump Content:
"${text.replace(/"/g, '\\"')}"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                category: { type: Type.STRING, enum: ["today", "later", "tiny-win", "important"] },
                energyLevel: { type: Type.STRING, enum: ["low", "medium", "deep"] }
              },
              required: ["text", "category", "energyLevel"]
            }
          }
        }
      });

      const resultText = response.text;
      if (resultText) {
        const parsedTasks = JSON.parse(resultText.trim());
        return res.json({ tasks: parsedTasks, source: "gemini" });
      }
    } catch (err: any) {
      console.warn("Gemini service failed or timed out. Falling back to robust offline parser:", err.message || err);
    }
  }

  // Robust, elegant offline keywords parser (fallback)
  // Split the chaotic text on newlines, periods, commas, semi-colons or keywords like "and", "then", "also"
  const sentences = text
    .split(/(?:[.\n;,]|\band\b|\bthen\b|\balso\b)/i)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 3 && !/^(so|and|then|but|really|very|i|to|should|must|want)$/i.test(s));

  const localParsed = sentences.map((sentence: string) => {
    const textLower = sentence.toLowerCase();
    
    // Choose Category
    let category: 'today' | 'later' | 'tiny-win' | 'important' = 'today';
    if (/(?:water|stretch|breathe|drink|tidy|pill|meds|eat|snack|shower|teeth|brush|nap|walk|window|air)/i.test(textLower)) {
      category = 'tiny-win';
    } else if (/(?:urgent|important|must|deadline|exam|bill|pay|rent|cash|tax|bank|call|dentist|doctor|interview)/i.test(textLower)) {
      category = 'important';
    } else if (/(?:later|tomorrow|next week|someday|eventually|future|maybe|whenever)/i.test(textLower)) {
      category = 'later';
    }

    // Choose Energy Level
    let energyLevel: 'low' | 'medium' | 'deep' = 'medium';
    if (/(?:water|stretch|breathe|tidy|pill|meds|drink|walk|shower|brush)/i.test(textLower)) {
      energyLevel = 'low';
    } else if (/(?:study|write|code|report|plan|build|program|exam|math|compose|organize|design|prepare)/i.test(textLower)) {
      energyLevel = 'deep';
    }

    // Clean description
    let cleanText = sentence
      .replace(/^(i need to|i have to|i should|i want to|must|please|can someone|need to|have to|remember to|don't forget to|go to|buy a|get a)\s+/i, '')
      .replace(/^\s*[-*•+]\s*/, '');
    
    if (cleanText.length > 0) {
      cleanText = cleanText.charAt(0).toUpperCase() + cleanText.slice(1);
    } else {
      cleanText = sentence;
    }

    return {
      text: cleanText,
      category,
      energyLevel
    };
  });

  return res.json({ tasks: localParsed, source: "local-parser" });
});

// Setup development server or production direct routing
async function initServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Mounted Vite middleware (dev mode)");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from: " + distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FocusFlow Server running at http://localhost:${PORT}`);
  });
}

initServer().catch((err) => {
  console.error("Critical: Server initialization failed!", err);
});
