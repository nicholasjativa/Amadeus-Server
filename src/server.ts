import * as admin from "firebase-admin";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as db from "./db";
import * as express from "express";
import { createServer, Server } from "http";
import * as path from "path";
import * as session from "express-session";
import * as SocketIO from "socket.io";

import { allowCrossDomain } from "./config/allowCrossDomain";
import { ConversationController } from "./controllers/conversation";
import { SnippetsController } from "./controllers/snippets";
import { UsersController } from "./controllers/users";
import { ContactsController } from "./controllers/contacts";

export class AmadeusServer {
    private static readonly PORT: number = 8999;
    private port: string | number = process.env.PORT || AmadeusServer.PORT;
    private app: express.Application = express();
    private server: Server = createServer(this.app);
    private io: SocketIO.Server = SocketIO(this.server);

    constructor() {
        this.initializeFirebaseApp();
        this.setupMiddlewares();
        this.setupRoutes();
        this.listen();
        this.createDbConnection();
    }

    private initializeFirebaseApp(): void {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: "amadeus",
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY
            }),
            databaseURL: process.env.FIREBASE_DB_URL
        });
    }

    private createDbConnection(): void {
        db.connect((err) => {
            if (err) {
                console.log("Unable to connect to MySQL.");
            } else {
                console.log("MySQL database starting..");
            }
        });
    }

    private setupMiddlewares(): void {

        const sessionMiddleware = session({
            name: "amadeus",
            secret: "SECRETE",
            resave: false,
            saveUninitialized: true,
            cookie: {
                httpOnly: false,
                maxAge: 6000000,
                secure: false
            }
        });

        this.app.use(allowCrossDomain);
        this.app.set("trust proxy", true);
        this.app.use(sessionMiddleware);
        this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            // TODO error handling?
            next();
        });
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(express.static(path.join(__dirname, "public/js/dist"), { maxAge: 31557600000 }));
        // for providing the express session to the socket
        this.io.use((socket, next) => {
            socket.client.request.originalUrl = socket.client.request.url;
            cookieParser()(socket.client.request, socket.client.request.res, () => {
                sessionMiddleware(socket.client.request, socket.client.request.res, next);
            });
        });
    }

    private setupRoutes(): void {
        this.app.use("/api/texts", new ConversationController(this.io).router);
        this.app.use("/api/users", new UsersController().router);
        this.app.use("/api/snippets", new SnippetsController().router);
        this.app.use("/api/contacts", new ContactsController().router);

        this.app.get("*", (req, res) => {
            res.sendFile(path.join(__dirname, "public/js/dist/index.html"));
        });
    }

    private listen(): void {
        this.server.listen(this.port, () => {
            console.log("App is running at http://localhost:%d in %s mode", this.port, this.app.get("env"));
        });
    }

    public getApp(): express.Application {
        return this.app;
    }

}




