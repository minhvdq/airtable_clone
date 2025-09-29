import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const tableRouter = createTRPCRouter({
    getAllForBase: protectedProcedure
        .input(z.object({ baseId: z.string() }))
        .query(async ({ ctx, input }) => {
            const tables = await ctx.db.table.findMany({ where: { baseId: input.baseId } });
            return tables;
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const table = await ctx.db.table.findUnique({ 
                where: { id: input.id },
                include: {
                    base: true
                }
            });
            return table;
        }),

    create: protectedProcedure
        .input(z.object({ baseId: z.string(), name: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const table = await ctx.db.table.create({ data: { baseId: input.baseId, name: input.name, createdById: ctx.session.user.id } });
            await ctx.db.view.create({ data: { name: "Grid view", tableId: table.id } });
            return table;
        }),

    rename: protectedProcedure
        .input(z.object({ id: z.string(), name: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const table = await ctx.db.table.update({ where: { id: input.id }, data: { name: input.name } });
            return table;
        }),

    delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
        const table = await ctx.db.table.delete({ where: { id: input.id } });
        return table;
    }),
});