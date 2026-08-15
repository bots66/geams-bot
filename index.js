const { 
    Client, 
    GatewayIntentBits, 
    AttachmentBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
} = require('discord.js');
const { createCanvas, loadImage } = require('@napi-rs/canvas');
const http = require('http');

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
const rouletteLobbyImageUrl = 'https://cdn.discordapp.com/attachments/1537949309666988042/1538098000377806858/Roullete.png?ex=6a8170e3&is=6a801f63&hm=410b44721de956afb86213dcbe97373d1a86a1b8f411099c699e898a795651fe&';

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

const popularFlags = [
    { name: "السعودية", code: "sa" }, { name: "امريكا", code: "us" }, { name: "الإمارات", code: "ae" },
    { name: "الكويت", code: "kw" }, { name: "قطر", code: "qa" }, { name: "البحرين", code: "bh" },
    { name: "عمان", code: "om" }, { name: "مصر", code: "eg" }, { name: "المغرب", code: "ma" },
    { name: "الجزائر", code: "dz" }, { name: "تونس", code: "tn" }, { name: "العراق", code: "iq" },
    { name: "الأردن", code: "jo" }, { name: "سوريا", code: "sy" }, { name: "لبنان", code: "lb" },
    { name: "فلسطين", code: "ps" }, { name: "تركيا", code: "tr" }, { name: "بريطانيا", code: "gb" },
    { name: "فرنسا", code: "fr" }, { name: "ألمانيا", code: "de" }, { name: "إيطاليا", code: "it" },
    { name: "إسبانيا", code: "es" }, { name: "البرازيل", code: "br" }, { name: "الأرجنتين", code: "ar" },
    { name: "اليابان", code: "jp" }, { name: "كوريا الجنوبية", code: "kr" }, { name: "الصين", code: "cn" },
    { name: "الهند", code: "in" }, { name: "كندا", code: "ca" }, { name: "استراليا", code: "au" },
    { name: "ماليزيا", code: "my" }, { name: "إندونيسيا", code: "id" }, { name: "سنغافورة", code: "sg" },
    { name: "روسيا", code: "ru" }, { name: "المكسيك", code: "mx" }, { name: "جنوب افريقيا", code: "za" }
];

let usedFlags = [];

function getRandomFlag() {
    let available = popularFlags.filter(f => !usedFlags.includes(f.name));
    if (available.length === 0) {
        usedFlags = [];
        available = popularFlags;
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

    drawRoundedRect(50, 25, 305, 55, 25, '#1a1d24', '#2b313d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('معك 15 ثانية', 202, 52);

    drawRoundedRect(365, 25, 285, 55, 25, '#1a1d24', '#2b313d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('أسرع من يكتب ؟', 507, 52);

    drawRoundedRect(50, 105, 600, 180, 35, '#161920', '#3a4454');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(word, 350, 195);

    return canvas.toBuffer('image/png');
}

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

    drawRoundedRect(50, 25, 305, 55, 25, '#1a1d24', '#2b313d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('معك 15 ثانية', 202, 52);

    drawRoundedRect(365, 25, 285, 55, 25, '#1a1d24', '#2b313d');
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('علم أي دولة ؟', 507, 52);

    drawRoundedRect(50, 100, 600, 195, 30, '#161920', '#3a4454');

    const flagUrl = `https://flagcdn.com/w320/${flagObj.code}.png`;
    try {
        const img = await loadImage(flagUrl);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(180, 125, 340, 145, 15);
        ctx.clip();
        ctx.drawImage(img, 180, 125, 340, 145);
        ctx.restore();
    } catch (e) {}

    return canvas.toBuffer('image/png');
}

// دالة رسم العجلة (ثابتة تماماً، والسهم فقط هو الذي يدور، مع دعم عرض اسم/يوزر الفائز أو صورة الأفاتار بدقة)
async function generateRouletteWheelImage(participants, targetUser, arrowAngle = 0, isWinnerDisplay = false) {
    const canvas = createCanvas(600, 600);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerX = 300;
    const centerY = 300;
    const radius = 280;
    const count = participants.length;
    const angleStep = (Math.PI * 2) / count;

    // رسم أقسام العجلة وثباتها
    participants.forEach((p, i) => {
        const startAngle = i * angleStep - Math.PI / 2;
        const endAngle = (i + 1) * angleStep - Math.PI / 2;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = '#f8f9fa';
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + angleStep / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px sans-serif';
        const displayName = p.displayName || p.username;
        ctx.fillText(displayName.substring(0, 12), radius - 50, 10);
        ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 12;
    ctx.stroke();

    if (!isWinnerDisplay) {
        // رسم السهم المتحرك وحده يدور حول المركز
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(arrowAngle);
        ctx.translate(-centerX, -centerY);

        ctx.beginPath();
        ctx.moveTo(canvas.width - 15, centerY - 12);
        ctx.lineTo(canvas.width - 2, centerY);
        ctx.moveTo(canvas.width - 15, centerY + 12);
        ctx.lineTo(canvas.width - 2, centerY);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.restore();
    }

    // دائرة الأفاتار في المنتصف (أفاتار الشخص الفائز أو المستهدف)
    const avatarRadius = 75;
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    try {
        const avatarImg = await loadImage(targetUser.displayAvatarURL({ extension: 'png', size: 256 }));
        ctx.drawImage(avatarImg, centerX - avatarRadius, centerY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
    } catch (e) {
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(centerX - avatarRadius, centerY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
    }
    ctx.restore();

    ctx.beginPath();
    ctx.arc(centerX, centerY, avatarRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.stroke();

    // إذا كانت شاشة فائز، يتم رسم شريط الاسم بالأسفل تماماً مثل التصميم المطلوب
    if (isWinnerDisplay) {
        const boxWidth = 260;
        const boxHeight = 50;
        const boxX = centerX - boxWidth / 2;
        const boxY = centerY + avatarRadius + 15;

        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 25);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const winnerName = targetUser.displayName || targetUser.username;
        ctx.fillText(winnerName.substring(0, 15), centerX, boxY + boxHeight / 2);
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

    if (content === 'إيقاف' || content === 'ايقاف') {
        if (!activeGames.has(guildId)) {
            return message.reply('لا توجد أي لعبة تعمل حالياً لإيقافها.');
        }

        if (message.author.id !== allowedRoleId) {
            try { await message.react('❌'); } catch (e) {}
            return;
        }

        const game = activeGames.get(guildId);
        if (game.collector) game.collector.stop();
        if (game.countdownInterval) clearInterval(game.countdownInterval);
        activeGames.delete(guildId);
        activeChannels.delete(channelId);
        
        try { await message.react('✅'); } catch (e) {}
        return;
    }

    if (content === 'روليت') {
        if (!message.member.roles.cache.has(allowedRoleId)) {
            return;
        }

        if (activeGames.has(guildId) || activeChannels.has(channelId)) {
            return message.reply('في لعبة جالس تنلعب');
        }

        activeChannels.add(channelId);
        let participants = [];
        let timeLeft = 30;

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('r_join').setLabel('انضمام').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('r_leave').setLabel('انسحاب').setStyle(ButtonStyle.Secondary)
        );

        const lobbyMessage = await message.channel.send({
            content: `@here\n0/20\nمتبقي لبداية اللعبة 30 ثانية`,
            files: [rouletteLobbyImageUrl],
            components: [row]
        });

        const countdownInterval = setInterval(async () => {
            timeLeft--;
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                return;
            }
            await lobbyMessage.edit({
                content: `@here\n${participants.length}/20\nمتبقي لبداية اللعبة ${timeLeft} ثانية`,
                components: [row]
            }).catch(() => {});
        }, 1000);

        const gameData = {
            type: 'roulette_lobby',
            participants,
            lobbyMessage,
            countdownInterval,
            timeoutTimer: setTimeout(async () => {
                clearInterval(countdownInterval);
                if (participants.length < 3) {
                    activeGames.delete(guildId);
                    activeChannels.delete(channelId);
                    return message.channel.send('العدد غير مكتمل');
                }
                startRouletteGame(message.channel, guildId, channelId, participants);
            }, 30000)
        };

        activeGames.set(guildId, gameData);

        const collector = lobbyMessage.createMessageComponentCollector({ time: 30000 });
        gameData.collector = collector;

        collector.on('collect', async (interaction) => {
            const userId = interaction.user.id;
            const userObj = interaction.user;

            if (interaction.customId === 'r_join') {
                if (participants.some(p => p.id === userId)) {
                    return interaction.reply({ content: 'انت بالفعل داخل اللعبة', ephemeral: true });
                }
                if (participants.length >= 20) {
                    return interaction.reply({ content: 'العدد مكتمل ولا يمدي دخول اللعبة', ephemeral: true });
                }
                participants.push(userObj);
                await interaction.reply({ content: 'تم الانضمام', ephemeral: true });

                await lobbyMessage.edit({ 
                    content: `@here\n${participants.length}/20\nمتبقي لبداية اللعبة ${timeLeft} ثانية`, 
                    components: [row] 
                }).catch(() => {});

                if (participants.length === 20) {
                    clearTimeout(gameData.timeoutTimer);
                    clearInterval(countdownInterval);
                    collector.stop();
                    startRouletteGame(message.channel, guildId, channelId, participants);
                }
            } else if (interaction.customId === 'r_leave') {
                const index = participants.findIndex(p => p.id === userId);
                if (index === -1) {
                    return interaction.reply({ content: 'انت بالفعل خارج اللعبة', ephemeral: true });
                }
                participants.splice(index, 1);
                await interaction.reply({ content: 'تم الانسحاب', ephemeral: true });

                await lobbyMessage.edit({ 
                    content: `@here\n${participants.length}/20\nمتبقي لبداية اللعبة ${timeLeft} ثانية`, 
                    components: [row] 
                }).catch(() => {});
            }
        });
    }

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
                    m.channel.send(`أسرع من يكتب ${randomWord} <@${m.author.id}>`);
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
            activeChannels.delete(channelId);
        }
    }

    if (content === 'أعلام' || content === 'اعلام') {
        if (activeGames.has(guildId) || activeChannels.has(channelId)) {
            return message.reply('في لعبة جالس تنلعب');
        }

        activeChannels.add(channelId);
        const flagObj = getRandomFlag();

        try {
            const buffer = await generateFlagGameImage(flagObj);
            const attachment = new AttachmentBuilder(buffer, { name: 'flag.png' });

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
                    m.channel.send(`أسرع من يخمن ${flagObj.name} <@${m.author.id}>`);
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
            activeChannels.delete(channelId);
        }
    }
});

async function startRouletteGame(channel, guildId, channelId, participants) {
    if (participants.length < 3) {
        activeGames.delete(guildId);
        activeChannels.delete(channelId);
        return channel.send('العدد غير مكتمل');
    }

    await channel.send('⏳ تم الانتهاء من تسجيل الارقام ستبدأ الجولة خلال ثواني .');
    setTimeout(() => {
        runRouletteRound(channel, guildId, channelId, participants);
    }, 2000);
}

async function runRouletteRound(channel, guildId, channelId, participants) {
    // إذا تبقى فائز واحد فقط
    if (participants.length === 1) {
        const winner = participants[0];
        activeGames.delete(guildId);
        activeChannels.delete(channelId);

        const winBuffer = await generateRouletteWheelImage([winner], winner, 0, true);
        const winAttachment = new AttachmentBuilder(winBuffer, { name: 'roulette_win.png' });
        return channel.send({ content: `@here\n<@!${winner.id}>`, files: [winAttachment] });
    }

    const targetPlayer = participants[Math.floor(Math.random() * participants.length)];
    
    let arrowAngle = 0;
    const initialWheelBuffer = await generateRouletteWheelImage(participants, targetPlayer, arrowAngle, false);
    const wheelMessage = await channel.send({
        files: [new AttachmentBuilder(initialWheelBuffer, { name: 'roulette_wheel.png' })]
    });

    // دوران السهم لمدة 6 ثوانٍ إجمالية (أول 4 ثوانٍ سريعة، آخر ثانيتين تباطؤ تدريجي سلس بدون أي وميض)
    const startTime = Date.now();
    const totalDuration = 6000; // 6 ثواني
    
    while (Date.now() - startTime < totalDuration) {
        const elapsed = Date.now() - startTime;
        let speed = 0.4; // سرعة البداية
        
        // آخر ثانيتين يحدث تباطؤ تدريجي
        if (elapsed > 4000) {
            const progress = (elapsed - 4000) / 2000;
            speed = 0.4 * (1 - progress) + 0.02; // يتوقف بنعومة
        }

        arrowAngle += speed;
        
        const rotatedBuffer = await generateRouletteWheelImage(participants, targetPlayer, arrowAngle, false);
        await wheelMessage.edit({
            files: [new AttachmentBuilder(rotatedBuffer, { name: 'roulette_wheel.png' })]
        }).catch(() => {});

        await new Promise(r => setTimeout(r, 100));
    }

    // تجهيز أزرار الإقصاء والتحكم
    let rows = [];
    let currentRow = new ActionRowBuilder();
    
    participants.forEach((p, index) => {
        if (currentRow.components.length >= 4) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
        }
        const displayName = p.displayName || p.username;
        currentRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`kick_${p.id}`)
                .setLabel(`${index + 1} - ${displayName.substring(0, 15)}`)
                .setStyle(ButtonStyle.Secondary)
        );
    });

    if (currentRow.components.length > 0) {
        rows.push(currentRow);
    }

    // زر العشوائي وزر الانسحاب في سطر منفصل ومستقل وبألوان رمادية متطابقة
    const bottomRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('kick_random')
            .setLabel('عشوائي')
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('r_leave_game')
            .setLabel('انسحاب')
            .setStyle(ButtonStyle.Secondary)
    );
    rows.push(bottomRow);

    await wheelMessage.edit({
        content: `<@!${targetPlayer.id}> , لديك **15 ثانية** لاختيار لاعب لطرده 🦵`,
        components: rows
    }).catch(() => {});

    const collector = wheelMessage.createMessageComponentCollector({ time: 15000 });

    collector.on('collect', async (interaction) => {
        const userId = interaction.user.id;
        
        if (userId !== targetPlayer.id && interaction.customId !== 'r_leave_game') {
            return interaction.reply({ content: 'ليس دورك لاختيار اللاعب!', ephemeral: true });
        }

        let kickedUser = null;

        if (interaction.customId === 'r_leave_game') {
            const index = participants.findIndex(p => p.id === userId);
            if (index !== -1) {
                kickedUser = participants[index];
                participants.splice(index, 1);
                collector.stop();
                await interaction.reply({ content: 'تم الانسحاب , ستتبدأ الجولة التالية خلال قليل ⏳', ephemeral: false });
            } else {
                return interaction.reply({ content: 'أنت لست مشاركاً في اللعبة.', ephemeral: true });
            }
        } else if (interaction.customId === 'kick_random') {
            let availableForRandom = participants.filter(p => p.id !== targetPlayer.id);
            if (availableForRandom.length === 0) availableForRandom = participants;
            kickedUser = availableForRandom[Math.floor(Math.random() * availableForRandom.length)];
            participants = participants.filter(p => p.id !== kickedUser.id);
            collector.stop();
            await interaction.reply({ content: `تم طرد <@!${kickedUser.id}> بشكل عشوائي , ستتبدأ الجولة التالية خلال قليل ⏳`, ephemeral: false });
        } else if (interaction.customId.startsWith('kick_')) {
            const kickedId = interaction.customId.replace('kick_', '');
            kickedUser = participants.find(p => p.id === kickedId);
            if (kickedUser) {
                participants = participants.filter(p => p.id !== kickedUser.id);
                collector.stop();
                await interaction.reply({ content: `تم طرد <@!${kickedUser.id}> , ستتبدأ الجولة التالية خلال قليل ⏳`, ephemeral: false });
            }
        }

        if (kickedUser) {
            setTimeout(() => {
                runRouletteRound(channel, guildId, channelId, participants);
            }, 1500);
        }
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time') {
            participants = participants.filter(p => p.id !== targetPlayer.id);
            channel.send(`تم طرد <@!${targetPlayer.id}> لعدم الاختيار , ستتبدأ الجولة التالية خلال قليل ⏳`);

            setTimeout(() => {
                runRouletteRound(channel, guildId, channelId, participants);
            }, 1500);
        }
    });
}

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running!');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});

client.login(process.env.TOKEN);
