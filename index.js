const { 
    Client, 
    GatewayIntentBits, 
    EmbedBuilder,
    AttachmentBuilder 
} = require('discord.js');
const Jimp = require('jimp');

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

// قائمة ضخمة تحتوي على أكثر من 300 كلمة متنوعة لمنع التكرار نهائياً
const wordsList = [
    "تفاحة", "سفينة", "طائرة", "سيارة", "قلم", "كتاب", "حاسوب", "هاتف", "طاولة", "كرسي",
    "شباك", "باب", "شمس", "قمر", "نجمة", "سحاب", "مطر", "بحر", "نهر", "جبل",
    "حاسب", "برمجية", "تطوير", "تقنية", "ذكاء", "اصطناعي", "سرعة", "لعبة", "تحدي", "فوز",
    "خوارزمية", "قاعدة", "بيانات", "شبكة", "تشفير", "حماية", "خادم", "اتصال", "تفاعل", "رسالة",
    "صورة", "تصميم", "لون", "خلفية", "شاشة", "لوحة", "مفتاح", "تطبيق", "منصة", "موقع",
    "قارب", "قطار", "دراجة", "صاروخ", "مريخ", "فضاء", "كوكب", "نجوم", "ليل", "نهار",
    "صيف", "شتاء", "ربيع", "خريف", "وردة", "شجرة", "غابة", "حديقة", "عصفور", "صقر",
    "أسد", "نمر", "فهد", "ذئب", "حصان", "جمل", "خروف", "بقرة", "دجاجة", "سمكة",
    "قصر", "منزل", "غرفة", "مطبخ", "حمام", "سجادة", "وسادة", "ساعة", "مرآة", "صندوق",
    "مفتاح", "قفل", "سلسلة", "خاتم", "سوار", "عقد", "حذاء", "قبعة", "معطف", "قميص",
    "بنطلون", "حقيبة", "محفظة", "نظارة", "قلم", "محاية", "مسطرة", "دفتر", "مقص", "صمغ",
    "برتقال", "موز", "تفاح", "عنب", "فراولة", "بطيخ", "رمان", "مانجو", "اناناس", "كيوي",
    "خيار", "طماطم", "بطاطس", "بصل", "ثوم", "جزر", "خس", "بقدونس", "نعناع", "ليمون",
    "قهوة", "شاي", "حليب", "ماء", "عصير", "سكر", "ملح", "بهارات", "زيت", "زبدة",
    "خبز", "جبن", "لحم", "دجاج", "سمك", "رز", "معكرونة", "شوربة", "سلطة", "فطور",
    "غداء", "عشاء", "حلوى", "كيك", "بسكويت", "شكولاته", "آيسكريم", "عسل", "مربى", "تمر",
    "طبيب", "مهندس", "معلم", "ضابط", "جندي", "طيار", "سائق", "تاجر", "صانع", "رسام",
    "كاتب", "شاعر", "مغني", "لاعب", "حارس", "مدرب", "صيدلي", "ممرض", "محامي", "قاضي",
    "مدرسة", "جامعة", "مستشفى", "مسجد", "ملعب", "حديقة", "سوق", "مطعم", "فندق", "مطار",
    "ميناء", "محطة", "متحف", "مسرح", "سينما", "ملعب", "شركة", "مصنع", "مكتب", "بنك",
    "طريق", "شارع", "جسر", "نفق", "إشارة", "رصيف", "مرآب", "ساحة", "دوار", "حي",
    "مدينة", "قرية", "دولة", "عاصمة", "قارة", "محيط", "خليج", "وادي", "صهارة", "بركان",
    "زلزال", "رياح", "عاصفة", "رعد", "برق", "ضباب", "صقيع", "ثلوج", "حرارة", "رطوبة",
    "دائرة", "مربع", "مستطيل", "مثلث", "هندسة", "حساب", "رقم", "عدد", "عملية", "معادلة",
    "طاقة", "قوة", "سرعة", "تسارع", "كتلة", "وزن", "حجم", "مساحة", "طول", "عرض",
    "ارتفاع", "عمق", "زمن", "دقيقة", "ثانية", "ساعة", "يوم", "أسبوع", "شهر", "سنة",
    "قرن", "تاريخ", "حاضر", "مستقبل", "ماضي", "بداية", "نهاية", "وسط", "يمين", "يسار",
    "أعلى", "أسفل", "أمام", "خلف", "قريب", "بعيد", "كبير", "صغير", "طويل", "قصير",
    "سريع", "بطيء", "قوي", "ضعيف", "ذكي", "غبي", "نشيط", "كسلان", "سعيد", "حزين",
    "غاضب", "هادئ", "شجاع", "جبان", "كريم", "بخيل", "طيب", "شرير", "جميل", "قبيح",
    "نظيف", "متسخ", "جديد", "قديم", "حار", "بارد", "داافئ", "مثلج", "جاف", "رطب",
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

// دالة ذكية تقوم برسم الصورة وتوليدها بنفسها من الصفر
async function generateFastImage(word) {
    // إنشاء لوحة عرض برمجية بحجم 400x150 بلون خلفية داكن وأنيق
    const width = 400;
    const height = 150;
    const image = new Jimp(width, height, 0x1f1f22ff); // لون رمادي غامق احترافي

    // تحميل الخط الافتراضي المدمج في Jimp
    const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);

    // حساب مكان الكلمة لتكون في المنتصف تماماً بشكل تلقائي
    const textWidth = Jimp.measureText(font, word);
    const textHeight = Jimp.measureTextHeight(font, word, width);
    
    const x = (width - textWidth) / 2;
    const y = (height - textHeight) / 2;

    // طباعة الكلمة على الصورة برمجياً
    image.print(font, x, y, word);

    // استخراج الصورة كـ Buffer لترسل للديسكورد مباشرة
    return new Promise((resolve, reject) => {
        image.getBuffer(Jimp.MIME_PNG, (err, buffer) => {
            if (err) reject(err);
            else resolve(buffer);
        });
    });
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
        
        // اختيار كلمة عشوائية من القائمة الضخمة (أكثر من 300 كلمة)
        const randomWord = wordsList[Math.floor(Math.random() * wordsList.length)];

        try {
            // رسم وتوليد الصورة آلياً والكلمة في منتصفها
            const buffer = await generateFastImage(randomWord);
            const attachment = new AttachmentBuilder(buffer, { name: 'fast_game.png' });

            const gameEmbed = new EmbedBuilder()
                .setTitle('⚡ لعبة أسرع بكتابة الكلمة!')
                .setDescription('**اكتب الكلمة الظاهرة في الصورة بالأسفل بأسرع ما يمكنك!**\n⏳ لديك 15 ثانية')
                .setImage('attachment://fast_game.png')
                .setColor(0x5865F2);

            await message.channel.send({ 
                embeds: [gameEmbed],
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
                    m.channel.send(`🏆 كفو! الفائز هو <@${m.author.id}> بكتبته للكلمة: **${randomWord}**`);
                }
            });

            collector.on('end', (collected, reason) => {
                if (reason !== 'won' && activeGames.has(guildId)) {
                    activeGames.delete(guildId);
                    activeChannels.delete(channelId);
                    message.channel.send(`⏰ انتهى الوقت! الكلمة الصحيحة كانت: **${randomWord}**`);
                }
            });

        } catch (error) {
            console.error("خطأ أثناء توليد ورسم صورة أسرع:", error);
            activeChannels.delete(channelId);
            return message.reply(`حدث خطأ أثناء إنشاء اللعبة: ${error.message}`);
        }
    }
});

// سيرفر وهمي للحفاظ على نشاط البوت على منصات مثل Render
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
