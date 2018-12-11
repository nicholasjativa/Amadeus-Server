"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = require("mysql");
let connection;
function connect(cb) {
    connection = mysql_1.createPool({
        host: process.env.PROD_DB_HOST,
        user: process.env.PROD_DB_USER,
        password: process.env.PROD_DB_PASSWORD,
        database: process.env.PROD_DB_NAME,
        charset: "utf8mb4"
    });
    connection.on("error", (err) => {
        connect(() => console.log("Server crashed. Restarting..."));
    });
    cb();
}
exports.connect = connect;
function get() {
    return connection;
}
exports.get = get;
//# sourceMappingURL=db.js.map