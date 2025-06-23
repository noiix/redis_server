import express from "express";
const app = express();
import bodyParser from "body-parser";
import session from "express-session";
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
// const userRouter = require("./routes/userRouter");
// const musicRouter = require("./routes/musicRouter");
// const chatRouter = require("./routes/chatRouter");
// const messageRouter = require('./routes/messageRouter');
// import errorController from "./controllers/errorController";
// const { logError } = require("./errorHandler");
import { router as userRouter } from './routers/userRouter.js';
import { router as searchRouter } from './routers/searchRouter.js';
import { router as chatRouter } from './routers/chatRouter.js';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')))

app.listen(process.env.PORT);

//routes
app.get("/", (req, res) => {
  res.json('E.T. : "Call home"')
});
// app.use("/music", musicRouter);
// app.use("/messages", messageRouter);
app.use('/chat', chatRouter);
app.use('/user', userRouter);
app.use('/users', searchRouter);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'))
})

// app.use(errorController);
