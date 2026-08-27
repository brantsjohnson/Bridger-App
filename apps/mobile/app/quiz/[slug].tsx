// ============================================
// WHAT THIS FILE DOES (plain English):
// The quiz take route. Home (or Profile archive) pushes here with a slug;
// QuizHost loads the matching plugin and runs the take → result flow.
// ============================================
import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { QuizHost } from '../../quizzes/_host/QuizHost';

export default function QuizSlugScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ slug: string | string[] }>();
  // Expo Router can hand back a string or a one-item array; normalize it.
  const raw = params.slug;
  const slug = Array.isArray(raw) ? raw[0] : raw;
  const resolved = typeof slug === 'string' && slug.length ? slug : 'what-j-name';

  return (
    <QuizHost
      slug={resolved}
      onClose={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/home');
      }}
    />
  );
}
