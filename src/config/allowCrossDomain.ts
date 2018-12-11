import { NextFunction, Request, Response } from "express";

export function allowCrossDomain(req: Request, res: Response, next: NextFunction) {
    const allowedOrigins = [
        "localhost:8999", "localhost:4200",
        "http://localhost:4200", "http://localhost:8999",
        "https://amadeusapp.herokuapp.com",
        "http://amadeusapp.herokuapp.com",
        "amadeusapp.herokuapp.com"    
    ];

    let incomingOrigin;

    try {
        incomingOrigin = allowedOrigins.indexOf(req.headers.host.toLowerCase()) > -1 ? req.headers.origin.toString() : "API_URL";
    } catch (error) {
        incomingOrigin = "amadeusapp.herokuapp.com";
    }

    res.header("Access-Control-Allow-Origin", incomingOrigin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Content-Length, X-Requested-With");

    if (req.method == "OPTIONS") {
        res.sendStatus(200);
    } else {
        next();
    }
}