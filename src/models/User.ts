import * as db from "../db";
import * as crypto from "crypto";
import { MysqlError } from "mysql";
import { MysqlCallback } from "../interfaces/MysqlCallback";
import { MysqlModificationCallback } from "../interfaces/MysqlModificationCallback";

export class User {

    constructor() {
    }

    public static createNewAccount(creationData, cb: MysqlModificationCallback): void {

        const { email, firstName, lastName, password, phoneNumber } = creationData;
        const salt: string = crypto.randomBytes(16).toString("hex");
        const hash: string = crypto.pbkdf2Sync(password, salt, 10000, 512, "sha512").toString("hex");

        const query: string = `INSERT INTO users
                        (emailAddress, firstName, lastName, phoneNumber, salt, hash)
                        VALUES
                        (?, ?, ?, ?, ?, ?)`;
        const values = [email, firstName, lastName, phoneNumber, salt, hash];

        db.get().query(query, values, (err: MysqlError, results: any) => cb(err, results));
    }

    public static findById(userId: number, cb: MysqlCallback): void {

        const query: string = "SELECT * FROM users WHERE id = ?";
        const values = [userId];

        db.get().query(query, values, (err: MysqlError, results: any) => cb(err, results));
    }

    public static findOne(emailAddress: string, password: string, cb: (err: MysqlError, result: any, info: any) => void): void {

        const query: string = `SELECT firstName, lastName, id, emailAddress, phoneNumber, hash, salt 
                                FROM users 
                                WHERE emailAddress = ?`;
        const values = [emailAddress];

        db.get().query(query, values,
            (err: MysqlError, result: any) => {

                const user = result[0];

                if (!user || !User.validatePassword(password, user.hash, user.salt)) {
                    cb(undefined, undefined, { error: "email or password is invalid" });
                } else {
                    cb(undefined, user, undefined);
                }

            });
    }

    public static updateRegistrationToken(userId: number, token: string, cb: MysqlModificationCallback): void {

        const query: string = `UPDATE users
                                SET registrationToken = ?
                                WHERE id = ?`;
        const values = [token, userId];

        db.get().query(query, values, (err: MysqlError, result: any) => cb(err, result));
    }

    public static validatePassword(password: string, hash: string, salt: string): boolean {
        const calculatedHash: string = crypto.pbkdf2Sync(password, salt, 10000, 512, "sha512").toString("hex");
        return hash === calculatedHash;
    }

}