import React, { useCallback, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  Platform,
  Share,
} from 'react-native';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export interface PreviewImage {
  id: number | string;
  url: string;
  original_name?: string;
}

interface Props {
  visible: boolean;
  images: PreviewImage[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ImagePreviewModal({ visible, images, initialIndex = 0, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const flatRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showUI, setShowUI] = useState(true);

  // Reset index when modal opens
  const handleShow = useCallback(() => {
    setCurrentIndex(initialIndex);
    setShowUI(true);
    // scroll to initial index after mount
    setTimeout(() => {
      flatRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    }, 50);
  }, [initialIndex]);

  const handleShare = async () => {
    try {
      await Share.share({ url: images[currentIndex]?.url ?? '' });
    } catch (_) {}
  };

  const renderItem = ({ item }: { item: PreviewImage }) => (
    <TouchableOpacity
      activeOpacity={1}
      style={styles.slide}
      onPress={() => setShowUI(v => !v)}
    >
      <Image
        source={{ uri: item.url }}
        style={styles.fullImage}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  if (images.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onShow={handleShow}
      onRequestClose={onClose}
    >
      <StatusBar hidden={!showUI} barStyle="light-content" />
      <View style={styles.backdrop}>

        {/* Top Bar */}
        {showUI && (
          <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 8 : 4) }]}>
            <TouchableOpacity style={styles.iconBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>

            <View style={styles.counterWrap}>
              <Ionicons name="images-outline" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.counterText}>
                {currentIndex + 1} / {images.length}
              </Text>
            </View>

            <TouchableOpacity style={styles.iconBtn} onPress={handleShare} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Image Pager */}
        <FlatList
          ref={flatRef}
          data={images}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
          getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
          initialScrollIndex={initialIndex}
          decelerationRate="fast"
          bounces={false}
        />

        {/* Bottom filename bar */}
        {showUI && images[currentIndex]?.original_name && (
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
            <Ionicons name="document-outline" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={styles.filename} numberOfLines={1}>
              {images[currentIndex].original_name}
            </Text>
          </View>
        )}

        {/* Dot indicators */}
        {showUI && images.length > 1 && (
          <View style={[styles.dots, { bottom: (images[currentIndex]?.original_name ? 60 : 20) + insets.bottom }]}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === currentIndex && styles.dotActive]}
              />
            ))}
          </View>
        )}

        {/* Prev / Next arrows */}
        {showUI && images.length > 1 && (
          <>
            {currentIndex > 0 && (
              <TouchableOpacity
                style={[styles.navBtn, styles.navLeft]}
                onPress={() => {
                  const next = currentIndex - 1;
                  flatRef.current?.scrollToIndex({ index: next, animated: true });
                  setCurrentIndex(next);
                }}
              >
                <Ionicons name="chevron-back" size={28} color="#fff" />
              </TouchableOpacity>
            )}
            {currentIndex < images.length - 1 && (
              <TouchableOpacity
                style={[styles.navBtn, styles.navRight]}
                onPress={() => {
                  const next = currentIndex + 1;
                  flatRef.current?.scrollToIndex({ index: next, animated: true });
                  setCurrentIndex(next);
                }}
              >
                <Ionicons name="chevron-forward" size={28} color="#fff" />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  counterWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  counterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  slide: {
    width: SCREEN_W,
    height: SCREEN_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullImage: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingTop: 10,
    paddingHorizontal: 24,
  },
  filename: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    flexShrink: 1,
  },
  dots: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    zIndex: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 18,
    borderRadius: 3,
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -26,
    zIndex: 10,
    width: 44,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
  },
  navLeft: { left: 8 },
  navRight: { right: 8 },
});
