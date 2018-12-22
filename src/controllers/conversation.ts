import * as admin from "firebase-admin";
import { Response, Request, Router, } from "express";
import { Snippet } from "../models/Snippet";
import { Text } from "../models/Text";
import { messaging } from "firebase-admin";
import * as SocketIO from "socket.io";
import { Contact } from "../models/Contact";

/*
    TODOs
        - change all emits to user specific
        - include return types for all functions

*/

export class ConversationController {
    public router: Router = Router();
    private readonly MESSAGE_STATE_PENDING: string = "pending";
    private readonly MESSAGE_STATE_GCM_SUCCESS: string = "gcm_success";
    private readonly MESSAGE_STATE_GCM_ERROR: string = "gcm_error";
    private readonly MESSAGE_STATE_PHONE_SUCCESS: string = "phone_success";
    private readonly MESSAGE_STATE_PHONE_ERROR: string = "phone_error";


    constructor(private io: SocketIO.Server) {

        this.io.on("connection", (socket) => {

            console.log("Knightmare frame initialised on server.");
            socket.send("Knightmare Frame connection established.");
        });

        this.router.post("/", this.handleSmsReceivedOnAndroidAndRelayedHere.bind(this));
        this.router.post("/send-to-device", this.relayMessageToAndroid.bind(this));
        this.router.post("/getConversationMessages", this.getConversationMessages.bind(this));
        this.router.post("/own", this.catchOutgoingMessagesSentOnAndroid.bind(this));
        this.router.post("/update-outgoing-text-message-id", this.handleUpdateOutgoingTextId.bind(this));
    }

    private catchOutgoingMessagesSentOnAndroid(req: Request, res: Response): void {

        const timestamp = req.body.timestamp;
        const amadeusId = timestamp + req.body.toPhoneNumber;
        const userId: number = req.body.userId;
        const message = {
            msgid_phone_db: req.body.msgid_phone_db,
            phone_num_clean: req.body.toPhoneNumber,
            thread_id: req.body.thread_id,
            fromPhoneNumber: req.body.fromPhoneNumber,
            toPhoneNumber: req.body.toPhoneNumber,
            textMessageBody: req.body.textMessageBody,
            amadeusId,
            timestamp,
            userId
        };

        this.storeMessageInDb(message);
        // TODO do this the right way
        this.io.emit("ownMessageSentOnAndroid", Object.assign({ status: this.MESSAGE_STATE_PHONE_SUCCESS }, message));
        Text.updateMesssageStatus(amadeusId, this.MESSAGE_STATE_PHONE_SUCCESS, (err, result) => {});
        res.sendStatus(200);
    }

    private getConversationMessages(req: Request, res: Response): void {

        const phone_num_clean = req.body.phone_num_clean;
        const userId = req.session.userId;

        Text.getAllMessages(phone_num_clean, userId, (err, messagesRows) => {
            if (err) {
                return res.json(err);
            } else {
                console.log("Sending conversation messages to client.");
                Contact.getContact(phone_num_clean, (err, contactRows) => {

                    const info = contactRows[0];

                    if (err) {
                        return res.json(err);
                    } else {
                        const response = {
                            name: info.name,
                            address: info.phoneNumber,
                            messages: messagesRows
                        };
                        res.json(response);
                    }
                });
            }
        });
    }

    private handleSmsReceivedOnAndroidAndRelayedHere(req: Request, res: Response): void {

        const timestamp: number = Date.now();
        const amadeusId: string = timestamp + req.body.fromPhoneNumber;
        const userId: number = req.body.userId;

        const message = {
            fromPhoneNumber: req.body.fromPhoneNumber,
            toPhoneNumber: req.body.toPhoneNumber,
            phone_num_clean: req.body.fromPhoneNumber,
            textMessageBody: req.body.textMessageBody,
            amadeusId,
            timestamp,
            userId
        };
        res.sendStatus(200);
        this.io.emit("receivedMessageFromAndroid", message);
        this.storeMessageInDb(message);
    }


    public relayMessageToAndroid(req: Request, res: Response): void {

        const timestamp = Date.now();
        const amadeusId = timestamp + req.body.toPhoneNumber;
        const userId: string = req.session.userId;
        const registrationToken: string = req.session.registrationToken;

        const payload = {
            data: {
                toPhoneNumber: req.body.toPhoneNumber,
                fromPhoneNumber: req.body.fromPhoneNumber,
                textMessageBody: req.body.textMessageBody,
                amadeusId
            }
        };

        const message = {
            toPhoneNumber: req.body.toPhoneNumber,
            fromPhoneNumber: req.body.fromPhoneNumber,
            textMessageBody: req.body.textMessageBody,
            phone_num_clean: req.body.toPhoneNumber,
            amadeusId,
            timestamp,
            userId
        };

        this.storeMessageInDb(message);
        // TODO this should come from a mysql query
        this.sendMessageToWebsocket(Object.assign({ status: this.MESSAGE_STATE_PENDING }, message));

        res.send(JSON.stringify({message: "OK"}));

        admin.messaging().sendToDevice(registrationToken, payload)
            .then(data => {

                // TODO, this message should come from a mysql query
                const updatedMessage = Object.assign({ status: this.MESSAGE_STATE_GCM_SUCCESS }, message);
                this.io.emit("sendToAndroidSuccessful", updatedMessage);
                Text.updateMesssageStatus(amadeusId, this.MESSAGE_STATE_GCM_SUCCESS, (err, result) => {
                    if (err) console.log(err);
                    else {
                        console.log("Updated message to completed");
                    }
                });
                console.log("Relaying message to Android. Creating text to %s with message body: %s", payload.data.toPhoneNumber, payload.data.textMessageBody);
            })
            .catch(err => {
                this.io.emit("sendToAndroidError");
                console.log("Error occurred in Firebase: %s", err);
            });
    }

    private sendMessageToWebsocket(message: any): void {
        this.io.emit("sendOutgoingMessageUpstreamToWebsocketWithInitialState", message);
    }

    private storeMessageInDb(message): void {
        const msgid_phone_db: string = message.msgid_phone_db || undefined;
        const fromPhoneNumber: string = message.fromPhoneNumber;
        const toPhoneNumber: string = message.toPhoneNumber;
        const phone_num_clean: string = message.phone_num_clean;
        const textMessageBody: string = message.textMessageBody;
        const timestamp: any = message.timestamp;
        const userId: number = message.userId;

        Snippet.updateConversationSnippet(phone_num_clean, textMessageBody, timestamp, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                this.io.emit("updateSnippetSidebar", result[0]);
            }
        });

        Text.create(msgid_phone_db, phone_num_clean, fromPhoneNumber, toPhoneNumber, textMessageBody, timestamp, userId,
            (err, result) => {
                if (err) return console.log(err);

                return console.log(result);
            });
    }

    private handleUpdateOutgoingTextId(req: Request, res: Response): void {
        const amadeusId = req.body.amadeusId;
        const msgid_phone_db = req.body.msgid_phone_db;

        Text.updateMessageId(amadeusId, msgid_phone_db, (err, result) => {
            if (err) return console.log(err);

            return console.log(result);
        });

        res.sendStatus(200);
    }

}