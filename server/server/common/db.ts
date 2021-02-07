import L from './logger'
import mysql, { RowDataPacket } from 'mysql2/promise';

export const dbPool = mysql.createPool({
  host: "localhost",
  user: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB
});

namespace SettingsTable {
  export const table = "settings";

  export const name = "name";
  export const value = "value";

  export const version = "version";
}

export namespace ControllersTable {
  export const table = "controllers";

  export const id = "controller_id";
  export const mac = "mac";
  export const name = "name";
  export const conversion_factor = "conversion_factor";
}

export namespace ReadingsTable {
  export const table = "readings";

  export const id = "reading_id";
  export const time = "time";
  export const controller_id = ControllersTable.id;
  export const min = "min";
  export const max = "max";
  export const avg = "avg";
}

export async function select(connection: mysql.PoolConnection, sql: string, values?: any[]): Promise<mysql.RowDataPacket[]> {
  L.info(`mysql select: ${sql}, ${values}`);
  const result = await connection.execute<mysql.RowDataPacket[]>(sql, values);
  return result[0]
}

export async function query(connection: mysql.PoolConnection, sql: string, values?: any[]): Promise<mysql.OkPacket> {
  L.info(`mysql query: ${sql}`);
  let result = await connection.execute<mysql.OkPacket>(sql, values);
  return result[0]
}

const schemaVersions = [
  [
    `CREATE TABLE ${ControllersTable.table} (
      ${ControllersTable.id} INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      ${ControllersTable.mac} VARCHAR(12) NOT NULL UNIQUE,
      ${ControllersTable.name} TEXT NOT NULL,
      ${ControllersTable.conversion_factor} FLOAT NOT NULL
    );`,
    `CREATE TABLE ${ReadingsTable.table} (
      ${ReadingsTable.id} INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      ${ReadingsTable.time} DATETIME NOT NULL,
      ${ReadingsTable.controller_id} INT UNSIGNED NOT NULL,
      ${ReadingsTable.min} SMALLINT UNSIGNED NOT NULL,
      ${ReadingsTable.max} SMALLINT UNSIGNED NOT NULL,
      ${ReadingsTable.avg} SMALLINT UNSIGNED NOT NULL
    );`,
    `ALTER TABLE ${ReadingsTable.table}
      ADD KEY ${ReadingsTable.time} (${ReadingsTable.time}),
      ADD KEY ${ReadingsTable.controller_id} (${ReadingsTable.controller_id})
      ;
    `,
  ]
]

export async function databaseInit() {
  const connection = await dbPool.getConnection()
  try {
    let version = 0;
    if ((await select(connection, `SHOW TABLES LIKE "${SettingsTable.table}"`)).length === 0) {
      await query(connection, `CREATE TABLE ${SettingsTable.table} (
        ${SettingsTable.name} VARCHAR(30) PRIMARY KEY,
        ${SettingsTable.value} VARCHAR(30) NOT NULL
        )`);
    } else {
      const row: RowDataPacket = (await select(connection, `SELECT ${SettingsTable.value} FROM ${SettingsTable.table} WHERE ${SettingsTable.name} = ?`, [SettingsTable.version]))[0];
      version = row !== undefined ? parseInt(row[SettingsTable.value]) : 0;
    }
    L.info(`current database version: ${version}`);
    if (version == schemaVersions.length) {
      return;
    }
    await connection.beginTransaction();
    for (let i = version; i < schemaVersions.length; i++) {
      L.info(`updating database to version: ${i}`);
      for (const statement of schemaVersions[i]) {
        await query(connection, statement);
      }
      version++;
    }
    await query(connection, `
      INSERT INTO ${SettingsTable.table}
      (${SettingsTable.name}, ${SettingsTable.value})
      VALUES
      (?, ?)
      ON DUPLICATE KEY UPDATE ${SettingsTable.value}=?;`,
      [SettingsTable.version, version, version]);
    L.warn("committing transaction");
    await connection.commit();
  }
  catch (err) {
    L.warn("rolling back transaction");
    connection.rollback();
    throw err;
  }
  finally {
    connection.release();
  }
}

export { select as dbSelect };
export { query as dbQuery };