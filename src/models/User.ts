import * as db from "../db";
import * as crypto from "crypto";
import { MysqlError } from "mysql";

export class User {

    constructor() {
    }

    public static createNewAccount(creationData, cb: (err: MysqlError, results: any) => void): void {

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

    public static findById(userId: number, cb: (err: MysqlError, result: any) => void): void {

        const query: string = "SELECT * FROM users WHERE id = ?";
        const values = [userId];

        db.get().query(query, values, (err: MysqlError, results: any) => cb(err, results[0]));
    }

    public static findOne(emailAddress, password, cb: (err: MysqlError, result: any, info: any) => void): void {

        const query: string = `SELECT firstName, lastName, id, emailAddress, phoneNumber, hash, salt 
                                FROM users 
                                WHERE emailAddress = ?`;
        const values = [emailAddress];

        db.get().query(query, values,
            (err: MysqlError, result: any) => {

                const user = result[0];

                if (!user || User.validatePassword(user.password, user.hash, user.salt)) {
                    cb(undefined, undefined, { error: "email or password is invalid" });
                } else {
                    cb(undefined, user, undefined);
                }

            });
    }

    // save(): void {
    //     db.get().query("INSERT INTO users (emailAddress, hash, salt, phoneNumber, name) VALUES (?, ?, ?, ?, ?)",
    //         [this.emailAddress, this.hash, this.salt, this.phoneNumber, this.name],
    //         (err, result) => {
    //             if (err) console.log("Error in Users table: ", err);
    //             else console.log("Successfully saved new user into Users table.");
    //         });
    // }

    public static validatePassword(password: string, hash: string, salt: string): boolean {
        const calculatedHash: string = crypto.pbkdf2Sync(password, salt, 10000, 512, "sha512").toString("hex");
        return hash === calculatedHash;
    }

}