import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
// allow access from frontend
app.use(
  cors({
    origin: process.env.BASE_URL,
  }),
);

// when multiple environment is configured
// const allowedOrigins = [
//   "http://localhost:5173", // development
//   "https://xxx.onrender.com", // staging
//   "https://myapp.com" // production
// ];

// app.use(cors({
//   origin: function (origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   }
// }));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("SmartPlanner backend is running");
});


// Azure OpenAI Service from GitHub to generate subtasks based on task description
const openai = new OpenAI({
  apiKey: process.env.GITHUB_OPENAI_API_KEY,
  baseURL: "https://models.inference.ai.azure.com", // azure style endpoint
});

app.post("/api/ai/subtasks", async (req, res) => {
  const { title, description } = req.body;

  if (!description) {
    return res.status(400).json({ error: "Missing input" });
  }

  try {
    const prompt = `
      You are a productivity assistant.

      Break this task into at most 3 subtasks.

      Rules:
      - Max 3 subtasks
      - Each subtask must include EXACTLY ONE time estimate
      - Time format MUST be:
        - "<number> min" OR "<number> hr"
      - DO NOT return ranges
      - DO NOT explain anything
      - Output JSON only

      Task: ${title}
      Description: ${description || "None"}

      Example:
      [
        { "name": "Research topic", "est": "30 min" },
        { "name": "Write draft", "est": "2 hr" }
      ]

      Now return result:
      `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const match = text.match(/\[[\s\S]*\]/);

    // parse JSON to ensure JSON is valid
    let parsed = [];

    try {
        parsed = match ? JSON.parse(match[0]) : [];
      } catch (e) {
        console.error("JSON parse failed:", e);
      }

    // ensure estimated time follows valid format for display purpose 
    function cleanEstimate(est) {
      if (est.includes("-")) {
        const [min, max] = est.split("-").map(s => parseInt(s));
        return Math.round((min + max) / 2) + " min";
      }
      return est;
    }

    parsed = parsed.map(item => ({
      ...item,
      est: cleanEstimate(item.est || "")
    }));

    // fallback when service free tier rate limit is met (development purpose)
    if (!parsed.length) {
      return res.json([
        { name: "Research & planning", est: "30 min" },
        { name: "Implementation", est: "2 hr" },
        { name: "Review & refine", est: "1 hr" },
      ]);
    }

    res.json(parsed);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI failed" });
  }
});

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});
