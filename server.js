require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;


// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🔥 Conectado ao MongoDB'))
  .catch(err => console.log('Erro ao conectar ao MongoDB:', err));

// Middleware
app.use(cors());
app.use(express.json());

// Rota de Teste
app.get('/', (req, res) => {
  res.send('🚀 API FitBot AI está rodando!');
});

// Importando as rotas
const userRoutes = require('./routes/userRoutes');
app.use('/api', userRoutes);

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
