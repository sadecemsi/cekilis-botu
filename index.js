const { Client, GatewayIntentBits, Collection, Events, REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token } = require('./config.json');

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions
    ] 
});

client.commands = new Collection();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    } else {
        console.log(`[UYARI] ${filePath} komut dosyasında gerekli "data" veya "execute" özellikleri eksik.`);
    }
}

client.once(Events.ClientReady, async () => {
    console.log(`${client.user.tag} olarak giriş yapıldı!`);

    const rest = new REST({ version: '10' }).setToken(token);

    try {
        console.log('Slash komutları yükleniyor...');

        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );

        console.log('Slash komutları başarıyla yüklendi!');
    } catch (error) {
        console.error('Slash komutları yüklenirken bir hata oluştu:', error);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`${interaction.commandName} adlı komut bulunamadı.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Bu komutu yürütürken bir hata oluştu!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Bu komutu yürütürken bir hata oluştu!', ephemeral: true });
            }
        }
    } else if (interaction.isButton()) {
        if (interaction.customId === 'join_giveaway') {
            let giveaways = JSON.parse(fs.readFileSync('./cekilis.json', 'utf-8'));
            const giveaway = giveaways[interaction.guildId][interaction.message.id];

            if (!giveaway) {
                return interaction.reply({ content: 'Bu çekiliş artık mevcut değil.', ephemeral: true });
            }

            const userIndex = giveaway.participantIds.indexOf(interaction.user.id);

            if (userIndex > -1) {
                const leaveButton = new ButtonBuilder()
                    .setCustomId('leave_giveaway')
                    .setLabel('Çekilişten Ayrıl')
                    .setStyle(ButtonStyle.Danger);

                const row = new ActionRowBuilder().addComponents(leaveButton);

                return interaction.reply({ 
                    content: 'Bu çekilişe zaten katıldınız! Çekilişten ayrılmak isterseniz aşağıdaki butona tıklayın.',
                    components: [row],
                    ephemeral: true 
                });
            } else {
                giveaway.participantIds.push(interaction.user.id);
                giveaway.participants++;

                const embed = EmbedBuilder.from(interaction.message.embeds[0]);
                embed.setDescription(
                    embed.data.description.replace(/\*\*Katılımcı:\*\* \d+/, `**Katılımcı:** ${giveaway.participants}`)
                );
                await interaction.message.edit({ embeds: [embed] });

                giveaways[interaction.guildId][interaction.message.id] = giveaway;
                fs.writeFileSync('./cekilis.json', JSON.stringify(giveaways, null, 2));

                return interaction.reply({ content: 'Çekilişe katıldınız!', ephemeral: true });
            }
        } else if (interaction.customId === 'leave_giveaway') {
            let giveaways = JSON.parse(fs.readFileSync('./cekilis.json', 'utf-8'));
            
           
            let giveaway;
            let giveawayMessageId;
            for (const [messageId, g] of Object.entries(giveaways[interaction.guildId])) {
                if (g.participantIds.includes(interaction.user.id)) {
                    giveaway = g;
                    giveawayMessageId = messageId;
                    break;
                }
            }

            if (!giveaway) {
                return interaction.reply({ content: 'Bu çekilişe katılmamışsınız veya çekiliş artık mevcut değil.', ephemeral: true });
            }

            const userIndex = giveaway.participantIds.indexOf(interaction.user.id);
            if (userIndex > -1) {
                giveaway.participantIds.splice(userIndex, 1);
                giveaway.participants--;

                const channel = await interaction.client.channels.fetch(giveaway.channelId);
                const message = await channel.messages.fetch(giveawayMessageId);
                const embed = EmbedBuilder.from(message.embeds[0]);
                embed.setDescription(
                    embed.data.description.replace(/\*\*Katılımcı:\*\* \d+/, `**Katılımcı:** ${giveaway.participants}`)
                );
                await message.edit({ embeds: [embed] });

                giveaways[interaction.guildId][giveawayMessageId] = giveaway;
                fs.writeFileSync('./cekilis.json', JSON.stringify(giveaways, null, 2));

                return interaction.update({ content: 'Çekilişten ayrıldınız.', components: [], ephemeral: true });
            } else {
                return interaction.update({ content: 'Bu çekilişe zaten katılmamışsınız.', components: [], ephemeral: true });
            }
        }
    }
});


setInterval(() => {
    const giveaways = JSON.parse(fs.readFileSync('./cekilis.json', 'utf-8'));
    const now = Date.now();

    for (const [guildId, guildGiveaways] of Object.entries(giveaways)) {
        for (const [messageId, giveaway] of Object.entries(guildGiveaways)) {
            if (!giveaway.ended && giveaway.endTime <= now) {
                endGiveaway(guildId, messageId, client);
            }
        }
    }
}, 10000); 

async function endGiveaway(guildId, messageId, client) {
    let giveaways = JSON.parse(fs.readFileSync('./cekilis.json', 'utf-8'));
    const giveaway = giveaways[guildId][messageId];
    if (!giveaway) return;

    const channel = await client.channels.fetch(giveaway.channelId);
    const message = await channel.messages.fetch(messageId);

    if (giveaway.participants < giveaway.winners) {
        const embed = EmbedBuilder.from(message.embeds[0]);
        embed.setDescription(`**Çekiliş iptal edildi!**\n\nYeterli katılımcı olmadığı için çekiliş iptal edildi.\n**Katılımcı:** ${giveaway.participants}\n**Gerekli Kazanan Sayısı:** ${giveaway.winners}`)
            .setFooter({ text: 'Çekiliş iptal edildi' });

        await message.edit({ embeds: [embed], components: [] });
        await message.reply('**Çekiliş iptal edildi!** Yeterli katılımcı olmadığı için kazanan belirlenemedi.');
    } else {
        const winners = giveaway.participantIds.sort(() => 0.5 - Math.random()).slice(0, giveaway.winners);
        let winnerText = winners.map(w => `<@${w}>`).join(', ');

        const embed = EmbedBuilder.from(message.embeds[0]);
        embed.setDescription(`**Çekiliş bitti!**\n\n**Ödül:** ${giveaway.prize}\n**Kazananlar:** ${winnerText}`)
            .setFooter({ text: 'Çekiliş sona erdi' });

        await message.edit({ embeds: [embed], components: [] });
        await message.reply(`**Tebrikler ${winnerText}! ${giveaway.prize} kazandınız!**`);
    }

    giveaway.ended = true;
    giveaways[guildId][messageId] = giveaway;
    fs.writeFileSync('./cekilis.json', JSON.stringify(giveaways, null, 2));
}

client.login(token);