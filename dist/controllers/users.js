"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const User_1 = require("../models/User");
class UsersController {
    constructor() {
        this.router = express_1.Router();
        this.setupRoutes();
    }
    getUser(req, res, next) {
        User_1.User.findById(req.session.userId, (error, result) => {
            if (error) {
                console.log(error);
                return res.send(error);
            }
            if (!result) {
                return res.sendStatus(401);
            }
            res.send({ user: { emailAddress: result[0].emailAddress, id: result[0].id } });
        });
    }
    handleSignup(req, res, next) {
        const email = req.body.user.emailAddress;
        const name = req.body.user.name;
        const phoneNumber = req.body.user.phoneNumber;
        const user = new User_1.User(email, name, phoneNumber);
        user.setPassword(req.body.user.password);
        user.save();
    }
    handleLogin(req, res, next) {
        const emailAddress = req.body.user.emailAddress;
        const password = req.body.user.password;
        User_1.User.findOne(emailAddress, password, (err, user, info) => {
            if (err)
                return console.log(err);
            if (user) {
                console.log("A user has successfully logged in.");
                req.session.userId = user.id;
                res.send({ user: { emailAddress: user.emailAddress, id: user.id } });
            }
            else {
                res.json(info);
            }
        });
    }
    setupRoutes() {
        this.router.post("/signup", this.handleSignup.bind(this));
        this.router.post("/login", this.handleLogin.bind(this));
        this.router.get("/user", this.getUser.bind(this));
    }
}
exports.UsersController = UsersController;
//# sourceMappingURL=users.js.map