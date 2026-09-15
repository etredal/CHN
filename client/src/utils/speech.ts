// On-device zero-cloud-cost Chinese speech synthesis via Web Speech API

class ChineseSpeechService {
  private voices: SpeechSynthesisVoice[] = [];
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();
    
    // Prefer Mandarin Chinese voices (zh-CN, cmn-Hans, Tingting, Xiaoxiao, Sinji, etc.)
    const zhVoices = this.voices.filter(v => 
      v.lang.startsWith('zh-CN') || 
      v.lang.startsWith('zh') || 
      v.lang.includes('cmn') ||
      v.name.toLowerCase().includes('chinese') ||
      v.name.toLowerCase().includes('mandarin')
    );

    if (zhVoices.length > 0) {
      // Prioritize high-quality voices if available
      this.selectedVoice = 
        zhVoices.find(v => v.name.includes('Natural') || v.name.includes('Online')) ||
        zhVoices.find(v => v.lang === 'zh-CN') ||
        zhVoices[0];
    }
    this.isInitialized = true;
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.isInitialized) this.initVoices();
    return this.voices.filter(v => v.lang.startsWith('zh'));
  }

  public setVoice(voice: SpeechSynthesisVoice) {
    this.selectedVoice = voice;
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public speak(text: string, options: { rate?: number; pitch?: number; onEnd?: () => void } = {}): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    // Cancel any previous speech for responsive clicks
    window.speechSynthesis.cancel();

    if (!this.isInitialized || !this.selectedVoice) {
      this.initVoices();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = options.rate ?? 0.85; // slightly slower for language learning clarity
    utterance.pitch = options.pitch ?? 1.0;

    if (options.onEnd) {
      utterance.onend = () => options.onEnd?.();
      utterance.onerror = () => options.onEnd?.();
    }

    window.speechSynthesis.speak(utterance);
  }

  public speakWord(text: string, slow: boolean = false): void {
    this.speak(text, { rate: slow ? 0.65 : 0.85 });
  }
}

export const speechService = new ChineseSpeechService();