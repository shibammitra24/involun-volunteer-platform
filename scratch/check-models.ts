import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function listModels() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("API Key not found");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  console.log("--- Checking v1 ---");
  try {
    // Note: The SDK doesn't have a direct listModels method on the genAI object usually, 
    // it's part of the GenerativeLanguageServiceClient in the official google-cloud/ai-platform but 
    // the simple SDK might not have it.
    // I'll try to just probe a few names.
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"];
    for (const m of models) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            await model.generateContent("test");
            console.log(`v1: ${m} works`);
        } catch (e: any) {
            console.log(`v1: ${m} failed: ${e.message}`);
        }
    }
  } catch (e) {
    console.error(e);
  }

  console.log("\n--- Checking v1beta ---");
  try {
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp", "gemini-2.0-flash"];
    for (const m of models) {
        try {
            const model = genAI.getGenerativeModel({ model: m }, { apiVersion: "v1beta" });
            await model.generateContent("test");
            console.log(`v1beta: ${m} works`);
        } catch (e: any) {
            console.log(`v1beta: ${m} failed: ${e.message}`);
        }
    }
  } catch (e) {
    console.error(e);
  }
}

listModels();
