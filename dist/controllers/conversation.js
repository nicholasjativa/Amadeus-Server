"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const express_1 = require("express");
const Snippet_1 = require("../models/Snippet");
const Text_1 = require("../models/Text");
const Contact_1 = require("../models/Contact");
/*
    TODOs
        - change all emits to user specific
        - include return types for all functions

*/
class ConversationController {
    constructor(io) {
        this.MESSAGE_STATE_PENDING = "pending";
        this.MESSAGE_STATE_GCM_SUCCESS = "gcm_success";
        this.MESSAGE_STATE_GCM_ERROR = "gcm_error";
        this.MESSAGE_STATE_PHONE_SUCCESS = "phone_success";
        this.MESSAGE_STATE_PHONE_ERROR = "phone_error";
        this.io = io;
        this.io.on("connection", (socket) => {
            console.log("Knightmare frame initialised on server.");
            // send upstream on websockete when message has successfully been sent on phone
            socket.send("Knightmare Frame connection established.");
        });
        this.router = express_1.Router();
        this.setupRoutes();
    }
    catchOutgoingMessagesSentOnAndroid(req, res) {
        const timestamp = req.body.timestamp;
        const amadeusId = timestamp + req.body.toPhoneNumber;
        const message = {
            msgid_phone_db: req.body.msgid_phone_db,
            phone_num_clean: req.body.toPhoneNumber,
            thread_id: req.body.thread_id,
            fromPhoneNumber: req.body.fromPhoneNumber,
            toPhoneNumber: req.body.toPhoneNumber,
            textMessageBody: req.body.textMessageBody,
            amadeusId,
            timestamp
        };
        this.storeMessageInDb(message);
        // TODO do this the right way
        this.io.emit("ownMessageSentOnAndroid", Object.assign({ status: this.MESSAGE_STATE_PHONE_SUCCESS }, message));
        Text_1.Text.updateMesssageStatus(amadeusId, this.MESSAGE_STATE_PHONE_SUCCESS);
        res.sendStatus(200);
    }
    getConversationMessages(req, res) {
        const phone_num_clean = req.body.phone_num_clean;
        Text_1.Text.getAllMessages(phone_num_clean, (err, messagesRows) => {
            if (err) {
                return res.json(err);
            }
            else {
                console.log("Sending conversation messages to client.");
                Contact_1.Contact.getContact(phone_num_clean, (err, contactRows) => {
                    const info = contactRows[0];
                    if (err) {
                        return res.json(err);
                    }
                    else {
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
    handleSmsReceivedOnAndroidAndRelayedHere(req, res) {
        const timestamp = Date.now();
        const amadeusId = timestamp + req.body.fromPhoneNumber;
        const message = {
            fromPhoneNumber: req.body.fromPhoneNumber,
            toPhoneNumber: req.body.toPhoneNumber,
            phone_num_clean: req.body.fromPhoneNumber,
            textMessageBody: req.body.textMessageBody,
            amadeusId,
            timestamp,
        };
        res.sendStatus(200);
        this.io.emit("receivedMessageFromAndroid", message);
        this.storeMessageInDb(message);
    }
    relayMessageToAndroid(req, res) {
        const timestamp = Date.now();
        const amadeusId = timestamp + req.body.toPhoneNumber;
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
        };
        this.storeMessageInDb(message);
        // TODO this should come from a mysql query
        this.sendMessageToWebsocket(Object.assign({ status: this.MESSAGE_STATE_PENDING }, message));
        res.send(JSON.stringify({ message: "OK" }));
        admin.messaging().sendToDevice(req.session.registrationToken, payload)
            .then(data => {
            // TODO, this message should come from a mysql query
            const updatedMessage = Object.assign({ status: this.MESSAGE_STATE_GCM_SUCCESS }, message);
            this.io.emit("sendToAndroidSuccessful", updatedMessage);
            Text_1.Text.updateMesssageStatus(amadeusId, this.MESSAGE_STATE_GCM_SUCCESS, (err, result) => {
                if (err)
                    console.log(err);
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
    setupRoutes() {
        this.router.post("/", this.handleSmsReceivedOnAndroidAndRelayedHere.bind(this));
        this.router.post("/send-to-device", this.relayMessageToAndroid.bind(this));
        this.router.post("/getConversationMessages", this.getConversationMessages.bind(this));
        this.router.post("/own", this.catchOutgoingMessagesSentOnAndroid.bind(this));
        this.router.post("/update-outgoing-text-message-id", this.handleUpdateOutgoingTextId.bind(this));
    }
    sendMessageToWebsocket(message) {
        this.io.emit("sendOutgoingMessageUpstreamToWebsocketWithInitialState", message);
    }
    storeMessageInDb(message) {
        const msgid_phone_db = message.msgid_phone_db || undefined;
        const fromPhoneNumber = message.fromPhoneNumber;
        const toPhoneNumber = message.toPhoneNumber;
        const phone_num_clean = message.phone_num_clean;
        const textMessageBody = message.textMessageBody;
        const timestamp = message.timestamp;
        Snippet_1.Snippet.updateConversationSnippet(phone_num_clean, textMessageBody, timestamp, (err, result) => {
            if (err) {
                console.log(err);
            }
            else {
                this.io.emit("updateSnippetSidebar", result[0]);
            }
        });
        Text_1.Text.create(msgid_phone_db, phone_num_clean, fromPhoneNumber, toPhoneNumber, textMessageBody, timestamp, (err, result) => {
            if (err)
                return console.log(err);
            return console.log(result);
        });
    }
    handleUpdateOutgoingTextId(req, res) {
        const amadeusId = req.body.amadeusId;
        const msgid_phone_db = req.body.msgid_phone_db;
        Text_1.Text.updateMessageId(amadeusId, msgid_phone_db, (err, result) => {
            if (err)
                return console.log(err);
            return console.log(result);
        });
        res.sendStatus(200);
    }
}
exports.ConversationController = ConversationController;
//# sourceMappingURL=conversation.js.map