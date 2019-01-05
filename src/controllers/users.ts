import { Router, Request, Response, NextFunction } from "express";
import { AmadeusUser } from "../models/AmadeusUser";
import { AmadeusAccountCreationData } from "../interfaces/AmadeusAccountCreationData";
import { logger } from "../util/logger";

export class UsersController {
    public router: Router = Router();

    constructor() {
        this.router.post("/create-account", this.createAccount.bind(this));
        this.router.post("/login", this.handleLogin.bind(this));
        this.router.get("/user", this.getUser.bind(this));
        this.router.post("/update-registration-token", this.updateRegistrationToken.bind(this));
    }

    private getUser(req: Request, res: Response, next: NextFunction): void {

        const userId: number = req.session.userId;

        AmadeusUser.findById(userId, (err, results) => {

            const user = results[0];

            if (err) {
                next(err);
            } else if (!user) {
                res.sendStatus(401);
            } else {
                res.send({
                    user: {
                        emailAddress: user.emailAddress,
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        phoneNumber: user.phoneNumber
                    }
                });
            }

        });
    }

    private createAccount(req: Request, res: Response): void {

        const accountCreationData: AmadeusAccountCreationData = req.body;

        AmadeusUser.createNewAccount(accountCreationData, (err, success) => {

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

    private handleLogin(req: Request, res: Response, next: NextFunction): void {

        const emailAddress: string = req.body.emailAddress;
        const password: string = req.body.password;

        AmadeusUser.findOne(emailAddress, password, (err, user, info) => {

            if (err) {
                return next(err);
            }

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

    private updateRegistrationToken(req: Request, res: Response, next: NextFunction): void {

        const token: string = req.body.registrationToken;
        const userId: number = req.body.userId;

        AmadeusUser.updateRegistrationToken(userId, token, (err, result) => {

            if (err) {
                next(err);
            }

            if (result) {
                res.send(200);
            }
        });
    }

}