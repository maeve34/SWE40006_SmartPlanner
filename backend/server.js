import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Groq from "groq-sdk";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";
import aiRoutes from "./routes/ai.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/ai", aiRoutes);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post("/api/ai/subtasks", async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Missing title or description" });
  }

  try {
    const prompt = `
      You are a productivity assistant.
      Break this task into at most 3 subtasks.
      Rules:
      - Max 3 subtasks
      - Each subtask must include EXACTLY ONE time estimate
      - Time format MUST be: "<number> min" OR "<number> hr"
      - DO NOT return ranges like "30-60 min"
      - DO NOT explain anything
      - Output JSON only, no markdown, no code block

      Task: ${title}
      Description: ${description}

      Example output:
      [
        { "name": "Research topic", "est": "30 min" },
        { "name": "Write draft", "est": "2 hr" }
      ]

      Now return result:
    `;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
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
      if (!est) return "30 min";
      if (est.includes("-")) {
        const numbers = est.match(/\d+/g);
        if (numbers && numbers.length >= 2) {
          const avg = Math.round((parseInt(numbers[0]) + parseInt(numbers[1])) / 2);
          return est.includes("hr") ? `${avg} hr` : `${avg} min`;
        }
      }
      return est;
    }

    parsed = parsed.map(item => ({
      ...item,
      est: cleanEstimate(item.est || ""),
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
    console.error("Groq API error:", err);
    res.status(500).json({ error: "AI service failed. Please try again." });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
