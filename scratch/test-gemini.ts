import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function listModels() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Missing GOOGLE_GEMINI_API_KEY");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // There is no direct listModels in the client SDK for web/node usually?
        // Actually, let's just try gemini-pro
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("Gemini Pro works!");
    } catch (e) {
        console.error("Gemini Pro failed:", e);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Gemini 1.5 Flash works!");
    } catch (e) {
        console.error("Gemini 1.5 Flash failed:", e);
    }
}

listModels();
