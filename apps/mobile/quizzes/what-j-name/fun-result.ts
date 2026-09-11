// ============================================
// WHAT THIS FILE DOES (plain English):
// Remembers the latest "retake for fun" J-name result on this phone only.
// The first real result stays on the server for friends and matching.
// This fun copy is never uploaded and never used for compatibility.
// ============================================
import AsyncStorage from '@react-native-async-storage/async-storage';

const FUN_KEY = 'bridger.quiz.jname.fun.v1';

export type JnameFunResult = {
  jName: string;
  percent: number;
  savedAt: number;
};

// THIS SECTION DOES: load the last fun retake saved on this device.
export async function loadJnameFunResult(): Promise<JnameFunResult | null> {
  try {
    const raw = await AsyncStorage.getItem(FUN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as JnameFunResult;
    if (!parsed?.jName || typeof parsed.percent !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

// THIS SECTION DOES: remember a new fun retake on this phone only.
export async function saveJnameFunResult(result: {
  jName: string;
  percent: number;
}): Promise<void> {
  try {
    const payload: JnameFunResult = { ...result, savedAt: Date.now() };
    await AsyncStorage.setItem(FUN_KEY, JSON.stringify(payload));
  } catch {
    // Storage full: the on-screen fun result still shows this session.
  }
}
