const db = require('./src/config/db');

async function testConnection() {
  console.log('🔄 Tentando conectar ao Supabase...');

  try {
    // 1. Testa a conexão básica e a versão do Postgres
    const resVersion = await db.query('SELECT version();');
    console.log('✅ Conexão estabelecida com sucesso!');
    console.log('📌 Versão do Banco:', resVersion.rows[0].version.split(' on ')[0]);

    // 2. Testa se a extensão PostGIS está ativa
    const resPostgis = await db.query('SELECT postgis_full_version();');
    console.log('🗺️ PostGIS está instalado e funcionando perfeitamente!');
    console.log('📌 PostGIS Info:', resPostgis.rows[0].postgis_full_version.split(' ')[0]);

    // 3. Testa se a tabela de esportes existe
    const resCount = await db.query('SELECT COUNT(*) FROM sports_spaces;');
    console.log(`🏟️ Total de centros esportivos cadastrados: ${resCount.rows[0].count}`);

    console.log('\n🎉 TUDO PRONTO! Seu backend já pode se comunicar com o banco.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Falha ao conectar ao banco de dados:');
    console.error('Mensagem de erro:', error.message);

    if (error.message.includes('password authentication failed')) {
      console.log('👉 Dica: A senha informada no DATABASE_URL do .env está incorreta.');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('👉 Dica: O endereço do host no DATABASE_URL está errado.');
    } else if (error.message.includes('relation "sports_spaces" does not exist')) {
      console.log('👉 Dica: A tabela ainda não foi criada. Rode o script database.sql no SQL Editor do Supabase.');
    }

    process.exit(1);
  }
}

testConnection();