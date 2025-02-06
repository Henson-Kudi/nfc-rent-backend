import { DataSource } from "typeorm";
import { MemoryCache } from "../../cache/memory-cache";
import envConf from "@/config/env.conf";
import logger from "../../utils/logger";
import { EntityRegistry } from "./entity-registry";

const dataSourceCache = new MemoryCache<string, DataSource>()

// 1. Create admin connection to default 'postgres' DB
const adminDataSource = new DataSource({
    url: `${envConf.DATABASE_SERVER_URL}/postgres`,
    type: "postgres",
    // host: "localhost",
    // port: 5432,
    // username: "postgres",
    // password: "postgres",
    // database: "postgres", // Default maintenance DB
});

// 2. Create tenant database
async function createTenantDatabase(databaseName: string) {
    try {
        databaseName = databaseName.toLowerCase()

        await adminDataSource.initialize();
        // If database already exists, then throw error 
        await adminDataSource.query(`CREATE DATABASE "${databaseName}"`);

        // Initialise datasource of db with getTenantDataSource because it is going to use Entities Registry to register relevant modules
        await getTenantDataSource(databaseName) // this will create and save datasource in cache
        logger.info(`Created database ${databaseName}`);
    } catch (error: any) {
        logger.error(`Database creation failed: ${error.message}`);
        throw error; // Rethrow for handling upstream
    } finally {
        await adminDataSource.destroy(); // Always clean up admin connection
    }
}

const dropTenantDatabase = async (databaseName: string) => {
    try {
        databaseName = databaseName.toLowerCase()

        await adminDataSource.initialize();

        await adminDataSource.query(`DROP DATABASE IF EXISTS "${databaseName}"`);

        dataSourceCache.delete(databaseName)
        logger.info(`Deleted database ${databaseName}`);
    } catch (error: any) {
        logger.error(`Database deletion failed: ${error.message}`);
        throw error; // Rethrow for handling upstream
    } finally {
        await adminDataSource.destroy(); // Always clean up admin connection
    }
}

const getTenantDataSource = async (databaseName: string): Promise<DataSource> => {
    databaseName = databaseName.toLowerCase()

    if (dataSourceCache.has(databaseName)) {
        return dataSourceCache.get(databaseName) as DataSource
    }

    const dataSource = new DataSource({
        type: 'postgres',
        url: `${envConf.DATABASE_SERVER_URL}/${databaseName}`,
        entities: EntityRegistry.getEntities(), // All registered entities
        synchronize: true,
        logging: false
    });

    await dataSource.initialize();
    await dataSource.runMigrations()

    dataSourceCache.set(databaseName, dataSource)

    return dataSource
}

const closeConnections = () => {
    dataSourceCache.values().map(datasource => datasource.destroy())
}

const closeConnection = async (dbName: string) => {
    dbName = dbName.toLowerCase()

    const dataSource = dataSourceCache.get(dbName)
    if (dataSource) {
        await dataSource.destroy()
        return true
    }
}

export {
    createTenantDatabase,
    dropTenantDatabase,
    getTenantDataSource,
    closeConnections,
    closeConnection
}