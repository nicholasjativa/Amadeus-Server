import { Request, Response, Router, NextFunction } from "express";
import { Contact } from "../models/Contact";

export class ContactsController {
    public router: Router = Router();

    constructor() {

        this.router.post("/", this.handleReceivingContacts.bind(this));
        this.router.get("/", this.handleSendingContacts.bind(this));
    }

    private handleReceivingContacts(req: Request, res: Response): void {

        const contacts: any[] = JSON.parse(req.body.contacts);
        const userId: number = req.body.userId;

        contacts.forEach((obj: { contactId: string, displayName: string, phoneNumber: string}) => {

            const contactId: string = obj.contactId;
            const displayName: string = obj.displayName;
            const phoneNumber: string = obj.phoneNumber;

            Contact.saveContact(contactId, displayName, phoneNumber, userId);
        });

        res.json({ success: true });
    }

    private handleSendingContacts(req: Request, res: Response, next: NextFunction): void {

        Contact.getContacts((err, rows) => {
            if (err) {
                next(err);
            } else {
                res.send(rows);
            }
        });
    }

}