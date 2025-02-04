require('dotenv').config();
console.log("🔑 API Key carregada:", process.env.GEMINI_API_KEY); // Verificar se a chave está sendo lida

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Diga Olá!");
    const response = await result.response;
    console.log("✅ Resposta do Gemini AI:", response.text());
  } catch (error) {
    console.error("❌ Erro ao conectar ao Gemini AI:", error);
  }
}

testGemini();
