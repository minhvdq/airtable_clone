import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const workspaceRouter = createTRPCRouter({
  getAllForUser: protectedProcedure.query(async ({ ctx }) => {
    const workspaces = await ctx.db.workspace.findMany({
      where: {createdBy: {id: ctx.session.user.id}}
    });
    return workspaces ?? null;
  }),

  create: protectedProcedure
    .input(z.object({name: z.string().min(1)}))
    .mutation(async ({ctx, input}) => {
    const workspace = await ctx.db.workspace.create({
      data: {
        name: input.name,
        createdBy: {connect: {id: ctx.session.user.id}}
      }
    });
    return workspace ?? null;
  }),

  update: protectedProcedure
    .input(z.object({id: z.string().min(1), name: z.string().min(1)}))
    .mutation(async ({ctx, input}) => {
    const workspace = await ctx.db.workspace.update({
      where: {id: input.id},
      data: {name: input.name}
    });
    return workspace ?? null;
  })
});