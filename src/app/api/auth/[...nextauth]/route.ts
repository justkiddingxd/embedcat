import NextAuth, { type AuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify guilds guilds.members.read",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      try {
        const discordProfile = profile as { id?: string; username?: string; avatar?: string } | undefined;
        const discordId = discordProfile?.id || user.id;
        if (discordId) {
          await prisma.appUser.upsert({
            where: { discordId },
            update: {
              username: discordProfile?.username || user.name || "",
              displayName: user.name || "",
              avatar: user.image || null,
              lastLogin: new Date(),
            },
            create: {
              discordId,
              username: discordProfile?.username || user.name || "",
              displayName: user.name || "",
              avatar: user.image || null,
            },
          });
        }
      } catch {
        void 0;
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub;
        (session.user as { accessToken?: string }).accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
