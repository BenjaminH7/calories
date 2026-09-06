import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { Platform, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModalHeader } from '@/components/ModalHeader';
import { Button, Card, Chip, Row, SectionTitle, Txt } from '@/components/ui';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { buildExport, loggedDayCount, type ExportFormat, type ExportInput } from '@/lib/export';
import { useAppStore } from '@/store/useAppStore';

const RANGES = [
  { days: 7, label: '7 jours' },
  { days: 14, label: '14 jours' },
  { days: 30, label: '30 jours' },
  { days: 90, label: '90 jours' },
];

/**
 * Exporte le journal sur une période, en Markdown (lisible par un LLM) ou en
 * JSON (parsable). Copie dans le presse-papiers ou partage vers une autre app.
 */
export default function ExportScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const entries = useAppStore((s) => s.entries);
  const events = useAppStore((s) => s.events);
  const profile = useAppStore((s) => s.profile);
  const calorieGoal = useAppStore((s) => s.calorieGoal);
  const proteinGoal = useAppStore((s) => s.proteinGoal);

  const [days, setDays] = useState(7);
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [copied, setCopied] = useState(false);

  const input: ExportInput = { entries, events, profile, calorieGoal, proteinGoal, days };
  const content = useMemo(() => buildExport(input, format), [entries, events, profile, calorieGoal, proteinGoal, days, format]);
  const logged = useMemo(() => loggedDayCount(input), [entries, days]);

  const copy = async () => {
    await Clipboard.setStringAsync(content);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const share = () => Share.share({ message: content });

  return (
    <View style={{ flex: 1, paddingTop: insets.top + Spacing.three }}>
      <ModalHeader title="Exporter mon journal" subtitle="Pour l'envoyer à ton LLM" />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: Spacing.five,
          paddingBottom: insets.bottom + Spacing.seven,
          gap: Spacing.four,
        }}>
        <Card style={{ gap: Spacing.four }}>
          <SectionTitle>Période</SectionTitle>
          <Row gap={Spacing.two} style={{ flexWrap: 'wrap' }}>
            {RANGES.map((r) => (
              <Chip key={r.days} label={r.label} selected={days === r.days} onPress={() => setDays(r.days)} />
            ))}
          </Row>
          <Txt variant="caption" muted>
            {logged === 0
              ? 'Aucun jour renseigné sur cette période.'
              : `${logged} jour${logged > 1 ? 's' : ''} renseigné${logged > 1 ? 's' : ''} sur ${days}.`}
          </Txt>
        </Card>

        <Card style={{ gap: Spacing.four }}>
          <SectionTitle>Format</SectionTitle>
          <Row gap={Spacing.two}>
            <Chip
              label="Texte lisible"
              selected={format === 'markdown'}
              onPress={() => setFormat('markdown')}
            />
            <Chip label="JSON" selected={format === 'json'} onPress={() => setFormat('json')} />
          </Row>
          <Txt variant="caption" muted>
            {format === 'markdown'
              ? 'Markdown : repas par repas, avec ton profil et tes objectifs en en-tête. À coller directement dans une conversation.'
              : 'JSON structuré : plus compact à parser si ton LLM doit calculer dessus.'}
          </Txt>
        </Card>

        <Row gap={Spacing.three}>
          <Button
            title={copied ? 'Copié ✓' : 'Copier'}
            onPress={copy}
            disabled={logged === 0}
            style={{ flex: 1 }}
          />
          <Button
            title="Partager"
            variant="secondary"
            onPress={share}
            disabled={logged === 0}
            style={{ flex: 1 }}
          />
        </Row>

        <Card style={{ gap: Spacing.three }}>
          <SectionTitle>Aperçu</SectionTitle>
          <View
            style={{
              backgroundColor: t.cardAlt,
              borderRadius: Radius.md,
              padding: Spacing.four,
              maxHeight: 320,
            }}>
            <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
              <Txt style={{ fontFamily: Fonts.mono, fontSize: 11, lineHeight: 16 }}>{content}</Txt>
            </ScrollView>
          </View>
          <Txt variant="caption" muted>
            {content.length.toLocaleString('fr-FR')} caractères.
          </Txt>
        </Card>
      </ScrollView>
    </View>
  );
}
