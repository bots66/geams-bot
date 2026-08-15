const { 
    Client, 
    GatewayIntentBits, 
    AttachmentBuilder 
} = require('discord.js');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const { ArabicReshaper } = require('arabic-persian-reshaper');
const fs = require('fs');
const https = require('https');
const path = require('path');

// تحميل وتسجيل الخط العربي لمنع المربعات وتوفير مظهر احترافي
const fontPath = path.join(__dirname, 'Cairo-Bold.ttf');
if (!fs.existsSync(fontPath)) {
    const file = fs.createWriteStream(fontPath);
    https.get("https://github.com/google/fonts/raw/main/ofl/cairo/Cairo-Bold.ttf", (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            GlobalFonts.registerFromPath(fontPath, 'Cairo');
        });
    });
} else {
    GlobalFonts.registerFromPath(fontPath, 'Cairo');
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

const wordsList = [
    "كاتب", "ضابط", "تفاحة", "سفينة", "طائرة", "سيارة", "قلم", "كتاب", "حاسوب", "هاتف", "طاولة", "كرسي",
    "شباك", "باب", "شمس", "قمر", "نجمة", "سحاب", "مطر", "بحر", "نهر", "جبل",
    "حاسب", "برمجية", "تطوير", "تقنية", "ذكاء", "اصطناعي", "سرعة", "لعبة", "تحدي", "فوز",
    "خوارزمية", "قاعدة", "بيانات", "شبكة", "تشفير", "حماية", "خادم", "اتصال", "تفاعل", "رسالة",
    "صورة", "تصميم", "لون", "خلفية", "شاشة", "لوحة", "مفتاح", "تطبيق", "منصة", "موقع",
    "قارب", "قطار", "دراجة", "صاروخ", "مريخ", "فضاء", "كوكب", "نجوم", "ليل", "نهار",
    "صيف", "شتاء", "ربيع", "خريف", "وردة", "شجرة", "غابة", "حديقة", "عصفور", "صقر",
    "أسد", "نمر", "فهد", "ذئب", "حصان", "جمل", "خروف", "بقرة", "دجاجة", "سمكة",
    "قصر", "منزل", "غرفة", "مطبخ", "حمام", "سجادة", "وسادة", "ساعة", "مرآة", "صندوق",
    "مفتاح", "قفل", "سلسلة", "خاتم", "سوار", "عقد", "حذاء", "قبعة", "معطف", "قميص",
    "بنطلون", "حقيبة", "محفظة", "نظارة", "محاية", "مسطرة", "دفتر", "مقص", "صمغ",
    "برتقال", "موز", "عنب", "فراولة", "بطيخ", "رمان", "مانجو", "اناناس", "كيوي",
    "خيار", "طماطم", "بطاطس", "بصل", "ثوم", "جزر", "خس", "بقدونس", "نعناع", "ليمون",
    "قهوة", "شاي", "حليب", "ماء", "عصير", "سكر", "ملح", "بهارات", "زيت", "زبدة",
    "خبز", "جبن", "لحم", "دجاج", "سمك", "رز", "معكرونة", "شوربة", "سلطة", "فطور",
    "غداء", "عشاء", "حلوى", "كيك", "بسكويت", "شكولاته", "آيسكريم", "عسل", "مربى", "تمر",
    "طبيب", "مهندس", "معلم", "جندي", "طيار", "سائق", "تاجر", "صانع", "رسام",
    "شاعر", "مغني", "لاعب", "حارس", "مدرب", "صيدلي", "ممرض", "محامي", "قاضي",
    "مدرسة", "جامعة", "مستشفى", "مسجد", "ملعب", "حديقة", "سوق", "مطعم", "فندق", "مطار",
    "ميناء", "محطة", "متحف", "مسرح", "سينما", "شركة", "مصنع", "مكتب", "بنك",
    "طريق", "شارع", "جسر", "نفق", "إشارة", "رصيف", "مرآب", "ساحة", "دوار", "حي",
    "مدينة", "قرية", "دولة", "عاصمة", "قارة", "محيط", "خليج", "وادي", "بركان",
    "زلزال", "رياح", "عاصفة", "رعد", "برق", "ضباب", "صقيع", "ثلوج", "حرارة", "رطوبة",
    "دائرة", "مربع", "مستطيل", "مثلث", "هندسة", "حساب", "رقم", "عدد", "عملية", "معادلة",
    "طاقة", "قوة", "تسارع", "كتلة", "وزن", "حجم", "مساحة", "طول", "عرض",
    "ارتفاع", "عمق", "زمن", "دقيقة", "ثانية", "ساعة", "يوم", "أسبوع", "شهر", "سنة",
    "قرن", "تاريخ", "حاضر", "مستقبل", "ماضي", "بداية", "نهاية", "وسط", "يمين", "يسار",
    "أعلى", "أسفل", "أمام", "خلف", "قريب", "بعيد", "كبير", "صغير", "طويل", "قصير",
    "سريع", "بطيء", "قوي", "ضعيف", "ذكي", "غبي", "نشيط", "كسلان", "سعيد", "حزين",
    "غاضب", "هادئ", "شجاع", "جبان", "كريم", "بخيل", "طيب", "شرير", "جميل", "قبيح",
    "نظيف", "متسخ", "جديد", "قديم", "حار", "بارد", "دافئ", "مثلج", "جاف", "رطب",
    "مفتوح", "مغلق", "سهل", "صعب", "واضح", "خفي", "ظاهر", "باطن", "صحيح", "خطأ",
    "صادق", "كاذب", "أمين", "خائن", "مخلص", "وفي", "حب", "كره", "سلام", "حرب"
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

    // معالجة الكلمة لضمان اتصال الحروف وعدم تباعدها
    const shapedWord = ArabicReshaper.convertArabic(word);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 55px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(shapedWord, 350, 195);

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
                    // رسالة الفوز بدون زوائد (المنشن فقط)
                    m.channel.send(`<@${m.author.id}>`);
                }
            });

            collector.on('end', (collected, reason) => {
                if (reason !== 'won' && activeGames.has(guildId)) {
                    activeGames.delete(guildId);
                    activeChannels.delete(channelId);
                    // رسالة انتهاء الوقت بدون زوائد
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

client.login(process.env.TOKEN);
