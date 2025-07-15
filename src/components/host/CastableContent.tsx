import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { captureRef } from 'react-native-view-shot';
import CastingService from '../../services/castingService';

interface CastableContentProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  isCasting?: boolean;
  backgroundColor?: string;
}

export default function CastableContent({ 
  children, 
  title, 
  subtitle, 
  isCasting = false,
  backgroundColor = '#0f172a' 
}: CastableContentProps) {
  const contentRef = useRef<View>(null);
  const [contentUri, setContentUri] = useState<string | null>(null);

  useEffect(() => {
    if (isCasting) {
      startCastingContent();
    } else {
      stopCastingContent();
    }
  }, [isCasting]);

  const startCastingContent = async () => {
    try {
      // For now, we'll just log that casting would start
      // In a full implementation, this would capture the content and send it to the cast device
      console.log('Starting cast for:', title);
      
      await CastingService.startCasting({
        title,
        subtitle,
        content: children,
        backgroundColor,
      });
    } catch (error) {
      console.error('Error starting cast:', error);
    }
  };

  const stopCastingContent = async () => {
    try {
      await CastingService.stopCasting();
      setContentUri(null);
    } catch (error) {
      console.error('Error stopping cast:', error);
    }
  };

  // For AirPlay support, we can use a Video component with native controls
  const renderAirPlayContent = () => (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Hidden video element for AirPlay - this would be used to trigger AirPlay */}
      <Video
        style={styles.hiddenVideo}
        useNativeControls={true}
        shouldPlay={false}
        isLooping={false}
        // This would be a stream URL or local content for casting
        source={{ uri: contentUri || '' }}
        resizeMode={ResizeMode.CONTAIN}
      />
      
      {/* Actual content display */}
      <View ref={contentRef} style={styles.content}>
        {children}
      </View>
    </View>
  );

  // For Chromecast support, we would use the Google Cast SDK
  const renderChromecastContent = () => (
    <View ref={contentRef} style={[styles.container, { backgroundColor }]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View ref={contentRef} style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  hiddenVideo: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    width: 1,
    height: 1,
    opacity: 0,
  },
});