import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const rowRouter = createTRPCRouter({
    getAllForTable: protectedProcedure
        .input(z.object({ tableId: z.string() }))
        .query(async ({ ctx, input }) => {
            const rows = await ctx.db.row.findMany({ where: { tableId: input.tableId } });
            return rows;
        }),

    create: protectedProcedure
        .input(z.object({ tableId: z.string(), position: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const row = await ctx.db.row.create({ data: { tableId: input.tableId, position: input.position } });
            return row;
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const row = await ctx.db.row.delete({ where: { id: input.id } });
            return row;
        }),
});   