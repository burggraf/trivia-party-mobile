import React, { useRef, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { Video, ResizeMode } from 'expo-av';

interface AirPlayButtonProps {
  onAirPlayStatusChange?: (isAirPlaying: boolean) => void;
  disabled?: boolean;
  style?: any;
}

export default function AirPlayButton({ onAirPlayStatusChange, disabled, style }: AirPlayButtonProps) {
  const videoRef = useRef<Video>(null);
  const [isAirPlaying, setIsAirPlaying] = useState(false);

  // Only show on iOS
  if (Platform.OS !== 'ios') {
    return null;
  }

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      const currentlyAirPlaying = status.isAirPlaying || false;
      if (currentlyAirPlaying !== isAirPlaying) {
        setIsAirPlaying(currentlyAirPlaying);
        onAirPlayStatusChange?.(currentlyAirPlaying);
      }
    }
  };

  const handleAirPlayPress = () => {
    // The Video component with useNativeControls will show the native AirPlay picker
    // We just need to make sure the video is ready to play
    if (videoRef.current) {
      videoRef.current.playAsync();
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Hidden video component that enables AirPlay */}
      <Video
        ref={videoRef}
        style={styles.hiddenVideo}
        source={{ uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }} // Sample video for AirPlay
        useNativeControls={true}
        resizeMode={ResizeMode.CONTAIN}
        isLooping={true}
        shouldPlay={false}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
      />
      
      {/* Visible AirPlay button */}
      {isAirPlaying ? (
        <Button
          mode="contained"
          onPress={() => videoRef.current?.stopAsync()}
          disabled={disabled}
          icon="airplay"
          style={[styles.button, styles.activeButton]}
          labelStyle={styles.activeButtonText}
        >
          Stop AirPlay
        </Button>
      ) : (
        <Button
          mode="outlined"
          onPress={handleAirPlayPress}
          disabled={disabled}
          icon="airplay"
          style={[styles.button, styles.inactiveButton]}
        >
          AirPlay
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  hiddenVideo: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    top: -1000,
    left: -1000,
  },
  button: {
    minWidth: 120,
  },
  inactiveButton: {
    borderColor: '#60a5fa',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
  },
  activeButton: {
    backgroundColor: '#10b981',
  },
  activeButtonText: {
    color: 'white',
  },
});