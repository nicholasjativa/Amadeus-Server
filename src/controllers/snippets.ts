import { NextFunction, Response, Request, Router, } from "express";
import { Snippet } from "../models/Snippet";
import { SnippetCreationData } from "../interfaces/SnippetCreationData";

export class SnippetsController {
    public router: Router = Router();

    constructor() {
        this.router.get("/", this.getSnippets.bind(this));
        this.router.post("/", this.handleSnippetsReceived.bind(this));    }

    private getSnippets(req: Request, res: Response): void {

        const userId: number = req.session.userId;

        Snippet.getSnippets(userId, (err, rows) => {
            if (err) {
                console.log(err);
            } else {
                res.json(rows);
            }
        });
    }

    private handleSnippetsReceived(req: Request, res: Response): void {

        // Snippet.dropTable(); TODO this will need to change to accommadate for users (not just me)
        const snippetsArr = JSON.parse(req.body.snippets);
        for (let i = 0; i < snippetsArr.length; i++) {
            const snippetData: SnippetCreationData = snippetsArr[i];

            Snippet.create(snippetData, () => {}); // TODO handle result/error
        }
        res.sendStatus(200).json({ success: "OK" });
    }

}