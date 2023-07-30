const express = require("express");
const axios = require("axios");
const app = express();
const cors = require("cors");
app.use(express.json());
require("dotenv").config();

// create a env port
const port = process.env.port || 5000;
app.use(cors());
// Install MongoDB
const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb://localhost:27017/`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

//this implementation work for only tokenize url

// Start Code
const username = "username";
const password = "password";
const appKey = "appKEy";
const appSecret = "appSecret";
const isTokenized = true;
const BASE_URL = "https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout";

const globaDataSet = (request, tokenResult) => {
  request.bkashCredential = {
    created_at: new Date(),
    expires_in: (tokenResult.expires_in - 100) * 1000,
    id_token: tokenResult.id_token,
    username: tokenResult.username,
    appSecret: tokenResult.appSecret,
    password: tokenResult.password,
    app_key: tokenResult.appKey,
    isTokenized: tokenResult.isTokenized,
  };
};
//External Lib Import
const authHeaders = (request) => {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: request?.bkashCredential["id_token"],
    "x-app-key": request?.bkashCredential["app_key"],
  };
};

const tokenHeaders = (username, password) => {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    username,
    password,
  };
};

//External Lib Import
const grantToken = async (request) => {
  try {
    const url = `${BASE_URL}/token/grant`;
    const tokenResponse = await axios({
      url,
      method: "POST",
      headers: tokenHeaders(username, password),
      data: {
        app_key: appKey,
        app_secret: appSecret,
      },
    });
    const tokenResult = tokenResponse.data;
    globaDataSet(request, {
      ...tokenResult,
      username,
      appSecret,
      password,
      appKey,
      isTokenized,
    });
    return tokenResult;
  } catch (error) {
    console.log("error", error);
  }
};

//External Lib Import
const bkashAuthorization = async (req, res, next) => {
  try {
    let created_at = new Date(req.bkashCredential?.["created_at"]);
    let id_token = req.bkashCredential?.["id_token"];
    let expires_in = req.bkashCredential?.["expires_in"];
    let currentDateTime = new Date();
    if (!id_token) {
      const data = await grantToken(req);
      console.log("data", data);
    } else {
      if (currentDateTime - created_at < expires_in) {
        await grantToken(req);
      } else {
        console.log("You already have a token !!");
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
const createPayment = async (request, res, next) => {
  try {
    const { amount, currency, intent, merchantInvoiceNumber } = request.body;
    console.log("request", request);
    console.log("Create Payment API Start !!!");
    const url = `${BASE_URL}/create`;
    console.log("header", authHeaders(request));
    const response = await axios({
      url,
      method: "POST",
      headers: authHeaders(request),
      data: {
        mode: "0011",
        payerReference: " ",
        callbackURL: "http://localhost:3000/executePayment",
        amount, // amount should be dynamic
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber, // should be unique number
      },
    });
    if (response.data.errorCode) {
      throw new Error("Something went wrong!");
    }
    res.send(response.data);
  } catch (error) {
    console.log(error);
  }
};

const executePayment = async (request, response) => {
  const { paymentID } = request.query;
  console.log(paymentID);
  console.log("Execute Payment API Start !!!");
  console.log("hit execute payment");
  const url = `${BASE_URL}/execute/`;
  try {
    const executeResponse = await axios({
      url,
      method: "POST",
      headers: authHeaders(request),
      data: { paymentID },
    });

    response.send(executeResponse.data);
  } catch (error) {
    console.log(error);
  }
};

//Bkash Create Payment
app.post("/createPayment", bkashAuthorization, createPayment);

//Bkash Cxecute Payment
app.post("/executePayment", bkashAuthorization, executePayment);

async function run() {}
// Call Function
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send(`<h1>Hello Server</h1>`);
});
app.listen(port, () => {
  console.log("Hello", port);
});
