// TEMPORARY design preview route: renders all seven J-name posters so the
// collage layout can be eyeballed without playing the quiz. Delete before ship.
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ResultCardStage } from '../../quizzes/what-j-name/ResultCardStage';

const NAMES: Array<[string, number]> = [
  ['Justin', 82],
  ['Josh', 64],
  ['Joey', 91],
  ['James', 47],
  ['Jake', 100],
  ['Jared', 13],
  ['John', 55]
];

export default function PreviewCards() {
  return (
    <ScrollView style={{ backgroundColor: '#143CAB' }} contentContainerStyle={{ padding: 12, gap: 24 }}>
      {NAMES.map(([n, p]) => (
        <View key={n}>
          <Text style={{ marginBottom: 6 }}>{n}</Text>
          <ResultCardStage jName={n} percent={p} />
        </View>
      ))}
    </ScrollView>
  );
}
