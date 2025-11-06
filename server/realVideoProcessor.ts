/**
 * Processador REAL de vídeo com extração de frames e análise visual
 * Este processador analisa o conteúdo REAL do vídeo, não gera exemplos
 */

import { exec } from "child_process";
import { promisify } from "util";
import { readFile, unlink, mkdir } from "fs/promises";
import path from "path";
import { storagePut } from "./storage";
import { updateAdProjectStatus, createAdUnits, updateAdProjectProgress } from "./adHelpers";
import { invokeLLM } from "./_core/llm";
import { generateAudioBatch } from "./ttsService";
import { generateCompleteAudio } from "./audioMerger";
import crypto from "crypto";

const execAsync = promisify(exec);

interface Frame {
  timestamp: number;
  imagePath: string;
  imageUrl: string;
}

interface DescriptiveUnit {
  timestamp: number;
  type: "nota_introdutoria" | "descricao";
  text: string;
  order: number;
}

/**
 * Processa vídeo REAL extraindo frames e analisando com IA
 */
export async function processRealVideo(
  projectId: number,
  videoUrl: string,
  videoDuration: number
): Promise<void> {
  const tempDir = `/tmp/ad_project_${projectId}_${Date.now()}`;
  
  try {
    console.log(`[Projeto ${projectId}] Iniciando processamento REAL do vídeo`);
    await updateAdProjectProgress(projectId, 5, 'Preparando processamento...');
    
    // Criar diretório temporário
    await mkdir(tempDir, { recursive: true });
    
    // Baixar vídeo se for URL
    await updateAdProjectProgress(projectId, 10, 'Baixando vídeo...');
    const videoPath = await downloadVideo(videoUrl, tempDir);
    
    // Extrair frames do vídeo REAL
    await updateAdProjectProgress(projectId, 20, 'Extraindo frames do vídeo...');
    console.log(`[Projeto ${projectId}] Extraindo frames do vídeo...`);
    const frames = await extractFrames(videoPath, tempDir, videoDuration, projectId);
    
    if (frames.length === 0) {
      throw new Error("Nenhum frame foi extraído do vídeo");
    }
    
    console.log(`[Projeto ${projectId}] ${frames.length} frames extraídos com sucesso`);
    
    // Analisar frames com IA (visão computacional REAL)
    await updateAdProjectProgress(projectId, 40, 'Analisando conteúdo visual com IA...');
    console.log(`[Projeto ${projectId}] Analisando frames com IA...`);
    const descriptions = await analyzeFramesWithAI(frames, projectId);
    
    // Criar roteiro estruturado
    await updateAdProjectProgress(projectId, 60, 'Gerando roteiro de audiodescrição...');
    const script = buildScript(descriptions);
    
    // Gerar áudio para cada unidade
    await updateAdProjectProgress(projectId, 80, 'Gerando áudio narrado...');
    console.log(`[Projeto ${projectId}] Gerando áudio TTS...`);
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
    
    // Gerar áudio completo (MP3 e WAV)
    console.log(`[Projeto ${projectId}] Gerando áudio completo...`);
    try {
      const completeAudio = await generateCompleteAudio(projectId, units as any);
      
      // Atualizar projeto como concluído com áudio completo
      await updateAdProjectStatus(projectId, "completed", {
        scriptData: JSON.stringify(script),
        completeAudioMp3Url: completeAudio.mp3Url,
        completeAudioMp3Key: completeAudio.mp3Key,
        completeAudioWavUrl: completeAudio.wavUrl,
        completeAudioWavKey: completeAudio.wavKey,
      });
    } catch (audioError) {
      console.error("Erro ao gerar áudio completo:", audioError);
      // Atualizar projeto como concluído mesmo sem áudio completo
      await updateAdProjectStatus(projectId, "completed", {
        scriptData: JSON.stringify(script),
      });
    }
    
    console.log(`[Projeto ${projectId}] Processamento concluído com sucesso!`);
    
    // Limpar arquivos temporários
    await cleanup(tempDir);
    
  } catch (error) {
    console.error(`[Projeto ${projectId}] Erro no processamento:`, error);
    
    await updateAdProjectStatus(projectId, "failed", {
      errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
    });
    
    // Tentar limpar arquivos temporários mesmo em caso de erro
    try {
      await cleanup(tempDir);
    } catch (cleanupError) {
      console.error("Erro ao limpar arquivos temporários:", cleanupError);
    }
  }
}

/**
 * Baixa vídeo se for URL externa ou retorna caminho local
 */
async function ensureYtDlpClean(): Promise<void> {
  try {
    await execAsync('/usr/local/bin/yt-dlp-clean --version');
  } catch (error) {
    console.log('[YouTube] yt-dlp-clean não encontrado, criando...');
    const projectRoot = process.cwd();
    await execAsync(`cd ${projectRoot} && ./yt-dlp-setup.sh`);
  }
}

async function downloadVideo(videoUrl: string, outputDir: string): Promise<string> {
  // Se for URL do YouTube, baixar com yt-dlp
  if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
    const outputPath = path.join(outputDir, "video.%(ext)s");
    console.log("[YouTube] Baixando vídeo do YouTube com yt-dlp...");
    console.log("[YouTube] URL:", videoUrl);
    
    try {
      // Garantir que yt-dlp-clean existe
      await ensureYtDlpClean();
      
      // Usar formato simples que funciona sem assinatura
      const command = `/usr/local/bin/yt-dlp-clean -f "worst[ext=mp4]/worst" --no-check-certificate -o "${outputPath}" "${videoUrl}"`;
      console.log("[YouTube] Comando:", command);
      
      const result = await execAsync(command, {
        timeout: 600000, // 10 minutos
        maxBuffer: 50 * 1024 * 1024 // 50MB buffer
      });
      
      console.log("[YouTube] Download concluído:", result.stdout);
      
      // Encontrar arquivo baixado
      const files = await execAsync(`ls "${outputDir}"/video.*`);
      const downloadedFile = files.stdout.trim().split("\n")[0];
      
      if (!downloadedFile) {
        throw new Error("Arquivo de vídeo não encontrado após download");
      }
      
      console.log("[YouTube] Arquivo baixado:", downloadedFile);
      return downloadedFile;
    } catch (error: any) {
      console.error("[YouTube] Erro ao baixar vídeo:", error);
      console.error("[YouTube] stderr:", error.stderr);
      console.error("[YouTube] stdout:", error.stdout);
      throw new Error(`Falha ao baixar vídeo do YouTube: ${error.message}`);
    }
  }
  
  // Se for URL de S3 ou outra URL, baixar com curl
  if (videoUrl.startsWith("http")) {
    const outputPath = path.join(outputDir, "video.mp4");
    console.log("Baixando vídeo da URL...");
    
    try {
      await execAsync(`curl -L -o "${outputPath}" "${videoUrl}"`, {
        timeout: 300000,
      });
      return outputPath;
    } catch (error) {
      console.error("Erro ao baixar vídeo:", error);
      throw new Error("Falha ao baixar vídeo da URL fornecida.");
    }
  }
  
  // Se for caminho local, retornar diretamente
  return videoUrl;
}

/**
 * Extrai frames do vídeo usando FFmpeg
 */
async function extractFrames(
  videoPath: string,
  tempDir: string,
  videoDuration: number,
  projectId: number
): Promise<Frame[]> {
  const frames: Frame[] = [];
  const framesDir = path.join(tempDir, "frames");
  await mkdir(framesDir, { recursive: true });
  
  // Calcular intervalos para extração (máximo 10 frames)
  const maxFrames = 10;
  const interval = Math.max(10, Math.floor(videoDuration / maxFrames));
  
  console.log(`Extraindo frames a cada ${interval} segundos...`);
  
  // Extrair frames usando FFmpeg
  try {
    await execAsync(
      `ffmpeg -i "${videoPath}" -vf "fps=1/${interval}" -frames:v ${maxFrames} "${framesDir}/frame_%03d.jpg"`,
      { timeout: 120000 } // 2 minutos de timeout
    );
  } catch (error) {
    console.error("Erro ao extrair frames com FFmpeg:", error);
    throw new Error("Falha ao extrair frames do vídeo. Verifique se o arquivo é válido.");
  }
  
  // Fazer upload dos frames para S3 e criar lista
  const frameFiles = await execAsync(`ls "${framesDir}"`);
  const fileList = frameFiles.stdout.trim().split("\n").filter(f => f.endsWith(".jpg"));
  
  for (let i = 0; i < fileList.length; i++) {
    const filename = fileList[i];
    const framePath = path.join(framesDir, filename);
    const timestamp = i * interval;
    
    try {
      // Ler frame
      const frameBuffer = await readFile(framePath);
      
      // Upload para S3
      const randomSuffix = crypto.randomBytes(4).toString("hex");
      const s3Key = `audiodescription/frames/project_${projectId}_frame_${i}_${randomSuffix}.jpg`;
      const result = await storagePut(s3Key, frameBuffer, "image/jpeg");
      
      frames.push({
        timestamp,
        imagePath: framePath,
        imageUrl: result.url,
      });
      
      console.log(`Frame ${i + 1}/${fileList.length} extraído: ${timestamp}s`);
    } catch (error) {
      console.error(`Erro ao processar frame ${filename}:`, error);
    }
  }
  
  return frames;
}

/**
 * Analisa frames com IA usando visão computacional
 */
async function analyzeFramesWithAI(
  frames: Frame[],
  projectId: number
): Promise<DescriptiveUnit[]> {
  const descriptions: DescriptiveUnit[] = [];
  
  console.log(`Analisando ${frames.length} frames com IA...`);
  
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    
    try {
      console.log(`Analisando frame ${i + 1}/${frames.length} (${frame.timestamp}s)...`);
      
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "Você é um audiodescritor profissional especializado em descrever cenas de filmes para pessoas cegas. " +
              "Siga as diretrizes da ABNT NBR 16452:2016. " +
              "Analise a imagem fornecida e crie uma audiodescrição objetiva, clara e concisa. " +
              "Use linguagem no presente do indicativo. " +
              "Descreva personagens, ações, cenário, objetos importantes e atmosfera. " +
              "Máximo 2-3 frases. " +
              "NÃO invente informações. Descreva APENAS o que você vê na imagem.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Descreva esta cena do vídeo que ocorre em ${formatTimestamp(frame.timestamp)}:`,
              },
              {
                type: "image_url",
                image_url: {
                  url: frame.imageUrl,
                  detail: "high",
                },
              },
            ],
          },
        ],
      });
      
      const content = response.choices[0]?.message?.content;
      const description = typeof content === "string" 
        ? content.trim() 
        : `Cena em ${formatTimestamp(frame.timestamp)}.`;
      
      descriptions.push({
        timestamp: frame.timestamp,
        type: "descricao",
        text: description,
        order: i + 1,
      });
      
      console.log(`✓ Frame ${i + 1} analisado: "${description.substring(0, 50)}..."`);
      
      // Pequeno delay para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`Erro ao analisar frame ${i}:`, error);
      descriptions.push({
        timestamp: frame.timestamp,
        type: "descricao",
        text: `Cena em ${formatTimestamp(frame.timestamp)}.`,
        order: i + 1,
      });
    }
  }
  
  return descriptions;
}

/**
 * Constrói roteiro completo com nota introdutória
 */
function buildScript(descriptions: DescriptiveUnit[]): DescriptiveUnit[] {
  const script: DescriptiveUnit[] = [];
  
  // Nota introdutória (conforme NBR 16452)
  script.push({
    timestamp: 0,
    type: "nota_introdutoria",
    text:
      "Audiodescrição gerada automaticamente com inteligência artificial. " +
      "Esta descrição segue as diretrizes da ABNT NBR 16452:2016. " +
      "A audiodescrição descreve elementos visuais importantes para compreensão da narrativa. " +
      "Recomenda-se revisão por audiodescritor profissional e consultor com deficiência visual.",
    order: 0,
  });
  
  // Adicionar descrições
  script.push(...descriptions);
  
  return script;
}

/**
 * Formata timestamp em segundos para formato MM:SS
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Limpa arquivos temporários
 */
async function cleanup(tempDir: string): Promise<void> {
  try {
    await execAsync(`rm -rf "${tempDir}"`);
    console.log("Arquivos temporários removidos");
  } catch (error) {
    console.error("Erro ao remover arquivos temporários:", error);
  }
}
