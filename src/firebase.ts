import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, update, get, remove } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAxsxafS6H0YNR632AJIF13XVdXETHMKo0",
  authDomain: "college-diplomas.firebaseapp.com",
  databaseURL: "https://college-diplomas-default-rtdb.firebaseio.com",
  projectId: "college-diplomas",
  storageBucket: "college-diplomas.firebasestorage.app",
  messagingSenderId: "181367907290",
  appId: "1:181367907290:web:7cf85370be4c3194d9d6e3"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Путь до БД конкретного проекта конкретного студента в рамках реализации единной Firebase БД
const BASE_PATH = import.meta.env.VITE_PROJECT_PATH;

/**
 * Firebase Realtime Database запрещает значения `undefined` в записываемых объектах
 * (set/update выбрасывают исключение). Опциональные поля (icon, location, imageUrl и т.д.)
 * при редактировании могут оказаться undefined — эта функция рекурсивно убирает их,
 * чтобы запись всегда проходила успешно.
 */
const stripUndefined = <T>(value: T): T => {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(item => stripUndefined(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (item === undefined) continue;
    result[key] = stripUndefined(item);
  }
  return result as T;
};

export class FirebaseService {
  static async getData<T = unknown>(path: string): Promise<T | null> {
    const dataRef = ref(db, `${BASE_PATH}/${path}`);
    return new Promise<T | null>((resolve) => {
      onValue(dataRef, (snapshot) => {
        resolve(snapshot.val() as T | null);
      }, { onlyOnce: true });
    });
  }

  static async setData<T = unknown>(path: string, data: T): Promise<void> {
    const dataRef = ref(db, `${BASE_PATH}/${path}`);
    await set(dataRef, stripUndefined(data));
  }

  static async updateData(path: string, updates: Record<string, unknown>): Promise<void> {
    const dataRef = ref(db, `${BASE_PATH}/${path}`);
    await update(dataRef, stripUndefined(updates));
  }

  static async removeData(path: string): Promise<void> {
    const dataRef = ref(db, `${BASE_PATH}/${path}`);
    await remove(dataRef);
  }

  static async getSnapshot<T = unknown>(path: string): Promise<T | null> {
    const dataRef = ref(db, `${BASE_PATH}/${path}`);
    const snapshot = await get(dataRef);
    return snapshot.val() as T | null;
  }
}

export default FirebaseService;
