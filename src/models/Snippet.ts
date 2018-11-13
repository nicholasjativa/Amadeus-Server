import * as db from "../db.js";
import { PhoneNumberUtils } from "../utils/phoneNumberUtils";

export class Snippet {

    public static create(phoneNumber, body, contactId, name, threadId, timestamp, type): void {
        phoneNumber = PhoneNumberUtils.normalizPhoneNumber(phoneNumber);
        const values = [phoneNumber, body, contactId, name, threadId, timestamp, type];

        db.get().query(`INSERT INTO snippets (address, body, contactId, name, threadId, timestamp, type)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        values, (err, result) => {
                            if (err) {
                                console.log("Error inserting snippet into table.");
                            } else {
                            }
                        });
    }

    public static delete(phone_num_clean, cb?) {

        db.get().query(`DELETE FROM texts
                        WHERE address = ?`,
                        [phone_num_clean],
                        (err, result) => {
                            if (cb && typeof cb === "function") {
                                if (err) {
                                    return cb(err, undefined);
                                } else {
                                    return cb(undefined, result);
                                }
                            }
                        });
    }

    public static dropTable(): void {
        db.get().query("TRUNCATE TABLE snippets", (err, result) => {
            if (err) {
                console.log("Error truncating table.");
            } else {
            }
        });
    }

    public static getSnippets(cb): void {
        db.get().query(`SELECT contacts.name, timestamp, address, body FROM snippets
                        JOIN contacts
                        WHERE address = phoneNumber
                        ORDER BY timestamp DESC`,
                        (err, rows) => {
                            if (err) {
                                return console.log("Error getting all snippets");
                            } else {
                                return cb(undefined, rows);
                            }
                        });
    }

    public static updateConversationSnippet(phone_num_clean, body, timestamp, cb): void {
        phone_num_clean = PhoneNumberUtils.normalizPhoneNumber(phone_num_clean);

        const values = [phone_num_clean, phone_num_clean, body, timestamp, body, timestamp];
        db.get().query(`INSERT INTO snippets
                        (address, name, body, timestamp)
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                        body = ?, timestamp = ?`,
                        values,
                        (err, result) => {
                            if (cb && typeof cb === "function") {
                                if (err) {
                                    return cb(err, undefined);
                                } else {
                                    db.get().query(`SELECT *
                                                    FROM snippets
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
