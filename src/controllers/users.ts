import { Router, Request, Response } from "express";
import { User } from "../models/User";

export class UsersController {
    public router: Router = Router();

    constructor() {
        this.router.post("/create-account", this.handleCreateAccount.bind(this));
        this.router.post("/login", this.handleLogin.bind(this));
        this.router.get("/user", this.getUser.bind(this));
    }

    public getUser(req: Request, res: Response, next): void {
        User.findById(req.session.userId, (error, result) => {
            if (error) {
                console.log(error);
                return res.send(error);
            }
            if (!result) {
                return res.sendStatus(401);
            }

            res.send({user: { emailAddress: result[0].emailAddress, id: result[0].id }});
        });
    }

    public handleCreateAccount(req: Request, res: Response): void {

        const accountCreationData = req.body;
        User.createNewAccount(accountCreationData, (err, success) => {

            if (err && err.code === "ER_DUP_ENTRY") {

                res.status(400).json({
                    error: "Email or phone number already exist"
                });

            } else if (success) {

                res.json({
                    success: true
                });
            }
        });

    }

    public handleLogin(req, res, next): void {
        const emailAddress = req.body.user.emailAddress;
        const password = req.body.user.password;
        User.findOne(emailAddress, password, (err, user, info) => {

            if (err) return console.log(err);

            if (user) {
                console.log("A user has successfully logged in.");
                req.session.userId = user.id;
                req.session.registrationToken = user.registrationToken;
                res.send({ user: {
                    emailAddress: user.emailAddress,
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phoneNumber: user.phoneNumber
                }});
            } else {
                res.status(401).json(info.error);
            }

        });
    }

}