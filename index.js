const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    AttachmentBuilder 
} = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// متغيرات عامة لإدارة حالة الألعاب والسيرفرات والقنوات لمنع التكرار جذرياً
const activeGames = new Map();
const activeChannels = new Set(); // حماية جذرية لمنع إرسال الألعاب مرتين في نفس القناة

// قائمة الأعلام مع أسمائها المقبولة
const flagsList = [
    { name: "مصر", url: "https://flagcdn.com/w320/eg.png" },
    { name: "المغرب", url: "https://flagcdn.com/w320/ma.png" },
    { name: "السعودية", url: "https://flagcdn.com/w320/sa.png" },
    { name: "الامارات", url: "https://flagcdn.com/w320/ae.png" },
    { name: "فرنسا", url: "https://flagcdn.com/w320/fr.png" },
    { name: "المانيا", url: "https://flagcdn.com/w320/de.png" },
    { name: "اليابان", url: "https://flagcdn.com/w320/jp.png" },
    { name: "سنغافورة", url: "https://flagcdn.com/w320/sg.png" }
];

// قائمة كلمات لعبة أسرع
const fastWords = [
    "تفاحة", "سفينة", "طائرة", "سيارة", "قلم", "كتاب", "حاسوب", "هاتف", "طاولة", "كرسي",
    "شباك", "باب", "شمس", "قمر", "نجمة", "سحاب", "مطر", "بحر", "نهر", "جبل",
    "حائط", "ساعة", "مصباح", "حقيبة", "مفتاح", "وردة", "شجرة", "عصفور", "قطة", "كلب",
    "حصان", "جمل", "أسد", "فهد", "ذئب", "ثعلب", "قرد", "دب", "فيل", "زرافة",
    "بطريق", "نسر", "صقر", "حمامة", "دجاجة", "بقرة", "خروف", "معزة", "سمكة", "قرش",
    "حوت", "سلحفاة", "تمساح", "ثعبان", "ضفدع", "فراشة", "نحلة", "نملة", "عنكبوت", "ذبابة",
    "طماطم", "خيار", "بطاطس", "بصل", "ثوم", "جزر", "خس", "بقدونس", "موز", "برتقال",
    "تفاح", "عنب", "توت", "فراولة", "مانجو", "اناناس", "بطيخ", "شمام", "رمان", "كيوي",
    "حليب", "جبن", "زبدة", "عسل", "سكر", "ملح", "بهارات", "قهوة", "شاي", "ماء",
    "حذاء", "قميص", "بنطلون", "قبعة", "نظارة", "حزام", "معطف", "خاتم", "سوار", "عقد",
    "مسجد", "مدرسة", "مستشفى", "ملعب", "حديقة", "شارع", "مدينة", "قرية", "دولة", "عالم",
    "قارب", "قطار", "صواريخ", "فضاء", "كوكب", "مجرة", "ليل", "نهار", "صيف",
    "شتاء", "ربيع", "خريف", "رياح", "عاصفة", "برق", "رعد", "ثلوج", "جليد", "رمال",
    "صخر", "تراب", "سقف", "أرض", "غرفة", "مطبخ", "حمام", "صالة", "مكتب", "متجر",
    "سوق", "مصنع", "شركة", "بنك", "مطار", "ميناء", "محطة", "طريق", "جسر", "برج",
    "قلعة", "قصر", "متحف", "مسرح", "سينما", "كرة", "هدف", "حارس", "مدرب",
    "فريق", "لاعب", "سباق", "سرعة", "فوز", "جائزة", "وسام", "درع", "تاج", "عرش",
    "ملك", "أمير", "وزير", "قاضي", "طبيب", "مهندس", "معلم", "طالب", "عامل", "تاجر",
    "فنان", "كاتب", "شاعر", "رسام", "مغامرة", "قصة", "رواية", "لعبة", "سؤال", "جواب",
    "فكرة", "رأي", "صوت", "صورة", "لون", "أحمر", "أزرق", "أخضر", "أصفر", "أسود",
    "أبيض", "برتقالي", "بنفسجي", "وردي", "رمادي", "بني", "ذهبي", "فضي", "حديد", "نحاس",
    "ذهب", "فضة", "ألماس", "ياقوت", "مرجان", "لؤلؤ", "صدف", "موج", "شاطئ", "ميدان",
    "جريش", "منسف", "كبسة", "صيادية", "مقاليب", "تكتوكة", "مفطح", "مطازيز", "حنيني", "تشريبة"
];

// دالة تنظيف النصوص
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

client.once('ready', () => {
    console.log(`تم تسجيل الدخول بنجاح باسم ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const content = message.content.trim();
    const guildId = message.guild.id;
    const channelId = message.channel.id;

    // أمر إيقاف اللعبة
    if (content === 'إيقاف') {
        if (!activeGames.has(guildId)) {
            return message.reply('لا توجد أي لعبة تعمل حالياً لإيقافها.');
        }
        const game = activeGames.get(guildId);
        if (game.timeout) clearTimeout(game.timeout);
        activeGames.delete(guildId);
        activeChannels.delete(channelId);
        return message.reply('تم إيقاف اللعبة الحالية بنجاح.');
    }

    // لعبة الأعلام (مع منع التدبيل نهائياً وجعل الصورة مع العلم بالجانب الأيمن عبر الـ Thumbnail أو الشكل المطلوب)
    if (content === 'أعلام' || content === 'اعلام') {
        if (activeGames.has(guildId) || activeChannels.has(channelId)) {
            return message.reply('توجد لعبة تنلعب الحين، استخدم "إيقاف" أولاً.');
        }

        activeChannels.add(channelId);

        const randomFlag = flagsList[Math.floor(Math.random() * flagsList.length)];
        activeGames.set(guildId, { type: 'flag', answer: randomFlag.name });

        // جعل العلم يظهر كصورة رئيسية أو مصغرة باليمين حسب الطلب والتصميم الاحترافي
        const flagEmbed = new EmbedBuilder()
            .setThumbnail(randomFlag.url) // جعل العلم يظهر على الجانب الأيمن داخل الإيمبد
            .setImage('https://cdn.discordapp.com/attachments/1537200039276056717/1537730891084857344/Fate.png') // الصورة المطلوبة بالأساس
            .setColor(0x2f3136);

        await message.channel.send({ embeds: [flagEmbed] });

        const filter = (m) => !m.author.bot;
        const collector = message.channel.createMessageCollector({ filter, time: 15000 });

        collector.on('collect', (m) => {
            if (normalizeText(m.content) === normalizeText(randomFlag.name)) {
                if (activeGames.has(guildId)) {
                    activeGames.delete(guildId);
                }
                activeChannels.delete(channelId);
                collector.stop('won');
                m.reply(`الفائز: <@${m.author.id}>`);
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason !== 'won' && activeGames.has(guildId)) {
                activeGames.delete(guildId);
                activeChannels.delete(channelId);
                message.channel.send('انتهى الوقت');
            }
        });
    }

    // لعبة أسرع
    if (content === 'أسرع' || content === 'اسرع') {
        if (activeGames.has(guildId) || activeChannels.has(channelId)) {
            return message.reply('فيه لعبة تنلعب الحين.');
        }

        activeChannels.add(channelId);
        const randomWord = fastWords[Math.floor(Math.random() * fastWords.length)];
        activeGames.set(guildId, { type: 'fast', answer: randomWord });

        const attachment = message.attachments.first();
        if (attachment) {
            const file = new AttachmentBuilder(attachment.url);
            await message.channel.send({ content: `أسرع: **${randomWord}**`, files: [file] });
        } else {
            await message.channel.send({ content: `أسرع: **${randomWord}**` });
        }

        const filter = (m) => !m.author.bot;
        const collector = message.channel.createMessageCollector({ filter, time: 15000 });

        collector.on('collect', (m) => {
            if (normalizeText(m.content) === normalizeText(randomWord)) {
                if (activeGames.has(guildId)) {
                    activeGames.delete(guildId);
                }
                activeChannels.delete(channelId);
                collector.stop('won');
                m.reply(`الفائز: <@${m.author.id}>`);
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason !== 'won' && activeGames.has(guildId)) {
                activeGames.delete(guildId);
                activeChannels.delete(channelId);
                message.channel.send('انتهى الوقت');
            }
        });
    }

    // لعبة الروليت
    if (content === 'روليت') {
        if (activeGames.has(guildId) || activeChannels.has(channelId)) {
            return message.reply('فيه لعبة تنلعب الحين.');
        }

        activeChannels.add(channelId);
        let participants = [];
        const maxPlayers = 20;
        const minPlayers = 1;

        const getRouletteEmbed = (count) => {
            return new EmbedBuilder()
                .setDescription(`0/${maxPlayers}\nالعدد الحالي: ${count}`)
                .setColor(0x2f3136);
        };

        const joinButton = new ButtonBuilder()
            .setCustomId('roulette_join')
            .setLabel('انضمام')
            .setStyle(ButtonStyle.Primary);

        const leaveButton = new ButtonBuilder()
            .setCustomId('roulette_leave')
            .setLabel('انسحاب')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(joinButton, leaveButton);

        const rouletteMessage = await message.channel.send({
            content: `روليت`,
            embeds: [getRouletteEmbed(0)],
            components: [row]
        });

        activeGames.set(guildId, { type: 'roulette', participants, message: rouletteMessage });

        const collector = rouletteMessage.createMessageComponentCollector({ time: 30000 });

        collector.on('collect', async (interaction) => {
            const userId = interaction.user.id;

            if (interaction.customId === 'roulette_join') {
                if (participants.includes(userId)) {
                    return interaction.reply({ content: 'أنت بالفعل منضم للعبة.', ephemeral: true });
                }
                participants.push(userId);
                await interaction.reply({ content: 'تم الانضمام', ephemeral: true });
                await interaction.message.edit({ embeds: [getRouletteEmbed(participants.length)] });
            } 
            else if (interaction.customId === 'roulette_leave') {
                if (!participants.includes(userId)) {
                    return interaction.reply({ content: 'أنت بالفعل خارج اللعبة.', ephemeral: true });
                }
                participants = participants.filter(id => id !== userId);
                await interaction.reply({ content: 'تم الانسحاب', ephemeral: true });
                await interaction.message.edit({ embeds: [getRouletteEmbed(participants.length)] });
            }
        });

        collector.on('end', async () => {
            if (participants.length < minPlayers) {
                activeGames.delete(guildId);
                activeChannels.delete(channelId);
                return message.channel.send('العدد غير مكتمل و تم إيقاف اللعبة.');
            }

            let currentTurnIndex = 0;

            const runRouletteTurn = async () => {
                if (participants.length <= 1) {
                    const winnerId = participants[0];
                    const winnerUser = await client.users.fetch(winnerId);
                    activeGames.delete(guildId);
                    activeChannels.delete(channelId);

                    return message.channel.send({
                        content: `الفائز: <@${winnerUser.id}>\n${winnerUser.displayAvatarURL({ extension: 'png', size: 256 })}`
                    });
                }

                const targetedUserId = participants[currentTurnIndex % participants.length];

                const targetRow = new ActionRowBuilder();
                for (const id of participants) {
                    const u = await client.users.fetch(id);
                    targetRow.addComponents(
                        new ButtonBuilder()
                            .setCustomId(`kick_${id}`)
                            .setLabel(u.username.substring(0, 20))
                            .setStyle(ButtonStyle.Secondary)
                    );
                }

                targetRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId('kick_random')
                        .setLabel('عشوائي')
                        .setStyle(ButtonStyle.Success)
                );

                const turnMsg = await message.channel.send({
                    content: `دور اللاعب: <@${targetedUserId}>\nاختر شخصاً لطرده أو اختر عشوائي:`,
                    components: [targetRow]
                });

                const turnCollector = turnMsg.createMessageComponentCollector({ time: 20000 });

                turnCollector.on('collect', async (i) => {
                    if (i.user.id !== targetedUserId) {
                        return i.reply({ content: 'هذا مو دورك', ephemeral: true });
                    }

                    let kickedId;
                    if (i.customId === 'kick_random') {
                        const remaining = participants.filter(id => id !== targetedUserId);
                        kickedId = remaining[Math.floor(Math.random() * remaining.length)];
                    } else {
                        kickedId = i.customId.replace('kick_', '');
                    }

                    participants = participants.filter(id => id !== kickedId);
                    await i.update({ content: `تم طرد <@${kickedId}>`, components: [] });
                    turnCollector.stop();
                    setTimeout(runRouletteTurn, 1500);
                });

                turnCollector.on('end', (collected, reason) => {
                    if (reason === 'time') {
                        const remaining = participants.filter(id => id !== targetedUserId);
                        const kickedId = remaining[Math.floor(Math.random() * remaining.length)];
                        participants = participants.filter(id => id !== kickedId);
                        message.channel.send(`انتهى الوقت، تم طرد <@${kickedId}> تلقائياً.`);
                        setTimeout(runRouletteTurn, 1500);
                    }
                });

                currentTurnIndex++;
            };

            runRouletteTurn();
        });
    }

    // أمر فائز مباشر
    if (content.startsWith('!فائز')) {
        const user = message.mentions.users.first();
        if (user) {
            await message.channel.send(`الفائز: ${user}`);
        } else {
            await message.channel.send("يرجى ذكر الفائز.");
        }
    }
});

// خادم الويب لمنصة Render
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
