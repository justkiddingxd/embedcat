import { Client, GatewayIntentBits, Events } from "discord.js";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { executeActionChain } from "./actions";

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("DISCORD_BOT_TOKEN is not set");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, (c) => {
  console.log(`Bot ready as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const customId = interaction.customId;

  try {
    // Defer IMMEDIATELY — interaction tokens expire in 3s
    await interaction.deferReply({ ephemeral: true });

    const buttonAction = await prisma.buttonAction.findFirst({
      where: { buttonId: customId },
      include: {
        actions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!buttonAction) {
      await interaction.editReply({ content: "This button has no configured actions." });
      return;
    }

    const hasReplied = await executeActionChain(interaction, buttonAction.actions, prisma);

    if (!hasReplied) {
      try {
        await interaction.editReply({ content: "✓" });
      } catch {
        // noop
      }
    }
  } catch (error) {
    console.error(`Error handling button ${customId}:`, error);
    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: "An error occurred while processing this action." });
      } else {
        await interaction.reply({
          content: "An error occurred while processing this action.",
          ephemeral: true,
        });
      }
    } catch {
      // noop — interaction token expired
    }
  }
});

client.login(token).catch((err) => {
  console.error("Failed to login:", err);
  process.exit(1);
});

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  client.destroy();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down...");
  client.destroy();
  await prisma.$disconnect();
  process.exit(0);
});
