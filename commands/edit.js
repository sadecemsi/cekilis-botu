const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { parseDuration, formatDuration } = require('../utils/durationUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('edit')
        .setDescription('Çekilişi düzenle')
        .addStringOption(option => 
            option.setName('cekilis_id')
                .setDescription('Düzenlenecek çekilişin ID\'si')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('ödül')
                .setDescription('Yeni ödül (boş bırakılırsa değişmez)'))
        .addStringOption(option => 
            option.setName('süre')
                .setDescription('Yeni süre (örn: 1d 2h 30m, boş bırakılırsa değişmez)'))
        .addIntegerOption(option => 
            option.setName('kazanan')
                .setDescription('Yeni kazanan sayısı (boş bırakılırsa değişmez)')),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız.', ephemeral: true });
        }

        const cekilisId = interaction.options.getString('cekilis_id');
        const newPrize = interaction.options.getString('ödül');
        const newDurationString = interaction.options.getString('süre');
        const newWinners = interaction.options.getInteger('kazanan');

        let giveaways = JSON.parse(fs.readFileSync('./cekilis.json', 'utf-8'));
        
        let giveaway;
        let guildId;

        for (const [gId, guildGiveaways] of Object.entries(giveaways)) {
            if (guildGiveaways[cekilisId]) {
                giveaway = guildGiveaways[cekilisId];
                guildId = gId;
                break;
            }
        }

        if (!giveaway) {
            return interaction.reply({ content: 'Geçerli bir çekiliş bulunamadı.', ephemeral: true });
        }

        if (giveaway.ended) {
            return interaction.reply({ content: 'Sona ermiş bir çekiliş düzenlenemez.', ephemeral: true });
        }

        let updated = false;

        if (newPrize) {
            giveaway.prize = newPrize;
            updated = true;
        }
        if (newDurationString) {
            const newDuration = parseDuration(newDurationString);
            if (newDuration === 0) {
                return interaction.reply({ content: 'Geçersiz süre formatı. Örnek: 1d 2h 30m', ephemeral: true });
            }
            giveaway.endTime = Date.now() + newDuration;
            updated = true;
        }
        if (newWinners) {
            giveaway.winners = newWinners;
            updated = true;
        }

        if (!updated) {
            return interaction.reply({ content: 'Hiçbir değişiklik yapılmadı.', ephemeral: true });
        }

        const channel = await interaction.guild.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(cekilisId);

        const embed = EmbedBuilder.from(message.embeds[0]);
        embed.setTitle(giveaway.prize)
            .setDescription(
                `**Bitiş:** <t:${Math.floor(giveaway.endTime / 1000)}:R> (<t:${Math.floor(giveaway.endTime / 1000)}:f>)\n` +
                `**Düzenleyen:** <@${giveaway.hostId}>\n` +
                `**Katılımcı:** ${giveaway.participants}\n` +
                `**Kazanan:** ${giveaway.winners}\n\n` +
                `Katılmak için 🎉 butonuna tıklayın!`
            );

        await message.edit({ embeds: [embed] });

        giveaways[guildId][cekilisId] = giveaway;
        fs.writeFileSync('./cekilis.json', JSON.stringify(giveaways, null, 2));

        await interaction.reply({ content: 'Çekiliş başarıyla düzenlendi.', ephemeral: true });
    },
};