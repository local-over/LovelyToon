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

  publishBackgroundMessage(pairingCode, songData) {
    return new Promise((resolve, reject) => {
      // If already connected in foreground, just publish and resolve immediately
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

      // Otherwise, create a temporary background connection
      const clientId = `lovelytoon_bg_${Math.random().toString(16).substr(2, 8)}`;
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

  checkAndClaimRoom(code) {
    return new Promise((resolve) => {
      const clientId = `lovelytoon_check_${Math.random().toString(16).substr(2, 8)}`;
      const tempClient = mqtt.connect('wss://broker.hivemq.com:8884/mqtt', {
        clientId,
        clean: true,
        connectTimeout: 5000,
      });

      let claimed = false;

      tempClient.on('connect', () => {
        tempClient.subscribe(`lovelytoon/room/${code}/created`);
        
        // Wait 1 second to see if a retained message arrives
        const timeout = setTimeout(() => {
          if (!claimed) {
            // Claim it by publishing a retained message
            tempClient.publish(`lovelytoon/room/${code}/created`, '1', { qos: 1, retain: true });
            tempClient.end();
            resolve(true); // Successfully claimed
          }
        }, 1000);

        tempClient.on('message', (topic, message) => {
          if (topic === `lovelytoon/room/${code}/created`) {
            // Room is already taken
            claimed = true;
            clearTimeout(timeout);
            tempClient.end();
            resolve(false); 
          }
        });
      });

      tempClient.on('error', () => {
        tempClient.end();
        // If error, assume taken just to be safe, or retry. We'll resolve false.
        resolve(false);
      });
    });
  }
}

export const mqttService = new MqttService();
