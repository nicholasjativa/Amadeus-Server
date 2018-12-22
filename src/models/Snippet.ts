import * as db from "../db.js";
import { PhoneNumberUtils } from "../utils/phoneNumberUtils";
import { MysqlCallback } from "../interfaces/MysqlCallback";
import { MysqlError } from "mysql";
import { MysqlModificationCallback } from "../interfaces/MysqlModificationCallback";
import { SnippetCreationData } from "../interfaces/SnippetCreationData";

export class Snippet {

    public static create(data: SnippetCreationData, cb: MysqlModificationCallback): void {

        const cleanPhoneNumber: string  = PhoneNumberUtils.normalizePhoneNumber(data.address);
        const query: string = `INSERT INTO snippets
                                (address, body, contactId, name, threadId, timestamp, type)
                                VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const values = [data.address, data.body, data.contactId, data.name, data.threadId, data.timestamp, data.type];

        db.get().query(query, values, (err: MysqlError, result: any) => cb(err, result));
    }

    public static delete(phone_num_clean: string, cb: MysqlModificationCallback) {

        const query: string = `DELETE FROM texts
                                WHERE address = ?`;
        const values = [phone_num_clean];

        db.get().query(query, values, (err: MysqlError, result: any) => cb(err, result));
    }

    public static dropTable(): void {

        const query: string = "TRUNCATE TABLE snippets";

        db.get().query(query, (err: MysqlError, result: any) => {});

    }

    public static getSnippets(userId: number, cb: MysqlCallback): void {

        const query: string = `SELECT contacts.name, timestamp, address, body FROM snippets
                                JOIN contacts
                                WHERE address = phoneNumber
                                AND snippets.userId = ?
                                AND contacts.userId = ?
                                ORDER BY timestamp DESC`;
        const values = [userId, userId];

        db.get().query(query, values, (err: MysqlError, rows: any[]) => cb(err, rows));
    }

    public static updateConversationSnippet(phone_num_clean: string, body: string, timestamp: string, cb: MysqlModificationCallback): void {

        const cleanPhoneNumber: string = PhoneNumberUtils.normalizePhoneNumber(phone_num_clean);
        const query: string = `INSERT INTO snippets
                                (address, name, body, timestamp)
                                VALUES (?, ?, ?, ?)
                                ON DUPLICATE KEY UPDATE
                                body = ?, timestamp = ?`;
        const values = [cleanPhoneNumber, cleanPhoneNumber, body, timestamp, body, timestamp];

        db.get().query(query, values,
                        (err, result) => {
                            if (cb && typeof cb === "function") {
                                if (err) {
                                    return cb(err, undefined);
                                } else {
                                    db.get().query(`SELECT snippets.id, contacts.name, timestamp, body, threadId, type,
                                                    address, snippets.contactId
                                                    FROM snippets
                                                    JOIN contacts
                                                    ON phoneNumber = address
                                                    WHERE address = ?`,
                                                    [phone_num_clean],
                                                    (err, result) => cb(undefined, result));
                                }
                            }
                        });
        db.get().query(`INSERT IGNORE INTO contacts
                        (name, phoneNumber)
                        VALUES (?, ?)`,
                        [phone_num_clean, phone_num_clean]);
    }


}
