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
const allowedRoleId = '1537723053318864927';

// قائمة كلمات كبيرة (فوق 100 كلمة)
const wordsList = ["شمس", "قمر", "نجمة", "سماء", "سحاب", "مطر", "برق", "رعد", "عاصفة", "رياح", "بحر", "نهر", "جبل", "صحراء", "سيارة", "طائرة", "قطار", "سفينة", "مدرسة", "حديقة", "سوق", "مطعم", "فندق", "مطار", "قهوة", "شاي", "حليب", "ماء", "خبز", "جبن", "لحم", "دجاج", "سمك", "رز", "تفاح", "موز", "برتقال", "عنب", "طبيب", "مهندس", "معلم", "قلم", "كتاب", "دفتر", "ساعة", "نظارة", "هاتف", "حاسوب", "مكيف", "ثلاجة", "كرسي", "طاولة", "باب", "نافذة", "مصباح", "ملعقة", "شوكة", "قدر", "كوب", "فنجان", "حذاء", "قميص", "سروال", "عطر", "مشط", "صابون", "منشفة", "وسادة", "بطانية", "سجادة", "ستارة", "لوحة", "مفتاح", "قفل", "حقيبة", "محفظة", "نظارة", "رسالة", "صورة", "راديو", "تلفاز", "كاميرا", "مروحة", "مكواة", "غسالة", "فرن", "دراجة", "شاحنة", "حافلة", "تاكسي", "جسر", "نفق", "طريق", "شارع", "حي", "مدينة", "قرية", "دولة", "قارة", "محيط", "خليج", "وادي", "بركان", "هرم", "قلعة", "متحف", "مسرح", "سينما", "ملعب"];

// قائمة أعلام (فوق 80 دولة)
const allFlags = [
    { name: "السعودية", code: "sa" }, { name: "امريكا", code: "us" }, { name: "الامارات", code: "ae" }, { name: "الكويت", code: "kw" }, { name: "قطر", code: "qa" }, { name: "البحرين", code: "bh" }, { name: "عمان", code: "om" }, { name: "مصر", code: "eg" }, { name: "المغرب", code: "ma" }, { name: "الجزائر", code: "dz" }, { name: "تونس", code: "tn" }, { name: "العراق", code: "iq" }, { name: "الاردن", code: "jo" }, { name: "سوريا", code: "sy" }, { name: "لبنان", code: "lb" }, { name: "فلسطين", code: "ps" }, { name: "ليبيا", code: "ly" }, { name: "السودان", code: "sd" }, { name: "اليمن", code: "ye" }, { name: "موريتانيا", code: "mr" },
    { name: "تركيا", code: "tr" }, { name: "فرنسا", code: "fr" }, { name: "المانيا", code: "de" }, { name: "ايطاليا", code: "it" }, { name: "اسبانيا", code: "es" }, { name: "بريطانيا", code: "gb" }, { name: "روسيا", code: "ru" }, { name: "الصين", code: "cn" }, { name: "اليابان", code: "jp" }, { name: "كوريا الجنوبية", code: "kr" }, { name: "الهند", code: "in" }, { name: "البرازيل", code: "br" }, { name: "الارجنتين", code: "ar" }, { name: "كندا", code: "ca" }, { name: "استراليا", code: "au" }, { name: "ماليزيا", code: "my" }, { name: "اندونيسيا", code: "id" }, { name: "سنغافورة", code: "sg" }, { name: "المكسيك", code: "mx" }, { name: "جنوب افريقيا", code: "za" },
    { name: "فنلندا", code: "fi" }, { name: "السويد", code: "se" }, { name: "النرويج", code: "no" }, { name: "الدنمارك", code: "dk" }, { name: "ايسلندا", code: "is" }, { name: "سويسرا", code: "ch" }, { name: "النمسا", code: "at" }, { name: "بلجيكا", code: "be" }, { name: "هولندا", code: "nl" }, { name: "البرتغال", code: "pt" }, { name: "اليونان", code: "gr" }, { name: "بولندا", code: "pl" }, { name: "المجر", code: "hu" }, { name: "التشيك", code: "cz" }, { name: "رومانيا", code: "ro" }, { name: "بلغاريا", code: "bg" }, { name: "صربيا", code: "rs" }, { name: "كرواتيا", code: "hr" }, { name: "سلوفاكيا", code: "sk" }, { name: "سلوفينيا", code: "si" },
    { name: "البانيا", code: "al" }, { name: "قبرص", code: "cy" }, { name: "مالطا", code: "mt" }, { name: "لوكسمبورغ", code: "lu" }, { name: "ايرلندا", code: "ie" }, { name: "فيتنام", code: "vn" }, { name: "تايلاند", code: "th" }, { name: "الفلبين", code: "ph" }, { name: "باكستان", code: "pk" }, { name: "بنغلاديش", code: "bd" }, { name: "نيبال", code: "np" }, { name: "سريلانكا", code: "lk" }, { name: "ايران", code: "ir" }, { name: "نيوزيلندا", code: "nz" }, { name: "تشيلي", code: "cl" }, { name: "كولومبيا", code: "co" }, { name: "بيرو", code: "pe" }, { name: "اوكرانيا", code: "ua" }, { name: "سويسرا", code: "ch" }, { name: "نيجيريا", code: "ng" }
];

function normalizeText(text) {
    if (!text) return "";
    return text.trim().toLowerCase()
        .replace(/[إأآا]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[ء]/g, '');
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
        ctx.save();
        ctx.beginPath();
        // تصغير عرض العلم من الجوانب ليكون أنحف وأوضح
        ctx.roundRect(180, 125, 340, 145, 15);
        ctx.clip();
        ctx.drawImage(img, 180, 125, 340, 145);
        ctx.restore();
    }
    return canvas.toBuffer('image/png');
}

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const content = normalizeText(message.content);
    const guildId = message.guild.id;

    if (content === 'ايقاف' && message.author.id === allowedRoleId) {
        if (activeGames.has(guildId)) {
            activeGames.get(guildId).collector.stop();
            activeGames.delete(guildId);
            return message.react('✅');
        }
    }

    if (content === 'اسرع') {
        if (activeGames.has(guildId)) return message.reply('في لعبة جالس تنلعب');
        const word = wordsList[Math.floor(Math.random() * wordsList.length)];
        const buffer = await generateImage('fast', word);
        await message.channel.send({ files: [new AttachmentBuilder(buffer)] });
        
        const collector = message.channel.createMessageCollector({ time: 15000 });
        activeGames.set(guildId, { answer: normalizeText(word), collector });
        
        collector.on('collect', (m) => {
            if (normalizeText(m.content) === normalizeText(word)) {
                message.channel.send(`اسرع من يكتب ${word} <@${m.author.id}>`);
                collector.stop();
                activeGames.delete(guildId);
            }
        });
    }

    if (content === 'اعلام') {
        if (activeGames.has(guildId)) return message.reply('في لعبة جالس تنلعب');
        const flag = allFlags[Math.floor(Math.random() * allFlags.length)];
        const buffer = await generateImage('flag', flag);
        await message.channel.send({ files: [new AttachmentBuilder(buffer)] });
        
        const collector = message.channel.createMessageCollector({ time: 15000 });
        activeGames.set(guildId, { answer: normalizeText(flag.name), collector });
        
        collector.on('collect', (m) => {
            if (normalizeText(m.content) === normalizeText(flag.name)) {
                message.channel.send(`اسرع من يخمن ${flag.name} <@${m.author.id}>`);
                collector.stop();
                activeGames.delete(guildId);
            }
        });
    }
});

loadFont().then(() => {
    client.login(process.env.TOKEN);
});
