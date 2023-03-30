import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import superjson from "superjson";

// getStaticProps is called at build time
export const generateSSGHelper = () =>
  createProxySSGHelpers({
    router: appRouter,
    ctx: { prisma, currentUser: null }, // Saurabh: check userId/currentUser
    transformer: superjson, // optional - adds superjson serialization
  });
