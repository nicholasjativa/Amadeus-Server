"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../db");
const phoneNumberUtils_1 = require("../utils/phoneNumberUtils");
class Contact {
    static getContact(phoneNumber, cb) {
        const query = `SELECT * FROM contacts WHERE phoneNumber = ?`;
        const values = [phoneNumber];
        db.get().query(query, values, (err, rows) => {
            if (err) {
                cb(err, undefined);
            }
            else {
                cb(undefined, rows);
            }
        });
    }
    static getContacts(cb) {
        const query = `SELECT * FROM contacts`;
        db.get().query(query, (err, rows) => {
            if (err) {
                cb(err, undefined);
            }
            else {
                cb(undefined, rows);
            }
        });
    }
    static saveContact(id, name, phoneNumber) {
        phoneNumber = phoneNumberUtils_1.PhoneNumberUtils.normalizPhoneNumber(phoneNumber);
        db.get().query(`
            INSERT INTO contacts (contactId, name, phoneNumber) VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE
                phoneNumber = ?,
                name = ?`, [id, name, phoneNumber, phoneNumber, name]);
    }
}
exports.Contact = Contact;
//# sourceMappingURL=Contact.js.map