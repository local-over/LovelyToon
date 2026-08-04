import mqtt from 'mqtt';

class MqttService {
  constructor() {
    this.client = null;
    this.pairingCode = null;
    this.callbacks = {
      onMessage: null,
      onConnect: null,
      onError: null,
    };
  }

  connect(pairingCode) {
    if (this.client) {
      this.client.end();
    }
    
    this.pairingCode = pairingCode;
    
    const clientId = `lovelytoon_${Math.random().toString(16).substr(2, 8)}`;
    this.client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
      clientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    this.client.on('connect', () => {
      console.log('MQTT Connected');
      if (this.pairingCode) {
        this.client.subscribe(`lovelytoon/room/${this.pairingCode}/now_playing`);
      }
      if (this.callbacks.onConnect) {
        this.callbacks.onConnect();
      }
    });

    this.client.on('message', (topic, message) => {
      if (topic === `lovelytoon/room/${this.pairingCode}/now_playing`) {
        try {
          const data = JSON.parse(message.toString());
          if (this.callbacks.onMessage) {
            this.callbacks.onMessage(data);
          }
        } catch (e) {
          console.error('Failed to parse MQTT message', e);
        }
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
}

export const mqttService = new MqttService();
