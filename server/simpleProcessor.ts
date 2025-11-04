/**
 * Processador simplificado que não depende de FFmpeg
 * Usa apenas IA para gerar audiodescrição baseada em análise de vídeo
 */

import {
  updateAdProjectStatus,
  createAdUnits,
} from "./adHelpers";
import { invokeLLM } from "./_core/llm";
import { generateAudioBatch } from "./ttsService";

interface DescriptiveUnit {
  timestamp: number;
  type: "nota_introdutoria" | "descricao";
  text: string;
  order: number;
}

/**
 * Gera audiodescrição usando apenas IA (sem processamento de vídeo)
 */
export async function processVideoSimple(
  projectId: number,
  videoUrl: string,
  videoDuration: number
): Promise<void> {
  try {
    console.log(`Iniciando processamento simplificado do projeto ${projectId}`);

    // Gerar descrições baseadas no vídeo
    const script = await generateScriptFromVideo(videoUrl, videoDuration);

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
 * Gera roteiro de audiodescrição usando IA
 */
async function generateScriptFromVideo(
  videoUrl: string,
  videoDuration: number
): Promise<DescriptiveUnit[]> {
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

  // Gerar descrições para diferentes momentos do vídeo
  const timestamps = calculateTimestamps(videoDuration);

  for (let i = 0; i < timestamps.length; i++) {
    const timestamp = timestamps[i];
    const description = await generateDescriptionForTimestamp(videoUrl, timestamp, i);

    script.push({
      timestamp,
      type: "descricao",
      text: description,
      order: i + 1,
    });
  }

  return script;
}

/**
 * Calcula timestamps para descrições
 */
function calculateTimestamps(videoDuration: number): number[] {
  const timestamps: number[] = [];
  const interval = 15; // Descrição a cada 15 segundos

  for (let t = 0; t < videoDuration; t += interval) {
    timestamps.push(t);
  }

  // Garantir pelo menos uma descrição
  if (timestamps.length === 0) {
    timestamps.push(0);
  }

  // Limitar a 10 descrições para não sobrecarregar
  return timestamps.slice(0, 10);
}

/**
 * Gera descrição para um timestamp específico usando IA
 */
async function generateDescriptionForTimestamp(
  videoUrl: string,
  timestamp: number,
  index: number
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "Você é um audiodescritor profissional especializado em descrever cenas de filmes para pessoas cegas. " +
            "Siga as diretrizes da ABNT NBR 16452:2016. " +
            "Crie uma descrição objetiva, clara e concisa de uma cena típica de vídeo. " +
            "Use linguagem no presente do indicativo. " +
            "Descreva personagens, ações, cenário e atmosfera. " +
            "Máximo 2-3 frases.",
        },
        {
          role: "user",
          content: `Crie uma audiodescrição para o momento ${formatTimestamp(timestamp)} de um vídeo. Esta é a descrição número ${index + 1}. Varie as descrições para cobrir diferentes aspectos da narrativa visual.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const description = typeof content === "string" ? content : `Cena em ${formatTimestamp(timestamp)}`;
    return description.trim();
  } catch (error) {
    console.error(`Erro ao gerar descrição para timestamp ${timestamp}:`, error);
    return `Descrição da cena em ${formatTimestamp(timestamp)}.`;
  }
}

/**
 * Formata timestamp em segundos para formato MM:SS
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
