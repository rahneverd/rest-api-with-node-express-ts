import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import mongoose from 'mongoose';
import router from 'router';

dotenv.config();
const app = express();

app.use(cors({ credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());

const server = http.createServer(app);

server.listen(process.env.PORT || 8080, () => {
  console.log(`listening on port ${process.env.PORT || 8080}`);
});

mongoose.Promise = Promise;
mongoose.connect(process.env.CONNECTIONSTRING || '');
mongoose.connection.on('error', (err: Error) => {
  console.log(err);
});

app.use('/', router());
