"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Snippet_1 = require("../models/Snippet");
class SnippetsController {
    constructor() {
        this.router = express_1.Router();
        this.router.get("/", this.getSnippets.bind(this));
        this.router.post("/", this.handleSnippetsReceived.bind(this));
    }
    getSnippets(req, res) {
        const userId = req.session.userId;
        Snippet_1.Snippet.getSnippets((err, rows) => {
            if (err) {
                console.log(err);
            }
            else {
                res.json(rows);
            }
        });
    }
    handleSnippetsReceived(req, res) {
        Snippet_1.Snippet.dropTable();
        const snippetsArr = JSON.parse(req.body.snippets);
        for (let i = 0; i < snippetsArr.length; i++) {
            const s = snippetsArr[i];
            Snippet_1.Snippet.create(s.address, s.body, s.contactId, s.name, s.threadId, s.timestamp, s.type);
        }
        res.sendStatus(200);
    }
}
exports.SnippetsController = SnippetsController;
//# sourceMappingURL=snippets.js.map