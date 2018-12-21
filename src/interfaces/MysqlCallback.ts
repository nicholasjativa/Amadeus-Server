import { MysqlError } from "mysql";

export interface MysqlCallback {
    (err: MysqlError, rows: any[]): void;
}