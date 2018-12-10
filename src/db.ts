import { createPool, Pool } from "mysql";

let connection: Pool;

export function connect(cb): void {
    connection = createPool({
        host: process.env.PROD_DB_HOST,
        user: process.env.PROD_DB_USER,
        password: process.env.PROD_DB_PASSWORD,
        database: process.env.PROD_DB_NAME,
        charset : "utf8mb4"
    });
    connection.on("error", (err) => {
        connect(() => console.log("Server crashed. Restarting..."));
    });
    cb();
}

export function get(): Pool {
    return connection;
}

