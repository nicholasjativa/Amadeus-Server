import * as db from "../db";
import { PhoneNumberUtils } from "../utils/phoneNumberUtils";

export class Contact {

    public static getContacts(cb: Function): void {
        const query: string = `SELECT * FROM contacts`;

        db.get().query(
            query,
            (err, rows) => {
                if (err) {
                    cb(err, undefined);
                } else {
                    cb(undefined, rows);
                }
            });
    }

    public static saveContact(id: string, name: string, phoneNumber: string) {
        phoneNumber = PhoneNumberUtils.normalizPhoneNumber(phoneNumber);

        db.get().query(`
            INSERT INTO contacts (contactId, name, phoneNumber) VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                phoneNumber = ?,
                name = ?`,
            [id, name, phoneNumber, phoneNumber, name]);
    }

}