import { Router, Request, Response } from "express";
import { User } from "../models/User";
import { AmadeusAccountCreationData } from "../interfaces/AmadeusAccountCreationData";

export class UsersController {
    public router: Router = Router();

    constructor() {
        this.router.post("/create-account", this.createAccount.bind(this));
        this.router.post("/login", this.handleLogin.bind(this));
        this.router.get("/user", this.getUser.bind(this));
    }

    private getUser(req: Request, res: Response): void {

        const userId: number = req.session.userId;

        User.findById(userId, (error, results) => {

            const user = results[0];

            if (error) {
                res.send(error);
            } else if (!user) {
                res.sendStatus(401);
            } else {
                res.send({ user: { emailAddress: user.emailAddress, id: user.id } });
            }

        });
    }

    private createAccount(req: Request, res: Response): void {

        const accountCreationData: AmadeusAccountCreationData = req.body;

        User.createNewAccount(accountCreationData, (err, success) => {

            if (err && err.code === "ER_DUP_ENTRY") {

                res.status(400).json({
                    error: "Email or phone number already exist" // TODO figure out how to generlize errors
                });

            } else if (success) {

                res.json({
                    success: true
                });
            }
        });

    }

    private handleLogin(req: Request, res: Response): void {

        const emailAddress: string = req.body.emailAddress;
        const password: string = req.body.password;

        User.findOne(emailAddress, password, (err, user, info) => {

            if (err) return console.log(err); // TODO handle errors

            if (user) {

                req.session.userId = user.id;
                req.session.registrationToken = user.registrationToken;
                res.send({
                    user: {
                        emailAddress: user.emailAddress,
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phoneNumber: user.phoneNumber
                    }
                });
            } else {
                res.status(401).json(info.error);
            }

        });
    }

}