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

// قائمة الأعلام مع أسمائها المقبولة (بدون همزات وبدون أل التعريف)
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
    "جريش", "منسف", "كبسة", "صيادية", "مقاليب", 
    "تكتوكة", "مفطح", "مطازيز", "حنيني", "تشريبة"
];

// دالة لتنظيف النصوص (إزالة الهمزات وأل التعريف للمقارنة المرنة)
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

        await message.channel.send({
            content: `**ما هو علم هذه الدولة؟ (معك 15 ثانية)**\n${randomFlag.url}`
        });

        const filter = (m) => !m.author.bot;
        const collector = message.channel.createMessageCollector({ filter, time: 15000 });

        collector.on('collect', (m) => {
            if (normalizeText(m.content) === normalizeText(randomFlag.name)) {
                if (activeGames.has(guildId)) {
                    clearTimeout(activeGames.get(guildId).timeout);
                    activeGames.delete(guildId);
                }
                collector.stop('won');
                m.reply(`الفائز: <@${m.author.id}>`);
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason !== 'won' && activeGames.has(guildId)) {
                activeGames.delete(guildId);
                message.channel.send('انتهى الوقت');
            }
        });
    }

    // لعبة أسرع
    if (content === 'أسرع' || content === 'اسرع') {
        if (activeGames.has(guildId)) {
            return message.reply('فيه لعبة تنلعب الحين.');
        }

        const randomWord = fastWords[Math.floor(Math.random() * fastWords.length)];
        activeGames.set(guildId, { type: 'fast', answer: randomWord });

        await message.channel.send({ content: `أسرع: **${randomWord}**` });

        const filter = (m) => !m.author.bot;
        const collector = message.channel.createMessageCollector({ filter, time: 15000 });

        collector.on('collect', (m) => {
            if (normalizeText(m.content) === normalizeText(randomWord)) {
                if (activeGames.has(guildId)) {
                    activeGames.delete(guildId);
                }
                collector.stop('won');
                m.reply(`الفائز: <@${m.author.id}>`);
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason !== 'won' && activeGames.has(guildId)) {
                activeGames.delete(guildId);
                message.channel.send('انتهى الوقت');
            }
        });
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
            content: `روليت - يمنشن هيديل بوت`,
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

            // بدء جولات الطرد والإقصاء بالروليت
            let currentTurnIndex = 0;

            const runRouletteTurn = async () => {
                if (participants.length <= 1) {
                    const winnerId = participants[0];
                    const winnerUser = await client.users.fetch(winnerId);
                    activeGames.delete(guildId);

                    // إرسال رسالة الفوز النهائية بصورة افتراضية مطابقة لطلبك
                    return message.channel.send({
                        content: `الفائز هو: ${winnerUser.username}\n${winnerUser.displayAvatarURL({ extension: 'png', size: 256 })}`
                    });
                }

                const targetedUserId = participants[currentTurnIndex % participants.length];
                const targetedUser = await client.users.fetch(targetedUserId);

                // إنشاء أزرار التصويت لطرد الشخص المستهدف أو اختيار العشوائي
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
                        .setStyle(ButtonStyle.Success)
                );

                const turnMsg = await message.channel.send({
                    content: `دور اللاعب: <@${targetedUserId}>\nاختر شخصاً لطرده أو اختر عشوائي:`,
                    components: [targetRow]
                });

                const turnCollector = turnMsg.createMessageComponentCollector({ time: 30000 });

                turnCollector.on('collect,', async (i) => {
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
                        // طرد عشوائي في حال انتهى الوقت
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
