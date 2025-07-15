import { Platform } from 'react-native';
import { Video, AVPlaybackStatus } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';

export interface CastDevice {
  id: string;
  name: string;
  type: 'airplay' | 'chromecast';
  isConnected: boolean;
}

export interface CastContent {
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  backgroundColor?: string;
}

class CastingService {
  private static instance: CastingService;
  private availableDevices: CastDevice[] = [];
  private connectedDevice: CastDevice | null = null;
  private castingCallbacks: ((devices: CastDevice[]) => void)[] = [];
  private connectionCallbacks: ((device: CastDevice | null) => void)[] = [];

  static getInstance(): CastingService {
    if (!CastingService.instance) {
      CastingService.instance = new CastingService();
    }
    return CastingService.instance;
  }

  // Initialize casting services
  async initialize(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await this.initializeAirPlay();
      } else if (Platform.OS === 'android') {
        await this.initializeChromecast();
      }
    } catch (error) {
      console.error('Error initializing casting service:', error);
    }
  }

  // iOS AirPlay initialization
  private async initializeAirPlay(): Promise<void> {
    // AirPlay is handled through expo-av's Video component
    // We'll check for AirPlay availability when needed
    console.log('AirPlay initialized for iOS');
  }

  // Android Chromecast initialization  
  private async initializeChromecast(): Promise<void> {
    try {
      // Initialize Google Cast SDK
      // This would typically be done with react-native-google-cast
      console.log('Chromecast initialized for Android');
    } catch (error) {
      console.error('Error initializing Chromecast:', error);
    }
  }

  // Check if casting is available on the current platform
  isCastingAvailable(): boolean {
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  // Get available cast devices
  async getAvailableDevices(): Promise<CastDevice[]> {
    if (Platform.OS === 'ios') {
      // For iOS, AirPlay devices are discovered automatically by the system
      // We'll return a generic AirPlay option
      return [
        {
          id: 'airplay',
          name: 'AirPlay',
          type: 'airplay',
          isConnected: false,
        },
      ];
    } else if (Platform.OS === 'android') {
      // For Android, we would scan for Chromecast devices
      // This is a simplified implementation
      return [
        {
          id: 'chromecast',
          name: 'Cast to TV',
          type: 'chromecast',
          isConnected: false,
        },
      ];
    }
    return [];
  }

  // Connect to a cast device
  async connectToDevice(deviceId: string): Promise<boolean> {
    try {
      const devices = await this.getAvailableDevices();
      const device = devices.find(d => d.id === deviceId);
      
      if (!device) {
        throw new Error('Device not found');
      }

      if (Platform.OS === 'ios' && device.type === 'airplay') {
        // For AirPlay, connection is handled by the Video component
        this.connectedDevice = { ...device, isConnected: true };
        this.notifyConnectionChange(this.connectedDevice);
        return true;
      } else if (Platform.OS === 'android' && device.type === 'chromecast') {
        // For Chromecast, we would use react-native-google-cast
        this.connectedDevice = { ...device, isConnected: true };
        this.notifyConnectionChange(this.connectedDevice);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error connecting to cast device:', error);
      return false;
    }
  }

  // Disconnect from current device
  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      this.connectedDevice = null;
      this.notifyConnectionChange(null);
    }
  }

  // Get currently connected device
  getConnectedDevice(): CastDevice | null {
    return this.connectedDevice;
  }

  // Check if currently casting
  isCasting(): boolean {
    return this.connectedDevice?.isConnected || false;
  }

  // Subscribe to device availability changes
  onDevicesChanged(callback: (devices: CastDevice[]) => void): () => void {
    this.castingCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.castingCallbacks.indexOf(callback);
      if (index > -1) {
        this.castingCallbacks.splice(index, 1);
      }
    };
  }

  // Subscribe to connection changes
  onConnectionChanged(callback: (device: CastDevice | null) => void): () => void {
    this.connectionCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.connectionCallbacks.indexOf(callback);
      if (index > -1) {
        this.connectionCallbacks.splice(index, 1);
      }
    };
  }

  // Notify callbacks of device changes
  private notifyDeviceChange(devices: CastDevice[]): void {
    this.castingCallbacks.forEach(callback => callback(devices));
  }

  // Notify callbacks of connection changes
  private notifyConnectionChange(device: CastDevice | null): void {
    this.connectionCallbacks.forEach(callback => callback(device));
  }

  // Start casting content (this would be implemented based on the specific casting solution)
  async startCasting(content: CastContent): Promise<boolean> {
    if (!this.connectedDevice) {
      throw new Error('No device connected');
    }

    try {
      if (Platform.OS === 'ios') {
        // For iOS AirPlay, this would be handled by the Video component's useNativeControls
        console.log('Starting AirPlay cast:', content.title);
        return true;
      } else if (Platform.OS === 'android') {
        // For Android Chromecast, this would use Google Cast SDK
        console.log('Starting Chromecast:', content.title);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error starting cast:', error);
      return false;
    }
  }

  // Stop casting
  async stopCasting(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        console.log('Stopping AirPlay cast');
      } else if (Platform.OS === 'android') {
        console.log('Stopping Chromecast');
      }
    } catch (error) {
      console.error('Error stopping cast:', error);
    }
  }
}

export default CastingService.getInstance();