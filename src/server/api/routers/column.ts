import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { ColumnType } from "@prisma/client";

export const columnRouter = createTRPCRouter({
    getAllForTable: protectedProcedure
        .input(z.object({ tableId: z.string() }))
        .query(async ({ ctx, input }) => {
            const columns = await ctx.db.column.findMany({ where: { tableId: input.tableId } });
            return columns;
        }),

    create: protectedProcedure
        .input(z.object({ tableId: z.string(), name: z.string(), position: z.number(), type: z.nativeEnum(ColumnType) }))
        .mutation(async ({ ctx, input }) => {
            const column = await ctx.db.column.create({ data: { tableId: input.tableId, name: input.name, position: input.position, type: input.type } });
            return column ?? null;
        }),

    rename: protectedProcedure
        .input(z.object({ id: z.string(), name: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const column = await ctx.db.column.update({ where: { id: input.id }, data: { name: input.name } });
            return column;
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const column = await ctx.db.column.delete({ where: { id: input.id } });
            return column;
        }),
});