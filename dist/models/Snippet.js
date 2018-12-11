"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../db.js");
const phoneNumberUtils_1 = require("../utils/phoneNumberUtils");
class Snippet {
    static create(phoneNumber, body, contactId, name, threadId, timestamp, type) {
        phoneNumber = phoneNumberUtils_1.PhoneNumberUtils.normalizPhoneNumber(phoneNumber);
        const values = [phoneNumber, body, contactId, name, threadId, timestamp, type];
        db.get().query(`INSERT INTO snippets (address, body, contactId, name, threadId, timestamp, type)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`, values, (err, result) => {
            if (err) {
                console.log("Error inserting snippet into table.");
            }
            else {
            }
        });
    }
    static delete(phone_num_clean, cb) {
        db.get().query(`DELETE FROM texts
                        WHERE address = ?`, [phone_num_clean], (err, result) => {
            if (cb && typeof cb === "function") {
                if (err) {
                    return cb(err, undefined);
                }
                else {
                    return cb(undefined, result);
                }
            }
        });
    }
    static dropTable() {
        db.get().query("TRUNCATE TABLE snippets", (err, result) => {
            if (err) {
                console.log("Error truncating table.");
            }
            else {
            }
        });
    }
    static getSnippets(cb) {
        db.get().query(`SELECT contacts.name, timestamp, address, body FROM snippets
                        JOIN contacts
                        WHERE address = phoneNumber
                        ORDER BY timestamp DESC`, (err, rows) => {
            if (err) {
                return console.log("Error getting all snippets");
            }
            else {
                return cb(undefined, rows);
            }
        });
    }
    static updateConversationSnippet(phone_num_clean, body, timestamp, cb) {
        phone_num_clean = phoneNumberUtils_1.PhoneNumberUtils.normalizPhoneNumber(phone_num_clean);
        const values = [phone_num_clean, phone_num_clean, body, timestamp, body, timestamp];
        db.get().query(`INSERT INTO snippets
                        (address, name, body, timestamp)
                        VALUES (?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE
                        body = ?, timestamp = ?`, values, (err, result) => {
            if (cb && typeof cb === "function") {
                if (err) {
                    return cb(err, undefined);
                }
                else {
                    db.get().query(`SELECT snippets.id, contacts.name, timestamp, body, threadId, type,
                                                    address, snippets.contactId
                                                    FROM snippets
                                                    JOIN contacts
                                                    ON phoneNumber = address
                                                    WHERE address = ?`, [phone_num_clean], (err, result) => cb(undefined, result));
                }
            }
        });
        db.get().query(`INSERT IGNORE INTO contacts
                        (name, phoneNumber)
                        VALUES (?, ?)`, [phone_num_clean, phone_num_clean]);
    }
}
exports.Snippet = Snippet;
//# sourceMappingURL=Snippet.js.map