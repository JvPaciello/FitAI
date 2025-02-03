const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  goal: String,  // Exemplo: emagrecer, ganhar massa
  mealPlan: String,
  workoutPlan: String
});

module.exports = mongoose.model('User', UserSchema);
