    if (content === 'أعلام' || content === 'اعلام') {
        if (activeGames.has(guildId) || activeChannels.has(channelId)) {
            return message.reply('توجد لعبة تنلعب الحين، استخدم "إيقاف" أولاً.');
        }

        activeChannels.add(channelId);
        const randomFlag = flagsList[Math.floor(Math.random() * flagsList.length)];

        try {
            const flagImage = await readImage(randomFlag.url);
            if (!flagImage) {
                throw new Error("تعذر جلب صورة العلم.");
            }

            // تكبير حجم العلم قليلاً ليكون واضحاً للمتفرج
            flagImage.resize(250, 150); 

            const buffer = await getJimpBufferSafe(flagImage);
            const attachment = new AttachmentBuilder(buffer, { name: 'flag_game.png' });

            const flagEmbed = new EmbedBuilder()
                .setImage('attachment://flag_game.png')
                .setColor(0x2f3136);

            await message.channel.send({ 
                content: "**علم أي دولة ؟**\n⏳ لديك 15 ثانيه",
                embeds: [flagEmbed],
                files: [attachment] 
            });

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
                    m.channel.send(`الفائز: <@${m.author.id}>`);
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
            console.error("خطأ تفصيلي أثناء معالجة صورة العلم:", error);
            activeChannels.delete(channelId);
            return message.reply(`حدث خطأ أثناء معالجة صورة العلم: ${error.message}`);
        }
    }
