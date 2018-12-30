import * as db from "../db";
import { MysqlError } from "mysql";
import { MysqlModificationCallback } from "../interfaces/MysqlModificationCallback";
import { MysqlCallback } from "../interfaces/MysqlCallback";
import { AmadeusMessage } from "../interfaces/AmadeusMessage";
import { AmadeusUser } from "./AmadeusUser";

export class TextMessage {
    public static readonly TABLE_NAME = "text_message";
    public static readonly COL_ID = "id";
    public static readonly COL_FROM_PHONE_NUMBER = "fromPhoneNumber";
    public static readonly COL_TO_PHONE_NUMBER = "toPhoneNumber";
    public static readonly COL_TEXT_MESSAGE_BODY = "textMessageBody";
    public static readonly COL_PHONE_NUM_CLEAN = "phone_num_clean";
    public static readonly COL_STATUS = "status";
    public static readonly COL_TIMESTAMP = "timestamp";
    public static readonly COL_USER_ID = "userId";
    public static readonly COL_THREAD_ID = "threadId";
    public static readonly COL_AMADEUS_ID = "amadeusId";
    public static readonly COL_MSG_ID_PHONE_DB = "msgid_phone_db";
    public static readonly COL_SOURCE = "source";
    public static readonly CREATE_TABLE = `
    CREATE TABLE ${TextMessage.TABLE_NAME} (
        ${TextMessage.COL_ID} INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        ${TextMessage.COL_FROM_PHONE_NUMBER} VARCHAR(10),
        ${TextMessage.COL_TO_PHONE_NUMBER} VARCHAR(10),
        ${TextMessage.COL_TEXT_MESSAGE_BODY} VARCHAR(200),
        ${TextMessage.COL_PHONE_NUM_CLEAN} VARCHAR(10),
        ${TextMessage.COL_STATUS} VARCHAR(15),
        ${TextMessage.COL_TIMESTAMP} VARCHAR(15),
        ${TextMessage.COL_USER_ID} INT(11) NOT NULL,
        ${TextMessage.COL_THREAD_ID} INT(11),
        ${TextMessage.COL_AMADEUS_ID} VARCHAR(40),
        ${TextMessage.COL_MSG_ID_PHONE_DB} INT(10),
        ${TextMessage.COL_SOURCE} VARCHAR(10),
        CONSTRAINT fk_userId_texts
        FOREIGN KEY (${TextMessage.COL_USER_ID}) REFERENCES ${AmadeusUser.TABLE_NAME}(${AmadeusUser.COL_ID})
    )`;

    private constructor() {
    }

    // TODO this will have to be refactored since we dont know the thread id when a
    // message from a new phone comes in
    public static create(message: AmadeusMessage, cb: MysqlModificationCallback): void {

        const values = [message.fromPhoneNumber, message.toPhoneNumber, message.textMessageBody,
                        message.timestamp, message.amadeusId, message.msgid_phone_db,
                        message.phone_num_clean, message.userId];
        const query = `INSERT INTO ${TextMessage.TABLE_NAME}
                        (${TextMessage.COL_FROM_PHONE_NUMBER}, ${TextMessage.COL_TO_PHONE_NUMBER}, ${TextMessage.COL_TEXT_MESSAGE_BODY},
                        ${TextMessage.COL_TIMESTAMP}, ${TextMessage.COL_AMADEUS_ID}, ${TextMessage.COL_MSG_ID_PHONE_DB},
                        ${TextMessage.COL_PHONE_NUM_CLEAN}, ${TextMessage.COL_USER_ID})
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

        db.get().query(query, values, (err: MysqlError, result: any) => cb(err, result));
    }

    public static getAllMessages(phone_num_clean: number, userId: number, cb: MysqlCallback): void {

        const query: string = `SELECT *
                                FROM ${TextMessage.TABLE_NAME}
                                WHERE ${TextMessage.COL_PHONE_NUM_CLEAN} = ?
                                AND ${TextMessage.COL_USER_ID} = ?
                                ORDER BY timestamp DESC
                                LIMIT 30`;
        const values = [phone_num_clean, userId];

        db.get().query(query, values, (err: MysqlError, rows: any) => cb(err, rows.reverse()));
    }

    public static updateMesssageStatus(id: number, status: string, cb: MysqlModificationCallback): void {

        const query: string = `UPDATE ${TextMessage.TABLE_NAME}
                                SET ${TextMessage.COL_STATUS} = ?
                                WHERE ${TextMessage.COL_AMADEUS_ID} = ?`;
        const values = [status, id];

        db.get().query(query, values, (err: MysqlError, result: any) => cb(err, result));
    }

    public static updateMessageId(amadeusId, msgid_phone_db, cb: MysqlModificationCallback): void {

        const query: string = `UPDATE ${TextMessage.TABLE_NAME}
                                SET ${TextMessage.COL_MSG_ID_PHONE_DB} = ?
                                WHERE ${TextMessage.COL_AMADEUS_ID} = ?`;
        const values = [msgid_phone_db, amadeusId];

        db.get().query(query, values, (err: MysqlError, results: any) => cb(err, results));
    }

}


