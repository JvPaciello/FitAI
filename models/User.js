const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  phoneNumber: { type: String, unique: true, required: true },
  name: { type: String },
  age: { type: Number },
  weight: { type: Number },
  height: { type: Number },
  goal: { type: String, default: "" }, // Meta do usuário (ex: ganhar massa muscular, perder peso)
  mealPlan: { type: String, default: "" }, // Plano de alimentação gerado pelo bot
  workoutPlan: { type: String, default: "" }, // Plano de treino gerado pelo bot
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);
