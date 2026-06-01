import './config/env'; // Load and validate env vars first
import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';

async function main() {
  // Test DB connection
  try {
    await prisma.$connect();
    console.log('✅ Conexão com o banco de dados estabelecida');
  } catch (err) {
    console.error('❌ Falha ao conectar ao banco de dados:', err);
    process.exit(1);
  }

  const server = app.listen(Number(env.PORT), '0.0.0.0', () => {
    console.log(`
🚀 Servidor iniciado!
   Ambiente:  ${env.NODE_ENV}
   Porta:     ${env.PORT}
   API:       http://localhost:${env.PORT}/api
   Health:    http://localhost:${env.PORT}/health
    `);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n📴 Recebido ${signal}. Encerrando servidor...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('✅ Servidor encerrado.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('❌ Erro ao iniciar servidor:', err);
  process.exit(1);
});
