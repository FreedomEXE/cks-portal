/**
 * File: connection.ts
 *
 * Description: Database connection utility using node-postgres
 * Function: Provide database connection pool and query helpers
 * Importance: Central database access for all repositories
 * Connects to: All repository files, PostgreSQL database
 *
 * Notes: Simple connection pool setup for Manager role implementation
 */
import { Pool } from 'pg';
declare const pool: Pool;
export declare function query(text: string, params?: any[]): Promise<any[]>;
export declare function queryOne(text: string, params?: any[]): Promise<any | null>;
export declare function transaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
export declare function testConnection(): Promise<boolean>;
export default pool;
//# sourceMappingURL=connection.d.ts.map