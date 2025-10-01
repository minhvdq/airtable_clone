import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const cellRouter = createTRPCRouter({
    getAllForRow: protectedProcedure
        .input(z.object({ rowId: z.string() }))
        .query(async ({ ctx, input }) => {
            const cells = await ctx.db.cell.findMany({ where: { rowId: input.rowId } });
            return cells;
        }),

    getAllForTable: protectedProcedure
        .input(z.object({ tableId: z.string() }))
        .query(async ({ ctx, input }) => {
            const cells = await ctx.db.cell.findMany({
                where: {
                    row: {
                        tableId: input.tableId
                    }
                },
                include: {
                    row: true,
                    column: true
                }
            });
            return cells;
        }),

    create: protectedProcedure
        .input(z.object({ rowId: z.string(), columnId: z.string(), value: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const cell = await ctx.db.cell.create({ data: { rowId: input.rowId, columnId: input.columnId, value: input.value } });
            return cell;
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const cell = await ctx.db.cell.delete({ where: { id: input.id } });
            return cell;
        }),

    update: protectedProcedure
        .input(z.object({ id: z.string(), value: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const cell = await ctx.db.cell.update({ where: { id: input.id }, data: { value: input.value } });
            return cell;
        }),
}); 