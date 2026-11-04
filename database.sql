-- ==============================================================================
-- PROJETO: ArenaMap - Mapeamento e Radar de Centros e Espaços Esportivos
-- BANCO DE DADOS: PostgreSQL com PostGIS (Compatível com Supabase)
-- ==============================================================================

-- 1. Habilitar a extensão espacial PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Criação da tabela de espaços esportivos
CREATE TABLE IF NOT EXISTS sports_spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    sport_category VARCHAR(60) NOT NULL,          -- Ex: "Futebol / Society", "Basquete / Street", "Pista de Skate", "Academia ao Ar Livre", "Quadra Poliesportiva"
    surface_type VARCHAR(50) DEFAULT 'Outro',     -- Ex: "Grama Sintética", "Concreto", "Areia", "Asfalto", "Madeira"
    is_public BOOLEAN DEFAULT true,               -- Gratuito / Público ou Privado
    has_lighting BOOLEAN DEFAULT false,           -- Possui iluminação para uso noturno?
    has_restrooms BOOLEAN DEFAULT false,          -- Possui vestiários ou banheiros?
    opening_hours VARCHAR(100) DEFAULT 'Livre',   -- Ex: "06:00 às 22:00" ou "24 horas"
    description TEXT,
    -- Campo espacial PostGIS: Ponto geográfico 2D no padrão mundial WGS 84 (SRID 4326)
    geom GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Criação de índice espacial (GIST)
-- Essencial para fazer consultas de raio (ST_DWithin) e área visível (ST_Intersects) instantâneas
CREATE INDEX IF NOT EXISTS idx_sports_spaces_geom ON sports_spaces USING GIST (geom);

-- 4. Inserção de dados iniciais para testes (Exemplos reais com coordenadas de teste)
-- ATENÇÃO: No PostGIS, a ordem do ST_MakePoint é (LONGITUDE, LATITUDE)
INSERT INTO sports_spaces (name, sport_category, surface_type, is_public, has_lighting, has_restrooms, opening_hours, description, geom)
VALUES 
(
    'Quadra Poliesportiva Central',
    'Quadra Poliesportiva',
    'Concreto',
    true,
    true,
    true,
    '07:00 às 22:00',
    'Quadra pública com marcações para futsal, basquete e vôlei.',
    ST_SetSRID(ST_MakePoint(-46.655981, -23.561180), 4326)
),
(
    'Arena Beach Tennis & Vôlei',
    'Beach Tennis',
    'Areia',
    false,
    true,
    true,
    '06:00 às 23:00',
    'Complexo de areia com 4 quadras e aluguel de raquetes.',
    ST_SetSRID(ST_MakePoint(-46.662100, -23.565200), 4326)
),
(
    'Skatepark Comunitário & Pump Track',
    'Pista de Skate',
    'Concreto polido',
    true,
    true,
    false,
    'Livre (24h)',
    'Pista de skate com bowls, caixotes e corrimãos.',
    ST_SetSRID(ST_MakePoint(-46.650200, -23.558300), 4326)
),
(
    'Espaço Fitness e Academia ao Ar Livre',
    'Academia ao Ar Livre',
    'Emborrachado',
    true,
    false,
    false,
    'Livre',
    'Aparelhos de calistenia, barras fixas e paralelas.',
    ST_SetSRID(ST_MakePoint(-46.653400, -23.564500), 4326)
);