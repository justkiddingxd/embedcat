import {
  ButtonInteraction,
  TextChannel,
  GuildMemberRoleManager,
  DiscordAPIError,
} from "discord.js";
import type { PrismaClient } from "../generated/prisma/client";
import type { Action } from "../generated/prisma/client";

type ActionConfig = Record<string, unknown>;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeActionChain(
  interaction: ButtonInteraction,
  actions: Action[],
  prisma: PrismaClient,
): Promise<boolean> {
  let hasReplied = false;
  for (const action of actions) {
    const config = action.config as ActionConfig;

    switch (action.type) {
      case "do_nothing":
        break;

      case "wait":
        await sleep(((config.seconds as number) ?? 1) * 1000);
        break;

      case "add_role":
        await addRole(interaction, config.roleId as string);
        break;

      case "remove_role":
        await removeRole(interaction, config.roleId as string);
        break;

      case "toggle_role":
        await toggleRole(interaction, config.roleId as string);
        break;

      case "send_message":
        await sendMessage(interaction, config, prisma);
        hasReplied = true;
        break;

      case "send_webhook":
        await sendWebhook(config);
        break;

      case "create_thread":
        await createThread(interaction, config);
        break;

      case "delete_message":
        await deleteMessage(interaction);
        break;

      case "stop":
        return hasReplied;

      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }
  return hasReplied;
}

async function addRole(interaction: ButtonInteraction, roleId: string): Promise<void> {
  if (!interaction.guild || !interaction.member) return;
  const roles = interaction.member.roles as GuildMemberRoleManager;
  try {
    await roles.add(roleId);
  } catch (err) {
    if (err instanceof DiscordAPIError && (err.code === 10011 || err.code === 50013)) {
      await interaction.editReply({
        content: err.code === 10011
          ? `Role ${roleId} does not exist on this server.`
          : `Missing permissions to manage role <@&${roleId}>.`,
      });
      return;
    }
    throw err;
  }
}

async function removeRole(interaction: ButtonInteraction, roleId: string): Promise<void> {
  if (!interaction.guild || !interaction.member) return;
  const roles = interaction.member.roles as GuildMemberRoleManager;
  try {
    await roles.remove(roleId);
  } catch (err) {
    if (err instanceof DiscordAPIError && (err.code === 10011 || err.code === 50013)) {
      await interaction.editReply({
        content: err.code === 10011
          ? `Role ${roleId} does not exist on this server.`
          : `Missing permissions to manage role <@&${roleId}>.`,
      });
      return;
    }
    throw err;
  }
}

async function toggleRole(interaction: ButtonInteraction, roleId: string): Promise<void> {
  if (!interaction.guild || !interaction.member) return;
  const roles = interaction.member.roles as GuildMemberRoleManager;

  try {
    if (roles.cache.has(roleId)) {
      await roles.remove(roleId);
    } else {
      await roles.add(roleId);
    }
  } catch (err) {
    if (err instanceof DiscordAPIError) {
      if (err.code === 50013) {
        await interaction.editReply({
          content: `Missing permissions to manage role <@&${roleId}>. Make sure the bot's role is above this role in the server settings.`,
        });
        return;
      }
      if (err.code === 10011) {
        await interaction.editReply({
          content: `Role ${roleId} does not exist on this server.`,
        });
        return;
      }
    }
    throw err;
  }
}

async function sendMessage(
  interaction: ButtonInteraction,
  config: ActionConfig,
  prisma: PrismaClient,
): Promise<void> {
  const channelId = (config.channelId as string) || interaction.channelId;
  const isEphemeral = config.ephemeral !== false;

  if (config.embedId) {
    const saved = await prisma.savedEmbed.findUnique({
      where: { id: config.embedId as string },
    });

    if (!saved) {
      await interaction.editReply({ content: `Saved embed "${config.embedId}" not found.` });
      return;
    }

    const payload = saved.payload as Record<string, unknown>;

    sanitizeV2Payload(payload);

    if (saved.mode === "components_v2") {
      if (isEphemeral) {
        // Send v2 embed as ephemeral via interaction webhook (raw PATCH)
        const appId = interaction.client.application?.id;
        const token = interaction.token;
        if (appId && token) {
          const res = await fetch(
            `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                content: "",
                flags: 32768, // IS_COMPONENTS_V2
                components: payload.components,
              }),
            },
          );
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            console.error("[sendMessage] ephemeral v2 error:", res.status, JSON.stringify(err));
            await interaction.editReply({ content: `Failed: ${(err as { message?: string }).message || res.status}` });
          }
        }
      } else {
        // Send to channel via raw API
        const result = await sendViaRawApi(channelId, payload);
        if (result.ok) {
          await interaction.editReply({ content: "✓ Embed sent." });
        } else {
          await interaction.editReply({ content: `Failed to send embed: ${result.error}` });
        }
      }
    } else if (saved.mode === "classic") {
      const sendPayload = buildClassicPayload(payload);
      if (isEphemeral) {
        await interaction.editReply(sendPayload);
      } else {
        const channel = await interaction.client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) return;
        await (channel as TextChannel).send(sendPayload);
        await interaction.editReply({ content: "✓ Embed sent." });
      }
    }
  } else if (config.content) {
    if (isEphemeral) {
      await interaction.editReply({ content: config.content as string });
    } else {
      const channel = await interaction.client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) return;
      await (channel as TextChannel).send({ content: config.content as string });
      await interaction.editReply({ content: "✓ Message sent." });
    }
  }
}

async function sendViaRawApi(
  channelId: string,
  payload: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return { ok: false, error: "Bot token not configured" };

  const messagePayload: Record<string, unknown> = { ...payload };
  delete messagePayload.username;
  delete messagePayload.avatar_url;

  console.log("[sendViaRawApi] channelId:", channelId, "payload keys:", Object.keys(messagePayload));

  const res = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messagePayload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: res.statusText }));
    console.error("[sendViaRawApi] Discord error:", res.status, JSON.stringify(data));
    return { ok: false, error: (data as { message?: string }).message || `HTTP ${res.status}` };
  }

  return { ok: true };
}

function buildClassicPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (payload.content) result.content = payload.content;
  if (Array.isArray(payload.embeds) && payload.embeds.length > 0) {
    result.embeds = payload.embeds;
  }
  if (!result.content && !result.embeds) result.content = "(empty)";
  return result;
}

function sanitizeV2Payload(payload: Record<string, unknown>): void {
  if (!Array.isArray(payload.components)) return;

  for (const c of payload.components as Record<string, unknown>[]) {
    sanitizeComponent(c);
    if (Array.isArray(c.components)) {
      for (const child of c.components as Record<string, unknown>[]) {
        sanitizeComponent(child);
        if (Array.isArray(child.components)) {
          for (const grandchild of child.components as Record<string, unknown>[]) {
            sanitizeComponent(grandchild);
          }
        }
      }
    }
  }
}

function sanitizeComponent(c: Record<string, unknown>): void {
  // Fix Link buttons without URL
  if ((c.type as number) === 2 && (c.style as number) === 5 && !c.url) {
    c.url = "https://discord.com";
  }
  // Fix accessory Link buttons without URL
  if (c.accessory && typeof c.accessory === "object") {
    const acc = c.accessory as Record<string, unknown>;
    if ((acc.type as number) === 2 && (acc.style as number) === 5 && !acc.url) {
      acc.url = "https://discord.com";
    }
  }
  // Fix non-Link buttons without custom_id
  if ((c.type as number) === 2 && (c.style as number) !== 5 && !c.custom_id) {
    c.custom_id = `btn_${Math.random().toString(36).slice(2, 10)}`;
  }
}

function extractV2Text(payload: Record<string, unknown>): string {
  const texts: string[] = [];
  if (!Array.isArray(payload.components)) return "";

  for (const c of payload.components as Record<string, unknown>[]) {
    // TextDisplay
    if ((c.type as number) === 10 && c.content) {
      texts.push(c.content as string);
    }
    // Container — dig into children
    if ((c.type as number) === 17 && Array.isArray(c.components)) {
      for (const child of c.components as Record<string, unknown>[]) {
        if ((child.type as number) === 10 && child.content) {
          texts.push(child.content as string);
        }
        // Section
        if ((child.type as number) === 9 && Array.isArray(child.components)) {
          for (const t of child.components as Record<string, unknown>[]) {
            if ((t.type as number) === 10 && t.content) {
              texts.push(t.content as string);
            }
          }
        }
      }
    }
  }
  return texts.join("\n\n");
}

async function sendWebhook(config: ActionConfig): Promise<void> {
  const webhookUrl = config.webhookUrl as string;
  if (!webhookUrl) return;

  const payload = (config.payload as object) ?? { content: "Action triggered" };
  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function createThread(interaction: ButtonInteraction, config: ActionConfig): Promise<void> {
  if (!interaction.channel || !interaction.channel.isTextBased()) return;
  const channel = interaction.channel as TextChannel;

  await channel.threads.create({
    name: (config.name as string) ?? "New Thread",
    autoArchiveDuration: (config.autoArchive as 60 | 1440 | 4320 | 10080) ?? 1440,
    reason: `Created by button action (${interaction.customId})`,
  });
}

async function deleteMessage(interaction: ButtonInteraction): Promise<void> {
  if (interaction.message) {
    await interaction.message.delete();
  }
}
