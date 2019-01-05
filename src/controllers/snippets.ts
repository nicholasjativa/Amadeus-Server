import { NextFunction, Response, Request, Router, } from "express";
import { ConversationPreview } from "../models/ConversationPreview";
import { ConversationPreviewCreationData } from "../interfaces/ConversationPreviewCreationData";

export class SnippetsController {
    public router: Router = Router();

    constructor() {
        this.router.get("/", this.getConversationPreviews.bind(this));
        this.router.post("/", this.receiveConversationPreviews.bind(this));    }

    private getConversationPreviews(req: Request, res: Response, next: NextFunction): void {

        const userId: number = req.session.userId;

        ConversationPreview.getPreviews(userId, (err, rows) => {
            if (err) {
                next(err);
            } else {
                res.json(rows);
            }
        });
    }

    private receiveConversationPreviews(req: Request, res: Response): void {

        // ConversationPreview.dropTable(); TODO this will need to change to accommadate for users (not just me)
        const snippetsArr = JSON.parse(req.body.snippets);
        for (let i = 0; i < snippetsArr.length; i++) {
            const conversationPreviewData: ConversationPreviewCreationData = snippetsArr[i];

            ConversationPreview.create(conversationPreviewData, () => {}); // TODO handle result/error
        }
        res.json({ success: true });
    }

}