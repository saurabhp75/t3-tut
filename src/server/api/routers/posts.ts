import type { User } from "@clerk/nextjs/dist/api";
import { clerkClient } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";
// import { filterUserForClient } from "~/server/helpers/filterUserForClient";
import type { Post } from "@prisma/client";

const filterUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  };
};

// Create a new ratelimiter, that allows 3 requests per 1 minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
});

// We could have defined all this in example router
// but it's also ok to have a seperate router
export const postsRouter = createTRPCRouter({
  // These procedures run on a server and generates
  // functions that client calls, it is public and
  // no auth is required.

  getAll: publicProcedure.query(async ({ ctx }) => {
    // Get all posts (max 100)
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }],
    });

    // Get list of users of all posts
    const users = (
      await clerkClient.users.getUserList({
        userId: posts.map((post) => post.authorId),
        limit: 100,
      })
    ).map(filterUserForClient);

    // console.log(users);
    // console.log(posts);

    return posts.map((post) => {
      const author = users.find((user) => user.id === post.authorId);
      // const author = "Saurabh";

      if (!author || !author.username)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Author for ${post.id} not found`,
        });

      return {
        post,
        author: {
          ...author,
          username: author.username,
        },
      };
    });
    // console.log(users);
  }),

  // Validations should ALSO be done @client using zod and react hook forms
  create: privateProcedure
    .input(
      z.object({
        content: z.string().emoji("Only emojis are allowed!!!").min(1).max(280),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;
      //rate limiter
      const { success } = await ratelimit.limit(authorId);
      if (!success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Rate limit exceeded",
        });
      }
      const post = await ctx.prisma.post.create({
        data: {
          authorId,
          content: input.content,
        },
      });

      return post;
    }),
});
