import { Client, Account, Databases, ID, Query } from 'react-native-appwrite';
import 'react-native-url-polyfill/auto'; // Required for Appwrite

export const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = '6a9e7791001e17f24757';
export const DB_ID = 'lovelytoon_db';
export const ROOMS_COL = 'rooms';
export const NOW_PLAYING_COL = 'now_playing';

class AppwriteService {
  constructor() {
    this.client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID);

    this.account = new Account(this.client);
    this.databases = new Databases(this.client);
    this.realtimeUnsubscribe = null;
    
    this.currentUser = null;
    this.currentRoom = null;
    
    this.callbacks = {
      onMessage: null,
      onConnect: null,
      onError: null,
      onPresence: null,
    };
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  async getSession() {
    try {
      this.currentUser = await this.account.get();
      return this.currentUser;
    } catch (e) {
      return null;
    }
  }

  async signInAnonymous() {
    try {
      this.currentUser = await this.account.createAnonymousSession();
      return this.currentUser;
    } catch (e) {
      console.error('Anon login error', e);
      throw e;
    }
  }

  async signOut() {
    try {
      await this.account.deleteSession('current');
      this.currentUser = null;
    } catch (e) {
      console.error(e);
    }
  }

  async connectToRoom(code, userInfo, lockedPartnerId) {
    try {
      if (!this.currentUser) {
        await this.getSession();
        if (!this.currentUser) await this.signInAnonymous();
      }

      // Sync nickname to Appwrite account
      if (userInfo.name && this.currentUser.name !== userInfo.name) {
        try {
            await this.account.updateName(userInfo.name);
        } catch (e) {} // Ignore if anonymous user limits name change
      }

      this.currentRoom = code;
      this.disconnect();
      this.currentRoom = code;

      // Ensure room exists
      try {
        const rooms = await this.databases.listDocuments(DB_ID, ROOMS_COL, [
          Query.equal('code', code)
        ]);
        
        if (rooms.total === 0) {
          // Create room
          await this.databases.createDocument(DB_ID, ROOMS_COL, ID.unique(), {
            code: code,
            ownerId: this.currentUser.$id,
            ownerName: userInfo.name || 'Anonymous'
          });
        }
      } catch (e) {
        console.error('Error fetching/creating room', e);
      }

      // Ensure our NowPlaying doc exists
      await this.initNowPlayingDoc(code, this.currentUser.$id);

      // Subscribe to all NowPlaying changes in this room
      const channel = `databases.${DB_ID}.collections.${NOW_PLAYING_COL}.documents`;
      
      this.realtimeUnsubscribe = this.client.subscribe(channel, (response) => {
        const data = response.payload;
        
        if (data.roomId !== code) return;
        if (data.userId === this.currentUser.$id) return;

        // Find partner name if we can
        let senderName = 'Partner';
        
        const songData = {
          title: data.title,
          artist: data.artist,
          albumArt: data.albumArt,
          status: data.status,
          sender: data.userId,
          senderName: senderName
        };

        if (this.callbacks.onMessage) {
          this.callbacks.onMessage(songData);
        }
      });

      if (this.callbacks.onConnect) {
        this.callbacks.onConnect();
      }

    } catch (e) {
      console.error('Room connection error', e);
      if (this.callbacks.onError) this.callbacks.onError(e);
    }
  }

  async initNowPlayingDoc(roomId, userId) {
    try {
      const docs = await this.databases.listDocuments(DB_ID, NOW_PLAYING_COL, [
        Query.equal('roomId', roomId),
        Query.equal('userId', userId)
      ]);

      if (docs.total === 0) {
        await this.databases.createDocument(DB_ID, NOW_PLAYING_COL, ID.unique(), {
          roomId: roomId,
          userId: userId,
          status: 'stopped',
          timestamp: Math.floor(Date.now() / 1000)
        });
      }
    } catch (e) {
      console.error('Init NowPlaying err', e);
    }
  }

  async publishNowPlaying(songData) {
    if (!this.currentRoom || !this.currentUser) return;
    try {
      const docs = await this.databases.listDocuments(DB_ID, NOW_PLAYING_COL, [
        Query.equal('roomId', this.currentRoom),
        Query.equal('userId', this.currentUser.$id)
      ]);

      if (docs.total > 0) {
        await this.databases.updateDocument(DB_ID, NOW_PLAYING_COL, docs.documents[0].$id, {
          title: songData.title || '',
          artist: songData.artist || '',
          albumArt: songData.albumArt || '',
          status: songData.status || 'stopped',
          timestamp: Math.floor(Date.now() / 1000)
        });
      } else {
        await this.initNowPlayingDoc(this.currentRoom, this.currentUser.$id);
        await this.publishNowPlaying(songData);
      }
    } catch (e) {
      console.error('Publish err', e);
    }
  }
  
  publishBackgroundMessage(pairingCode, songData) {
    return new Promise(async (resolve, reject) => {
      try {
        const clientBg = new Client()
          .setEndpoint(APPWRITE_ENDPOINT)
          .setProject(APPWRITE_PROJECT_ID);
        
        const accountBg = new Account(clientBg);
        const user = await accountBg.get();
        const dbBg = new Databases(clientBg);
        
        const docs = await dbBg.listDocuments(DB_ID, NOW_PLAYING_COL, [
          Query.equal('roomId', pairingCode),
          Query.equal('userId', user.$id)
        ]);

        if (docs.total > 0) {
          await dbBg.updateDocument(DB_ID, NOW_PLAYING_COL, docs.documents[0].$id, {
            title: songData.title || '',
            artist: songData.artist || '',
            albumArt: songData.albumArt || '',
            status: songData.status || 'stopped',
            timestamp: Math.floor(Date.now() / 1000)
          });
        }
        resolve();
      } catch(e) {
        reject(e);
      }
    });
  }

  disconnect() {
    if (this.realtimeUnsubscribe) {
      this.realtimeUnsubscribe();
      this.realtimeUnsubscribe = null;
    }
    this.currentRoom = null;
  }
}

export const appwriteService = new AppwriteService();
