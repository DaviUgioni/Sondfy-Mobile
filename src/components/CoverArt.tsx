import React, { useEffect, useState } from 'react';
import { View, Image, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { colors, radius } from '../theme';
import { MusicNoteIcon } from './Icon';

type Props = {
  /** Cor sólida de fundo quando não há capa. */
  color?: string;
  /** URL da capa (thumbnail do vídeo de origem). */
  uri?: string;
  size: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle & ImageStyle>;
};

/**
 * Capa da faixa. Com `uri` mostra a imagem real; sem imagem (ou se falhar o
 * carregamento) cai para o placeholder escuro (#282828) com nota musical.
 */
export default function CoverArt({
  color = colors.placeholder,
  uri,
  size,
  borderRadius = radius.thumb,
  style,
}: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const box = { width: size, height: size, borderRadius };

  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        style={[box, { backgroundColor: colors.placeholder }, style] as StyleProp<ImageStyle>}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View
      style={[
        box,
        { backgroundColor: color, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <MusicNoteIcon size={size * 0.42} color={colors.textFaint} />
    </View>
  );
}
