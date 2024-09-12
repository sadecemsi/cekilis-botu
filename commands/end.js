const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('end')
        .setDescription('Çekilişi sonlandır')
        .addStringOption(option => 
            option.setName('cekilis_id')
                .setDescription('Sonlandırılacak çekilişin ID\'si')
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

        if (giveaway.ended) {
            return interaction.reply({ content: 'Bu çekiliş zaten sona ermiş.', ephemeral: true });
        }

        const channel = await interaction.guild.channels.fetch(giveaway.channelId);
        const message = await channel.messages.fetch(cekilisId);

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
        giveaways[guildId][cekilisId] = giveaway;
        fs.writeFileSync('./cekilis.json', JSON.stringify(giveaways, null, 2));

        await interaction.reply({ content: 'Çekiliş başarıyla sonlandırıldı.', ephemeral: true });
    },
};