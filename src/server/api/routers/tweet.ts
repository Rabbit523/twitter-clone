import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "y/server/api/trpc";

export const tweetRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ content: z.string() }))
    .mutation(async ({ input: { content }, ctx }) => {
      const tweet = ctx.prisma.tweet.create({
        data: { content, userId: ctx.session.user.id },
      });

      return tweet;
    }),
});
