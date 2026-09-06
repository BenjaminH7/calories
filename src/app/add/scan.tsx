import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModalHeader } from '@/components/ModalHeader';
import { Button, Card, Txt } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { today } from '@/lib/date';
import type { Meal } from '@/store/types';

/** Codes-barres alimentaires courants (EAN/UPC). */
const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] as const;

export default function ScanScreen() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ day?: string; meal?: Meal }>();
  const day = params.day ?? today();
  const meal = params.meal;

  const [permission, requestPermission] = useCameraPermissions();
  const [manualTorch, setManualTorch] = useState(false);
  // Empêche les lectures multiples pendant la navigation.
  const lockedRef = useRef(false);

  const onScanned = ({ data }: { data: string }) => {
    if (lockedRef.current || !data) return;
    lockedRef.current = true;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace({ pathname: '/add/portion', params: { barcode: data, day, meal } });
  };

  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: t.background }} />;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, paddingTop: insets.top + Spacing.three }}>
        <ModalHeader title="Scanner" />
        <View style={{ padding: Spacing.five, gap: Spacing.four }}>
          <Card style={{ gap: Spacing.three }}>
            <Txt variant="heading">Accès à la caméra</Txt>
            <Txt variant="body" muted>
              L&apos;app a besoin de la caméra pour lire les codes-barres. Aucune image n&apos;est
              enregistrée ni envoyée.
            </Txt>
          </Card>
          <Button title="Autoriser la caméra" onPress={requestPermission} />
          <Button
            title="Saisir à la main"
            variant="secondary"
            onPress={() => router.replace({ pathname: '/add/manual', params: { day, meal } })}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={manualTorch}
        barcodeScannerSettings={{ barcodeTypes: [...BARCODE_TYPES] }}
        onBarcodeScanned={onScanned}
      />

      <View style={{ flex: 1, paddingTop: insets.top + Spacing.three }}>
        <ModalHeader title="" />

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={{
              width: '78%',
              aspectRatio: 1.5,
              borderRadius: Radius.lg,
              borderWidth: 3,
              borderColor: '#FFFFFF',
            }}
          />
          <Txt variant="body" color="#FFFFFF" style={{ marginTop: Spacing.five, textAlign: 'center' }}>
            Vise le code-barres du produit
          </Txt>
        </View>

        <View style={{ padding: Spacing.five, gap: Spacing.three, paddingBottom: insets.bottom + Spacing.five }}>
          <Button
            title={manualTorch ? 'Éteindre la lampe' : 'Allumer la lampe'}
            variant="secondary"
            onPress={() => setManualTorch((v) => !v)}
          />
          <Button
            title="Saisie manuelle"
            variant="secondary"
            onPress={() => router.replace({ pathname: '/add/manual', params: { day, meal } })}
          />
        </View>
      </View>
    </View>
  );
}
