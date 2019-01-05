import * as db from "../db";
import { PhoneNumberUtils } from "../util/phoneNumberUtils";
import { MysqlCallback } from "../interfaces/MysqlCallback";
import { MysqlError } from "mysql";
import { AmadeusUser } from "./AmadeusUser";

export class Contact {
    public static readonly TABLE_NAME = "contact";
    public static readonly COL_CONTACT_ID = "contactId";
    public static readonly COL_NAME = "name";
    public static readonly COL_PHONE_NUMBER = "phoneNumber";
    public static readonly COL_USER_ID = "userId";
    public static CREATE_TABLE = `
    CREATE TABLE ${Contact.TABLE_NAME} (
        ${Contact.COL_CONTACT_ID} VARCHAR(10),
        ${Contact.COL_NAME} VARCHAR(255),
        ${Contact.COL_PHONE_NUMBER} VARCHAR(20) UNIQUE,
        ${Contact.COL_USER_ID} INT(11) UNIQUE,
        CONSTRAINT fk_userId_contacts
        FOREIGN KEY (${Contact.COL_USER_ID}) REFERENCES ${AmadeusUser.TABLE_NAME}(${AmadeusUser.COL_ID})
    )`;

    private constructor() {
    }

    public static getContact(phoneNumber: string, cb: MysqlCallback): void {

        const query: string = `SELECT *
                                FROM ${Contact.TABLE_NAME}
                                WHERE ${Contact.COL_PHONE_NUMBER} = ?`;
        const values: string[] = [phoneNumber];

        db.get().query(query, values, (err: MysqlError, rows: any[]) => cb(err, rows));
    }

    public static getContacts(cb: MysqlCallback): void {

        const query: string = `SELECT *
                                FROM ${Contact.TABLE_NAME}`;

        db.get().query(query, (err: MysqlError, rows: any[]) => cb(err, rows));
    }

    public static saveContact(id: string, name: string, phoneNumber: string, userId: number): void {

        const cleanPhoneNumber: string = PhoneNumberUtils.normalizePhoneNumber(phoneNumber);

        const query: string = `INSERT INTO ${Contact.TABLE_NAME}
                                (${Contact.COL_CONTACT_ID}, ${Contact.COL_NAME},
                                ${Contact.COL_PHONE_NUMBER}, ${Contact.COL_USER_ID})
                                VALUES (?, ?, ?, ?)
                                ON DUPLICATE KEY UPDATE
                                ${Contact.COL_PHONE_NUMBER} = ?,
                                ${Contact.COL_NAME} = ?`;
        const values = [id, name, cleanPhoneNumber, userId, cleanPhoneNumber, name];

        db.get().query(query, values);
    }

}