const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true }, // Número do WhatsApp do usuário
  message: { type: String, required: true }, // Mensagem recebida
  response: { type: String, required: true }, // Resposta do bot
  timestamp: { type: Date, default: Date.now } // Data da mensagem
});

module.exports = mongoose.model("Message", MessageSchema);
