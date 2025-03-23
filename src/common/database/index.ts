import { DataSource } from 'typeorm';
import envConf from '@/config/env.conf';
import logger from '../utils/logger';
import { runCommand } from '@/scripts/migration';

// 1. Create admin connection to default 'postgres' DB
export const dataSource = new DataSource({
  url: `${envConf.DATABASE_URL}`,
  type: 'postgres',
  entities: [`${envConf.rootDir}/src/common/entities/**/*.entity.{ts,js}`], // Since we're using share entity, all entities should be created in common/entities directory
  migrations: [`${envConf.rootDir}/src/migrations/*{.ts,.js}`],
  synchronize: false,
  logging: envConf.NODE_ENV !== 'production',
});

const initializeDb = async () => {
  if (!dataSource.isInitialized) {
    // Initialise db
    logger.info('Initialising database');
    await dataSource.initialize();
    // Initialise datasource dependency for injection
  }

  return dataSource;
};

async function generateFreshMigrations() {
  try {
    // Generate a new single migration file
    logger.info('📜 Generating a fresh migration for tenant...');

    await runCommand(
      `npx ts-node -r tsconfig-paths/register node_modules/typeorm/cli.js migration:generate src/migrations/LatestSchema -d src/common/database/index.ts`
    );

    logger.info('✅ All migrations generated successfully!');
  } catch (error) {
    logger.error('❌ Migration generation failed!', error);
    throw error;
  }
}

const runMigrations = async () => {
  // Generate fresh migrations. generate migration files before initialising datasource. Because database initialisation scans migration folder, cache the current migrations to run. So if we initialise migration before generating migration files, migration will not run.
  await generateFreshMigrations();

  // We want to use a different datasource instance because if the existing instance is alsready initialised, a different migration is gonna be ran. We want to avoid that
  const dataSource = new DataSource({
    url: `${envConf.DATABASE_URL}`,
    type: 'postgres',
    entities: [`${envConf.rootDir}/src/common/entities/**/*.entity.{ts,js}`], // Since we're using share entity, all entities should be created in common/entities directory
    migrations: [`${envConf.rootDir}/src/migrations/*{.ts,.js}`],
    synchronize: true,
    logging: envConf.NODE_ENV !== 'production',
  });

  try {
    // Initialise datasource
    await dataSource.initialize();

    // Run migrations
    logger.info('Running migrations');
    await dataSource.runMigrations();
    logger.info('Finished running migrations');
  } catch (error) {
    logger.error('Failed to run migrations', error);
  } finally {
    // Destroy datasource once migration is completed (either successfully or not)
    await dataSource.destroy();
    logger.info('Datasource destroyed');
  }
};

const closeConnection = () => dataSource.destroy();

export {
  closeConnection,
  initializeDb,
  generateFreshMigrations,
  runMigrations,
};
