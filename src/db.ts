import { createPool, Pool } from "mysql";

let connection: Pool;

export function connect(cb): void {
    connection = createPool({
        host: "DB_HOST",
        user: "USER",
        password: "PASSWORD",
        database: "DATABASE_NAME",
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

