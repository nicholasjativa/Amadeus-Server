"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const bodyParser = require("body-parser");
const db = require("./db");
const express = require("express");
const http_1 = require("http");
const path = require("path");
const session = require("express-session");
const SocketIO = require("socket.io");
const allowCrossDomain_1 = require("./config/allowCrossDomain");
const conversation_1 = require("./controllers/conversation");
const snippets_1 = require("./controllers/snippets");
const users_1 = require("./controllers/users");
const contacts_1 = require("./controllers/contacts");
class AmadeusServer {
    constructor() {
        this.port = process.env.PORT || AmadeusServer.PORT;
        this.app = express();
        this.server = http_1.createServer(this.app);
        this.io = SocketIO(this.server);
        this.initializeFirebaseApp();
        this.setupMiddlewares();
        this.setupRoutes();
        this.listen();
        this.createDbConnection();
    }
    initializeFirebaseApp() {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: "amadeus",
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY
            }),
            databaseURL: process.env.FIREBASE_DB_URL
        });
    }
    createDbConnection() {
        db.connect((err) => {
            if (err) {
                console.log("Unable to connect to MySQL.");
            }
            else {
                console.log("MySQL database starting..");
            }
        });
    }
    setupMiddlewares() {
        this.app.use(allowCrossDomain_1.allowCrossDomain);
        this.app.set("trust proxy", true);
        this.app.use(session({
            name: "amadeus",
            secret: "SECRETE",
            resave: false,
            saveUninitialized: true,
            cookie: {
                httpOnly: false,
                maxAge: 6000000,
                secure: false
            }
        }));
        this.app.use((req, res, next) => {
            next();
        });
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(express.static(path.join(__dirname, "public/js/dist"), { maxAge: 31557600000 }));
    }
    setupRoutes() {
        this.app.use("/api/texts", new conversation_1.ConversationController(this.io).router);
        this.app.use("/api/users", new users_1.UsersController().router);
        this.app.use("/api/snippets", new snippets_1.SnippetsController().router);
        this.app.use("/api/contacts", new contacts_1.ContactsController().router);
        this.app.get("*", (req, res) => {
            res.sendFile(path.join(__dirname, "public/js/dist/index.html"));
        });
    }
    listen() {
        this.server.listen(this.port, () => {
            console.log("App is running at http://localhost:%d in %s mode", this.port, this.app.get("env"));
        });
    }
    getApp() {
        return this.app;
    }
}
AmadeusServer.PORT = 8999;
exports.AmadeusServer = AmadeusServer;
//# sourceMappingURL=server.js.map