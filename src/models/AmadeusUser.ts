import * as db from "../db";
import * as crypto from "crypto";
import { MysqlError } from "mysql";
import { MysqlCallback } from "../interfaces/MysqlCallback";
import { MysqlModificationCallback } from "../interfaces/MysqlModificationCallback";

export class AmadeusUser {
    public static readonly TABLE_NAME = "amadeus_user";
    public static readonly COL_ID = "id";
    public static readonly COL_FIRST_NAME = "firstName";
    public static readonly COL_LAST_NAME = "lastName";
    public static readonly COL_EMAIL_ADDRESS = "emailAddress";
    public static readonly COL_PHONE_NUMBER = "phoneNumber";
    public static readonly COL_HASH = "hash";
    public static readonly COL_SALT = "salt";
    public static readonly COL_REGISTRATION_TOKEN = "registrationToken";
    public static readonly CREATE_TABLE = `
    CREATE TABLE ${AmadeusUser.TABLE_NAME} (
        ${AmadeusUser.COL_ID} INT(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
        ${AmadeusUser.COL_FIRST_NAME} VARCHAR(20),
        ${AmadeusUser.COL_LAST_NAME} VARCHAR(30),
        ${AmadeusUser.COL_EMAIL_ADDRESS} VARCHAR(255) NOT NULL UNIQUE,
        ${AmadeusUser.COL_PHONE_NUMBER} VARCHAR(15) NOT NULL UNIQUE,
        ${AmadeusUser.COL_REGISTRATION_TOKEN} VARCHAR(255),
        ${AmadeusUser.COL_HASH} VARCHAR(1024),
        ${AmadeusUser.COL_SALT} VARCHAR(255)
    )`;

    private constructor() {
    }

    public static createNewAccount(creationData, cb: MysqlModificationCallback): void {

        const { email, firstName, lastName, password, phoneNumber } = creationData;
        const salt: string = crypto.randomBytes(16).toString("hex");
        const hash: string = crypto.pbkdf2Sync(password, salt, 10000, 512, "sha512").toString("hex");

        const query: string = `INSERT INTO ${AmadeusUser.TABLE_NAME}
                                (${AmadeusUser.COL_EMAIL_ADDRESS}, ${AmadeusUser.COL_FIRST_NAME}, ${AmadeusUser.COL_LAST_NAME},
                                ${AmadeusUser.COL_PHONE_NUMBER}, ${AmadeusUser.COL_SALT}, ${AmadeusUser.COL_HASH})
                                VALUES
                                (?, ?, ?, ?, ?, ?)`;
        const values = [email, firstName, lastName, phoneNumber, salt, hash];

        db.get().query(query, values, (err: MysqlError, results: any) => cb(err, results));
    }

    public static findById(userId: number, cb: MysqlCallback): void {

        const query: string = `SELECT *
                                FROM ${AmadeusUser.TABLE_NAME}
                                WHERE ${AmadeusUser.COL_ID} = ?`;
        const values = [userId];

        db.get().query(query, values, (err: MysqlError, results: any) => cb(err, results));
    }

    public static findOne(emailAddress: string, password: string, cb: (err: MysqlError, result: any, info: any) => void): void {

        const query: string = `SELECT ${AmadeusUser.COL_ID}, ${AmadeusUser.COL_FIRST_NAME}, ${AmadeusUser.COL_LAST_NAME},
                                ${AmadeusUser.COL_EMAIL_ADDRESS}, ${AmadeusUser.COL_PHONE_NUMBER},
                                ${AmadeusUser.COL_REGISTRATION_TOKEN}, ${AmadeusUser.COL_HASH}, ${AmadeusUser.COL_SALT}
                                FROM ${AmadeusUser.TABLE_NAME}
                                WHERE ${AmadeusUser.COL_EMAIL_ADDRESS} = ?`;
        const values = [emailAddress];

        db.get().query(query, values,
            (err: MysqlError, result: any) => {

                const user = result[0];

                if (!user || !AmadeusUser.validatePassword(password, user.hash, user.salt)) {
                    cb(undefined, undefined, { error: "email or password is invalid" });
                } else {
                    cb(undefined, user, undefined);
                }

            });
    }

    public static updateRegistrationToken(userId: number, token: string, cb: MysqlModificationCallback): void {

        const query: string = `UPDATE ${AmadeusUser.TABLE_NAME}
                                SET ${AmadeusUser.COL_REGISTRATION_TOKEN} = ?
                                WHERE ${AmadeusUser.COL_ID} = ?`;
        const values = [token, userId];

        db.get().query(query, values, (err: MysqlError, result: any) => cb(err, result));
    }

    public static validatePassword(password: string, hash: string, salt: string): boolean {
        const calculatedHash: string = crypto.pbkdf2Sync(password, salt, 10000, 512, "sha512").toString("hex");
        return hash === calculatedHash;
    }

}