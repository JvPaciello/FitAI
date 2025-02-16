const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  phoneNumber: { type: String, unique: true, required: true },
  name: { type: String },
  age: { type: Number },
  weight: { type: Number },
  height: { type: Number },
  gender: { type: String, default: "" },
  goal: { type: String, default: "" },
  mealPlan: { type: String, default: "" },
  workoutPlan: { type: String, default: "" },
  hasDisability: { type: Boolean, default: undefined },
  disabilityDescription: { type: String, default: "" },
  hasFoodRestriction: { type: Boolean, default: undefined },
  foodRestrictionDescription: { type: String, default: "" }, 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", UserSchema);
