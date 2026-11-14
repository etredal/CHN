// Chinese and Latin punctuation, shared by the tokenizer, the reader and the
// word timeline so they agree on what is a "word".
const PUNCTUATION_CHARS = '，。！？；：“”‘’（）《》〈〉「」『』【】、—…·～.,!?;:\'"()[\\]-';

const PUNCTUATION_RUN = new RegExp(`^[\\s${PUNCTUATION_CHARS}]+$`);

/** Whether `text` is only punctuation (and whitespace). */
export function isPunctuation(text: string): boolean {
  return PUNCTUATION_RUN.test(text);
}
