import * as db from "../db";
import { PhoneNumberUtils } from "../utils/phoneNumberUtils";
import { MysqlCallback } from "../interfaces/MysqlCallback";
import { MysqlError } from "mysql";

export class Contact {

    public static getContact(phoneNumber: string, cb: MysqlCallback): void {

        const query: string = `SELECT *
                                FROM contacts
                                WHERE phoneNumber = ?`;
        const values: string[] = [phoneNumber];

        db.get().query(query, values, (err: MysqlError, rows: any[]) => cb(err, rows));
    }

    public static getContacts(cb: MysqlCallback): void {

        const query: string = `SELECT * FROM contacts`;

        db.get().query(query, (err: MysqlError, rows: any[]) => cb(err, rows));
    }

    public static saveContact(id: string, name: string, phoneNumber: string): void {

        const cleanPhoneNumber: string = PhoneNumberUtils.normalizePhoneNumber(phoneNumber);
        const query: string = `INSERT INTO contacts (contactId, name, phoneNumber) VALUES (?, ?, ?)
                                ON DUPLICATE KEY UPDATE
                                phoneNumber = ?,
                                name = ?`;
        const values = [id, name, cleanPhoneNumber, cleanPhoneNumber, name];

        db.get().query(query, values);
    }

}