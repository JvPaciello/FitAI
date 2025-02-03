require('dotenv').config();
const venom = require('venom-bot');
const { Configuration, OpenAIApi } = require('openai');
const { generatePDF } = require('./pdfGenerator'); // Função para criar PDF
const express = require('express');
const mongoose = require('mongoose');

// Configuração da API OpenAI
const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
const openai = new OpenAIApi(configuration);

// Inicializa o WhatsApp Bot
venom.create().then((client) => start(client)).catch((error) => console.log(error));

// Conectar ao Banco de Dados (MongoDB)
mongoose.connect('mongodb://localhost:27017/fitbot', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  phone: String,
  goal: String, // Exemplo: emagrecer, ganhar massa
  mealPlan: String,
  workoutPlan: String
});
const User = mongoose.model('User', userSchema);

// Função principal do bot
async function start(client) {
  client.onMessage(async (message) => {
    if (message.isGroupMsg === false) {
      let response = await getAIResponse(message.body, message.from);
      client.sendText(message.from, response);

      if (message.body.toLowerCase() === "gerar pdf") {
        generatePDF(message.from);
        client.sendText(message.from, "Seu plano foi gerado e enviado em PDF.");
      }
    }
  });
}

// Função para obter resposta da IA personalizada
async function getAIResponse(userMessage, userPhone) {
  let user = await User.findOne({ phone: userPhone });
  if (!user) {
    user = new User({ phone: userPhone, goal: "", mealPlan: "", workoutPlan: "" });
    await user.save();
  }

  const response = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [{ role: "user", content: `Objetivo: ${user.goal}. Mensagem do usuário: ${userMessage}` }]
  });

  return response.data.choices[0].message.content;
}
