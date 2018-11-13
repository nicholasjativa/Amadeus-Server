# Amadeus Server

This project is the server for one of my personal projects, called Amadeus. The purpose of this project is to be an almost exact clone of the iMessage application that currently exists for Macs/iPhones. For the server, I've
chosen to NodeJS, along with Express, and wrote the code using Typescript. I will likely be implementing a version of this server in Java, just to get more experience with Java. I have also chosen Socket.IO for the WebSocket server implementation. Moreover, since the server is meant to send push notifications to Android devices that have the Amadeus Android app installed, I am using the Firebase Admin SDK along with Google Cloud Messaging. The server connects to a MySQL database (which is hosted on Heroku) via the MySQLJS library and saves user information and messages there. The entire project itself is hosted on Heroku.

## Features

The back-end server currently supports real-time message proccessing and push notifications. When an Android device with the Amadeus app installed receives a text message, it sends information about the text message (such as the sender phone number and message body) to this server. The server extracts the information, saves it into a MySQL database, and sends a message up to the web browser via a WebSocket connection. The server also supports user sessions.

## High-Level Description of Amadeus

The Amadeus Front-End web application serves as an interface for users (currently only myself) to create text messages from a web-browser. From the web application, the "text message" gets sent to the back-end Node/Express server, and once the server receives it, it sends a push notification down to the user's (my) Android device. The Android device must have the Amadeus Android app installed. Once the Android app receives the push notification, it parses the payload (which has two notable properties: the text message body and the phone number for which this message must go to). It then programatically creates and transmits a real text message to the designated phone number with the designated message body.

Amadeus works bi-directionally; a user can use the web app to create text messages to be sent out, and the web app also receives real-time text messages that the user's phone receives. I.e., when an Android device receives a text message, the Amadeus Android app will be listening for this event, and contact the back-end server with the time and date, phone number of the sender, and the message payload. From here, the server stores the message in a MySQL database, and also sends the web app a WebSocket message to let the user know that they have a received a text message. The web app then updates that particular conversation with the new message.