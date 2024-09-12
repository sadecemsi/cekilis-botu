const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const { parseDuration, formatDuration } = require('../utils/durationUtils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Çekiliş başlat')
        .addStringOption(option => option.setName('ödül').setDescription('Çekiliş ödülü').setRequired(true))
        .addStringOption(option => option.setName('süre').setDescription('Çekiliş süresi (örn: 1d 2h 30m)').setRequired(true))
        .addIntegerOption(option => option.setName('kazanan').setDescription('Kazanan sayısı').setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'Bu komutu kullanmak için yönetici yetkisine sahip olmalısınız.', ephemeral: true });
        }

        const prize = interaction.options.getString('ödül');
        const durationString = interaction.options.getString('süre');
        const winners = interaction.options.getInteger('kazanan');

        const duration = parseDuration(durationString);
        if (duration === 0) {
            return interaction.reply({ content: 'Geçersiz süre formatı. Örnek: 1d 2h 30m', ephemeral: true });
        }

        const endTime = Date.now() + duration;

        const embed = new EmbedBuilder()
            .setColor('#000000')
            .setTitle(prize)
            .setDescription(
                `**Bitiş:** <t:${Math.floor(endTime / 1000)}:R> (<t:${Math.floor(endTime / 1000)}:f>)\n` +
                `**Düzenleyen:** ${interaction.user}\n` +
                `**Katılımcı:** 0\n` +
                `**Kazanan:** ${winners}\n\n` +
                `Katılmak için 🎉 butonuna tıklayın!`
            )
            .setFooter({ text: 'Çekiliş devam ediyor' });

        const button = new ButtonBuilder()
            .setCustomId('join_giveaway')
            .setEmoji('🎉')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(button);

        const message = await interaction.channel.send({ embeds: [embed], components: [row] });

        const giveaway = {
            prize,
            endTime,
            winners,
            channelId: interaction.channelId,
            messageId: message.id,
            hostId: interaction.user.id,
            participants: 0,
            participantIds: []
        };

        let giveaways = {};
        if (fs.existsSync('./cekilis.json')) {
            giveaways = JSON.parse(fs.readFileSync('./cekilis.json'));
        }
        
        if (!giveaways[interaction.guildId]) {
            giveaways[interaction.guildId] = {};
        }
        giveaways[interaction.guildId][message.id] = giveaway;
        
        fs.writeFileSync('./cekilis.json', JSON.stringify(giveaways, null, 2));

        await interaction.reply({ content: `Çekiliş başlatıldı! Çekiliş ID: ${message.id}`, ephemeral: true });
    },
};
