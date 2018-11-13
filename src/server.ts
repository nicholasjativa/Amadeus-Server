import * as admin from "firebase-admin";
import * as bodyParser from "body-parser";
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
    public static readonly PORT: number = 8999;
    private app: express.Application;
    private io: SocketIO.Server;
    private port: string | number;
    private server: Server;

    constructor() {
        this.initializeFirebaseApp();
        this.createApp();
        this.config();
        this.createServer();
        this.createSocketServer();
        this.setupMiddlewares();
        this.setupRoutes();
        this.listen();
        this.createDbConnection();
    }

    private initializeFirebaseApp(): void {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: "amadeus",
                clientEmail: "FIREBASE_CLIENT_EMAIL",
                privateKey: "FIREBASE_PRIVATE_KEY"
            }),
            databaseURL: "DATABASE_URL"
        });
    }


    private createApp(): void {
        this.app = express();
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

    private createServer(): void {
        this.server = createServer(this.app);
    }

    private createSocketServer(): void {
        this.io = SocketIO(this.server);
    }

    private config(): void {
        this.port = process.env.PORT || AmadeusServer.PORT;
    }

    private setupMiddlewares(): void {
        this.app.use(allowCrossDomain);
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
        this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            next();
        });
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(express.static(path.join(__dirname, "public/js/dist"), { maxAge: 31557600000 }));
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




