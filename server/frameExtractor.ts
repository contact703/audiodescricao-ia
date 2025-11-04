/**
 * Serviço de extração de frames de vídeo usando FFmpeg
 * FFmpeg é open source e amplamente disponível
 */

import { exec } from "child_process";
import { promisify } from "util";
import { storagePut } from "./storage";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

/**
 * Extrai frames de um vídeo em timestamps específicos
 * @param videoPath Caminho local do vídeo ou URL
 * @param timestamps Array de timestamps em segundos
 * @returns Array de URLs dos frames no S3
 */
export async function extractFrames(
  videoPath: string,
  timestamps: number[]
): Promise<Array<{ timestamp: number; imageUrl: string; imageKey: string }>> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ad-frames-"));
  const frames: Array<{ timestamp: number; imageUrl: string; imageKey: string }> = [];

  try {
    // Verificar se FFmpeg está disponível
    try {
      await execAsync("ffmpeg -version");
    } catch (error) {
      throw new Error(
        "FFmpeg não está instalado. Instale com: apt-get install ffmpeg"
      );
    }

    // Extrair cada frame
    for (const timestamp of timestamps) {
      const outputFile = path.join(tempDir, `frame_${timestamp}.jpg`);

      // Comando FFmpeg para extrair frame em timestamp específico
      const command = `ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 -q:v 2 "${outputFile}" -y`;

      try {
        await execAsync(command, { timeout: 30000 });

        // Verificar se o arquivo foi criado
        const stats = await fs.stat(outputFile);
        if (stats.size === 0) {
          console.warn(`Frame em ${timestamp}s está vazio`);
          continue;
        }

        // Upload para S3
        const imageData = await fs.readFile(outputFile);
        const key = `audiodescription/frames/frame_${timestamp}_${Date.now()}.jpg`;
        const result = await storagePut(key, imageData, "image/jpeg");

        frames.push({
          timestamp,
          imageUrl: result.url,
          imageKey: key,
        });

        // Limpar arquivo temporário
        await fs.unlink(outputFile);
      } catch (error) {
        console.error(`Erro ao extrair frame em ${timestamp}s:`, error);
      }
    }

    return frames;
  } finally {
    // Limpar diretório temporário
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error("Erro ao limpar diretório temporário:", error);
    }
  }
}

/**
 * Obtém duração de um vídeo em segundos
 */
export async function getVideoDuration(videoPath: string): Promise<number> {
  try {
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    const { stdout } = await execAsync(command, { timeout: 10000 });
    const duration = parseFloat(stdout.trim());

    if (isNaN(duration) || duration <= 0) {
      throw new Error("Duração do vídeo inválida");
    }

    return Math.floor(duration);
  } catch (error) {
    console.error("Erro ao obter duração do vídeo:", error);
    throw new Error("Não foi possível determinar a duração do vídeo");
  }
}

/**
 * Baixa vídeo do YouTube usando yt-dlp (open source)
 */
export async function downloadYouTubeVideo(
  youtubeUrl: string
): Promise<{ videoPath: string; duration: number }> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ad-youtube-"));
  const outputPath = path.join(tempDir, "video.mp4");

  try {
    // Verificar se yt-dlp está disponível
    try {
      await execAsync("yt-dlp --version");
    } catch (error) {
      throw new Error(
        "yt-dlp não está instalado. Instale com: pip install yt-dlp"
      );
    }

    // Baixar vídeo (qualidade média para economizar espaço)
    const command = `yt-dlp -f "best[height<=720]" -o "${outputPath}" "${youtubeUrl}"`;
    await execAsync(command, { timeout: 300000 }); // 5 minutos de timeout

    // Obter duração
    const duration = await getVideoDuration(outputPath);

    return {
      videoPath: outputPath,
      duration,
    };
  } catch (error) {
    // Limpar em caso de erro
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {}

    console.error("Erro ao baixar vídeo do YouTube:", error);
    throw new Error("Falha ao baixar vídeo do YouTube");
  }
}

/**
 * Limpa arquivo de vídeo temporário
 */
export async function cleanupVideoFile(videoPath: string): Promise<void> {
  try {
    const dir = path.dirname(videoPath);
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    console.error("Erro ao limpar arquivo de vídeo:", error);
  }
}
