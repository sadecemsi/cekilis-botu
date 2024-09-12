const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { formatDuration } = require('../utils/durationUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('Aktif çekilişleri listele'),
    async execute(interaction) {
        let giveaways = JSON.parse(fs.readFileSync('./cekilis.json', 'utf-8'));
        
        const guildGiveaways = giveaways[interaction.guildId] || {};
        const activeGiveaways = Object.entries(guildGiveaways).filter(([, giveaway]) => !giveaway.ended);

        if (activeGiveaways.length === 0) {
            return interaction.reply('Şu anda aktif çekiliş bulunmamaktadır.');
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Aktif Çekilişler')
            .setDescription('İşte sunucudaki aktif çekilişler:');

        activeGiveaways.forEach(([cekilisId, giveaway]) => {
            const timeLeft = giveaway.endTime - Date.now();
            embed.addFields({
                name: giveaway.prize,
                value: `ID: ${cekilisId}\nKalan Süre: ${formatDuration(timeLeft)}\nKatılımcı: ${giveaway.participants}\nKazanan Sayısı: ${giveaway.winners}`
            });
        });

        await interaction.reply({ embeds: [embed] });
    },
};