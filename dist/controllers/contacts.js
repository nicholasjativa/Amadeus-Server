"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Contact_1 = require("../models/Contact");
class ContactsController {
    constructor() {
        this.router = express_1.Router();
        this.router.post("/", this.handleReceivingContacts.bind(this));
        this.router.get("/", this.handleSendingContacts.bind(this));
    }
    handleReceivingContacts(req, res) {
        const contacts = JSON.parse(req.body.contacts);
        contacts.forEach((obj) => {
            const contactId = obj.contactId;
            const displayName = obj.displayName;
            const phoneNumber = obj.phoneNumber;
            Contact_1.Contact.saveContact(contactId, displayName, phoneNumber);
        });
        res.sendStatus(200);
    }
    handleSendingContacts(req, res) {
        Contact_1.Contact.getContacts((err, rows) => {
            if (err) {
                res.send(err);
            }
            else {
                res.send(rows);
            }
        });
    }
}
exports.ContactsController = ContactsController;
//# sourceMappingURL=contacts.js.map