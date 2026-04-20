require("dotenv").config({
    path: `.env.${process.env.NODE_ENV || "development"}`
});

const express = require("express");
const cors = require("cors");
const path = require("path");
const favicon = require("serve-favicon");

// Import
const app = express();
const bot = require("./bot/telegram.jalan");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public", "favicon.ico")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "public"));

/* **************************************
 *  ROOT ENDPOINT
 * **************************************/
app.get('/', (req, res) => {
    res.render("index", {
        BASE_URL: process.env.BASE_URL
    });
});

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
