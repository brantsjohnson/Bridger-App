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
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = typeof params.slug === 'string' ? params.slug : 'road-trip';

  return (
    <QuizHost
      slug={slug}
      onClose={() => {
        if (router.canGoBack()) router.back();
        else router.replace('/home');
      }}
    />
  );
}
