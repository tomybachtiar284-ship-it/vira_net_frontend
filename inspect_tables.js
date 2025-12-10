const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
    console.log(`Connected to database: ${process.env.DB_NAME}`);

    connection.query('SHOW TABLES', (err, tables) => {
        if (err) throw err;

        if (tables.length === 0) {
            console.log('No tables found.');
            connection.end();
            return;
        }

        console.log(`Found ${tables.length} tables:`);
        const tableNames = tables.map(t => Object.values(t)[0]);

        // Use a promise-based approach or just simple recursion/loop with callbacks to describe each table
        let processed = 0;
        tableNames.forEach(tableName => {
            connection.query(`DESCRIBE ${tableName}`, (err, columns) => {
                if (err) throw err;

                console.log(`\nTable: ${tableName}`);
                console.table(columns.map(col => ({
                    Field: col.Field,
                    Type: col.Type,
                    Null: col.Null,
                    Key: col.Key,
                    Default: col.Default,
                    Extra: col.Extra
                })));

                processed++;
                if (processed === tableNames.length) {
                    connection.end();
                }
            });
        });
    });
});
