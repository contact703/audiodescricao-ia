import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  processVideoInBackground,
  processYouTubeVideoInBackground,
} from "./backgroundProcessor";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  /**
   * Rotas de audiodescrição
   */
  audiodescription: router({
    // Listar projetos do usuário
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getUserAdProjects } = await import("./adHelpers");
      return await getUserAdProjects(ctx.user.id);
    }),

    // Buscar projeto por ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getAdProjectById } = await import("./adHelpers");
        const project = await getAdProjectById(input.id);
        
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Projeto não encontrado" });
        }
        
        if (project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        
        return project;
      }),

    // Buscar unidades descritivas de um projeto
    getUnits: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getAdProjectById, getProjectAdUnits } = await import("./adHelpers");
        
        // Verificar permissão
        const project = await getAdProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        
        return await getProjectAdUnits(input.projectId);
      }),

    // Criar novo projeto (upload de vídeo)
    createFromUpload: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          videoUrl: z.string().url(),
          videoKey: z.string(),
          videoDuration: z.number().positive(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { createAdProject } = await import("./adHelpers");
        
        const projectId = await createAdProject({
          userId: ctx.user.id,
          title: input.title,
          videoSource: "upload",
          videoUrl: input.videoUrl,
          videoKey: input.videoKey,
          videoDuration: input.videoDuration,
          status: "processing",
        });
        
        // Iniciar processamento em background
        processVideoInBackground(projectId, input.videoUrl, input.videoDuration).catch(
          (error: unknown) => {
            console.error("Erro no processamento em background:", error);
          }
        );
        
        return { projectId };
      }),

    // Criar novo projeto (YouTube)
    createFromYouTube: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          youtubeUrl: z.string().url(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { createAdProject } = await import("./adHelpers");
        
        const projectId = await createAdProject({
          userId: ctx.user.id,
          title: input.title,
          videoSource: "youtube",
          videoUrl: input.youtubeUrl,
          status: "processing",
        });
        
        // Iniciar processamento em background
        processYouTubeVideoInBackground(projectId, input.youtubeUrl).catch((error: unknown) => {
          console.error("Erro no processamento em background:", error);
        });
        
        return { projectId };
      }),

    // Deletar projeto
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getAdProjectById, deleteAdProject } = await import("./adHelpers");
        
        const project = await getAdProjectById(input.id);
        if (!project || project.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }
        
        await deleteAdProject(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
