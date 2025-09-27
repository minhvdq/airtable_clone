import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";

export const workspaceRouter = createTRPCRouter({
  getAllForUser: protectedProcedure.query(async ({ ctx }) => {
    const workspaces = await ctx.db.workspace.findMany({
      where: {createdBy: {id: ctx.session.user.id}},
      orderBy: {createdAt: 'desc'}
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

  rename: protectedProcedure
    .input(z.object({id: z.string().min(1), name: z.string().min(1)}))
    .mutation(async ({ctx, input}) => {
    const workspace = await ctx.db.workspace.update({
      where: {id: input.id},
      data: {name: input.name}
    });
    return workspace ?? null;
  }),
  
  delete: protectedProcedure
    .input(z.object({id: z.string().min(1)}))
    .mutation(async ({ctx, input}) => {
    // First, delete all bases in this workspace
    await ctx.db.base.deleteMany({
      where: {workspaceId: input.id}
    });
    
    // Then delete the workspace
    const workspace = await ctx.db.workspace.delete({
      where: {id: input.id}
    });
    return workspace ?? null;
  })
});