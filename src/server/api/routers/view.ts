import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const viewRouter = createTRPCRouter({
    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const view = await ctx.db.view.findUnique({ 
                where: { id: input.id },
                include: {
                    filters: true,
                    sorts: true,
                    table: {
                        include: {
                            columns: true,
                            rows: {
                                include: {
                                    cells: true
                                }
                            }
                        }
                    }
                }
            });
            return view;
        }),

    getAllForTable: protectedProcedure
        .input(z.object({ tableId: z.string() }))
        .query(async ({ ctx, input }) => {
            const views = await ctx.db.view.findMany({ 
                where: { tableId: input.tableId },
                include: {
                    filters: true,
                    sorts: true,
                    table: true
                }
            });
            return views;
        }),

    create: protectedProcedure
        .input(z.object({ tableId: z.string(), name: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const view = await ctx.db.view.create({ data: { tableId: input.tableId, name: input.name} });
            return view;
        }),

    rename: protectedProcedure
        .input(z.object({ id: z.string(), name: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const view = await ctx.db.view.update({ where: { id: input.id }, data: { name: input.name } });
            return view;
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const view = await ctx.db.view.delete({ where: { id: input.id } });
            return view;
        }),
});   