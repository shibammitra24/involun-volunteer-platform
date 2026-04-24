import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function checkModels() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) return;

    // Use a direct fetch to list models since the SDK doesn't expose it easily
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log("Available models:");
        if (data.models) {
            data.models.forEach((m: any) => console.log(`- ${m.name}`));
        } else {
            console.log("No models found or error:", JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

checkModels();
