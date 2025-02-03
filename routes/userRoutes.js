const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Criar usuário
router.post('/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Buscar todos os usuários
router.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

// Atualizar objetivo do usuário
router.put('/users/:phone', async (req, res) => {
  const user = await User.findOneAndUpdate({ phone: req.params.phone }, req.body, { new: true });
  res.json(user);
});

module.exports = router;
