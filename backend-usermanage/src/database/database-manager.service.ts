// database/database-manager.service.ts (IMPROVED)
import { Injectable } from '@nestjs/common';
import * as sql from 'mssql';
import {
  defaultServerConfig,
  userRightServerConfig,
  authServerConfig,
} from 'src/config/multi-database.config';

@Injectable()
export class DatabaseManagerService {
  private pools: Map<string, sql.ConnectionPool> = new Map();

  /**
   * ดึง pool จาก database name
   * @param database - database name (optional, default = defaultServerConfig.database)
   */
  async getPool(database?: string): Promise<sql.ConnectionPool> {
    //  ถ้าไม่ระบุ database ให้ใช้ default
    const dbName = database || defaultServerConfig.database;

    if (!this.pools.has(dbName)) {
      let config: sql.config;

      //  เลือก config ตามชื่อฐานข้อมูล
      if (dbName === userRightServerConfig.database) {
        config = userRightServerConfig;
      } else if (dbName === authServerConfig.database) {
        config = authServerConfig;
      } else if (dbName === defaultServerConfig.database) {
        config = defaultServerConfig;
      } else {
        // ถ้าไม่ match ให้ใช้ default config แต่เปลี่ยน database name
        config = { ...defaultServerConfig, database: dbName };
      }

      const pool = await new sql.ConnectionPool(config).connect();
      this.pools.set(dbName, pool);
      console.log(
        ` Connected to SQL Server: ${config.server} - Database: ${config.database}`,
      );
    }

    return this.pools.get(dbName)!;
  }

  /**
   * แยก database name จาก fully qualified procedure name
   * @param fullyQualifiedProcName - เช่น "PTEC_USERSRIGHT.dbo.User_Login_Cloud"
   * @returns { database: string, procName: string }
   */
  private parseProcedureName(fullyQualifiedProcName: string): {
    database: string;
    procName: string;
  } {
    const parts = fullyQualifiedProcName.split('.');

    if (parts.length === 3) {
      // Format: DatabaseName.dbo.ProcedureName
      return {
        database: parts[0],
        procName: fullyQualifiedProcName,
      };
    } else if (parts.length === 2) {
      return {
        database: defaultServerConfig.database,
        procName: fullyQualifiedProcName,
      };
    } else {
      return {
        database: defaultServerConfig.database,
        procName: `dbo.${fullyQualifiedProcName}`,
      };
    }
  }

  /**
   * @param fullyQualifiedProcName - Full procedure name (e.g., "PTEC_USERSRIGHT.dbo.User_Login_Cloud")
   * @param params - Parameters array
   * @param mapOutput - Optional output mapper function
   */
  async executeStoredProcedure<T = any>(
    fullyQualifiedProcName: string,
    params: {
      name: string;
      type: sql.ISqlType;
      value?: any;
      output?: boolean;
    }[],
    mapOutput?: (result: {
      recordset: T[];
      output?: Record<string, any>;
    }) => T[],
  ): Promise<T[]> {
    const { database, procName } = this.parseProcedureName(
      fullyQualifiedProcName,
    );

    const pool = await this.getPool(database);
    const request = pool.request();

    // Set parameters
    for (const param of params) {
      if (param.output) {
        request.output(param.name, param.type);
      } else {
        request.input(param.name, param.type, param.value);
      }
    }

    // Execute
    const result = await request.execute(procName);

    return mapOutput ? mapOutput(result) : result.recordset;
  }

  /**
   * Execute stored procedure that returns multiple recordsets
   */
  async executeMultipleStoredProcedures<T = any>(
    fullyQualifiedProcName: string,
    params: {
      name: string;
      type: sql.ISqlType;
      value?: any;
      output?: boolean;
    }[],
  ): Promise<T[][]> {
    // แยก database name จาก procedure name
    const { database, procName } = this.parseProcedureName(
      fullyQualifiedProcName,
    );

    // ใช้ pool ที่ถูกต้อง
    const pool = await this.getPool(database);
    const request = pool.request();

    // Set parameters
    for (const param of params) {
      if (param.output) {
        request.output(param.name, param.type);
      } else {
        request.input(param.name, param.type, param.value);
      }
    }

    // Execute
    const result = await request.execute(procName);
    return result.recordsets as T[][];
  }

  /**
   * Execute raw SQL query
   * @param sqlQuery - SQL query string
   * @param database - Optional database name
   */
  async query<T = any>(sqlQuery: string, database?: string): Promise<T[]> {
    const pool = await this.getPool(database);
    const result = await pool.request().query(sqlQuery);
    return result.recordset;
  }

  /**
   * Execute SQL query with parameters
   * @param sqlQuery - SQL query with parameters (@param1, @param2, etc.)
   * @param params - Parameters array
   * @param database - Optional database name
   */
  async queryWithParams<T = any>(
    sqlQuery: string,
    params: {
      name: string;
      type: sql.ISqlType;
      value?: any;
    }[],
    database?: string,
  ): Promise<T[]> {
    const pool = await this.getPool(database);
    const request = pool.request();

    // Set parameters
    for (const param of params) {
      request.input(param.name, param.type, param.value);
    }

    const result = await request.query(sqlQuery);
    return result.recordset;
  }

  /**
   * ปิด connection pools ทั้งหมดเมื่อ app shutdown
   */
  async closeAll(): Promise<void> {
    for (const [dbName, pool] of this.pools.entries()) {
      await pool.close();
      console.log(`🔌 Closed connection to database: ${dbName}`);
    }
    this.pools.clear();
  }

  /**
   * Get list of all active database connections
   */
  getActiveConnections(): string[] {
    return Array.from(this.pools.keys());
  }

  /**
   * Check if a specific database pool is connected
   */
  isConnected(database: string): boolean {
    return this.pools.has(database);
  }
}
