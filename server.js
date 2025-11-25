const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

// M-PESA credentials
const consumerKey = process.env.DARAJA_CONSUMER_KEY;
const consumerSecret = process.env.DARAJA_CONSUMER_SECRET;
const shortCode = process.env.SHORT_CODE;
const passkey = process.env.PASSKEY;

// Generate Base64 Token
async function getAccessToken() {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    const response = await axios.get(
        "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
        {
            headers: {
                Authorization: `Basic ${auth}`
            }
        }
    );

    return response.data.access_token;
}

app.post("/stkpush", async (req, res) => {
    try {
        const { amount, phone } = req.body;

        const token = await getAccessToken();

        const timestamp = new Date()
            .toISOString()
            .replace(/[-T:.Z]/g, "")
            .substring(0, 14);

        const password = Buffer.from(shortCode + passkey + timestamp).toString("base64");

        const response = await axios.post(
            "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
            {
                BusinessShortCode: shortCode,
                Password: password,
                Timestamp: timestamp,
                TransactionType: "CustomerBuyGoodsOnline",
                Amount: amount,
                PartyA: phone,
                PartyB: shortCode,
                PhoneNumber: phone,
                CallBackURL: "https://mpesa-backend-a7vc.onrender.com/callback",
                AccountReference: "Order Payment",
                TransactionDesc: "Test Payment"
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        res.json({
            message: "STK Push sent",
            data: response.data
        });

    } catch (error) {
        console.error(error.response?.data || error.message);
        res.status(500).json({ error: "Failed to send STK Push" });
    }
});

app.post("/callback", (req, res) => {
    console.log("M-PESA Callback:", req.body);
    res.json({ message: "Callback received" });
});
app.get('/', (req, res) => {
  res.send('Daraja API is running 🚀');
});
app.listen(5000, () => console.log("Server running on port 5000"));
