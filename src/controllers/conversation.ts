import * as admin from "firebase-admin";
import { Response, Request, Router, } from "express";
import { Snippet } from "../models/Snippet";
import { Text } from "../models/Text";
import { messaging } from "firebase-admin";
import * as SocketIO from "socket.io";
import { Contact } from "../models/Contact";
import { AmadeusMessage } from "../interfaces/AmadeusMessage";
import { MysqlCallback } from "../interfaces/MysqlCallback";
import { MysqlModificationCallback } from "../interfaces/MysqlModificationCallback";

/*
    TODOs
        - change all emits to user specific

        
*/

export class ConversationController {
    public router: Router = Router();
    private readonly MESSAGE_STATE_PENDING: string = "pending";
    private readonly MESSAGE_STATE_GCM_SUCCESS: string = "gcm_success";
    private readonly MESSAGE_STATE_GCM_ERROR: string = "gcm_error";
    private readonly MESSAGE_STATE_PHONE_SUCCESS: string = "phone_success";
    private readonly MESSAGE_STATE_PHONE_ERROR: string = "phone_error";
    private userSockets: Map<number, SocketIO.Socket> = new Map(); // TODO eventually use rooms?

    constructor(private io: SocketIO.Server) {

        this.io.on("connection", (socket) => {

            let session = socket.request.session;
            session.socketId = socket.id;
            session.save();
            this.userSockets.set(session.userId, socket); // TODO this should change eventually as well
            console.log("Knightmare frame initialised on server.");
            socket.send("Knightmare Frame connection established.");
        });

        this.router.post("/send-sms-to-server", this.receiveSmsFromAndroid.bind(this));
        this.router.post("/send-to-device", this.relayMessageToAndroid.bind(this));
        this.router.post("/get-conversation-messages", this.getConversationMessages.bind(this));
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

        this.storeMessageInDb(message, (err, result, snippet) => {

            if (err) {
                // TODO error handling
                console.log(err);
                res.send(500);
            } else {

                const userOpenSocket = this.userSockets.get(userId);
                if (userOpenSocket) {
                    userOpenSocket.emit("ownMessageSentOnAndroid", Object.assign({ status: this.MESSAGE_STATE_PHONE_SUCCESS }, message));
                    userOpenSocket.emit("updateSnippetSidebar", snippet);
                }
                Text.updateMesssageStatus(amadeusId, this.MESSAGE_STATE_PHONE_SUCCESS, (err, result) => { });
                res.json({ success: true });
            }

        });
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

    private receiveSmsFromAndroid(req: Request, res: Response): void {

        const timestamp: number = Date.now();
        const amadeusId: string = timestamp + req.body.fromPhoneNumber;

        const message: AmadeusMessage = {
            fromPhoneNumber: req.body.fromPhoneNumber,
            toPhoneNumber: req.body.toPhoneNumber,
            phone_num_clean: req.body.fromPhoneNumber,
            textMessageBody: req.body.textMessageBody,
            userId: req.body.userId,
            amadeusId,
            timestamp,
        };

        this.storeMessageInDb(message, (err, result, snippet) => {

            if (err) {
                // handle error
                res.sendStatus(500);
            } else {
                res.sendStatus(200); // TODO we may be able to use req.session.socketId if Volley supports cookie

                const userOpenSocket = this.userSockets.get(req.body.userId);
                if (userOpenSocket) {
                    userOpenSocket.emit("receivedMessageFromAndroid", message);
                    userOpenSocket.emit("updateSnippetSidebar", snippet);
                }
            }

        });
    }


    public relayMessageToAndroid(req: Request, res: Response): void {

        const timestamp = Date.now();
        const amadeusId = timestamp + req.body.toPhoneNumber;
        const userId: number = req.session.userId;

        const amadeusMessage: AmadeusMessage = {
            fromPhoneNumber: req.body.fromPhoneNumber,
            toPhoneNumber: req.body.toPhoneNumber,
            textMessageBody: req.body.textMessageBody,
            phone_num_clean: req.body.toPhoneNumber,
            amadeusId,
            timestamp,
            userId
        };

        const fcmPayload: messaging.MessagingPayload = {
            data: {
                fromPhoneNumber: amadeusMessage.fromPhoneNumber,
                toPhoneNumber: amadeusMessage.toPhoneNumber,
                textMessageBody: amadeusMessage.textMessageBody,
                phone_num_clean: amadeusMessage.phone_num_clean,
                amadeusId: amadeusMessage.amadeusId,
                timestamp: amadeusMessage.timestamp.toString(),
                userId: amadeusMessage.userId.toString()
            }
        };

        this.storeMessageInDb(amadeusMessage, (err, result, snippet) => {

            if (err) {
                // TODO handle error
            } else {

                res.json({ success: true });

                // TODO this should come from a mysql query (update pending to sent)

                const userOpenSocket = this.userSockets.get(userId);
                if (userOpenSocket) {
                    const message = Object.assign({ status: this.MESSAGE_STATE_PENDING }, amadeusMessage);
                    userOpenSocket.emit("sendOutgoingMessageUpstreamToWebsocketWithInitialState", message);
                    userOpenSocket.emit("updateSnippetSidebar", snippet);
                }

                const registrationToken: string = req.session.registrationToken;
                admin.messaging().sendToDevice(registrationToken, fcmPayload)
                    .then(data => {

                        // TODO, this message should come from a mysql query
                        // const updatedMessage = Object.assign({ status: this.MESSAGE_STATE_GCM_SUCCESS }, amadeusMessage);
                        // this.io.emit("sendToAndroidSuccessful", updatedMessage);
                        Text.updateMesssageStatus(amadeusId, this.MESSAGE_STATE_GCM_SUCCESS, (err, result) => {
                            if (err) console.log(err);
                            else {
                                console.log("Updated message to completed");
                            }
                        });
                    })
                    .catch(err => {
                        this.io.emit("sendToAndroidError");
                        console.log("Error occurred in Firebase: %s", err);
                    });

            }

        });

    }

    private storeMessageInDb(message: AmadeusMessage, cb: MysqlModificationCallback): void {

        Snippet.updateConversationSnippet(message, (err, snippetResult) => {
            if (err) {
                console.log("Coming from Snippet.updateConversationSnippet");
                console.log(err);
            } else {
                // TODO figure out whether the updateconversationsnippet call
                // should be a multiple statement with Text.create
                Text.create(message, (err, result) => cb(err, result, snippetResult[0]));
            }
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