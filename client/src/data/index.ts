import type { LongStory } from '../types';
import { hsk5NightTrain } from './hsk5_night_train';
import { hsk6BattleOfJulu } from './hsk6_battle_of_julu';
import { hsk5DigitalNomads } from './hsk5_digital_nomads';
import { hsk6ZhuangziOak } from './hsk6_zhuangzi_oak';

export { hsk5NightTrain, hsk6BattleOfJulu, hsk5DigitalNomads, hsk6ZhuangziOak };

export const ALL_STORIES: LongStory[] = [
  hsk5NightTrain,
  hsk6BattleOfJulu,
  hsk5DigitalNomads,
  hsk6ZhuangziOak,
];

export function getStoryById(id: string): LongStory | undefined {
  return ALL_STORIES.find(s => s.id === id);
}
