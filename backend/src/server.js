const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const sportsRoutes = require('./routes/sportsRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de saúde para o Render / Uptime
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ArenaMap API' });
});

app.use('/api/sports', sportsRoutes);

// Escuta em 0.0.0.0 (essencial para ambientes em nuvem como Render)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor ArenaMap rodando na porta ${PORT}`);
});
