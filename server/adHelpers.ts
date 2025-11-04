/**
 * Helpers para operações de audiodescrição no banco de dados
 */

import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { adProjects, adUnits, InsertAdProject, InsertAdUnit } from "../drizzle/schema";

/**
 * Cria um novo projeto de audiodescrição
 */
export async function createAdProject(project: InsertAdProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(adProjects).values(project);
  return result[0].insertId;
}

/**
 * Busca projeto por ID
 */
export async function getAdProjectById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(adProjects).where(eq(adProjects.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Busca todos os projetos de um usuário
 */
export async function getUserAdProjects(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(adProjects)
    .where(eq(adProjects.userId, userId))
    .orderBy(desc(adProjects.createdAt));
}

/**
 * Atualiza status do projeto
 */
export async function updateAdProjectStatus(
  id: number,
  status: "processing" | "completed" | "failed",
  data?: {
    scriptData?: string;
    audioUrl?: string;
    audioKey?: string;
    errorMessage?: string;
    completeAudioMp3Url?: string;
    completeAudioMp3Key?: string;
    completeAudioWavUrl?: string;
    completeAudioWavKey?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: any = { status };
  
  if (data?.scriptData) updateData.scriptData = data.scriptData;
  if (data?.audioUrl) updateData.audioUrl = data.audioUrl;
  if (data?.audioKey) updateData.audioKey = data.audioKey;
  if (data?.errorMessage) updateData.errorMessage = data.errorMessage;
  if (data?.completeAudioMp3Url) updateData.completeAudioMp3Url = data.completeAudioMp3Url;
  if (data?.completeAudioMp3Key) updateData.completeAudioMp3Key = data.completeAudioMp3Key;
  if (data?.completeAudioWavUrl) updateData.completeAudioWavUrl = data.completeAudioWavUrl;
  if (data?.completeAudioWavKey) updateData.completeAudioWavKey = data.completeAudioWavKey;
  
  if (status === "completed") {
    updateData.completedAt = new Date();
  }

  await db.update(adProjects).set(updateData).where(eq(adProjects.id, id));
}

/**
 * Cria unidades descritivas para um projeto
 */
export async function createAdUnits(units: InsertAdUnit[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (units.length === 0) return;
  
  await db.insert(adUnits).values(units);
}

/**
 * Busca unidades descritivas de um projeto
 */
export async function getProjectAdUnits(projectId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(adUnits)
    .where(eq(adUnits.projectId, projectId))
    .orderBy(adUnits.order);
}

/**
 * Deleta um projeto e suas unidades (cascade)
 */
export async function deleteAdProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(adProjects).where(eq(adProjects.id, id));
}
