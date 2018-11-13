import * as db from "../db";
import * as crypto from "crypto";

export class User {
    private id: number;
    private emailAddress: string;
    private hash: string;
    private salt: string;
    private name: string;
    private phoneNumber: string;

    constructor(emailAddress, name, phoneNumber) {
        this.emailAddress = emailAddress;
        this.name = name;
        this.phoneNumber = phoneNumber;
    }

    public static findById(id, cb): void {
        db.get().query(`SELECT *
                        FROM users
                        WHERE id = ?`,
                        [id],
                        (err, result) => {
                            if (err) {
                                return cb(err, undefined);
                            } else if (result.length === 0) {
                                return cb(undefined, undefined);
                            } else {
                                return cb(undefined, result);
                            }
                        });
    }

    public static findOne(emailAddress, password, done): void {
        db.get().query("SELECT * FROM users WHERE emailAddress = ?", [emailAddress],
            (err, result) => {
                if (result.length == 0) {
                    return done(undefined, false, { error: "email or password is invalid" });
                } else {
                    if (!User.validatePassword(password, result[0].hash, result[0].salt)) {
                        return done(undefined, false, { error: "email or password is invalid" });
                    } else {
                        return done(undefined, result[0]);
                    }
                }

            });
    }

    save(): void {
        db.get().query("INSERT INTO users (emailAddress, hash, salt, phoneNumber, name) VALUES (?, ?, ?, ?, ?)",
            [this.emailAddress, this.hash, this.salt, this.phoneNumber, this.name],
            (err, result) => {
                if (err) console.log("Error in Users table: ", err);
                else console.log("Successfully saved new user into Users table.");
            });
    }

    setPassword(password): void {
        this.salt = crypto.randomBytes(16).toString("hex");
        this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, "sha512").toString("hex");
    }

    static validatePassword(password, userHash, userSalt): boolean {
        const hash = crypto.pbkdf2Sync(password, userSalt, 10000, 512, "sha512").toString("hex");
        return userHash === hash;
    }

}