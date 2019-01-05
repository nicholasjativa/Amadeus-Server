import * as admin from "firebase-admin";
import { Response, Request, Router, NextFunction } from "express";
import { ConversationPreview } from "../models/ConversationPreview";
import { TextMessage } from "../models/TextMessage";
import { messaging } from "firebase-admin";
import * as SocketIO from "socket.io";
import { Contact } from "../models/Contact";
import { AmadeusMessage } from "../interfaces/AmadeusMessage";
import { MysqlCallback } from "../interfaces/MysqlCallback";
import { MysqlModificationCallback } from "../interfaces/MysqlModificationCallback";
import { PhoneNumberUtils } from "../util/phoneNumberUtils";
import { logger } from "../util/logger";

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

            const session = socket.request.session;
            this.userSockets.set(session.userId, socket); // TODO this should change eventually as well
            socket.on("disconnect", () => {
                this.userSockets.delete(session.userId);
                logger.info("Socket has disconnected from Knightmare Frame");
                logger.info(`Total number of connections is now ${this.userSockets.size}`);
            });

            logger.info(`Knightmare Frame accepting incoming socket connection..`);
            logger.info(`Total number of connections is ${this.userSockets.size}`);
            socket.send("Knightmare Frame connection established.");
        });

        this.router.post("/send-sms-to-server", this.receiveSmsFromAndroid.bind(this));
        this.router.post("/send-to-device", this.relayMessageToAndroid.bind(this));
        this.router.post("/get-conversation-messages", this.getConversationMessages.bind(this));
        this.router.post("/own", this.catchOutgoingMessagesSentOnAndroid.bind(this));
        this.router.post("/update-outgoing-text-message-id", this.handleUpdateOutgoingTextId.bind(this));
    }

    private catchOutgoingMessagesSentOnAndroid(req: Request, res: Response, next: NextFunction): void {

        const timestamp = req.body.timestamp;
        const amadeusId = timestamp + req.body.toPhoneNumber;
        const userId: number = req.body.userId;

        const message = {
            msgid_phone_db: req.body.msgid_phone_db,
            phone_num_clean: PhoneNumberUtils.normalizePhoneNumber(req.body.toPhoneNumber),
            thread_id: req.body.thread_id,
            fromPhoneNumber: PhoneNumberUtils.normalizePhoneNumber(req.body.fromPhoneNumber),
            toPhoneNumber: PhoneNumberUtils.normalizePhoneNumber(req.body.toPhoneNumber),
            textMessageBody: req.body.textMessageBody,
            amadeusId,
            timestamp,
            userId
        };

        this.storeMessageInDb(message, (err, result, snippet) => {

            if (err) {
                next(err);
            } else {

                const userOpenSocket = this.userSockets.get(userId);
                if (userOpenSocket) {
                    userOpenSocket.emit("ownMessageSentOnAndroid", Object.assign({ status: this.MESSAGE_STATE_PHONE_SUCCESS }, message));
                    userOpenSocket.emit("updateSnippetSidebar", snippet);
                }
                TextMessage.updateMesssageStatus(amadeusId, this.MESSAGE_STATE_PHONE_SUCCESS, (err, result) => { });
                res.json({ success: true });
            }

        });
    }

    private getConversationMessages(req: Request, res: Response, next: NextFunction): void {

        const phone_num_clean = req.body.phone_num_clean;
        const userId = req.session.userId;

        TextMessage.getAllMessages(phone_num_clean, userId, (err, messagesRows) => {
            if (err) {
                next(err);
            } else {
                Contact.getContact(phone_num_clean, (err, contactRows) => {

                    const info = contactRows[0];

                    if (err) {
                        next(err);
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

    private receiveSmsFromAndroid(req: Request, res: Response, next: NextFunction): void {

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
                next(err);
            } else {
                res.json({ success: true }); // TODO we may be able to use req.session.socketId if Volley supports cookie

                const userOpenSocket = this.userSockets.get(req.body.userId);
                if (userOpenSocket) {
                    userOpenSocket.emit("receivedMessageFromAndroid", message);
                    userOpenSocket.emit("updateSnippetSidebar", snippet);
                }
            }

        });
    }


    public relayMessageToAndroid(req: Request, res: Response, next: NextFunction): void {

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
                next(err);
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
                        TextMessage.updateMesssageStatus(amadeusId, this.MESSAGE_STATE_GCM_SUCCESS, (err, result) => {
                            if (err) {
                                next(err);
                            }
                            else {
                            }
                        });
                    })
                    .catch(err => {
                        this.io.emit("sendToAndroidError");
                        logger.error(`Error occurred in Firebase: ${err}`);
                    });

            }

        });

    }

    private storeMessageInDb(message: AmadeusMessage, cb: MysqlModificationCallback): void {

        ConversationPreview.updatePreview(message, (err, snippetResult) => {
            if (err) {
                logger.error(`Error in storeMessageInDb: ${err}`);
            } else {
                // TODO figure out whether the update call
                // should be a multiple statement with TextMessage.create
                TextMessage.create(message, (err, result) => cb(err, result, snippetResult[0]));
            }
        });

    }

    private handleUpdateOutgoingTextId(req: Request, res: Response, next: NextFunction): void {
        const amadeusId = req.body.amadeusId;
        const msgid_phone_db = req.body.msgid_phone_db;

        TextMessage.updateMessageId(amadeusId, msgid_phone_db, (err, result) => {

            if (err) {
                next(err);
            } else {
                res.json({ success: 200 });
            }

        });

    }

}