import { NextFunction, Response, Request, Router, } from "express";
import { Snippet } from "../models/Snippet";

export class SnippetsController {
    public router: Router = Router();

    constructor() {
        this.router.get("/", this.getSnippets.bind(this));
        this.router.post("/", this.handleSnippetsReceived.bind(this));    }

    getSnippets(req: Request, res: Response): void {

        const userId: number = req.session.userId;

        Snippet.getSnippets(userId, (err, rows) => {
            if (err) {
                console.log(err);
            } else {
                res.json(rows);
            }
        });
    }

    handleSnippetsReceived(req: Request, res: Response): void {
        Snippet.dropTable();
        const snippetsArr = JSON.parse(req.body.snippets);
        for (let i = 0; i < snippetsArr.length; i++) {
            const s = snippetsArr[i];
            Snippet.create(s.address, s.body, s.contactId, s.name, s.threadId, s.timestamp, s.type);
        }
        res.sendStatus(200);
    }

}