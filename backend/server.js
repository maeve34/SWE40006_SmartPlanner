import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import aiRoutes from "./routes/ai.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.BASE_URL,
  })
);

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.GITHUB_OPENAI_API_KEY,
  baseURL: "https://models.inference.ai.azure.com",
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/ai", aiRoutes);

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

    const text = response.choices[0].message.content;
    const match = text.match(/\[[\s\S]*\]/);

    let parsed = [];
    try {
      parsed = match ? JSON.parse(match[0]) : [];
    } catch (e) {
      console.error("JSON parse failed:", e);
    }

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
