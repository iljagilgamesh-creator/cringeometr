import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

app.post("/api/cringe", async (req, res) => {
  try {
    const { bio, mode = "normal" } = req.body;

    if (!bio || typeof bio !== "string") {
      return res.status(400).json({ error: "Нет текста для анализа." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Нет GEMINI_API_KEY в файле .env." });
    }

    let tone = "язвительно, смешно, но не жестоко";

    if (mode === "hard") {
      tone = "жестче, острее, мемнее, но без травли и унижения личности";
    }

    if (mode === "soft") {
      tone = "мягче, дружелюбнее, с поддержкой, но всё равно честно";
    }

    const prompt = `
Ты — редактор молодежных профилей и био.

Твоя задача: разобрать текст профиля пользователя.
Пиши по-русски.
Тон: ${tone}.

Правила:
- Критикуй только текст, стиль и самопрезентацию.
- Не унижай внешность, пол, национальность, здоровье, религию или личные признаки.
- Не ставь диагнозы.
- Не будь занудным.
- Результат должен быть смешным и пригодным для сайта "Кринжометр".
- Верни только валидный JSON без markdown и без пояснений.

Текст пользователя:
${bio}

Формат JSON:
{
  "score": 75,
  "vibe": "короткий вайб",
  "problem": "что не так с текстом",
  "roast": "жесткий, но не злой комментарий",
  "calm": "спокойная улучшенная версия био",
  "bold": "дерзкая улучшенная версия био",
  "funny": "смешная улучшенная версия био"
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    let text = response.text || "";
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    const data = JSON.parse(text);

    res.json({
      score: Number(data.score) || 50,
      vibe: data.vibe || "Непонятный, но живой вайб",
      problem: data.problem || "Текст можно сделать конкретнее.",
      roast: data.roast || "Био пока выглядит как черновик.",
      calm: data.calm || "Люблю простое общение и людей без лишнего театра.",
      bold: data.bold || "Не пытаюсь понравиться всем. Мне достаточно своих людей.",
      funny: data.funny || "Вроде нормальный человек, но иногда исчезаю без объяснений.",
    });
    } catch (error) {
    console.error("GEMINI ERROR:", error);

    res.status(500).json({
      error: error?.message || "Неизвестная ошибка Gemini",
    });
  }
});

app.listen(port, () => {
  console.log(`Кринжометр запущен: http://localhost:${port}`);
});