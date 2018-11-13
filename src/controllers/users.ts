import { Router, Request, Response } from "express";
import { User } from "../models/User";

export class UsersController {
    public router: Router;

    constructor() {
        this.router = Router();
        this.setupRoutes();
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

    public handleSignup(req, res, next): void {
        const email = req.body.user.emailAddress;
        const name = req.body.user.name;
        const phoneNumber = req.body.user.phoneNumber;
        const user = new User(email, name, phoneNumber);
        user.setPassword(req.body.user.password);

        user.save();

    }


    public handleLogin(req, res, next): void {
        const emailAddress = req.body.user.emailAddress;
        const password = req.body.user.password;
        User.findOne(emailAddress, password, (err, user, info) => {

            if (err) return console.log(err);

            if (user) {
                console.log("A user has successfully logged in.");
                req.session.userId = user.id;
                res.send({ user: { emailAddress: user.emailAddress, id: user.id }});
            } else {
                res.json(info);
            }

        });
    }

    public setupRoutes(): void {
        this.router.post("/signup", this.handleSignup.bind(this));
        this.router.post("/login", this.handleLogin.bind(this));
        this.router.get("/user", this.getUser.bind(this));
    }
}