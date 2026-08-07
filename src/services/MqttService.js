import mqtt from 'mqtt';

class MqttService {
  constructor() {
    this.client = null;
    this.pairingCode = null;
    this.userInfo = null; // { userId, name }
    this.callbacks = {
      onMessage: null,
      onConnect: null,
      onError: null,
      onPresence: null,
    };
  }

  connect(pairingCode, userInfo) {
    if (this.client) {
      this.client.end();
    }
    
    this.pairingCode = pairingCode;
    this.userInfo = userInfo;
    
    const clientId = `lt_${userInfo?.userId || 'anon'}_${Math.random().toString(16).substr(2, 4)}`;
    this.client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
      clientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    this.client.on('connect', () => {
      console.log('MQTT Connected');
      if (this.pairingCode) {
        // Subscribe to music messages and presence announcements
        this.client.subscribe(`lovelytoon/room/${this.pairingCode}/now_playing`);
        this.client.subscribe(`lovelytoon/room/${this.pairingCode}/presence/+`);
        
        // Announce ourselves with a retained presence message
        if (this.userInfo) {
          this.client.publish(
            `lovelytoon/room/${this.pairingCode}/presence/${this.userInfo.userId}`,
            JSON.stringify({
              userId: this.userInfo.userId,
              name: this.userInfo.name,
              timestamp: Date.now(),
            }),
            { qos: 1, retain: true }
          );
        }
      }
      if (this.callbacks.onConnect) {
        this.callbacks.onConnect();
      }
    });

    this.client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (topic === `lovelytoon/room/${this.pairingCode}/now_playing`) {
          if (this.callbacks.onMessage) {
            this.callbacks.onMessage(data);
          }
        } else if (topic.startsWith(`lovelytoon/room/${this.pairingCode}/presence/`)) {
          if (this.callbacks.onPresence) {
            this.callbacks.onPresence(data);
          }
        }
      } catch (e) {
        console.error('Failed to parse MQTT message', e);
      }
    });

    this.client.on('error', (err) => {
      console.error('MQTT Error', err);
      if (this.callbacks.onError) {
        this.callbacks.onError(err);
      }
    });
  }

  publishNowPlaying(songData) {
    if (this.client && this.client.connected && this.pairingCode) {
      this.client.publish(
        `lovelytoon/room/${this.pairingCode}/now_playing`,
        JSON.stringify(songData),
        { qos: 1, retain: true }
      );
    }
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  publishBackgroundMessage(pairingCode, songData) {
    return new Promise((resolve, reject) => {
      if (this.client && this.client.connected && this.pairingCode === pairingCode) {
        this.client.publish(
          `lovelytoon/room/${pairingCode}/now_playing`,
          JSON.stringify(songData),
          { qos: 1, retain: true },
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
        return;
      }

      const clientId = `lt_bg_${Math.random().toString(16).substr(2, 8)}`;
      const tempClient = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
        clientId,
        clean: true,
        connectTimeout: 5000,
      });

      tempClient.on('connect', () => {
        tempClient.publish(
          `lovelytoon/room/${pairingCode}/now_playing`,
          JSON.stringify(songData),
          { qos: 1, retain: true },
          (err) => {
            tempClient.end();
            if (err) reject(err);
            else resolve();
          }
        );
      });

      tempClient.on('error', (err) => {
        tempClient.end();
        reject(err);
      });
    });
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
    }
    this.pairingCode = null;
    this.userInfo = null;
  }
}

export const mqttService = new MqttService();
