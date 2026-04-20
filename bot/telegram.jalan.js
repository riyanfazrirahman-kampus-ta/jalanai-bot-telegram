require("dotenv").config();

const { Telegraf } = require("telegraf");
const FormData = require("form-data");
const axios = require("axios");

const token = process.env.TELEGRAM_BOT_TOKEN;
const BASE_URL = process.env.BASE_URL;
const BASE_API = process.env.BASE_API;
const BASE_API_CLASSIFICATION = process.env.BASE_API_CLASSIFICATION;

const bot = new Telegraf(token);

bot.action("take_photo", async (ctx) => {
    await ctx.reply("Silakan tekan 📎 lalu pilih Camera");
});

// set menu command
bot.telegram.setMyCommands([
    { command: "start", description: "🚀 Mulai bot" },
    { command: "status", description: "▶ Get Status" },
    { command: "history", description: "📊 Riwayat Klasifikasi" },
]);

// Pesan Start
bot.start((ctx) => {
    const startMessage = `
Selamat Datang di ChatBot <a href="${BASE_API}">Jalan.Ai</a>
Klasifikasi Kerusakan

Fitur Tersedia :
1. Get /status
2. Get /history


`;
    ctx.reply(
        startMessage,
        {
            parse_mode: "HTML",
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📷 Ambil Foto Sekarang", callback_data: "take_photo" }]
                ]
            },
        }
    );
});

bot.command("status", async (ctx) => {
    try {
        await ctx.reply("⏳ Loading Server...");
        const response = await axios.get(BASE_API_CLASSIFICATION);
        const res = response.data
        await ctx.reply("Status: " + res.status);
    } catch (err) {
        console.error("ERROR:", err.response?.data || err.message);
        ctx.reply("Server tidak ditemukan.");
    }
});

bot.command("history", async (ctx) => {
    try {
        const response = await axios.get(BASE_API_CLASSIFICATION + "/history");

        const data = response.data.data;

        const rows = data.slice(0, 10).map((item, i) => {
            const top = item.predictions[0]; // asumsi sudah sorted confidence
            const link = `${BASE_API}/?selected=${item.id}`;

            return `${i + 1}. <a href="${link}">${item.id}</a>
    Kelas: ${top.class}
    Conf: ${top.confidence}%
    Tanggal: ${new Date(item.created_at._seconds * 1000).toLocaleString()}
`;
        });

        const msg = `
📊 <b>History Klasifikasi (10 terakhir)</b>

${rows.join("\n")}
        `;

        await ctx.reply(msg, { parse_mode: "HTML" });

    } catch (err) {
        console.error(err);
        ctx.reply("Gagal ambil history");
    }
});

bot.on("photo", async (ctx) => {
    try {
        await ctx.reply("⏳ Sedang memproses gambar...");

        // ambil foto resolusi terbesar
        const photo = ctx.message.photo.pop();
        const fileId = photo.file_id;

        // ambil info file dari Telegram
        const file = await ctx.telegram.getFile(fileId);

        const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

        const imageResponse = await axios.get(fileUrl, {
            responseType: "arraybuffer"
        });

        // kirim ke API kamu
        const formData = new FormData();
        const filePath = file.file_path;
        const fileName = filePath.split("/").pop(); // contoh: photo_123.png
        formData.append("file", Buffer.from(imageResponse.data), fileName);
        formData.append("model_name", "Model-RDC-4.1");

        const apiResponse = await axios.post(
            `${BASE_API_CLASSIFICATION}/predict`,
            formData,
            {
                headers: formData.getHeaders(),
                maxBodyLength: Infinity,
            }
        );

        const result = apiResponse.data;

        // ambil prediksi tertinggi
        const top = result.data.predictions[0];

        const text = `
Hasil Klasifikasi:
Model: ${result.data.model}

Kelas: <b>${top.class}</b>
Confidence: <b>${top.confidence}%</b>
        `;

        await ctx.reply(text, { parse_mode: "HTML" });

    } catch (err) {
        console.error("ERROR:", err.response?.data || err.message);
        ctx.reply("Gagal memproses gambar");
    }
});


// handler
bot.on('text', (ctx) => {
    const text = ctx.message.text;

    if (text.startsWith('/')) return; // skip command
    ctx.reply('Pesan diterima!');
});

module.exports = bot;