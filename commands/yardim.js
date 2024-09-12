const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('yardım')
        .setDescription('Botun komutları hakkında bilgi verir'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#000000')
            .setTitle('Çekiliş Botu Komutları')
            .setDescription('İşte kullanabileceğiniz komutlar:')
            .addFields(
                { name: '/start', value: 'Yeni bir çekiliş başlatır.' },
                { name: '/edit', value: 'Çekilişi düzenler.' },
                { name: '/end', value: 'Çekilişi sonlandırır.' },
                { name: '/reroll', value: 'Çekilişi yeniden çeker.' },
                { name: '/list', value: 'Aktif çekilişleri listeler.' }
            )
            .setFooter({ text: 'Çekiliş Botu ' });

        await interaction.reply({ embeds: [embed] });
    },
};