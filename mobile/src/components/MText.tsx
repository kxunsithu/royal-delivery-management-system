/**
 * MText – Myanmar-aware Text component.
 * Always renders with NotoSansMyanmar font so Burmese glyphs
 * are displayed correctly on all Android / iOS versions.
 *
 * Usage: import { MText } from '../components/MText';
 *        <MText style={styles.title}>ပါဆယ်များ</MText>
 */
import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { FONTS } from '../constants';

export function MText({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.base, style]} />;
}

const styles = StyleSheet.create({
  base: {
    fontFamily: FONTS.regular,
  },
});

