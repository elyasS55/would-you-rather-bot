require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
});

// Would You Rather questions
const questions = [
    { optionA: "Have the ability to fly", optionB: "Have the ability to become invisible" },
    { optionA: "Always be 10 minutes late", optionB: "Always be 20 minutes early" },
    { optionA: "Have super strength", optionB: "Have super speed" },
    { optionA: "Live without music", optionB: "Live without movies" },
    { optionA: "Be able to speak all languages", optionB: "Be able to talk to animals" },
    { optionA: "Have $1 million now", optionB: "Have $50,000 every year for life" },
    { optionA: "Never use the internet again", optionB: "Never watch TV again" },
    { optionA: "Be famous but poor", optionB: "Be rich but unknown" },
    { optionA: "Time travel to the past", optionB: "Time travel to the future" },
    { optionA: "Have perfect memory", optionB: "Have perfect intuition" }
];

// Slash command definition
const commands = [
    new SlashCommandBuilder()
        .setName('wyr')
        .setDescription('Get a Would You Rather question!'),
    new SlashCommandBuilder()
        .setName('wyrhelp')
        .setDescription('Show help for Would You Rather Machine')
];

// Register slash commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function deployCommands() {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands.map(command => command.toJSON()) }
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error deploying commands:', error);
    }
}

// Bot ready event
client.once('ready', async () => {
    console.log(`${client.user.tag} is now online!`);
    console.log('Would You Rather Machine is ready to serve questions!');
    
    // Deploy slash commands when bot starts
    await deployCommands();
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'wyr') {
        // Get random question
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        // Create embed
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('🤔 Would You Rather?')
            .setDescription(`**Option A:** ${randomQuestion.optionA}\n\n**Option B:** ${randomQuestion.optionB}`)
            .setFooter({ text: 'React with 🅰️ for Option A or 🅱️ for Option B!' })
            .setTimestamp();

        // Send embed
        const message = await interaction.reply({ embeds: [embed], fetchReply: true });
        
        // Add reactions
        await message.react('🅰️');
        await message.react('🅱️');
        
        // Set up vote tracking
        const votes = { A: [], B: [] };
        
        // Create reaction collector
        const filter = (reaction, user) => {
            return ['🅰️', '🅱️'].includes(reaction.emoji.name) && !user.bot;
        };
        
        const collector = message.createReactionCollector({ filter, time: 300000 }); // 5 minutes
        
        collector.on('collect', (reaction, user) => {
            if (reaction.emoji.name === '🅰️') {
                if (!votes.A.includes(user.id) && !votes.B.includes(user.id)) {
                    votes.A.push(user.id);
                }
            } else if (reaction.emoji.name === '🅱️') {
                if (!votes.B.includes(user.id) && !votes.A.includes(user.id)) {
                    votes.B.push(user.id);
                }
            }
        });
        
        collector.on('end', () => {
            const totalVotes = votes.A.length + votes.B.length;
            if (totalVotes > 0) {
                const percentA = Math.round((votes.A.length / totalVotes) * 100);
                const percentB = Math.round((votes.B.length / totalVotes) * 100);
                
                const resultsEmbed = new EmbedBuilder()
                    .setColor('#4ECDC4')
                    .setTitle('📊 Voting Results!')
                    .setDescription(`**Option A:** ${randomQuestion.optionA}\n${votes.A.length} votes (${percentA}%)\n\n**Option B:** ${randomQuestion.optionB}\n${votes.B.length} votes (${percentB}%)`)
                    .setFooter({ text: `Total votes: ${totalVotes}` })
                    .setTimestamp();
                
                interaction.followUp({ embeds: [resultsEmbed] });
            }
        });
    }

    if (commandName === 'wyrhelp') {
        const helpEmbed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle('🤖 Would You Rather Machine - Help')
            .setDescription('Welcome to the Would You Rather Machine!')
            .addFields(
                { name: '/wyr', value: 'Get a random Would You Rather question with voting!', inline: false },
                { name: '/wyrhelp', value: 'Show this help message', inline: false },
                { name: '🎮 How to Play', value: 'Use /wyr to get a question, then react with 🅰️ or 🅱️ to vote!', inline: false },
                { name: '⏰ Voting Time', value: 'Voting lasts for 5 minutes, then results are shown!', inline: false }
            )
            .setFooter({ text: 'Have fun with your choices!' })
            .setTimestamp();

        await interaction.reply({ embeds: [helpEmbed] });
    }
});

// Handle old text commands (still works)
client.on('messageCreate', message => {
    if (message.author.bot) return;
    
    const content = message.content.toLowerCase();
    
    if (content === '!wyr' || content === '!wouldyourather') {
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        const embed = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('🤔 Would You Rather?')
            .setDescription(`**Option A:** ${randomQuestion.optionA}\n\n**Option B:** ${randomQuestion.optionB}`)
            .setFooter({ text: 'React with 🅰️ for Option A or 🅱️ for Option B!' })
            .setTimestamp();

        message.reply({ embeds: [embed] }).then(sentMessage => {
            sentMessage.react('🅰️');
            sentMessage.react('🅱️');
        });
    }
    
    if (content === '!wyrhelp') {
        const helpEmbed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle('🤖 Would You Rather Machine - Help')
            .setDescription('Welcome to the Would You Rather Machine!')
            .addFields(
                { name: '!wyr or !wouldyourather', value: 'Get a random Would You Rather question!', inline: false },
                { name: '/wyr', value: 'Get a question with voting (slash command)', inline: false },
                { name: '!wyrhelp', value: 'Show this help message', inline: false }
            )
            .setFooter({ text: 'Have fun with your choices!' })
            .setTimestamp();

        message.reply({ embeds: [helpEmbed] });
    }
});

client.login(process.env.DISCORD_TOKEN);