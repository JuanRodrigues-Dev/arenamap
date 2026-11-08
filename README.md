# 🏟️ ArenaMap - Mapeamento & Radar de Centros Esportivos (PostGIS + Leaflet)

> **Aplicação Web Georreferenciada para Mapeamento, CRUD e Radar em Tempo Real de Espaços Esportivos.**
> Desenvolvido com **PostgreSQL + PostGIS (Supabase)**, **Node.js (Express)**, **React + Vite** e **Leaflet**.

---

## 🌟 Funcionalidades e Requisitos Atendidos

- [x] **Banco de Dados Espacial com PostGIS**: Armazenamento de geometrias espaciais (`GEOMETRY(Point, 4326)`) com índice espacial GiST no Supabase.
- [x] **CRUD Completo de Espaços Esportivos**: Criação, Leitura, Atualização e Exclusão com persistência de coordenadas espaciais.
- [x] **Geolocalização do Navegador**: O mapa abre automaticamente centralizado na localização real do usuário (`navigator.geolocation`).
- [x] **Carregamento por Área Visível (Bounding Box)**: Conforme o usuário arrasta ou dá zoom no mapa, apenas os pontos dentro do campo de visão são consultados via `ST_Intersects` e `ST_MakeEnvelope`.
- [x] **Geocodificação de Endereços (Nominatim / OSM)**: Busca inteligente de ruas, praças e bairros na tela de cadastro para autopreenchimento de coordenadas.
- [x] **Busca por Proximidade / Raio (1 km, 2 km, 5 km, 10 km)**: Painel lateral que lista locais ordenados por distância exata em metros calculada pelo PostGIS (`ST_DWithin` e `ST_Distance`).
- [x] **Radar Esportivo com Alerta em Tempo Real**: Monitoramento de aproximação que dispara notificações nativas do sistema operacional (**Web Notification API**) e alertas visuais animados na tela ao se aproximar de centros esportivos.
- [x] **Interface Gráfica de Alta Qualidade**: Ícones temáticos para cada modalidade esportiva (Futebol, Basquete, Skate, Beach Tennis, Calistenia), badges informativas (Iluminação noturna, Vestiários, Gratuito/Pago) e design responsivo com Tailwind CSS.

---

## 🗺️ Como Funciona o PostGIS no Projeto

| Funcionalidade | Função PostGIS Utilizada | Explicação Técnica |
| :--- | :--- | :--- |
| **Criação de Ponto** | `ST_SetSRID(ST_MakePoint(lng, lat), 4326)` | Cria um objeto geométrico formal no padrão mundial WGS 84 (GPS). |
| **Área Visível (BBOX)** | `ST_Intersects(geom, ST_MakeEnvelope(minLng, minLat, maxLng, maxLat, 4326))` | Filtra os pontos que interceptam o retângulo visível da tela do Leaflet. |
| **Filtro de Raio** | `ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography, raio_metros)` | Encontra espaços no raio especificado considerando a curvatura real da Terra. |
| **Cálculo de Distância** | `ST_Distance(geom::geography, ...)` | Calcula a distância precisa em metros entre o usuário e o espaço esportivo. |
| **Índice Espacial** | `CREATE INDEX ... USING GIST (geom)` | Garante performance ultrarrápida em consultas geográficas. |

---

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** com **Express**
- **pg (node-postgres)** com SSL habilitado
- **PostgreSQL 15+** com extensão **PostGIS** (hospedado no **Supabase**)

### Frontend
- **React** com **Vite**
- **Leaflet** & **OpenStreetMap**
- **Tailwind CSS** (estilização moderna e responsiva)
- **Lucide React** (ícones)
- **Nominatim API** (Geocodificação OpenStreetMap)
- **Web Notification API** & **Geolocation API**

---

## 🚀 Como Rodar o Projeto Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/JuanRodrigues-Dev/arenamap.git
cd arenamap
```

### 2. Configurar o Banco de Dados (Supabase)
1. Crie um projeto gratuito no [Supabase](https://supabase.com).
2. Abra o **SQL Editor** do Supabase, copie o conteúdo de `database.sql` e execute.

### 3. Rodar o Backend
```bash
cd backend
npm install
# Crie o arquivo .env com a string de conexão do Supabase:
# DATABASE_URL=postgresql://postgres:[SUA_SENHA]@db.[SEU_PROJETO].supabase.co:5432/postgres
npm run dev
```
O servidor estará rodando em `http://localhost:3001`.

### 4. Rodar o Frontend
Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```
A aplicação abrirá em `http://localhost:5173`.

---

## 🌐 Instruções para Deploy em Produção

### 1. Backend no Render (Gratuito)
1. Conecte o repositório no [Render](https://render.com).
2. Crie um novo **Web Service**.
3. Defina:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
4. Em **Environment Variables**, adicione:
   - `DATABASE_URL`: URL do Supabase com a senha.

### 2. Frontend na Vercel (Gratuito)
1. Conecte o repositório na [Vercel](https://vercel.com).
2. Defina:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
3. Em **Environment Variables**, adicione:
   - `VITE_API_URL`: URL pública do backend no Render (ex: `https://arenamap-api.onrender.com/api/sports`).

---

## 👥 Equipe do Projeto
- **Juan Rodrigues** - [@JuanRodrigues-Dev](https://github.com/JuanRodrigues-Dev)
