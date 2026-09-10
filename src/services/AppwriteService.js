import { Client, Account, Databases, ID, Query } from 'react-native-appwrite';
import 'react-native-url-polyfill/auto'; // Required for Appwrite

export const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = '6a9e7791001e17f24757';
export const DB_ID = 'lovelytoon_db';
export const NOW_PLAYING_COL = 'now_playing';
export const INVITES_COL = 'invites';
export const RELATIONSHIPS_COL = 'relationships';

class AppwriteService {
  constructor() {
    this.client = new Client()
      .setEndpoint(APPWRITE_ENDPOINT)
      .setProject(APPWRITE_PROJECT_ID);

    this.account = new Account(this.client);
    this.databases = new Databases(this.client);
    this.realtimeUnsubscribe = null;
    
    this.currentUser = null;
    this.partnerId = null;
    
    this.callbacks = {
      onMessage: null,
      onConnect: null,
      onError: null,
    };
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // ── Auth Methods ──

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
      this.disconnect();
    } catch (e) {
      console.error(e);
    }
  }

  // ── Invite & Relationship Logic ──

  async createInvite(name) {
    if (!this.currentUser) return null;
    
    // Auto sync name just in case
    try { if (name && this.currentUser.name !== name) await this.account.updateName(name); } catch(e){}

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await this.databases.createDocument(DB_ID, INVITES_COL, ID.unique(), {
      code: code,
      inviterId: this.currentUser.$id,
      inviterName: name || this.currentUser.name || 'Partner',
      timestamp: Math.floor(Date.now() / 1000)
    });
    return code;
  }

  async getActiveInvite() {
    if (!this.currentUser) return null;
    try {
      const invites = await this.databases.listDocuments(DB_ID, INVITES_COL, [
        Query.equal('inviterId', this.currentUser.$id)
      ]);
      if (invites.total > 0) {
        return invites.documents[0].code;
      }
    } catch (e) {
      console.error('Error fetching active invite:', e);
    }
    return null;
  }

  async consumeInvite(code, myName) {
    if (!this.currentUser) return null;
    try { if (myName && this.currentUser.name !== myName) await this.account.updateName(myName); } catch(e){}

    const invites = await this.databases.listDocuments(DB_ID, INVITES_COL, [
      Query.equal('code', code)
    ]);

    if (invites.total === 0) throw new Error('Invalid or expired invite code');

    const invite = invites.documents[0];
    const partnerId = invite.inviterId;

    if (partnerId === this.currentUser.$id) throw new Error('You cannot pair with yourself');

    // Create permanent relationship
    await this.databases.createDocument(DB_ID, RELATIONSHIPS_COL, ID.unique(), {
      users: [this.currentUser.$id, partnerId],
      lastActive: Math.floor(Date.now() / 1000)
    });

    // Delete the one-time invite
    await this.databases.deleteDocument(DB_ID, INVITES_COL, invite.$id);

    return { partnerId, partnerName: invite.inviterName };
  }

  async migrateAccount(partnerId, relationshipId, myName) {
    if (!this.currentUser) return null;
    try { if (myName && this.currentUser.name !== myName) await this.account.updateName(myName); } catch(e){}

    // Create new permanent relationship
    await this.databases.createDocument(DB_ID, RELATIONSHIPS_COL, ID.unique(), {
      users: [this.currentUser.$id, partnerId],
      lastActive: Math.floor(Date.now() / 1000)
    });

    // Try to cleanup the old relationship
    if (relationshipId) {
      try {
        await this.databases.deleteDocument(DB_ID, RELATIONSHIPS_COL, relationshipId);
      } catch (e) {}
    }

    return { partnerId, partnerName: 'Partner' };
  }

  async getRelationship() {
    if (!this.currentUser) return null;
    const rels = await this.databases.listDocuments(DB_ID, RELATIONSHIPS_COL, [
      Query.contains('users', [this.currentUser.$id]),
      Query.orderDesc('lastActive')
    ]);

    if (rels.total > 0) {
      const rel = rels.documents[0];
      const partnerId = rel.users.find(id => id !== this.currentUser.$id);
      this.relationshipId = rel.$id;
      
      // Update last active to prevent the 1-year cleanup
      try {
        await this.databases.updateDocument(DB_ID, RELATIONSHIPS_COL, rel.$id, {
          lastActive: Math.floor(Date.now() / 1000)
        });
      } catch(e) {}
      
      return partnerId;
    }
    return null;
  }

  // ── Sync Logic ──

  async connectToPartner(partnerId) {
    try {
      this.disconnect();
      this.partnerId = partnerId;

      // Ensure our own NowPlaying doc exists so partner can subscribe to it
      await this.initNowPlayingDoc(this.currentUser.$id);

      // Subscribe to all NowPlaying changes globally
      const channel = `databases.${DB_ID}.collections.${NOW_PLAYING_COL}.documents`;
      
      this.realtimeUnsubscribe = this.client.subscribe(channel, (response) => {
        const data = response.payload;
        
        // Only react if the document belongs to our partner
        if (data.userId !== this.partnerId) return;

        const songData = {
          title: data.title,
          artist: data.artist,
          albumArt: data.albumArt,
          status: data.status,
          sender: data.userId,
          senderName: 'Partner' // The local StorageService/App can override this
        };

        if (this.callbacks.onMessage) {
          this.callbacks.onMessage(songData);
        }
      });

      if (this.callbacks.onConnect) {
        this.callbacks.onConnect();
      }

    } catch (e) {
      console.error('Partner connection error', e);
      if (this.callbacks.onError) this.callbacks.onError(e);
    }
  }

  async initNowPlayingDoc(userId) {
    try {
      const docs = await this.databases.listDocuments(DB_ID, NOW_PLAYING_COL, [
        Query.equal('userId', userId)
      ]);

      if (docs.total === 0) {
        await this.databases.createDocument(DB_ID, NOW_PLAYING_COL, ID.unique(), {
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
    if (!this.currentUser) return;
    try {
      const docs = await this.databases.listDocuments(DB_ID, NOW_PLAYING_COL, [
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
        await this.initNowPlayingDoc(this.currentUser.$id);
        await this.publishNowPlaying(songData); // Retry
      }
    } catch (e) {
      console.error('Publish err', e);
    }
  }
  
  publishBackgroundMessage(songData) {
    return new Promise(async (resolve, reject) => {
      try {
        const clientBg = new Client()
          .setEndpoint(APPWRITE_ENDPOINT)
          .setProject(APPWRITE_PROJECT_ID);
        
        const accountBg = new Account(clientBg);
        const user = await accountBg.get();
        const dbBg = new Databases(clientBg);
        
        const docs = await dbBg.listDocuments(DB_ID, NOW_PLAYING_COL, [
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
    if (this.relationshipUnsubscribe) {
      this.relationshipUnsubscribe();
      this.relationshipUnsubscribe = null;
    }
    this.partnerId = null;
  }

  subscribeToRelationships(callback) {
    if (!this.currentUser) return;
    
    // Unsubscribe if already listening
    if (this.relationshipUnsubscribe) {
      this.relationshipUnsubscribe();
    }
    
    const channel = `databases.${DB_ID}.collections.${RELATIONSHIPS_COL}.documents`;
    this.relationshipUnsubscribe = this.client.subscribe(channel, (response) => {
      const doc = response.payload;
      
      // If a relationship is created or updated, and we are in it
      if (doc.users && doc.users.includes(this.currentUser.$id)) {
        const partnerId = doc.users.find(id => id !== this.currentUser.$id);
        if (partnerId) {
          callback(partnerId);
        }
      }
    });
  }
}

export const appwriteService = new AppwriteService();
