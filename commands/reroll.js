const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reroll')
        .setDescription('Çekilişi yeniden çek')
        .addStringOption(option => 
            option.setName('cekilis_id')
                .setDescription('Yeniden çekilecek çekilişin ID\'si')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız.', ephemeral: true });
        }

        const cekilisId = interaction.options.getString('cekilis_id');
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

        if (!giveaway.ended) {
            return interaction.reply({ content: 'Bu çekiliş henüz sona ermemiş.', ephemeral: true });
        }

        if (giveaway.participants < giveaway.winners) {
            return interaction.reply({ content: 'Yeterli katılımcı olmadığı için yeniden çekilemiyor.', ephemeral: true });
        }

        const newWinners = giveaway.participantIds.sort(() => 0.5 - Math.random()).slice(0, giveaway.winners);
        let winnerText = newWinners.map(w => `<@${w}>`).join(', ');

        const channel = await interaction.guild.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(cekilisId);

        const embed = EmbedBuilder.from(message.embeds[0]);
        embed.setDescription(`**Çekiliş yeniden çekildi!**\n\n**Ödül:** ${giveaway.prize}\n**Yeni Kazananlar:** ${winnerText}`)
            .setFooter({ text: 'Çekiliş yeniden çekildi' });

        await message.edit({ embeds: [embed] });
        await message.reply(`**Çekiliş yeniden çekildi!** Yeni kazananlar: ${winnerText}`);

        await interaction.reply({ content: 'Çekiliş başarıyla yeniden çekildi.', ephemeral: true });
    },
};