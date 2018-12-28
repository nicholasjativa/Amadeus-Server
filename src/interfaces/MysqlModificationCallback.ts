import { MysqlError } from "mysql";

export interface MysqlModificationCallback {
    (err: MysqlError, result: any, snippet?: any): void;
}