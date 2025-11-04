/**
 * Exportador de roteiro para formato SRT (SubRip Subtitle)
 */

interface SubtitleEntry {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

/**
 * Converte roteiro de audiodescrição para formato SRT
 */
export function generateSRT(units: Array<{
  timestamp: number;
  text: string;
  type: string;
}>): string {
  const entries: SubtitleEntry[] = [];
  
  for (let i = 0; i < units.length; i++) {
    const unit = units[i];
    const nextUnit = units[i + 1];
    
    // Calcular duração baseada no próximo timestamp ou estimar 5 segundos
    const duration = nextUnit 
      ? Math.min(nextUnit.timestamp - unit.timestamp, 10) 
      : 5;
    
    const startTime = formatSRTTime(unit.timestamp);
    const endTime = formatSRTTime(unit.timestamp + duration);
    
    entries.push({
      index: i + 1,
      startTime,
      endTime,
      text: unit.text,
    });
  }
  
  return entries.map(entry => 
    `${entry.index}\n${entry.startTime} --> ${entry.endTime}\n${entry.text}\n`
  ).join("\n");
}

/**
 * Formata timestamp em segundos para formato SRT (HH:MM:SS,mmm)
 */
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(milliseconds).padStart(3, "0")}`;
}
