"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db = require("../db");
const crypto = require("crypto");
class User {
    constructor(emailAddress, name, phoneNumber) {
        this.emailAddress = emailAddress;
        this.name = name;
        this.phoneNumber = phoneNumber;
    }
    static findById(id, cb) {
        db.get().query(`SELECT *
                        FROM users
                        WHERE id = ?`, [id], (err, result) => {
            if (err) {
                return cb(err, undefined);
            }
            else if (result.length === 0) {
                return cb(undefined, undefined);
            }
            else {
                return cb(undefined, result);
            }
        });
    }
    static findOne(emailAddress, password, done) {
        db.get().query("SELECT * FROM users WHERE emailAddress = ?", [emailAddress], (err, result) => {
            if (result.length == 0) {
                return done(undefined, false, { error: "email or password is invalid" });
            }
            else {
                if (!User.validatePassword(password, result[0].hash, result[0].salt)) {
                    return done(undefined, false, { error: "email or password is invalid" });
                }
                else {
                    return done(undefined, result[0]);
                }
            }
        });
    }
    save() {
        db.get().query("INSERT INTO users (emailAddress, hash, salt, phoneNumber, name) VALUES (?, ?, ?, ?, ?)", [this.emailAddress, this.hash, this.salt, this.phoneNumber, this.name], (err, result) => {
            if (err)
                console.log("Error in Users table: ", err);
            else
                console.log("Successfully saved new user into Users table.");
        });
    }
    setPassword(password) {
        this.salt = crypto.randomBytes(16).toString("hex");
        this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, "sha512").toString("hex");
    }
    static validatePassword(password, userHash, userSalt) {
        const hash = crypto.pbkdf2Sync(password, userSalt, 10000, 512, "sha512").toString("hex");
        return userHash === hash;
    }
}
exports.User = User;
//# sourceMappingURL=User.js.map