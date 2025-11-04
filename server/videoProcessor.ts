/**
 * Serviço de processamento de vídeo e geração de audiodescrição
 * Usa apenas tecnologias open source
 */

import { invokeLLM } from "./_core/llm";

/**
 * Interface para frame extraído
 */
export interface ExtractedFrame {
  timestamp: number;
  frameNumber: number;
  imageUrl: string; // URL da imagem no S3
}

/**
 * Interface para unidade descritiva
 */
export interface DescriptiveUnit {
  timestamp: number;
  timeFormatted: string;
  type: "nota_introdutoria" | "descricao";
  text: string;
  order: number;
}

/**
 * Analisa um frame usando modelo de visão computacional via LLM
 */
export async function analyzeFrame(imageUrl: string, timestamp: number): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "Você é um audiodescritor profissional especializado em descrever cenas de filmes para pessoas cegas. " +
            "Siga as diretrizes da ABNT NBR 16452:2016. " +
            "Descreva de forma objetiva, clara e concisa os elementos visuais importantes da cena: " +
            "personagens, ações, cenário, expressões faciais, figurino, iluminação e atmosfera. " +
            "Use linguagem no presente do indicativo. " +
            "Seja específico mas evite interpretações subjetivas. " +
            "Máximo 2-3 frases.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Descreva esta cena do filme (timestamp: ${formatTimestamp(timestamp)}):`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const description = typeof content === 'string' ? content : "Cena não descrita";
    return description.trim();
  } catch (error) {
    console.error("Erro ao analisar frame:", error);
    return `Erro ao analisar cena em ${formatTimestamp(timestamp)}`;
  }
}

/**
 * Gera roteiro completo de audiodescrição a partir das descrições de frames
 */
export async function generateAudiodescriptionScript(
  frameDescriptions: Array<{ timestamp: number; description: string }>
): Promise<DescriptiveUnit[]> {
  const script: DescriptiveUnit[] = [];

  // Nota introdutória (conforme NBR 16452)
  script.push({
    timestamp: 0,
    timeFormatted: "00:00",
    type: "nota_introdutoria",
    text:
      "Audiodescrição gerada automaticamente com inteligência artificial. " +
      "Esta descrição segue as diretrizes da ABNT NBR 16452:2016. " +
      "A audiodescrição descreve elementos visuais importantes para compreensão da narrativa. " +
      "Recomenda-se revisão por audiodescritor profissional e consultor com deficiência visual.",
    order: 0,
  });

  // Processar cada descrição de frame
  for (let i = 0; i < frameDescriptions.length; i++) {
    const { timestamp, description } = frameDescriptions[i];

    script.push({
      timestamp,
      timeFormatted: formatTimestamp(timestamp),
      type: "descricao",
      text: description,
      order: i + 1,
    });
  }

  return script;
}

/**
 * Melhora uma descrição usando modelo de linguagem
 */
export async function enhanceDescription(
  description: string,
  context?: string
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "Você é um audiodescritor profissional. " +
            "Melhore a descrição fornecida mantendo objetividade e clareza. " +
            "Mantenha o tamanho similar (2-3 frases). " +
            "Use linguagem no presente do indicativo. " +
            "Foque em elementos visuais concretos.",
        },
        {
          role: "user",
          content: `Melhore esta audiodescrição: "${description}"${context ? `\nContexto: ${context}` : ""}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    const enhanced = typeof content === 'string' ? content : description;
    return enhanced.trim();
  } catch (error) {
    console.error("Erro ao melhorar descrição:", error);
    return description;
  }
}

/**
 * Formata timestamp em segundos para formato MM:SS
 */
export function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Calcula timestamps para extração de frames
 * @param videoDuration Duração do vídeo em segundos
 * @param intervalSeconds Intervalo entre frames em segundos
 * @returns Array de timestamps
 */
export function calculateFrameTimestamps(
  videoDuration: number,
  intervalSeconds: number = 5
): number[] {
  const timestamps: number[] = [];
  
  for (let t = 0; t < videoDuration; t += intervalSeconds) {
    timestamps.push(t);
  }
  
  // Garantir que temos pelo menos um frame
  if (timestamps.length === 0) {
    timestamps.push(0);
  }
  
  return timestamps;
}
