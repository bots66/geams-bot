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
const allowedRoleId = '1537723053318864927';

// قائمة الكلمات للعبة أسرع من يكتب (أكثر من 400 كلمة)
const wordsList = [
    "شمس", "قمر", "نجمة", "سماء", "سحاب", "مطر", "برق", "رعد", "عاصفة", "رياح",
    "بحر", "نهر", "بحيرة", "محيط", "شاطئ", "موج", "جبل", "تل", "وادي", "صحراء",
    "رمل", "واحة", "غابة", "شجرة", "نخلة", "وردة", "زهرة", "عشبة", "صخر", "تربة",
    "بركان", "زلزال", "فضاء", "كوكب", "مريخ", "ارض", "مشتري", "زهرة", "عطارد", "ليل",
    "نهار", "فجر", "صباح", "مساء", "شفق", "صيف", "شتاء", "ربيع", "خريف",
    "اسد", "نمر", "فهد", "فيل", "زرافة", "قرد", "دب", "ذئب", "ثعلب", "ارنب",
    "حصان", "جمل", "حمار", "بقرة", "خروف", "معزة", "تيس", "كلب", "قطة", "فأر",
    "صقر", "نسر", "بومة", "غراب", "حمامة", "عصفور", "دجاجة", "ديك", "بطة", "وزة",
    "حوت", "دلفين", "قرش", "أخطبوط", "سلطعون", "تمساح", "ثعبان", "حرباء", "سلحفاة",
    "نحلة", "فراشة", "نملة", "عنكبوت", "خنفساء", "جندب", "يعسوب", "عقرب",
    "طبيب", "مهندس", "معلم", "مدرس", "مدير", "طالب", "شرطي", "جندي", "ضابط", "طباخ",
    "خياط", "نجار", "حداد", "رسام", "كاتب", "شاعر", "مؤلف", "تاجر", "سائق", "طيار",
    "بحار", "صياد", "حارس", "حلاق", "بناء", "ممرض", "صيدلي", "محامي", "قاضي", "وزير",
    "قلم", "كتاب", "دفتر", "ورقة", "ممحاة", "مسطرة", "حقيبة", "محفظة", "مفتاح", "قفل",
    "ساعة", "نظارة", "مرآة", "مشط", "منشفة", "صابون", "شامبو", "عطر", "سرير", "وسادة",
    "بطانية", "سجادة", "ستارة", "باب", "نافذة", "طاولة", "كرسي", "خزانة", "مكتب", "مصباح",
    "هاتف", "حاسوب", "تلفاز", "راديو", "مكيف", "ثلاجة", "غسالة", "مكواة", "فرن", "مروحة",
    "ملعقة", "شوكة", "قدر", "مقلاة", "كوب", "فنجان", "صندوق", "سلم",
    "تفاح", "موز", "برتقال", "عنب", "فراولة", "بطيخ", "رمان", "مانجو", "اناناس", "كيوي",
    "خيار", "طماطم", "بطاطس", "بصل", "ثوم", "جزر", "خس", "بقدونس", "نعناع", "ليمون",
    "قهوة", "شاي", "حليب", "ماء", "عصير", "سكر", "ملح", "بهارات", "زيت", "زبدة",
    "خبز", "جبن", "لحم", "دجاج", "سمك", "رز", "معكرونة", "شوربة", "سلطة", "فطور",
    "غداء", "عشاء", "حلوى", "كيك", "بسكويت", "شكولاته", "آيسكريم", "عسل", "مربى", "تمر",
    "سيارة", "طائرة", "قطار", "سفينة", "قارب", "دراجة", "صاروخ", "شاحنة", "حافلة", "تاكسي",
    "مدرسة", "جامعة", "مستشفى", "مسجد", "ملعب", "حديقة", "سوق", "مطعم", "فندق", "مطار",
    "ميناء", "محطة", "متحف", "مسرح", "سينما", "شركة", "مصنع", "مكتب", "بنك", "شارع",
    "طريق", "جسر", "نفق", "إشارة", "رصيف", "مرآب", "ساحة", "دوار", "حي", "مدينة",
    "قرية", "دولة", "عاصمة", "قارة", "محيط", "خليج", "وادي", "بركان", "هرم", "قلعة",
    "احمر", "ازرق", "اخضر", "اصفر", "اسود", "ابيض", "برتقالي", "بنفسجي", "وردي", "رمادي",
    "دائرة", "مربع", "مستطيل", "مثلث", "نجمة", "هلال", "مكعب", "هرم", "خط", "نقطة",
    "كبير", "صغير", "طويل", "قصير", "سريع", "بطيء", "قوي", "ضعيف", "ذكي", "غبي",
    "نشيط", "كسلان", "سعيد", "حزين", "غاضب", "هادئ", "شجاع", "جبان", "كريم", "بخيل",
    "طيب", "شرير", "جميل", "قبيح", "نظيف", "متسخ", "جديد", "قديم", "حار", "بارد",
    "لعبة", "تحدي", "فوز", "خسارة", "سرعة", "ذكاء", "تفكير", "عمل", "جهد", "نجاح",
    "صوت", "صراخ", "همس", "كلمة", "حرف", "جملة", "قصة", "رواية", "كتابة", "قراءة",
    "رسم", "لون", "فن", "موسيقى", "نغم", "لحن", "غناء", "رقص", "حركة", "سكون",
    "وقف", "جلس", "مشي", "جري", "قفز", "نوم", "أكل", "شرب", "ضحك", "بكا",
    "حب", "كره", "سلام", "حرب", "صداقة", "عائلة", "أب", "أم", "أخ", "أخت"
];

// قائمة الأعلام (مشهورة 80% وصعبة 20%) مع رابط علم الـ SVG أو PNG الدقيق
const popularFlags = [
    { name: "السعودية", code: "sa" },
    { name: "امريكا", code: "us" },
    { name: "الإمارات", code: "ae" },
    { name: "الكويت", code: "kw" },
    { name: "قطر", code: "qa" },
    { name: "البحرين", code: "bh" },
    { name: "عمان", code: "om" },
    { name: "مصر", code: "eg" },
    { name: "المغرب", code: "ma" },
    { name: "الجزائر", code: "dz" },
    { name: "تونس", code: "tn" },
    { name: "العراق", code: "iq" },
    { name: "الأردن", code: "jo" },
    { name: "سوريا", code: "sy" },
    { name: "لبنان", code: "lb" },
    { name: "فلسطين", code: "ps" },
    { name: "تركيا", code: "tr" },
    { name: "بريطانيا", code: "gb" },
    { name: "فرنسا", code: "fr" },
    { name: "ألمانيا", code: "de" },
    { name: "إيطاليا", code: "it" },
    { name: "إسبانيا", code: "es" },
    { name: "البرازيل", code: "br" },
    { name: "الأرجنتين", code: "ar" },
    { name: "اليابان", code: "jp" },
    { name: "كوريا الجنوبية", code: "kr" },
    { name: "الصين", code: "cn" },
    { name: "الهند", code: "in" },
    { name: "كندا", code: "ca" },
    { name: "استراليا", code: "au" },
    { name: "ماليزيا", code: "my" },
    { name: "إندونيسيا", code: "id" },
    { name: "سنغافورة", code: "sg" },
    { name: "روسيا", code: "ru" },
    { name: "المكسيك", code: "mx" },
    { name: "جنوب افريقيا", code: "za" }
];

const hardFlags = [
    { name: "استونيا", code: "ee" },
    { name: "لاتفيا", code: "lv" },
    { name: "ليتوانيا", code: "lt" },
    { name: "فنلندا", code: "fi" },
    { name: "السويد", code: "se" },
    { name: "النرويج", code: "no" },
    { name: "الدنمارك", code: "dk" },
    { name: "ايسلندا", code: "is" },
    { name: "سويسرا", code: "ch" },
    { name: "النمسا", code: "at" },
    { name: "بلجيكا", code: "be" },
    { name: "هولندا", code: "nl" },
    { name: "البرتغال", code: "pt" },
    { name: "اليونان", code: "gr" },
    { name: "بولندا", code: "pl" },
    { name: "المجر", code: "hu" },
    { name: "تشيك", code: "cz" },
    { name: "رومانيا", code: "ro" },
    { name: "بلغاريا", code: "bg" },
    { name: "صربيا", code: "rs" },
    { name: "كرواتيا", code: "hr" },
    { name: "سلوفاكيا", code: "sk" },
    { name: "سلوفينيا", code: "si" },
    { name: "ألبانيا", code: "al" },
    { name: "قبرص", code: "cy" },
    { name: "مالطا", code: "mt" },
    { name: "لوكسمبورغ", code: "lu" },
    { name: "أيرلندا", code: "ie" },
    { name: "فيتنام", code: "vn" },
    { name: "تايلاند", code: "th" },
    { name: "الفلبين", code: "ph" },
    { name: "باكستان", code: "pk" },
    { name: "بنغلاديش", code: "bd" },
    { name: "نيبال", code: "np" },
    { name: "سريلانكا", code: "lk" },
    { name: "إيران", code: "ir" },
    { name: "نيوزيلندا", code: "nz" },
    { name: "تشيلي", code: "cl" },
    { name: "كولومبيا", code: "co" },
    { name: "بيرو", code: "pe" }
];

let usedFlags = [];

function getRandomFlag() {
    let pool = popularFlags;
    const rand = Math.random();
    // 80% مشهورة، 20% صعبة
    if (rand > 0.8) {
        pool = hardFlags;
    }
    
    // فلترة غير المستخدمة لمنع التكرار قدر الإمكان
    let available = pool.filter(f => !usedFlags.includes(f.name));
    if (available.length === 0) {
        usedFlags = [];
        available = pool;
    }
    
    const flag = available[Math.floor(Math.random() * available.length)];
    usedFlags.push(flag.name);
    return flag;
}

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

// دالة لتوليد صورة لعبة أسرع من يكتب
async function generateGameImage(word) {
    const canvas = createCanvas(700, 320);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    function drawRoundedRect(x, y, width, height, radius, fillColor, strokeColor) {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
        if (fillColor) { ctx.fillStyle = fillColor; ctx.fill(); }
        if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = 3; ctx.stroke(); }
    }

    drawRoundedRect(365, 25, 285, 55, 25, '#1a1d24', '#2b313d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('أسرع من يكتب', 507, 52);

    drawRoundedRect(50, 25, 305, 55, 25, '#1a1d24', '#2b313d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡ لديك 15 ثانية', 202, 52);

    drawRoundedRect(50, 105, 600, 180, 35, '#161920', '#3a4454');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 55px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(word, 350, 195);

    return canvas.toBuffer('image/png');
}

// دالة لتوليد صورة لعبة الأعلام تماماً مثل الصورة المطلوبة
async function generateFlagGameImage(flagObj) {
    const canvas = createCanvas(700, 320);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    function drawRoundedRect(x, y, width, height, radius, fillColor, strokeColor) {
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, radius);
        if (fillColor) { ctx.fillStyle = fillColor; ctx.fill(); }
        if (strokeColor) { ctx.strokeStyle = strokeColor; ctx.lineWidth = 3; ctx.stroke(); }
    }

    // 1. المربع العلوي الأيسر (أعلام)
    drawRoundedRect(50, 25, 305, 55, 25, '#1a1d24', '#2b313d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('أعلام', 202, 52);

    // 2. المربع العلوي الأيمن (⚡ لديك 15 ثانية مع أيقونة المؤقت بالرسم)
    drawRoundedRect(365, 25, 285, 55, 25, '#1a1d24', '#2b313d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡ لديك 15 ثانية', 507, 52);

    // رسم دائرة أيقونة المؤقت البسيطة بجانب المربع إذا لزم أو داخل النص
    ctx.beginPath();
    ctx.arc(615, 52, 10, 0, Math.PI * 2);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. المربع السفلي الكبير الذي يحتوي العلم
    drawRoundedRect(50, 100, 600, 195, 30, '#161920', '#3a4454');

    // جلب صورة العلم عبر الرابط الرسمي
    const flagUrl = `https://flagcdn.com/w320/${flagObj.code}.png`;
    try {
        const { Canvas, loadImage } = require('@napi-rs/canvas');
        const img = await loadImage(flagUrl);
        // رسم العلم داخل المربع بأبعاد متناسقة ونظيفة
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(85, 125, 530, 145, 15);
        ctx.clip();
        ctx.drawImage(img, 85, 125, 530, 145);
        ctx.restore();
    } catch (e) {
        console.error("خطأ في تحميل صورة العلم:", e);
    }

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

    // أمر إيقاف
    if (content === 'إيقاف' || content === 'ايقاف') {
        if (!activeGames.has(guildId)) {
            return message.reply('لا توجد أي لعبة تعمل حالياً لإيقافها.');
        }

        // تحقق من الصلاحية (الإيدي المطلوب)
        if (message.author.id !== allowedRoleId) {
            try {
                await message.react('❌');
            } catch (e) {}
            return;
        }

        const game = activeGames.get(guildId);
        if (game.collector) game.collector.stop();
        activeGames.delete(guildId);
        activeChannels.delete(channelId);
        
        try {
            await message.react('✅');
        } catch (e) {}
        return;
    }

    // لعبة أسرع من يكتب
    if (content === 'أسرع' || content === 'اسرع') {
        if (activeGames.has(guildId) || activeChannels.has(channelId)) {
            return message.reply('في لعبة جالس تنلعب');
        }

        activeChannels.add(channelId);
        const randomWord = wordsList[Math.floor(Math.random() * wordsList.length)];

        try {
            const buffer = await generateGameImage(randomWord);
            const attachment = new AttachmentBuilder(buffer, { name: 'fast_game.png' });

            await message.channel.send({ files: [attachment] });

            activeGames.set(guildId, { type: 'fast', answer: randomWord });

            const filter = (m) => !m.author.bot;
            const collector = message.channel.createMessageCollector({ filter, time: 15000 });
            activeGames.get(guildId).collector = collector;

            collector.on('collect', (m) => {
                if (normalizeText(m.content) === normalizeText(randomWord)) {
                    if (activeGames.has(guildId)) activeGames.delete(guildId);
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

    // لعبة الأعلام
    if (content === 'أعلام' || content === 'اعلام') {
        if (activeGames.has(guildId) || activeChannels.has(channelId)) {
            return message.reply('في لعبة جالس تنلعب');
        }

        activeChannels.add(channelId);
        const flagObj = getRandomFlag();

        try {
            const buffer = await generateFlagGameImage(flagObj);
            const attachment = new AttachmentBuilder(buffer, { name: 'flag_game.png' });

            await message.channel.send({ files: [attachment] });

            activeGames.set(guildId, { type: 'flag', answer: flagObj.name });

            const filter = (m) => !m.author.bot;
            const collector = message.channel.createMessageCollector({ filter, time: 15000 });
            activeGames.get(guildId).collector = collector;

            collector.on('collect', (m) => {
                if (normalizeText(m.content) === normalizeText(flagObj.name)) {
                    if (activeGames.has(guildId)) activeGames.delete(guildId);
                    activeChannels.delete(channelId);
                    collector.stop('won');
                    m.channel.send(`أسرع من يكتب: ${flagObj.name} <@${m.author.id}>`);
                }
            });

            collector.on('end', (collected, reason) => {
                if (reason !== 'won' && activeGames.has(guildId)) {
                    activeGames.delete(guildId);
                    activeChannels.delete(channelId);
                    message.channel.send(`انتهى الوقت! البلد هي: ${flagObj.name}`);
                }
            });

        } catch (error) {
            console.error("خطأ أثناء توليد رسم العلم:", error);
            activeChannels.delete(channelId);
            return message.reply(`حدث خطأ أثناء إنشاء لعبة الأعلام: ${error.message}`);
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
