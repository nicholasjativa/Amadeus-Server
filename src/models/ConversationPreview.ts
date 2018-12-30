import * as db from "../db";
import { PhoneNumberUtils } from "../utils/phoneNumberUtils";
import { MysqlCallback } from "../interfaces/MysqlCallback";
import { MysqlError } from "mysql";
import { MysqlModificationCallback } from "../interfaces/MysqlModificationCallback";
import { ConversationPreviewCreationData } from "../interfaces/ConversationPreviewCreationData";
import { AmadeusMessage } from "../interfaces/AmadeusMessage";
import { AmadeusUser } from "./AmadeusUser";
import { Contact } from "./Contact";

export class ConversationPreview {
    public static readonly TABLE_NAME = "conversation_preview";
    public static readonly COL_ID = "id";
    public static readonly COL_NAME = "name";
    public static readonly COL_ADDRESS = "address";
    public static readonly COL_BODY = "body";
    public static readonly COL_TIMESTAMP = "timestamp";
    public static readonly COL_THREAD_ID = "threadId";
    public static readonly COL_TYPE = "type";
    public static readonly COL_CONTACT_ID = "contactId";
    public static readonly COL_USER_ID = "userId";
    public static readonly CREATE_TABLE = `
    CREATE TABLE ${ConversationPreview.TABLE_NAME} (
        ${ConversationPreview.COL_ID} INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        ${ConversationPreview.COL_NAME} VARCHAR(255) NOT NULL,
        ${ConversationPreview.COL_ADDRESS} VARCHAR(10),
        ${ConversationPreview.COL_BODY} VARCHAR(160) NOT NULL,
        ${ConversationPreview.COL_TIMESTAMP} VARCHAR(15),
        ${ConversationPreview.COL_THREAD_ID} INT(11),
        ${ConversationPreview.COL_TYPE} VARCHAR(10),
        ${ConversationPreview.COL_CONTACT_ID} VARCHAR(10),
        ${ConversationPreview.COL_USER_ID} INT(11) NOT NULL,
        CONSTRAINT fk_userId_snippets
        FOREIGN KEY (${ConversationPreview.COL_USER_ID}) REFERENCES ${AmadeusUser.TABLE_NAME}(${AmadeusUser.COL_ID})
    )`;

    private constructor() {
    }

    public static create(data: ConversationPreviewCreationData, cb: MysqlModificationCallback): void {

        const cleanPhoneNumber: string  = PhoneNumberUtils.normalizePhoneNumber(data.address);
        const query: string = `INSERT INTO ${ConversationPreview.TABLE_NAME}
                                (${ConversationPreview.COL_ADDRESS}, ${ConversationPreview.COL_BODY}, ${ConversationPreview.COL_CONTACT_ID},
                                ${ConversationPreview.COL_NAME}, ${ConversationPreview.COL_THREAD_ID}, ${ConversationPreview.COL_TIMESTAMP},
                                ${ConversationPreview.COL_TYPE})
                                VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const values = [data.address, data.body, data.contactId, data.name, data.threadId, data.timestamp, data.type];

        db.get().query(query, values, (err: MysqlError, result: any) => cb(err, result));
    }

    public static dropTable(): void {

        const query: string = `TRUNCATE TABLE ${ConversationPreview.TABLE_NAME}`;

        db.get().query(query, (err: MysqlError, result: any) => {});
    }

    public static getPreviews(userId: number, cb: MysqlCallback): void {

        const query: string = `SELECT ${Contact.TABLE_NAME}.${Contact.COL_NAME},
                                ${ConversationPreview.COL_ADDRESS}, ${ConversationPreview.COL_BODY}, ${ConversationPreview.COL_TIMESTAMP}
                                FROM ${ConversationPreview.TABLE_NAME}
                                JOIN ${Contact.TABLE_NAME}
                                WHERE ${ConversationPreview.COL_ADDRESS} = ${Contact.COL_PHONE_NUMBER}
                                AND ${ConversationPreview.TABLE_NAME}.${ConversationPreview.COL_USER_ID} = ?
                                AND ${Contact.TABLE_NAME}.${Contact.COL_USER_ID} = ?
                                ORDER BY timestamp DESC`;
        const values = [userId, userId];

        db.get().query(query, values, (err: MysqlError, rows: any[]) => cb(err, rows));
    }

    public static updatePreview(message: AmadeusMessage, cb: MysqlModificationCallback): void {

        const cleanPhoneNumber: string = PhoneNumberUtils.normalizePhoneNumber(message.phone_num_clean);
        const insertQuery: string = `INSERT INTO ${ConversationPreview.TABLE_NAME}
                                        (${ConversationPreview.COL_ADDRESS}, ${ConversationPreview.COL_NAME}, ${ConversationPreview.COL_BODY},
                                        ${ConversationPreview.COL_TIMESTAMP}, ${ConversationPreview.COL_USER_ID})
                                        VALUES (?, ?, ?, ?, ?)
                                        ON DUPLICATE KEY UPDATE
                                        ${ConversationPreview.COL_BODY} = ?, ${ConversationPreview.COL_TIMESTAMP} = ?`;
        const insertValues = [cleanPhoneNumber, cleanPhoneNumber, message.textMessageBody,
                                message.timestamp, message.userId, message.textMessageBody, message.timestamp];

        const selectQuery: string = `SELECT ${ConversationPreview.TABLE_NAME}.${ConversationPreview.COL_ID},
                                        ${Contact.TABLE_NAME}.${Contact.COL_NAME}, ${ConversationPreview.COL_TIMESTAMP},
                                        ${ConversationPreview.COL_BODY}, ${ConversationPreview.COL_THREAD_ID}, ${ConversationPreview.COL_TYPE},
                                        ${ConversationPreview.COL_ADDRESS}, ${ConversationPreview.TABLE_NAME}.${ConversationPreview.COL_CONTACT_ID}
                                        FROM ${ConversationPreview.TABLE_NAME}
                                        JOIN ${Contact.TABLE_NAME}
                                        ON ${ConversationPreview.COL_ADDRESS} = ${Contact.COL_PHONE_NUMBER}
                                        WHERE ${ConversationPreview.COL_ADDRESS} = ?`;
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

        const insertContactQuery: string = `INSERT IGNORE INTO ${Contact.TABLE_NAME}
                                            (${Contact.COL_NAME}, ${Contact.COL_PHONE_NUMBER},
                                            ${Contact.COL_USER_ID})
                                            VALUES (?, ?, ?)`;
        const insertContactValues = [cleanPhoneNumber, cleanPhoneNumber, message.userId];

        db.get().query(insertContactQuery, insertContactValues);
    }


}
