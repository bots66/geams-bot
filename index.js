const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { createCanvas, GlobalFonts, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');
const https = require('https');
const path = require('path');

const fontPath = path.join(__dirname, 'Cairo-Bold.ttf');

function loadFont() {
    return new Promise((resolve) => {
        if (fs.existsSync(fontPath)) {
            GlobalFonts.registerFromPath(fontPath, 'Cairo');
            resolve();
        } else {
            const file = fs.createWriteStream(fontPath);
            https.get("https://github.com/google/fonts/raw/main/ofl/cairo/Cairo-Bold.ttf", (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    GlobalFonts.registerFromPath(fontPath, 'Cairo');
                    resolve();
                });
            });
        }
    });
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const activeGames = new Map();
const activeChannels = new Set();
const allowedRoleId = '1537723053318864927';

// قائمة الكلمات بدون همزات
const wordsList = ["شمس", "قمر", "نجمة", "سماء", "سحاب", "مطر", "برق", "رعد", "عاصفة", "رياح", "بحر", "نهر", "جبل", "صحراء", "سيارة", "طائرة", "قطار", "سفينة"];

const flags = [
    { name: "السعودية", code: "sa" }, { name: "امريكا", code: "us" }, { name: "الامارات", code: "ae" },
    { name: "الكويت", code: "kw" }, { name: "قطر", code: "qa" }, { name: "البحرين", code: "bh" },
    { name: "عمان", code: "om" }, { name: "مصر", code: "eg" }, { name: "المغرب", code: "ma" },
    { name: "الجزائر", code: "dz" }, { name: "تركيا", code: "tr" }, { name: "فرنسا", code: "fr" },
    { name: "اندونيسيا", code: "id" }, { name: "ماليزيا", code: "my" }, { name: "روسيا", code: "ru" }
];

function normalizeText(text) {
    if (!text) return "";
    return text.trim().toLowerCase()
        .replace(/[إأآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[ء]/g, ''); // إزالة الهمزات
}

async function generateImage(type, data) {
    const canvas = createCanvas(700, 320);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    function drawBox(x, y, w, h, text) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 25);
        ctx.fillStyle = '#1a1d24';
        ctx.fill();
        ctx.strokeStyle = '#2b313d';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px Cairo, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + w / 2, y + h / 2);
    }

    if (type === 'fast') {
        drawBox(365, 25, 285, 55, "اسرع");
        drawBox(50, 25, 305, 55, "معك 15 ثانية");
        drawBox(50, 105, 600, 180, data);
    } else {
        drawBox(365, 25, 285, 55, "معك 15 ثانية");
        drawBox(50, 25, 305, 55, "علم دولة ؟");
        
        ctx.beginPath();
        ctx.roundRect(50, 100, 600, 195, 30);
        ctx.fillStyle = '#161920';
        ctx.fill();
        ctx.strokeStyle = '#3a4454';
        ctx.stroke();

        const img = await loadImage(`https://flagcdn.com/w320/${data.code}.png`);
        // تصغير عرض العلم من اليمين واليسار (العرض صار 380 بدلاً من 450)
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(160, 125, 380, 145, 15);
        ctx.clip();
        ctx.drawImage(img, 160, 125, 380, 145);
        ctx.restore();
    }
    return canvas.toBuffer('image/png');
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const content = normalizeText(message.content);

    if (content === 'اسرع') {
        const word = wordsList[Math.floor(Math.random() * wordsList.length)];
        const buffer = await generateImage('fast', word);
        await message.channel.send({ files: [new AttachmentBuilder(buffer)] });
        activeGames.set(message.guild.id, { answer: normalizeText(word) });
    }

    if (content === 'اعلام') {
        const flag = flags[Math.floor(Math.random() * flags.length)];
        const buffer = await generateImage('flag', flag);
        await message.channel.send({ files: [new AttachmentBuilder(buffer)] });
        activeGames.set(message.guild.id, { answer: normalizeText(flag.name) });
    }

    if (activeGames.has(message.guild.id)) {
        const game = activeGames.get(message.guild.id);
        if (content === game.answer) {
            message.channel.send(`فاز <@${message.author.id}>`);
            activeGames.delete(message.guild.id);
        }
    }
});

client.login(process.env.TOKEN);
