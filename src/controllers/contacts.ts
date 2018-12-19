import { Request, Response, Router } from "express";
import { Contact } from "../models/Contact";

export class ContactsController {
    public router: Router = Router();

    constructor() {

        this.router.post("/", this.handleReceivingContacts.bind(this));
        this.router.get("/", this.handleSendingContacts.bind(this));
    }

    private handleReceivingContacts(req: Request, res: Response): void {
        const contacts: any[] = JSON.parse(req.body.contacts);

        contacts.forEach((obj: { contactId: string, displayName: string, phoneNumber: string}) => {

            const contactId: string = obj.contactId;
            const displayName: string = obj.displayName;
            const phoneNumber: string = obj.phoneNumber;

            Contact.saveContact(contactId, displayName, phoneNumber);
        });

        res.sendStatus(200);
    }

    private handleSendingContacts(req: Request, res: Response): void {

        Contact.getContacts((err, rows) => {
            if (err) {
                res.send(err);
            } else {
                res.send(rows);
            }
        });
    }

}