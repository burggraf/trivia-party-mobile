import React, { useState } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { Video, ResizeMode } from 'expo-av';

interface NativeAirPlayButtonProps {
  onAirPlayStatusChange?: (isAirPlaying: boolean) => void;
  disabled?: boolean;
  style?: any;
}

export default function NativeAirPlayButton({ onAirPlayStatusChange, disabled, style }: NativeAirPlayButtonProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [isAirPlaying, setIsAirPlaying] = useState(false);

  // Only show on iOS
  if (Platform.OS !== 'ios') {
    return null;
  }

  const handleAirPlayPress = () => {
    if (isAirPlaying) {
      // Stop AirPlay
      setShowVideo(false);
      setIsAirPlaying(false);
      onAirPlayStatusChange?.(false);
    } else {
      // Start AirPlay by showing the video with native controls
      setShowVideo(true);
      Alert.alert(
        'AirPlay Instructions',
        'Tap the AirPlay button in the video controls to connect to your TV, then tap "Done" to hide the video controls.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded && status.isAirPlaying !== undefined) {
      const currentlyAirPlaying = status.isAirPlaying;
      if (currentlyAirPlaying !== isAirPlaying) {
        setIsAirPlaying(currentlyAirPlaying);
        onAirPlayStatusChange?.(currentlyAirPlaying);
      }
    }
  };

  const handleDonePress = () => {
    setShowVideo(false);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Show video with native controls when AirPlay is being set up */}
      {showVideo && (
        <View style={styles.videoOverlay}>
          <Video
            style={styles.video}
            source={{ uri: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' }}
            useNativeControls={true}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={true}
            isLooping={true}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          />
          <Button
            mode="contained"
            onPress={handleDonePress}
            style={styles.doneButton}
          >
            Done
          </Button>
        </View>
      )}
      
      {/* AirPlay control button */}
      <Button
        mode={isAirPlaying ? "contained" : "outlined"}
        onPress={handleAirPlayPress}
        disabled={disabled}
        icon="airplay"
        style={[
          styles.button,
          isAirPlaying ? styles.activeButton : styles.inactiveButton
        ]}
        labelStyle={isAirPlaying ? styles.activeButtonText : undefined}
      >
        {isAirPlaying ? 'Stop AirPlay' : 'AirPlay'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  videoOverlay: {
    position: 'absolute',
    top: -200,
    left: -100,
    right: -100,
    height: 250,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 12,
    padding: 16,
    zIndex: 1000,
  },
  video: {
    flex: 1,
    backgroundColor: 'black',
    borderRadius: 8,
  },
  doneButton: {
    marginTop: 12,
    backgroundColor: '#10b981',
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