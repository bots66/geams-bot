const { 
    Client, 
    GatewayIntentBits, 
    AttachmentBuilder 
} = require('discord.js');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
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
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const activeGames = new Map();
const activeChannels = new Set();

// قائمة كلمات عربية واضحة ومفهومة بالكامل
const wordsList = [
    "شمس", "قمر", "بحر", "نهر", "جبل", "سماء", "حديقة", "سيارة", "طائرة", "قطار",
    "قلم", "كتاب", "دفتر", "مدرسة", "جامعة", "طاولة", "كرسي", "نافذة", "باب", "مفتاح",
    "تفاحة", "موز", "برتقال", "عنب", "حليب", "ماء", "قهوة", "شاي", "عصير", "خبز",
    "تفاح", "سفينة", "قارب", "طبيب", "مهندس", "معلم", "لاعب", "حارس", "صقر", "أسد",
    "نمر", "حصان", "جمل", "عصفور", "وردة", "شجرة", "غابة", "صيف", "شتاء", "ربيع"
];

function normalizeText(text) {
    if (!text) return "";
    return text
        .trim()
        .toLowerCase()
        .replace(/^(ال)/, '')
        .replace(/[إأآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي');
}

async function generateGameImage(word) {
    const canvas = createCanvas(700, 320);
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    function drawRoundedRect(x, y, width, height, radius, fillColor, strokeColor) {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fill();
        }
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }

    // 1. المربع العلوي الأيمن (أسرع من يكتب)
    drawRoundedRect(365, 25, 285, 55, 25, '#1a1d24', '#2b313d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('أسرع من يكتب', 507, 52);

    // 2. المربع العلوي الأيسر (⚡ لديك 15 ثانية)
    drawRoundedRect(50, 25, 305, 55, 25, '#1a1d24', '#2b313d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡ لديك 15 ثانية', 202, 52);

    // 3. المربع السفلي الكبير (عرض الكلمة بشكلها الطبيعي تماماً بدون قلب)
    drawRoundedRect(50, 105, 600, 180, 35, '#161920', '#3a4454');

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 55px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(word, 350, 195);

    return canvas.toBuffer('image/png');
}

client.once('ready', () => {
    console.log(`تم تسجيل الدخول بنجاح باسم ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.trim();
    const guildId = message.guild.id;
    const channelId = message.channel.id;

    if (content === 'إيقاف') {
        if (!activeGames.has(guildId)) {
            return message.reply('لا توجد أي لعبة تعمل حالياً لإيقافها.');
        }
        const game = activeGames.get(guildId);
        if (game.collector) game.collector.stop();
        activeGames.delete(guildId);
        activeChannels.delete(channelId);
        return message.reply('تم إيقاف اللعبة.');
    }

    if (content === 'أسرع' || content === 'اسرع') {
        if (activeGames.has(guildId) || activeChannels.has(channelId)) {
            return message.reply('توجد لعبة تعمل الآن، استخدم "إيقاف" أولاً.');
        }

        activeChannels.add(channelId);
        
        const randomWord = wordsList[Math.floor(Math.random() * wordsList.length)];

        try {
            const buffer = await generateGameImage(randomWord);
            const attachment = new AttachmentBuilder(buffer, { name: 'fast_game.png' });

            await message.channel.send({ 
                files: [attachment] 
            });

            activeGames.set(guildId, { type: 'fast', answer: randomWord });

            const filter = (m) => !m.author.bot;
            const collector = message.channel.createMessageCollector({ filter, time: 15000 });
            activeGames.get(guildId).collector = collector;

            collector.on('collect', (m) => {
                if (normalizeText(m.content) === normalizeText(randomWord)) {
                    if (activeGames.has(guildId)) {
                        activeGames.delete(guildId);
                    }
                    activeChannels.delete(channelId);
                    collector.stop('won');
                    m.channel.send(`<@${m.author.id}>`);
                }
            });

            collector.on('end', (collected, reason) => {
                if (reason !== 'won' && activeGames.has(guildId)) {
                    activeGames.delete(guildId);
                    activeChannels.delete(channelId);
                    message.channel.send('انتهى الوقت');
                }
            });

        } catch (error) {
            console.error("خطأ أثناء توليد الرسم:", error);
            activeChannels.delete(channelId);
            return message.reply(`حدث خطأ أثناء إنشاء اللعبة: ${error.message}`);
        }
    }
});

const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

loadFont().then(() => {
    client.login(process.env.TOKEN);
});
