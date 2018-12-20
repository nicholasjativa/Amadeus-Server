import * as db from "../db.js";

export class Text {

    // TODO this will have to be refactored since we dont know the thread id when a
    // message from a new phone comes in
    static create(msgid_phone_db, phone_num_clean, fromPhoneNumber, toPhoneNumber, textMessageBody, timestamp, cb): void {
        const values = [fromPhoneNumber, toPhoneNumber, textMessageBody, timestamp, timestamp + toPhoneNumber,
                        msgid_phone_db, phone_num_clean];

        db.get().query(`INSERT INTO texts
                        (fromPhoneNumber, toPhoneNumber, textMessageBody, timestamp, amadeusId, msgid_phone_db, phone_num_clean)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        values,
                        (err, result) => {
                            if (err) return cb(err, undefined);
                            else {
                                return cb(undefined, result);
                            }
                        });
    }

    static getAllMessages(phone_num_clean: number, userId: number, cb): void {
        db.get().query(`SELECT *
                        FROM texts
                        WHERE phone_num_clean = ?
                        AND userId = ?
                        ORDER BY timestamp
                        DESC LIMIT 30`,
                        [phone_num_clean, userId],
                        (err, rows) => {
                            if (err) return cb(err);
                            cb(undefined, rows.reverse());
            });
    }

    static updateMesssageStatus(id, status: string, cb?): void {

        const values = [status, id];

        db.get().query(`UPDATE texts
                        SET status = ?
                        WHERE amadeusId = ?`,
                        values,
                        (err, result) => {
                            if (typeof cb === "function" && cb()) {
                                if (err) return cb(err, undefined);
                                if (result) return cb(undefined, result);
                            }
                        });
    }

    static updateMessageId(amadeusId, msgid_phone_db, cb?): void {

        const values = [msgid_phone_db, amadeusId];

        db.get().query(`UPDATE texts
                        SET msgid_phone_db = ?
                        WHERE amadeusId = ?`,
                        values,
                        (err, results) => {
                            if (err) return cb(err, undefined);
                            return cb(undefined, results);
                        });
    }

}


