/**
 * Helper para concatenar áudios e gerar arquivo completo
 */

import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { storagePut } from "./storage";
import crypto from "crypto";

const execAsync = promisify(exec);

interface AudioUnit {
  audioUrl: string | null;
  timestamp: number;
  text: string;
}

/**
 * Gera áudio completo concatenando todas as unidades
 * Retorna URL do arquivo MP3 completo
 */
export async function generateCompleteAudio(
  projectId: number,
  units: AudioUnit[]
): Promise<{ mp3Url: string; mp3Key: string; wavUrl: string; wavKey: string }> {
  const tempDir = `/tmp/audio_merge_${projectId}_${Date.now()}`;
  
  try {
    await mkdir(tempDir, { recursive: true });
    
    // Baixar todos os áudios
    const audioFiles: string[] = [];
    
    for (let i = 0; i < units.length; i++) {
      const unit = units[i];
      
      if (!unit.audioUrl) {
        console.warn(`Unidade ${i} sem áudio, pulando...`);
        continue;
      }
      
      const audioPath = path.join(tempDir, `audio_${i}.mp3`);
      
      // Baixar áudio
      await execAsync(`curl -s -L -o "${audioPath}" "${unit.audioUrl}"`);
      audioFiles.push(audioPath);
    }
    
    if (audioFiles.length === 0) {
      throw new Error("Nenhum áudio disponível para concatenar");
    }
    
    // Criar arquivo de lista para FFmpeg
    const listPath = path.join(tempDir, "filelist.txt");
    const listContent = audioFiles.map(f => `file '${f}'`).join("\n");
    await writeFile(listPath, listContent);
    
    // Concatenar áudios em MP3
    const outputMP3 = path.join(tempDir, "complete.mp3");
    await execAsync(
      `ffmpeg -f concat -safe 0 -i "${listPath}" -c copy "${outputMP3}"`,
      { timeout: 120000 }
    );
    
    // Converter para WAV
    const outputWAV = path.join(tempDir, "complete.wav");
    await execAsync(
      `ffmpeg -i "${outputMP3}" -acodec pcm_s16le -ar 44100 "${outputWAV}"`,
      { timeout: 120000 }
    );
    
    // Upload para S3
    const randomSuffix = crypto.randomBytes(8).toString("hex");
    
    const mp3Buffer = await readFile(outputMP3);
    const mp3Key = `audiodescription/audio/project_${projectId}_complete_${randomSuffix}.mp3`;
    const mp3Result = await storagePut(mp3Key, mp3Buffer, "audio/mpeg");
    
    const wavBuffer = await readFile(outputWAV);
    const wavKey = `audiodescription/audio/project_${projectId}_complete_${randomSuffix}.wav`;
    const wavResult = await storagePut(wavKey, wavBuffer, "audio/wav");
    
    // Limpar arquivos temporários
    await execAsync(`rm -rf "${tempDir}"`);
    
    return {
      mp3Url: mp3Result.url,
      mp3Key,
      wavUrl: wavResult.url,
      wavKey,
    };
    
  } catch (error) {
    console.error("Erro ao gerar áudio completo:", error);
    
    // Tentar limpar em caso de erro
    try {
      await execAsync(`rm -rf "${tempDir}"`);
    } catch {}
    
    throw error;
  }
}
