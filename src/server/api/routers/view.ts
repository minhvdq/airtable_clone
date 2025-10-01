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
                            views: true,
                            rows: {
                                include: {
                                    cells: true
                                },
                                orderBy: {
                                    createdAt: 'asc'
                                },
                                take: 100 // Limit to first 100 rows to prevent connection issues
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
            try {
                const views = await ctx.db.view.findMany({ 
                    where: { tableId: input.tableId },
                    include: {
                        filters: true,
                        sorts: true,
                        table: true
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                });
                return views;
            } catch (error) {
                console.error('Error fetching views for table:', error);
                throw error;
            }
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

    getTableData: protectedProcedure
        .input(z.object({ tableId: z.string() }))
        .query(async ({ ctx, input }) => {
            const table = await ctx.db.table.findUnique({
                where: { id: input.tableId },
                include: {
                    columns: true,
                    rows: {
                        include: {
                            cells: true
                        },
                        orderBy: {
                            createdAt: 'asc'
                        }
                    }
                }
            });
            return table;
        }),
});   