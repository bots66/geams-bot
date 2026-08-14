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

// متغيرات عامة لإدارة حالة الألعاب والقنوات لمنع التكرار
const activeGames = new Map();
const activeChannels = new Set();

// روابط الصور المطلوبة
const FLAG_IMAGE_URL = "https://cdn.discordapp.com/attachments/1537200039276056717/1537730891084857344/Fate.png";
const FAST_IMAGE_URL = "https://cdn.discordapp.com/attachments/1537200039276056717/1537740104926498896/Fate.png";

// قائمة الأعلام (متغيرة لكل لعبة)
const flagsList = [
    { name: "مصر", url: "https://flagcdn.com/w320/eg.png" },
    { name: "المغرب", url: "https://flagcdn.com/w320/ma.png" },
    { name: "السعودية", url: "https://flagcdn.com/w320/sa.png" },
    { name: "الامارات", url: "https://flagcdn.com/w320/ae.png" },
    { name: "فرنسا", url: "https://flagcdn.com/w320/fr.png" },
    { name: "المانيا", url: "https://flagcdn.com/w320/de.png" },
    { name: "اليابان", url: "https://flagcdn.com/w320/jp.png" },
    { name: "سنغافورة", url: "https://flagcdn.com/w320/sg.png" },
    { name: "الكويت", url: "https://flagcdn.com/w320/kw.png" },
    { name: "قطر", url: "https://flagcdn.com/w320/qa.png" },
    { name: "البحرين", url: "https://flagcdn.com/w320/bh.png" },
    { name: "عمان", url: "https://flagcdn.com/w320/om.png" },
    { name: "الاردن", url: "https://flagcdn.com/w320/jo.png" },
    { name: "فلسطين", url: "https://flagcdn.com/w320/ps.png" },
    { name: "لبنان", url: "https://flagcdn.com/w320/lb.png" },
    { name: "سوريا", url: "https://flagcdn.com/w320/sy.png" },
    { name: "العراق", url: "https://flagcdn.com/w320/iq.png" },
    { name: "اليمن", url: "https://flagcdn.com/w320/ye.png" },
    { name: "السودان", url: "https://flagcdn.com/w320/sd.png" },
    { name: "ليبيا", url: "https://flagcdn.com/w320/ly.png" },
    { name: "تونس", url: "https://flagcdn.com/w320/tn.png" },
    { name: "الجزائر", url: "https://flagcdn.com/w320/dz.png" },
    { name: "موريتانيا", url: "https://flagcdn.com/w320/mr.png" },
    { name: "الصومال", url: "https://flagcdn.com/w320/so.png" },
    { name: "جيبوتي", url: "https://flagcdn.com/w320/dj.png" },
    { name: "جزر القمر", url: "https://flagcdn.com/w320/km.png" },
    { name: "امريكا", url: "https://flagcdn.com/w320/us.png" },
    { name: "بريطانيا", url: "https://flagcdn.com/w320/gb.png" },
    { name: "كندا", url: "https://flagcdn.com/w320/ca.png" },
    { name: "ايطاليا", url: "https://flagcdn.com/w320/it.png" },
    { name: "اسبانيا", url: "https://flagcdn.com/w320/es.png" },
    { name: "تركيا", url: "https://flagcdn.com/w320/tr.png" },
    { name: "ايران", url: "https://flagcdn.com/w320/ir.png" },
    { name: "الهند", url: "https://flagcdn.com/w320/in.png" },
    { name: "باكستان", url: "https://flagcdn.com/w320/pk.png" },
    { name: "الصين", url: "https://flagcdn.com/w320/cn.png" },
    { name: "كوريا الجنوبية", url: "https://flagcdn.com/w320/kr.png" },
    { name: "كوريا الشمالية", url: "https://flagcdn.com/w320/kp.png" },
    { name: "اندونيسيا", url: "https://flagcdn.com/w320/id.png" },
    { name: "ماليزيا", url: "https://flagcdn.com/w320/my.png" },
    { name: "تايلاند", url: "https://flagcdn.com/w320/th.png" },
    { name: "فيتنام", url: "https://flagcdn.com/w320/vn.png" },
    { name: "الفلبين", url: "https://flagcdn.com/w320/ph.png" },
    { name: "استراليا", url: "https://flagcdn.com/w320/au.png" },
    { name: "نيوزيلندا", url: "https://flagcdn.com/w320/nz.png" },
    { name: "البرازيل", url: "https://flagcdn.com/w320/br.png" },
    { name: "الارجنتين", url: "https://flagcdn.com/w320/ar.png" },
    { name: "المكسيك", url: "https://flagcdn.com/w320/mx.png" },
    { name: "كولومبيا", url: "https://flagcdn.com/w320/co.png" },
    { name: "تشيلي", url: "https://flagcdn.com/w320/cl.png" },
    { name: "بيرو", url: "https://flagcdn.com/w320/pe.png" },
    { name: "فنزويلا", url: "https://flagcdn.com/w320/ve.png" },
    { name: "جنوب افريقيا", url: "https://flagcdn.com/w320/za.png" },
    { name: "نيجيريا", url: "https://flagcdn.com/w320/ng.png" },
    { name: "كينيا", url: "https://flagcdn.com/w320/ke.png" },
    { name: "اثيوبيا", url: "https://flagcdn.com/w320/et.png" },
    { name: "غانا", url: "https://flagcdn.com/w320/gh.png" },
    { name: "السويد", url: "https://flagcdn.com/w320/se.png" },
    { name: "النرويج", url: "https://flagcdn.com/w320/no.png" },
    { name: "فنلندا", url: "https://flagcdn.com/w320/fi.png" },
    { name: "الدنمارك", url: "https://flagcdn.com/w320/dk.png" },
    { name: "ايسلندا", url: "https://flagcdn.com/w320/is.png" },
    { name: "هولندا", url: "https://flagcdn.com/w320/nl.png" },
    { name: "بلجيكا", url: "https://flagcdn.com/w320/be.png" },
    { name: "سويسرا", url: "https://flagcdn.com/w320/ch.png" },
    { name: "النمسا", url: "https://flagcdn.com/w320/at.png" },
    { name: "اليونان", url: "https://flagcdn.com/w320/gr.png" },
    { name: "البرتغال", url: "https://flagcdn.com/w320/pt.png" },
    { name: "بولندا", url: "https://flagcdn.com/w320/pl.png" },
    { name: "اوكرانيا", url: "https://flagcdn.com/w320/ua.png" },
    { name: "روسيا", url: "https://flagcdn.com/w320/ru.png" },
    { name: "التشيك", url: "https://flagcdn.com/w320/cz.png" },
    { name: "المجر", url: "https://flagcdn.com/w320/hu.png" },
    { name: "رومانيا", url: "https://flagcdn.com/w320/ro.png" },
    { name: "بلغاريا", url: "https://flagcdn.com/w320/bg.png" },
    { name: "كرواتيا", url: "https://flagcdn.com/w320/hr.png" },
    { name: "صربيا", url: "https://flagcdn.com/w320/rs.png" },
    { name: "ايرلندا", url: "https://flagcdn.com/w320/ie.png" },
    { name: "كوبا", url: "https://flagcdn.com/w320/cu.png" },
    { name: "بنما", url: "https://flagcdn.com/w320/pa.png" }
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

// دالة تنظيف النصوص لتسهيل الإجابة بدون همزات أو تاء مربوطة
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
        if (game.collector) game.collector.stop();
        activeGames.delete(guildId);
        activeChannels.delete(channelId);
        return message.reply('تم إيقاف اللعبة.');
    }

    // لعبة الأعلام
    if (content === 'أعلام' || content === 'اعلام') {
        if (activeGames.has(guildId) || activeChannels.has(channelId)) {
            return message.reply('توجد لعبة تنلعب الحين، استخدم "إيقاف" أولاً.');
        }

        activeChannels.add(channelId);

        // اختيار علم عشوائي من القائمة
        const randomFlag = flagsList[Math.floor(Math.random() * flagsList.length)];

        // إرسال رابط الصورة المطلوبة كرسالة أولى
        await message.channel.send(FLAG_IMAGE_URL);

        // إرسال إيمبد يكتب "علم أي دولة ؟" مع العلم المتغير في اليمين
        const flagEmbed = new EmbedBuilder()
            .setTitle("علم أي دولة ؟")
            .setThumbnail(randomFlag.url)
            .setColor(0x2f3136);

        await message.channel.send({ embeds: [flagEmbed] });

        activeGames.set(guildId, { type: 'flag', answer: randomFlag.name });

        const filter = (m) => !m.author.bot;
        const collector = message.channel.createMessageCollector({ filter, time: 15000 });
        activeGames.get(guildId).collector = collector;

        collector.on('collect', (m) => {
            if (normalizeText(m.content) === normalizeText(randomFlag.name)) {
                if (activeGames.has(guildId)) {
                    activeGames.delete(guildId);
                }
                activeChannels.delete(channelId);
                collector.stop('won');
                // الفائز ومنشنه فقط بدون أي إضافات أو فواصل
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
    }

    // لعبة أسرع
    if (content === 'أسرع' || content === 'اسرع') {
        if (activeGames.has(guildId) || activeChannels.has(channelId)) {
            return message.reply('فيه لعبة تنلعب الحين.');
        }

        activeChannels.add(channelId);
        const randomWord = fastWords[Math.floor(Math.random() * fastWords.length)];
        activeGames.set(guildId, { type: 'fast', answer: randomWord });

        // إرسال رابط صورة أسرع المحددة
        await message.channel.send(FAST_IMAGE_URL);

        // إرسال الكلمة العشوائية من الـ 300 كلمة في النص
        await message.channel.send(`أسرع: **${randomWord}**`);

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
                // الفائز ومنشنه فقط بدون أي إضافات
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
                        content: `<@${winnerUser.id}>\n${winnerUser.displayAvatarURL({ extension: 'png', size: 256 })}`
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
            await message.channel.send(`${user}`);
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
