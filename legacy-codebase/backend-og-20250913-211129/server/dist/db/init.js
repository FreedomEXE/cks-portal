"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const pool_1 = __importDefault(require("../../../Database/db/pool"));
async function initializeDatabase() {
    try {
        console.log('🚀 Initializing CKS Portal database...');
        const schemaPath = path_1.default.join(__dirname, 'schema.sql');
        const schemaSQL = fs_1.default.readFileSync(schemaPath, 'utf8');
        const statements = schemaSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        console.log(`📝 Executing ${statements.length} SQL statements...`);
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await pool_1.default.query(statement);
                }
                catch (error) {
                    if (!error.message.includes('already exists') &&
                        !error.message.includes('duplicate key')) {
                        console.warn(`⚠️  Warning executing statement: ${error.message}`);
                        console.warn(`SQL: ${statement.substring(0, 100)}...`);
                    }
                }
            }
        }
        console.log('✅ Database initialization completed successfully!');
        const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
        const result = await pool_1.default.query(tablesQuery);
        console.log(`📊 Created ${result.rows.length} tables:`);
        result.rows.forEach((row) => {
            console.log(`   • ${row.table_name}`);
        });
        return true;
    }
    catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        return false;
    }
}
if (require.main === module) {
    initializeDatabase()
        .then(success => {
        process.exit(success ? 0 : 1);
    })
        .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=init.js.map