import { z } from 'zod'

import {
    createTRPCRouter,
    protectedProcedure,
} from '~/server/api/trpc'

export const baseRouter = createTRPCRouter({
    getAllForUser: protectedProcedure.query(async ({ctx}) => {
        const bases = await ctx.db.base.findMany({
            where: {createdBy: {id: ctx.session.user.id}},
            orderBy: {lastOpenAt: 'desc'}
        })
        return bases ?? null;
    }),

    getByWorkspace: protectedProcedure
    .input(z.object({
        workspaceId: z.string().min(1)
    }))
    .query(async ({ctx, input}) => {
        const bases = await ctx.db.base.findMany({
            where: {createdBy: {id: ctx.session.user.id}, workspaceId: input.workspaceId},
            orderBy: {lastOpenAt: 'desc'}
        })
        return bases ?? null;
    }),

    create: protectedProcedure
    .input(z.object({
        workspaceId: z.string().min(1), 
        name: z.string().min(1)
    }))
    .mutation(async ({ctx, input}) => {
        const base = await ctx.db.base.create({
            data: {
                name: input.name, 
                workspaceId: input.workspaceId, 
                createdById: ctx.session.user.id,
                lastOpenAt: new Date()
            }
        })
        return base ?? null;
    }),

    rename: protectedProcedure
        .input(z.object({id: z.string().min(1), name: z.string().min(1)}))
        .mutation(async ({ctx, input}) => {
            const base = await ctx.db.base.update({
                where: {id: input.id},
                data: {name: input.name, lastOpenAt: new Date()}
            })
            return base ?? null;
        }),
    moveToWorkspace: protectedProcedure
    .input(z.object({id: z.string().min(1), workspaceId: z.string().min(1)}))
    .mutation(async ({ctx, input}) => {
        const base = await ctx.db.base.update({
            where: {id: input.id},
            data: {workspaceId: input.workspaceId}
        })
        return base ?? null;
    }),

    open: protectedProcedure
    .input(z.object({id: z.string().min(1)}))
    .mutation(async ({ctx, input}) => {
        const base = await ctx.db.base.update({
            where: {id: input.id},
            data: {lastOpenAt: new Date()}
        })
        return base ?? null;
    }),

    delete: protectedProcedure
    .input(z.object({id: z.string().min(1)}))
    .mutation(async ({ctx, input}) => {
        const base = await ctx.db.base.delete({where: {id: input.id}})
        return base ?? null;
    })
})