import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

// We could have defined all this in example router
// but it's also ok to have a seperate router

export const postsRouter = createTRPCRouter({
  // These procedures run on a server and generates
  // functions that client calls, it is public and
  // no auth is required.
  getAll: publicProcedure.query(({ ctx }) => {
    return ctx.prisma.post.findMany();
  }),
});
