/**
 * Serviço de síntese de voz (Text-to-Speech) para audiodescrição
 * Usa API gratuita do Google TTS
 */

import { storagePut } from "./storage";

/**
 * Gera áudio a partir de texto usando Google TTS
 * @param text Texto para converter em áudio
 * @param filename Nome do arquivo (sem extensão)
 * @returns URL e chave do áudio no S3
 */
export async function generateAudio(
  text: string,
  filename: string
): Promise<{ url: string; key: string }> {
  try {
    // Usar API do Google TTS (gratuita, sem necessidade de chave)
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=pt-BR&client=tw-ob&q=${encodeURIComponent(text)}`;

    // Baixar o áudio
    const response = await fetch(ttsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioData = Buffer.from(audioBuffer);

    // Upload para S3
    const key = `audiodescription/audio/${filename}-${Date.now()}.mp3`;
    const result = await storagePut(key, audioData, "audio/mpeg");

    return {
      url: result.url,
      key,
    };
  } catch (error) {
    console.error("Erro ao gerar áudio:", error);
    throw new Error("Falha ao gerar áudio TTS");
  }
}

/**
 * Gera áudio para múltiplos textos em lote
 */
export async function generateAudioBatch(
  texts: Array<{ text: string; filename: string }>
): Promise<Array<{ url: string; key: string } | null>> {
  const results: Array<{ url: string; key: string } | null> = [];

  for (const item of texts) {
    try {
      const audio = await generateAudio(item.text, item.filename);
      results.push(audio);
      
      // Pequeno delay para não sobrecarregar a API
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Erro ao gerar áudio para "${item.filename}":`, error);
      results.push(null);
    }
  }

  return results;
}

/**
 * Valida se o texto é adequado para TTS
 */
export function validateTextForTTS(text: string): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: "Texto vazio" };
  }

  if (text.length > 5000) {
    return { valid: false, error: "Texto muito longo (máximo 5000 caracteres)" };
  }

  return { valid: true };
}
