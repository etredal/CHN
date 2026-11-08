// Chinese display names for story categories (the data keeps English keys).
export const CATEGORY_ZH: Record<string, string> = {
  Fiction: '小说',
  History: '历史',
  Society: '社会',
  Philosophy: '哲学',
};

export const categoryZh = (category: string): string => CATEGORY_ZH[category] ?? category;
