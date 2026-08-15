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

// قائمة ضخمة تضم أكثر من 400 كلمة عربية واضحة ومفهومة لمنع التكرار تماماً
const wordsList = [
    // الطبيعة والبيئة
    "شمس", "قمر", "نجمة", "سماء", "سحاب", "مطر", "برق", "رعد", "عاصفة", "رياح",
    "بحر", "نهر", "بحيرة", "محيط", "شاطئ", "موج", "جبل", "تل", "وادي", "صحراء",
    "رمل", "واحة", "غابة", "شجرة", "نخلة", "وردة", "زهرة", "عشبة", "صخر", "تربة",
    "بركان", "زلزال", "فضاء", "كوكب", "مريخ", "ارض", "مشتري", "زهرة", "عطارد", "ليل",
    "نهار", "فجر", "صباح", "مساء", "ليل", "شفق", "صيف", "شتاء", "ربيع", "خريف",
    
    // الحيوانات والطيور والحشرات
    "اسد", "نمر", "فهد", "فيل", "زرافة", "قرد", "دب", "ذئب", "ثعلب", "ارنب",
    "حصان", "جمل", "حمار", "بقرة", "خروف", "معزة", "تيس", "كلب", "قطة", "فأر",
    "صقر", "نسر", "بومة", "غراب", "حمامة", "عصفور", "دجاجة", "ديك", "بطة", "وزة",
    "سمكةقرش", "حوت", "دلفين", "قرش", "أخطبوط", "سلطعون", "تمساح", "ثعبان", "حرباء", "سلحفاة",
    "نحلة", "فراشة", "نملة", "بعوضةذبابة", "عنكبوت", "خنفساء", "جندب", "يعسوب", "قملة", "عقرب",

    // المهن والأشخاص
    "طبيب", "مهندس", "معلم", "مدرس", "مدير", "طالب", "شرطي", "جندي", "ضابط", "طباخ",
    "خياط", "نجار", "حداد", "رسام", "كاتب", "شاعر", "مؤلف", "تاجر", "سائق", "طيار",
    "بحار", "صياد", "حارس", "حلاق", "بناء", "ممرض", "صيدلي", "محامي", "قاضي", "وزير",
    "ملك", "أمير", "رئيس", "قائد", "خادم", "ضيف", "جار", "صديق", "طبيب أسنان", "مهندس مدني",

    // الأدوات والأشياء اليومية
    "قلم", "كتاب", "دفتر", "ورقة", "ممحاة", "مسطرة", "حقيبة", "محفظة", "مفتاح", "قفل",
    "ساعة", "نظارة", "مرآة", "مشط", "منشفة", "صابون", "شامبو", "عطر", "سرير", "وسادة",
    "بطانية", "سجادة", "ستارة", "باب", "نافذة", "طاولة", "كرسي", "خزانة", "مكتب", "مصباح",
    "هاتف", "حاسوب", "تلفاز", "راديو", "مكيف", "ثلاجة", "غسالة", "مكواة", "فرن", "مروحة",
    "سכין", "ملعقة", "شوكة", "صوان", "قدر", "مقلاة", "كوب", "فنجان", "صندوق", "سلم",

    // الأطعمة والمشروبات
    "تفاح", "موز", "برتقال", "عنب", "فراولة", "بطيخ", "رمان", "مانجو", "اناناس", "كيوي",
    "خيار", "طماطم", "بطاطس", "بصل", "ثوم", "جزر", "خس", "بقدونس", "نعناع", "ليمون",
    "قهوة", "شاي", "حليب", "ماء", "عصير", "سكر", "ملح", "بهارات", "زيت", "زبدة",
    "خبز", "جبن", "لحم", "دجاج", "سمك", "رز", "معكرونة", "شوربة", "سلطة", "فطور",
    "غداء", "عشاء", "حلوى", "كيك", "بسكويت", "شكولاته", "آيسكريم", "عسل", "مربى", "تمر",
    "تفاحة", "موزة", "برتقالة", "عنبة", "رمانة", "بطيخة", "خوخ", "مشمش", "توت", "اليمون",

    // وسائل المواصلات والأماكن
    "سيارة", "طائرة", "قطار", "سفينة", "قارب", "دراجة", "صاروخ", "شاحنة", "حافلة", "تاكسي",
    "مدرسة", "جامعة", "مستشفى", "مسجد", "ملعب", "حديقة", "سوق", "مطعم", "فندق", "مطار",
    "ميناء", "محطة", "متحف", "مسرح", "سينما", "شركة", "مصنع", "مكتب", "بنك", "شارع",
    "طريق", "جسر", "نفق", "إشارة", "رصيف", "مرآب", "ساحة", "دوار", "حي", "مدينة",
    "قرية", "دولة", "عاصمة", "قارة", "محيط", "خليج", "وادي", "بركان", "هرم", "قلعة",

    // الألوان والأشكال والصفات
    "احمر", "ازرق", "اخضر", "اصفر", "اسود", "ابيض", "برتقالي", "بنفسجي", "وردي", "رمادي",
    "دائرة", "مربع", "مستطيل", "مثلث", "نجمة", "هلال", "مكعب", "هرم", "خط", "نقطة",
    "كبير", "صغير", "طويل", "قصير", "سريع", "بطيء", "قوي", "ضعيف", "ذكي", "غبي",
    "نشيط", "كسلان", "سعيد", "حزين", "غاضب", "هادئ", "شجاع", "جبان", "كريم", "بخيل",
    "طيب", "شرير", "جميل", "قبيح", "نظيف", "متسخ", "جديد", "قديم", "حار", "بارد",

    // أفعال وكلمات متنوعة
    "لعبة", "تحدي", "فوز", "خسارة", "سرعة", "ذكاء", "تفكير", "عمل", "جهد", "نجاح",
    "صوت", "صراخ", "همس", "كلمة", "حرف", "جملة", "قصة", "رواية", "كتابة", "قراءة",
    "رسم", "لون", "فن", "موسيقى", "نغم", "لحن", "غناء", "رقص", "حركة", "سكون",
    "وقف", "جلس", "مشي", "جري", "قفز", "نوم", "أكل", "شرب", "ضحك", "بكا",
    "حب", "كره", "سلام", "حرب", "صداقة", "عائلة", "أب", "أم", "أخ", "أخت"
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

    // 3. المربع السفلي الكبير (الكلمة المستهدفة)
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
        
        try {
            await message.react('✅');
        } catch (e) {
            console.error("لم نتمكن من وضع الرياكشن:", e);
        }
        return;
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
                    m.channel.send(`أسرع من يكتب: ${randomWord} <@${m.author.id}>`);
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
