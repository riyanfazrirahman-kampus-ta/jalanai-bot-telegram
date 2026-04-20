require("dotenv").config({
    path: `.env.${process.env.NODE_ENV || "development"}`
});

const express = require("express");
const cors = require("cors");

// Import
const app = express();
const bot = require("./bot/telegram.jalan");

app.use(cors());
app.use(express.json());

/* **************************************
 * TELEGRAM BOT
 * **************************************/
if (process.env.NODE_ENV === "production") {
    // set webhook sekali
    bot.telegram.setWebhook(`${process.env.BASE_URL}/bot`);

    // webhook
    app.use(bot.webhookCallback('/bot'));
} else {
    bot.launch(); // lokal
}

/* **************************************
 * RUN SERVER
 * **************************************/
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`SERVER running on: http://localhost:${PORT}`);
});
