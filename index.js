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

// متغيرات عامة لإدارة حالة الألعاب في السيرفرات
const activeGames = new Map(); // guildId -> { type, timeout, data }

// قائمة 80 دولة بأعلامها
const flagsList = [
    { name: "مصر", url: "https://flagcdn.com/w320/eg.png" },
    { name: "المغرب", url: "https://flagcdn.com/w320/ma.png" },
    { name: "السعودية", url: "https://flagcdn.com/w320/sa.png" },
    { name: "الامارات", url: "https://flagcdn.com/w320/ae.png" },
    { name: "فرنسا", url: "https://flagcdn.com/w320/fr.png" },
    { name: "المانيا", url: "https://flagcdn.com/w320/de.png" },
    { name: "اليابان", url: "https://flagcdn.com/w320/jp.png" },
    { name: "سنغافورة", url: "https://flagcdn.com/w320/sg.png" },
    { name: "الولايات المتحدة", url: "https://flagcdn.com/w320/us.png" },
    { name: "بريطانيا", url: "https://flagcdn.com/w320/gb.png" },
    { name: "ايطاليا", url: "https://flagcdn.com/w320/it.png" },
    { name: "اسبانيا", url: "https://flagcdn.com/w320/es.png" },
    { name: "تركيا", url: "https://flagcdn.com/w320/tr.png" },
    { name: "البرازيل", url: "https://flagcdn.com/w320/br.png" },
    { name: "الأرجنتين", url: "https://flagcdn.com/w320/ar.png" },
    { name: "كندا", url: "https://flagcdn.com/w320/ca.png" },
    { name: "استراليا", url: "https://flagcdn.com/w320/au.png" },
    { name: "الصين", url: "https://flagcdn.com/w320/cn.png" },
    { name: "كوريا الجنوبية", url: "https://flagcdn.com/w320/kr.png" },
    { name: "الهند", url: "https://flagcdn.com/w320/in.png" },
    { name: "روسيا", url: "https://flagcdn.com/w320/ru.png" },
    { name: "المكسيك", url: "https://flagcdn.com/w320/mx.png" },
    { name: "الكويت", url: "https://flagcdn.com/w320/kw.png" },
    { name: "قطر", url: "https://flagcdn.com/w320/qa.png" },
    { name: "البحرين", url: "https://flagcdn.com/w320/bh.png" },
    { name: "عمان", url: "https://flagcdn.com/w320/om.png" },
    { name: "الاردن", url: "https://flagcdn.com/w320/jo.png" },
    { name: "لبنان", url: "https://flagcdn.com/w320/lb.png" },
    { name: "العراق", url: "https://flagcdn.com/w320/iq.png" },
    { name: "سوريا", url: "https://flagcdn.com/w320/sy.png" },
    { name: "الجزائر", url: "https://flagcdn.com/w320/dz.png" },
    { name: "تونس", url: "https://flagcdn.com/w320/tn.png" },
    { name: "ليبيا", url: "https://flagcdn.com/w320/ly.png" },
    { name: "السودان", url: "https://flagcdn.com/w320/sd.png" },
    { name: "اليمن", url: "https://flagcdn.com/w320/ye.png" },
    { name: "فلسطين", url: "https://flagcdn.com/w320/ps.png" },
    { name: "الصومال", url: "https://flagcdn.com/w320/so.png" },
    { name: "موريتانيا", url: "https://flagcdn.com/w320/mr.png" },
    { name: "جيبوتي", url: "https://flagcdn.com/w320/dj.png" },
    { name: "جزر القمر", url: "https://flagcdn.com/w320/km.png" },
    { name: "باكستان", url: "https://flagcdn.com/w320/pk.png" },
    { name: "إيران", url: "https://flagcdn.com/w320/ir.png" },
    { name: "أفغانستان", url: "https://flagcdn.com/w320/af.png" },
    { name: "إندونيسيا", url: "https://flagcdn.com/w320/id.png" },
    { name: "ماليزيا", url: "https://flagcdn.com/w320/my.png" },
    { name: "بروناي", url: "https://flagcdn.com/w320/bn.png" },
    { name: "تايلاند", url: "https://flagcdn.com/w320/th.png" },
    { name: "فيتنام", url: "https://flagcdn.com/w320/vn.png" },
    { name: "الفلبين", url: "https://flagcdn.com/w320/ph.png" },
    { name: "بنغلاديش", url: "https://flagcdn.com/w320/bd.png" },
    { name: "السويد", url: "https://flagcdn.com/w320/se.png" },
    { name: "النرويج", url: "https://flagcdn.com/w320/no.png" },
    { name: "الدنمارك", url: "https://flagcdn.com/w320/dk.png" },
    { name: "فنلندا", url: "https://flagcdn.com/w320/fi.png" },
    { name: "آيسلندا", url: "https://flagcdn.com/w320/is.png" },
    { name: "هولندا", url: "https://flagcdn.com/w320/nl.png" },
    { name: "بلجيكا", url: "https://flagcdn.com/w320/be.png" },
    { name: "سويسرا", url: "https://flagcdn.com/w320/ch.png" },
    { name: "النمسا", url: "https://flagcdn.com/w320/at.png" },
    { name: "البرتغال", url: "https://flagcdn.com/w320/pt.png" },
    { name: "اليونان", url: "https://flagcdn.com/w320/gr.png" },
    { name: "بولندا", url: "https://flagcdn.com/w320/pl.png" },
    { name: "اوكرانيا", url: "https://flagcdn.com/w320/ua.png" },
    { name: "رومانيا", url: "https://flagcdn.com/w320/ro.png" },
    { name: "المجر", url: "https://flagcdn.com/w320/hu.png" },
    { name: "التشيك", url: "https://flagcdn.com/w320/cz.png" },
    { name: "ايرلندا", url: "https://flagcdn.com/w320/ie.png" },
    { name: "نيوزيلندا", url: "https://flagcdn.com/w320/nz.png" },
    { name: "جنوب افريقيا", url: "https://flagcdn.com/w320/za.png" },
    { name: "نيجيريا", url: "https://flagcdn.com/w320/ng.png" },
    { name: "كينيا", url: "https://flagcdn.com/w320/ke.png" },
    { name: "اثيوبيا", url: "https://flagcdn.com/w320/et.png" },
    { name: "غانا", url: "https://flagcdn.com/w320/gh.png" },
    { name: "الكاميرون", url: "https://flagcdn.com/w320/cm.png" },
    { name: "السنغال", url: "https://flagcdn.com/w320/sn.png" },
    { name: "كولومبيا", url: "https://flagcdn.com/w320/co.png" },
    { name: "تشيلي", url: "https://flagcdn.com/w320/cl.png" },
    { name: "بيرو", url: "https://flagcdn.com/w320/pe.png" },
    { name: "فنزويلا", url: "https://flagcdn.com/w320/ve.png" },
    { name: "كوبا", url: "https://flagcdn.com/w320/cu.png" }
];

// قائمة أكثر من 300 كلمة لعبه أسرع
const fastWords = [
    "جريش", "منسف", "كبسة", "صيادية", "مقاليب", "تكتوكة", "مفطح", "مطازيز", "حنيني", "تشريبة",
    "سليق", "مرقوق", "قرصان", "محلى", "عصيدة", "هريس", "مثلوثة", "مفاليس", "مضبي", "حنيذ",
    "فلافل", "فول", "تميس", "شكشوكة", "مطبق", "مصبوبة", "حمص", "متبل", "تبولة", "فتوش",
    "مسخن", "منقوشة", "صفيحة", "كبسة لحم", "كبسة دجاج", "سمك", "روبيان", "استاكوزا", "جريش ابيض", "مرقة",
    "تفاح", "موز", "برتقال", "توت", "فراولة", "مانجو", "اناناس", "بطيخ", "شمام", "عنب",
    "خوخ", "مشمش", "رمان", "كمثري", "كيوي", "جوافة", "تين", "تمر", "رطب", "عجوة",
    "خيار", "طماطم", "خس", "جزر", "بطاطس", "بصل", "ثوم", "فلفل", "بقدونس", "كزبرة",
    "جمل", "ناقة", "حصان", "خيل", "فهد", "نمر", "أسد", "ذيب", "ثعلب", "ارنب",
    "قرد", "دب", "فيل", "زرافة", "حمار", "بقرة", "خروف", "تيس", "مازة", "دجاجة",
    "بطة", "وزة", "حمامة", "عصفور", "صقر", "بازي", "نسر", "بومة", "غراب", "نعامة",
    "تمساح", "ثعبان", "حرباء", "ضفدع", "سلحفاة", "سمكة", "قرش", "حوت", "دلفين", "اخطبوط",
    "قلم", "كتاب", "دفتر", "ممحاة", "مسطرة", "حقيبة", "طاولة", "كرسي", "باب", "نافذة",
    "ساعة", "هاتف", "حاسوب", "شاشة", "لوحة", "مفتاح", "سيارة", "طائرة", "قطار", "سفينة",
    "دراجة", "شارع", "طريق", "جبل", "نهر", "بحر", "محيط", "سماء", "قمر", "شمس",
    "نجوم", "سحاب", "مطر", "برق", "رعد", "ريح", "ثلج", "رمل", "صخر", "تراب",
    "بيت", "غرفة", "مطبخ", "حمام", "صالة", "سرور", "فرح", "سعادة", "نجاح", "تفوق",
    "برمجية", "كود", "بايثون", "جافاسكريبت", "روبلوكس", "ديسكورد", "سيرفر", "قناة", "رول", "عضو",
    "فستان", "ثوب", "غترة", "عقال", "شماغ", "حذاء", "جورب", "سوار", "خاتم", "سلسلة",
    "مكتب", "شركة", "متجر", "سوق", "بضاعة", "فلوس", "رصيد", "بنك", "عملة", "سهم",
    "رياضة", "كرة", "ملعب", "حكم", "لاعب", "مدرب", "فوز", "هزيمة", "تعادل", "دوري",
    "جمال", "وسامة", "ذكاء", "سرعة", "قوة", "شجاعة", "صبر", "امل", "حلم", "هدف",
    "طبيب", "مهندس", "معلم", "طالب", "شرطي", "جندي", "طيار", "حارس", "كاتب", "شاعر",
    "مسجد", "صلاة", "صيام", "زكاة", "حج", "قرآن", "سنة", "حديث", "دعاء", "استغفار",
    "شتاء", "صيف", "ربيع", "خريف", "فصل", "شهر", "يوم", "ساعة", "دقيقة", "ثانية"
];

// دالة لتنظيف النصوص
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

    // أمر إيقاف اللعبة
    if (content === 'إيقاف') {
        if (!activeGames.has(guildId)) {
            return message.reply('لا توجد أي لعبة تعمل حالياً لإيقافها.');
        }
        const game = activeGames.get(guildId);
        if (game.timeout) clearTimeout(game.timeout);
        activeGames.delete(guildId);
        return message.reply('تم إيقاف اللعبة الحالية بنجاح.');
    }

    // لعبة الأعلام
    if (content === 'أعلام' || content === 'اعلام') {
        if (activeGames.has(guildId)) {
            return message.reply('توجد لعبة تنلعب الحين، استخدم "إيقاف" أولاً.');
        }

        const randomFlag = flagsList[Math.floor(Math.random() * flagsList.length)];
        activeGames.set(guildId, { type: 'flag', answer: randomFlag.name });

        const flagEmbed = new EmbedBuilder()
            .setColor(0x2f3136)
            .setDescription(`**ما هو علم هذه الدولة؟ (معك 15 ثانية)**`)
            .setImage(randomFlag.url);

        await message.channel.send({
            embeds: [flagEmbed]
        });

        const filter = (m) => !m.author.bot;
        const collector = message.channel.createMessageCollector({ filter, time: 15000 });

        collector.on('collect', (m) => {
            if (normalizeText(m.content) === normalizeText(randomFlag.name)) {
                if (activeGames.has(guildId)) {
                    activeGames.delete(guildId);
                }
                collector.stop('won');
                m.reply(`الفائز: <@${m.author.id}>`);
            } else {
                // إذا كتب أمر خاطئ أثناء اللعبة
                if (m.content === 'نرد' || m.content === 'روليت' || m.content === 'أسرع' || m.content === 'اسرع') {
                    m.reply('في لعبة النرد مو كذا');
                }
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason !== 'won' && activeGames.has(guildId)) {
                activeGames.delete(guildId);
                message.channel.send('انتهى الوقت');
            }
        });
        return;
    }

    // لعبة أسرع
    if (content === 'أسرع' || content === 'اسرع') {
        if (activeGames.has(guildId)) {
            return message.reply('فيه لعبة تنلعب الحين.');
        }

        const randomWord = fastWords[Math.floor(Math.random() * fastWords.length)];
        activeGames.set(guildId, { type: 'fast', answer: randomWord });

        const fastEmbed = new EmbedBuilder()
            .setColor(0x2f3136)
            .setDescription(`أسرع: **${randomWord}**`);

        await message.channel.send({ embeds: [fastEmbed] });

        const filter = (m) => !m.author.bot;
        const collector = message.channel.createMessageCollector({ filter, time: 15000 });

        collector.on('collect', (m) => {
            if (normalizeText(m.content) === normalizeText(randomWord)) {
                if (activeGames.has(guildId)) {
                    activeGames.delete(guildId);
                }
                collector.stop('won');
                m.reply(`الفائز: <@${m.author.id}>`);
            } else {
                if (m.content === 'نرد' || m.content === 'روليت' || m.content === 'أعلام' || m.content === 'اعلام') {
                    m.reply('في لعبة النرد مو كذا');
                }
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason !== 'won' && activeGames.has(guildId)) {
                activeGames.delete(guildId);
                message.channel.send('انتهى الوقت');
            }
        });
        return;
    }

    // لعبة الروليت
    if (content === 'روليت') {
        if (activeGames.has(guildId)) {
            return message.reply('فيه لعبة تنلعب الحين.');
        }

        let participants = [];
        const maxPlayers = 20;
        const minPlayers = 3;

        const getRouletteEmbed = (count) => {
            return new EmbedBuilder()
                .setDescription(`${count}/${maxPlayers}`)
                .setColor(0x2f3136);
        };

        const joinButton = new ButtonBuilder()
            .setCustomId('roulette_join')
            .setLabel('انضمام')
            .setStyle(ButtonStyle.Secondary); // لون موحد هادئ

        const leaveButton = new ButtonBuilder()
            .setCustomId('roulette_leave')
            .setLabel('انسحاب')
            .setStyle(ButtonStyle.Secondary); // لون موحد هادئ

        const row = new ActionRowBuilder().addComponents(joinButton, leaveButton);

        const rouletteMessage = await message.channel.send({
            embeds: [getRouletteEmbed(0)],
            components: [row]
        });

        activeGames.set(guildId, { type: 'roulette', participants, message: rouletteMessage });

        const collector = rouletteMessage.createMessageComponentCollector({ time: 60000 });

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
                return message.channel.send('العدد غير مكتمل ويوقف اللعبة.');
            }

            let currentTurnIndex = 0;

            const runRouletteTurn = async () => {
                if (participants.length <= 1) {
                    const winnerId = participants[0];
                    const winnerUser = await client.users.fetch(winnerId);
                    activeGames.delete(guildId);

                    return message.channel.send({
                        content: `الفائز هو: ${winnerUser.username}\n${winnerUser.displayAvatarURL({ extension: 'png', size: 256 })}`
                    });
                }

                const targetedUserId = participants[currentTurnIndex % participants.length];
                const targetedUser = await client.users.fetch(targetedUserId);

                const targetRow = new ActionRowBuilder();
                participants.forEach(id => {
                    client.users.fetch(id).then(u => {
                        targetRow.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`kick_${id}`)
                                .setLabel(u.username.substring(0, 20))
                                .setStyle(ButtonStyle.Secondary)
                        );
                    });
                });

                targetRow.addComponents(
                    new ButtonBuilder()
                        .setCustomId('kick_random')
                        .setLabel('عشوائي')
                        .setStyle(ButtonStyle.Secondary)
                );

                const turnMsg = await message.channel.send({
                    content: `دور اللاعب: <@${targetedUserId}>\nاختر شخصاً لطرده أو اختر عشوائي:`,
                    components: [targetRow]
                });

                const turnCollector = turnMsg.createMessageComponentCollector({ time: 30000 });

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
                    await i.update({ content: `تم طرد الشخص <@${kickedId}>`, components: [] });
                    turnCollector.stop();
                    setTimeout(runRouletteTurn, 2000);
                });

                turnCollector.on('end', (collected, reason) => {
                    if (reason === 'time') {
                        const remaining = participants.filter(id => id !== targetedUserId);
                        const kickedId = remaining[Math.floor(Math.random() * remaining.length)];
                        participants = participants.filter(id => id !== kickedId);
                        message.channel.send(`انتهى الوقت، تم طرد <@${kickedId}> تلقائياً.`);
                        setTimeout(runRouletteTurn, 2000);
                    }
                });

                currentTurnIndex++;
            };

            runRouletteTurn();
        });
        return;
    }

    // الرد عند كتابة أي أمر خاطئ في الألعاب أو غيرها
    if (content === 'نرد' || content.startsWith('نرد')) {
        return message.reply('في لعبة النرد مو كذا');
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
