const db = require('../config/db');

// Buscar pontos na área visível do mapa (Bounding Box)
const getInBounds = async (req, res) => {
  try {
    const { minLng, minLat, maxLng, maxLat } = req.query;

    if (!minLng || !minLat || !maxLng || !maxLat) {
      return res.status(400).json({ error: 'Parâmetros minLng, minLat, maxLng e maxLat são obrigatórios.' });
    }

    const query = `
      SELECT 
        id, name, sport_category, surface_type, is_public, has_lighting, has_restrooms, opening_hours, description,
        ST_X(geom) AS longitude,
        ST_Y(geom) AS latitude,
        ST_AsGeoJSON(geom) AS geojson
      FROM sports_spaces
      WHERE ST_Intersects(
        geom,
        ST_MakeEnvelope($1, $2, $3, $4, 4326)
      )
      ORDER BY created_at DESC;
    `;

    const values = [parseFloat(minLng), parseFloat(minLat), parseFloat(maxLng), parseFloat(maxLat)];
    const result = await db.query(query, values);
    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar por Bounding Box:', error);
    return res.status(500).json({ error: 'Erro ao consultar pontos na área visível.' });
  }
};

// Buscar pontos por raio de distância (ex: 2km do usuário)
const getNearby = async (req, res) => {
  try {
    const { lat, lng, radius = 2000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude (lat) e Longitude (lng) são obrigatórias.' });
    }

    const query = `
      SELECT 
        id, name, sport_category, surface_type, is_public, has_lighting, has_restrooms, opening_hours, description,
        ST_X(geom) AS longitude,
        ST_Y(geom) AS latitude,
        ROUND(ST_Distance(
          geom::geography, 
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        )) AS distance_meters
      FROM sports_spaces
      WHERE ST_DWithin(
        geom::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY distance_meters ASC;
    `;

    const values = [parseFloat(lng), parseFloat(lat), parseFloat(radius)];
    const result = await db.query(query, values);
    return res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar por proximidade:', error);
    return res.status(500).json({ error: 'Erro ao consultar pontos próximos.' });
  }
};

// Inserção espacial com ST_SetSRID(ST_MakePoint(lng, lat), 4326)
const createSpace = async (req, res) => {
  try {
    const { 
      name, 
      sport_category, 
      surface_type, 
      is_public, 
      has_lighting, 
      has_restrooms, 
      opening_hours, 
      description, 
      latitude, 
      longitude 
    } = req.body;

    if (!name || !sport_category || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Nome, categoria, latitude e longitude são obrigatórios.' });
    }

    const query = `
      INSERT INTO sports_spaces 
        (name, sport_category, surface_type, is_public, has_lighting, has_restrooms, opening_hours, description, geom)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, ST_SetSRID(ST_MakePoint($9, $10), 4326))
      RETURNING 
        id, name, sport_category, surface_type, is_public, has_lighting, has_restrooms, opening_hours, description,
        ST_X(geom) AS longitude,
        ST_Y(geom) AS latitude;
    `;

    const values = [
      name,
      sport_category,
      surface_type || 'Outro',
      is_public !== undefined ? is_public : true,
      has_lighting || false,
      has_restrooms || false,
      opening_hours || 'Livre',
      description || '',
      parseFloat(longitude),
      parseFloat(latitude)
    ];

    const result = await db.query(query, values);
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar espaço esportivo:', error);
    return res.status(500).json({ error: 'Erro ao cadastrar local no banco espacial.' });
  }
};

const getSpaceById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        id, name, sport_category, surface_type, is_public, has_lighting, has_restrooms, opening_hours, description,
        ST_X(geom) AS longitude,
        ST_Y(geom) AS latitude,
        ST_AsGeoJSON(geom) AS geojson
      FROM sports_spaces
      WHERE id = $1;
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Espaço esportivo não encontrado.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar espaço por ID:', error);
    return res.status(500).json({ error: 'Erro ao consultar detalhes do local.' });
  }
};

const updateSpace = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      sport_category, 
      surface_type, 
      is_public, 
      has_lighting, 
      has_restrooms, 
      opening_hours, 
      description, 
      latitude, 
      longitude 
    } = req.body;

    const query = `
      UPDATE sports_spaces
      SET 
        name = COALESCE($1, name),
        sport_category = COALESCE($2, sport_category),
        surface_type = COALESCE($3, surface_type),
        is_public = COALESCE($4, is_public),
        has_lighting = COALESCE($5, has_lighting),
        has_restrooms = COALESCE($6, has_restrooms),
        opening_hours = COALESCE($7, opening_hours),
        description = COALESCE($8, description),
        geom = CASE 
          WHEN $9::numeric IS NOT NULL AND $10::numeric IS NOT NULL 
          THEN ST_SetSRID(ST_MakePoint($10::numeric, $9::numeric), 4326) 
          ELSE geom 
        END,
        updated_at = timezone('utc'::text, now())
      WHERE id = $11
      RETURNING 
        id, name, sport_category, surface_type, is_public, has_lighting, has_restrooms, opening_hours, description,
        ST_X(geom) AS longitude,
        ST_Y(geom) AS latitude;
    `;

    const values = [
      name,
      sport_category,
      surface_type,
      is_public,
      has_lighting,
      has_restrooms,
      opening_hours,
      description,
      latitude ? parseFloat(latitude) : null,
      longitude ? parseFloat(longitude) : null,
      id
    ];

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Espaço não encontrado para atualização.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar espaço esportivo:', error);
    return res.status(500).json({ error: 'Erro ao atualizar dados do local.' });
  }
};

const deleteSpace = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM sports_spaces WHERE id = $1 RETURNING id;', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Espaço não encontrado para remoção.' });
    }

    return res.json({ message: 'Espaço esportivo removido com sucesso.', id });
  } catch (error) {
    console.error('Erro ao deletar espaço esportivo:', error);
    return res.status(500).json({ error: 'Erro ao remover local do banco.' });
  }
};

module.exports = {
  createSpace,
  getSpaceById,
  updateSpace,
  deleteSpace,
  getInBounds,
  getNearby
};