import * as db from "../db.js";
import { PhoneNumberUtils } from "../utils/phoneNumberUtils";
import { MysqlCallback } from "../interfaces/MysqlCallback";
import { MysqlError } from "mysql";
import { MysqlModificationCallback } from "../interfaces/MysqlModificationCallback";
import { SnippetCreationData } from "../interfaces/SnippetCreationData";
import { AmadeusMessage } from "../interfaces/AmadeusMessage";

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

    public static updateConversationSnippet(message: AmadeusMessage, cb: MysqlModificationCallback): void {

        const cleanPhoneNumber: string = PhoneNumberUtils.normalizePhoneNumber(message.phone_num_clean);
        const insertQuery: string = `INSERT INTO snippets
                                (address, name, body, timestamp, userId)
                                VALUES (?, ?, ?, ?, ?)
                                ON DUPLICATE KEY UPDATE
                                body = ?, timestamp = ?`;
        const insertValues = [cleanPhoneNumber, cleanPhoneNumber, message.textMessageBody,
                                message.timestamp, message.userId, message.textMessageBody, message.timestamp];

        const selectQuery: string = `SELECT snippets.id, contacts.name, timestamp, body, threadId, type,
                                address, snippets.contactId
                                FROM snippets
                                JOIN contacts
                                ON phoneNumber = address
                                WHERE address = ?`;
        const selectValues = [cleanPhoneNumber];

        db.get().query(insertQuery, insertValues,
                        (err, result) => {
                            if (cb && typeof cb === "function") {
                                if (err) {
                                    return cb(err, undefined);
                                } else {
                                    db.get().query(selectQuery, selectValues,
                                                    (err, result) => cb(undefined, result));
                                }
                            }
                        });

        const insertContactQuery: string = `INSERT IGNORE INTO contacts
                                            (name, phoneNumber, userId)
                                            VALUES (?, ?, ?)`;
        const insertContactValues = [cleanPhoneNumber, cleanPhoneNumber, message.userId];

        db.get().query(insertContactQuery, insertContactValues);
    }


}
