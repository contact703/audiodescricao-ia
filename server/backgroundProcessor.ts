/**
 * Processamento de vídeos em background
 */

import {
  updateAdProjectStatus,
  createAdUnits,
  getAdProjectById,
} from "./adHelpers";
import {
  extractFrames,
  getVideoDuration,
  downloadYouTubeVideo,
  cleanupVideoFile,
} from "./frameExtractor";
import {
  analyzeFrame,
  generateAudiodescriptionScript,
  calculateFrameTimestamps,
} from "./videoProcessor";
import { generateAudioBatch } from "./ttsService";
import { storagePut } from "./storage";

/**
 * Processa vídeo enviado por upload
 */
export async function processVideoInBackground(
  projectId: number,
  videoUrl: string,
  videoDuration: number
): Promise<void> {
  try {
    console.log(`Iniciando processamento do projeto ${projectId}`);

    // Calcular timestamps para extração de frames (a cada 10 segundos)
    const timestamps = calculateFrameTimestamps(videoDuration, 10);
    console.log(`Extraindo ${timestamps.length} frames...`);

    // Extrair frames do vídeo
    // Nota: videoUrl é a URL do S3, precisamos baixar o vídeo primeiro
    const tempVideoPath = `/tmp/video_${projectId}_${Date.now()}.mp4`;
    
    // Baixar vídeo do S3
    const videoResponse = await fetch(videoUrl);
    const videoBuffer = await videoResponse.arrayBuffer();
    const fs = await import("fs/promises");
    await fs.writeFile(tempVideoPath, Buffer.from(videoBuffer));

    // Extrair frames
    const frames = await extractFrames(tempVideoPath, timestamps);
    console.log(`${frames.length} frames extraídos`);

    // Limpar vídeo temporário
    await fs.unlink(tempVideoPath);

    // Analisar cada frame com IA
    const frameDescriptions: Array<{ timestamp: number; description: string }> = [];
    
    for (const frame of frames) {
      console.log(`Analisando frame em ${frame.timestamp}s...`);
      const description = await analyzeFrame(frame.imageUrl, frame.timestamp);
      frameDescriptions.push({
        timestamp: frame.timestamp,
        description,
      });
    }

    // Gerar roteiro de audiodescrição
    console.log("Gerando roteiro de audiodescrição...");
    const script = await generateAudiodescriptionScript(frameDescriptions);

    // Gerar áudio para cada unidade descritiva
    console.log("Gerando áudio TTS...");
    const audioInputs = script.map((unit, index) => ({
      text: unit.text,
      filename: `project_${projectId}_unit_${index}`,
    }));

    const audioResults = await generateAudioBatch(audioInputs);

    // Criar unidades descritivas no banco
    const units = script.map((unit, index) => ({
      projectId,
      timestamp: unit.timestamp,
      type: unit.type,
      text: unit.text,
      audioUrl: audioResults[index]?.url || null,
      audioKey: audioResults[index]?.key || null,
      order: unit.order,
    }));

    await createAdUnits(units);

    // Atualizar projeto como concluído
    await updateAdProjectStatus(projectId, "completed", {
      scriptData: JSON.stringify(script),
    });

    console.log(`Projeto ${projectId} processado com sucesso!`);
  } catch (error) {
    console.error(`Erro ao processar projeto ${projectId}:`, error);
    
    await updateAdProjectStatus(projectId, "failed", {
      errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
    });
  }
}

/**
 * Processa vídeo do YouTube
 */
export async function processYouTubeVideoInBackground(
  projectId: number,
  youtubeUrl: string
): Promise<void> {
  let videoPath: string | null = null;

  try {
    console.log(`Baixando vídeo do YouTube para projeto ${projectId}...`);

    // Baixar vídeo do YouTube
    const { videoPath: downloadedPath, duration } = await downloadYouTubeVideo(
      youtubeUrl
    );
    videoPath = downloadedPath;

    console.log(`Vídeo baixado. Duração: ${duration}s`);

    // Atualizar duração no projeto
    await updateAdProjectStatus(projectId, "processing", {});
    const project = await getAdProjectById(projectId);
    if (project) {
      const { getDb } = await import("./db");
      const { adProjects } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (db) {
        await db
          .update(adProjects)
          .set({ videoDuration: duration })
          .where(eq(adProjects.id, projectId));
      }
    }

    // Calcular timestamps para extração de frames
    const timestamps = calculateFrameTimestamps(duration, 10);
    console.log(`Extraindo ${timestamps.length} frames...`);

    // Extrair frames
    const frames = await extractFrames(videoPath, timestamps);
    console.log(`${frames.length} frames extraídos`);

    // Analisar cada frame com IA
    const frameDescriptions: Array<{ timestamp: number; description: string }> = [];
    
    for (const frame of frames) {
      console.log(`Analisando frame em ${frame.timestamp}s...`);
      const description = await analyzeFrame(frame.imageUrl, frame.timestamp);
      frameDescriptions.push({
        timestamp: frame.timestamp,
        description,
      });
    }

    // Gerar roteiro de audiodescrição
    console.log("Gerando roteiro de audiodescrição...");
    const script = await generateAudiodescriptionScript(frameDescriptions);

    // Gerar áudio para cada unidade descritiva
    console.log("Gerando áudio TTS...");
    const audioInputs = script.map((unit, index) => ({
      text: unit.text,
      filename: `project_${projectId}_unit_${index}`,
    }));

    const audioResults = await generateAudioBatch(audioInputs);

    // Criar unidades descritivas no banco
    const units = script.map((unit, index) => ({
      projectId,
      timestamp: unit.timestamp,
      type: unit.type,
      text: unit.text,
      audioUrl: audioResults[index]?.url || null,
      audioKey: audioResults[index]?.key || null,
      order: unit.order,
    }));

    await createAdUnits(units);

    // Atualizar projeto como concluído
    await updateAdProjectStatus(projectId, "completed", {
      scriptData: JSON.stringify(script),
    });

    console.log(`Projeto ${projectId} processado com sucesso!`);
  } catch (error) {
    console.error(`Erro ao processar projeto ${projectId}:`, error);
    
    await updateAdProjectStatus(projectId, "failed", {
      errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
    });
  } finally {
    // Limpar arquivo de vídeo temporário
    if (videoPath) {
      await cleanupVideoFile(videoPath);
    }
  }
}
