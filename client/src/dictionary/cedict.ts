// English definitions from CC-CEDICT (CC BY-SA 4.0), built into
// public/dict/<version>/ by tools/build_cedict.py. The dictionary is split into
// shards by a word's first character; each is fetched the first time a word
// in it is looked up (and then kept by the service worker for offline use).

const DICT_VERSION = '20251213';
const SHARDS = 64; // keep in sync with tools/build_cedict.py

export const CEDICT_ATTRIBUTION_URL = 'https://www.mdbg.net/chinese/dictionary?page=cc-cedict';

/** [pinyin with tone marks, "def1/def2/..."] */
type Reading = [string, string];
type Shard = Record<string, Reading[]>;

export interface DictReading {
  pinyin: string;
  definitions: string[];
}

const shards = new Map<number, Promise<Shard>>();

const shardOf = (word: string) => (word.codePointAt(0) ?? 0) % SHARDS;

function loadShard(i: number): Promise<Shard> {
  let shard = shards.get(i);
  if (!shard) {
    shard = fetch(`dict/${DICT_VERSION}/${i}.json`)
      .then(res => {
        if (!res.ok) throw new Error(`dictionary shard ${i}: HTTP ${res.status}`);
        return res.json() as Promise<Shard>;
      })
      .catch(err => {
        shards.delete(i); // try again next time (e.g. back online)
        throw err;
      });
    shards.set(i, shard);
  }
  return shard;
}

/** "Gù xiāng" / "gùxiāng" -> "gùxiāng", for comparing readings. */
const normalize = (pinyin: string) => pinyin.toLowerCase().replace(/[\s'’·-]/g, '');

/** Entries that only point elsewhere ("variant of X", "surname Li"). */
const isMinor = (def: string) => /^(old |archaic |erroneous )?variant of |^surname /i.test(def);

const MAX_DEFINITIONS = 8;

/** Pronunciation notes, not meanings: "also pr. [mu3 qin5]", "Taiwan pr. [...]". */
const isPronunciationNote = (def: string) => /^(also |Taiwan |old |colloquial )?pr\. /i.test(def);

/**
 * Make CC-CEDICT's notation readable: "條|条[tiao2]" -> "条" (traditional|
 * simplified[pinyin] cross-references), "CL:個|个[ge4],位[wei4]" -> "量词: 个, 位",
 * and drop trailing pronunciation asides "(Taiwan pr. [...])".
 */
export function tidyDefinition(def: string): string {
  return def
    .replace(/\bCL:/g, '量词: ')
    .replace(/\s*\((?:also |Taiwan )?pr\. \[[^\]]*\]\)/g, '')
    .replace(/[^\s|,;:()[\]]+\|([^\s|,;:()[\]]+)\[[^\]]*\]/g, '$1')
    .replace(/(\p{Script=Han}+)\[[^\]]*\]/gu, '$1')
    .replace(/,(?=\S)/g, ', ')
    .trim();
}

/**
 * All readings of `word`, best first: the one matching `pinyin` (how the word
 * is read here), then common words before proper names, and cross-references
 * such as "variant of …" last. Resolves to [] if the word isn't listed.
 */
export async function lookupCedict(word: string, pinyin?: string): Promise<DictReading[]> {
  if (!word) return [];
  const shard = await loadShard(shardOf(word));
  const readings = shard[word];
  if (!readings) return [];

  const want = pinyin ? normalize(pinyin) : null;
  const score = ([py, defs]: Reading) => {
    let s = 0;
    if (want && normalize(py) === want) s -= 100;
    if (py[0] && py[0] !== py[0].toLowerCase()) s += 10; // proper noun
    if (defs.split('/').every(isMinor)) s += 20;
    return s;
  };

  return [...readings]
    .sort((a, b) => score(a) - score(b))
    .map(([py, defs]) => {
      const all = defs.split('/').filter(d => d && !isPronunciationNote(d)).map(tidyDefinition).filter(Boolean);
      // Keep cross-references only if that's all there is.
      const main = all.filter(d => !isMinor(d));
      return { pinyin: py, definitions: (main.length ? main : all).slice(0, MAX_DEFINITIONS) };
    });
}
