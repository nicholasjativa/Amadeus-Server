import * as db from "../db.js";
import { MysqlError } from "mysql";
import { MysqlModificationCallback } from "../interfaces/MysqlModificationCallback";
import { MysqlCallback } from "../interfaces/MysqlCallback";

export class Text {

    constructor() {
    }
    // TODO this will have to be refactored since we dont know the thread id when a
    // message from a new phone comes in
    public static create(msgid_phone_db, phone_num_clean, fromPhoneNumber, toPhoneNumber, textMessageBody, timestamp, cb: MysqlModificationCallback): void {
        
        const values = [fromPhoneNumber, toPhoneNumber, textMessageBody, timestamp, timestamp + toPhoneNumber,
                        msgid_phone_db, phone_num_clean];
        const query = `INSERT INTO texts
                        (fromPhoneNumber, toPhoneNumber, textMessageBody, timestamp, 
                        amadeusId, msgid_phone_db, phone_num_clean)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`;

        db.get().query(query, values, (err: MysqlError, result: any) => cb(err, result));
    }

    public static getAllMessages(phone_num_clean: number, userId: number, cb: MysqlCallback): void {

        const query: string = `SELECT *
                                FROM texts
                                WHERE phone_num_clean = ?
                                AND userId = ?
                                ORDER BY timestamp
                                DESC LIMIT 30`;
        const values = [phone_num_clean, userId];
        
        db.get().query(query, values, (err: MysqlError, rows: any) => cb(err, rows.reverse()));
    }

    public static updateMesssageStatus(id: number, status: string, cb: MysqlModificationCallback): void {

        const query: string = `UPDATE texts
                                SET status = ?
                                WHERE amadeusId = ?`; 
        const values = [status, id];

        db.get().query(query, values, (err: MysqlError, result: any) => cb(err, result));
    }

    public static updateMessageId(amadeusId, msgid_phone_db, cb: MysqlModificationCallback): void {

        const query: string = `UPDATE texts
                                SET msgid_phone_db = ?
                                WHERE amadeusId = ?`;
        const values = [msgid_phone_db, amadeusId];

        db.get().query(query, values, (err: MysqlError, results: any) => cb(err, results));
    }

}


