// Конфиг секретного квеста. Ответы хранятся только как SHA-256 хэши —
// в исходниках страницы их не подсмотреть.

export type SecretStage = {
  /** Заголовок этапа */
  title: string;
  /** Зашифрованный вопрос, который нужно сначала расшифровать */
  ciphertext: string;
  /** Подсказка (открывается по расписанию: этап N — через N*5 дней после находки) */
  hint: string;
  /** SHA-256 хэши допустимых ответов (после нормализации) */
  answerHashes: string[];
};

export const SECRET_STAGES: SecretStage[] = [
  {
    title: 'Шифр первый',
    ciphertext: 'ЦПУРБПУ ЙТКО СА З ПЕМЕТН?',
    hint: 'Это шифр Цезаря: каждая буква убежала вперёд на пять шагов. Верни её назад по алфавиту — и прочитаешь вопрос.',
    answerHashes: [
      'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d', // 5
      'abd18920076c974f4405610f0c459b988d218cef24854532242a2fe63238780c', // пять
    ],
  },
  {
    title: 'Шифр второй',
    ciphertext: 'ОХСФГХС УЪОАЙЪЭ УД ЭОНПЪИЯЪУОА?',
    hint: 'Это Атбаш: алфавит отражён зеркально — А меняется с Я, Б с Ю, В с Э, и так до середины.',
    answerHashes: [
      '19581e27de7ced00ff1ce50b2047e7a567c76b1cbaebabe5ef03f7c3017bb5b7', // 9
      '00a402aa6ca0805361aba25307c44bf778ca32fe94d5f38d32ab90b0e3982edc', // девять
    ],
  },
  {
    title: 'Шифр третий',
    ciphertext:
      '8-1  /  18-11-15-12-29-11-15  /  5-14-6-10  /  16-15  /  12-6-4-6-14-5-6  /  16-15-18-19-17-15-9-12-9  /  2-1-25-14-31  /  18-31-31-13-2-9-11-6',
    hint: 'Каждое число — номер буквы в алфавите (Ё не считается). А ответ на сам вопрос прячется на странице «Истории».',
    answerHashes: [
      '7902699be42c8a8e46fbbb4501726517e86b22c56a189f7625a6da49081b2451', // 7
      '955b6674ce7b8a02c887b6b0c3daac7bd07f1fae8f9e1d0ea76de8f0147ea958', // семь
    ],
  },
  {
    title: 'Шифр последний',
    ciphertext: 'ФАС Я ДЬГЕ ЙСТЯШ НЗЗИЮКЮ ШВЫЪ ХЮИИЩПИ?',
    hint: 'Шифр Виженера. Ключ — город, ради которого сделан весь этот сайт. От каждой буквы шифра отсчитай назад букву ключа.',
    answerHashes: [
      'b2ec71cfd2a108c79e0e59779fd12e9f550af87393342aea1315d6c199483893', // милая
    ],
  },
];

/** Дней между открытием подсказок */
export const HINT_INTERVAL_DAYS = 5;

export const STORAGE_KEY = 'kazan-secret-v1';

// Текст за замком. Замени на свой — например, прямо на GitHub в этом файле.
export const SECRET_LETTER = {
  title: 'Милая, спасибо ♥',
  paragraphs: [
    'Огромное спасибо, что ты прошла все головоломки. Я безумно благодарен тебе, что ты выделила на это время и свои силы.',
    'Ты большая молодец и молодешечка. Я очень сильно люблю тебя 💋',
  ],
  signature: 'Твой главный попутчик',
};

export function normalizeAnswer(s: string): string {
  return s.toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, '');
}

export async function hashAnswer(s: string): Promise<string> {
  const data = new TextEncoder().encode(normalizeAnswer(s));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
