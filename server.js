const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, 'frontend', 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'dist', 'index.html'));
});

// ── In-memory state ──
const profiles = new Map();   // uid → UserProfile
const groups = new Map();     // groupId → Group
const sessions = new Map();   // sessionId → Session
const socketUid = new Map();  // socketId → uid
const uidSockets = new Map(); // uid → Set<socketId>

function linkSocket(socketId, uid) {
  socketUid.set(socketId, uid);
  if (!uidSockets.has(uid)) uidSockets.set(uid, new Set());
  uidSockets.get(uid).add(socketId);
}

function joinGroupRooms(socket, profile) {
  for (const gid of profile.groupIds) {
    socket.join('g:' + gid);
    const g = groups.get(gid);
    if (g && g.currentSession) socket.join('s:' + g.currentSession);
  }
}

io.on('connection', (socket) => {

  // ── Register / Login ──
  socket.on('register', ({ uid, name, city, avatar }, cb) => {
    let profile = profiles.get(uid);
    if (profile) {
      profile.name = name;
      profile.city = city;
      profile.avatar = avatar;
      for (const gid of profile.groupIds) {
        const g = groups.get(gid);
        if (g && g.memberProfiles[uid]) {
          g.memberProfiles[uid] = { name, avatar };
        }
      }
    } else {
      profile = { uid, name, city, avatar, groupIds: [] };
      profiles.set(uid, profile);
    }
    linkSocket(socket.id, uid);
    joinGroupRooms(socket, profile);
    const myGroups = profile.groupIds.map(id => groups.get(id)).filter(Boolean);
    cb({ profile, groups: myGroups });
  });

  socket.on('reconnect-register', ({ uid }, cb) => {
    const profile = profiles.get(uid);
    if (!profile) return cb({ error: 'not_found' });
    linkSocket(socket.id, uid);
    joinGroupRooms(socket, profile);
    const myGroups = profile.groupIds.map(id => groups.get(id)).filter(Boolean);
    cb({ profile, groups: myGroups });
  });

  // ── Groups ──
  socket.on('createGroup', ({ name }, cb) => {
    const uid = socketUid.get(socket.id);
    const profile = profiles.get(uid);
    if (!profile) return cb({ error: 'לא מחובר' });

    const id = 'g-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const group = {
      id, name, code,
      members: [uid],
      memberProfiles: { [uid]: { name: profile.name, avatar: profile.avatar } },
      createdBy: uid,
    };
    groups.set(id, group);
    profile.groupIds.push(id);
    socket.join('g:' + id);
    cb({ group });
  });

  socket.on('joinGroup', ({ code }, cb) => {
    const uid = socketUid.get(socket.id);
    const profile = profiles.get(uid);
    if (!profile) return cb({ error: 'לא מחובר' });

    const upper = code.trim().toUpperCase();
    let found = null;
    for (const g of groups.values()) {
      if (g.code === upper) { found = g; break; }
    }
    if (!found) return cb({ error: 'לא נמצאה קבוצה עם הקוד הזה' });

    if (!found.members.includes(uid)) {
      found.members.push(uid);
      found.memberProfiles[uid] = { name: profile.name, avatar: profile.avatar };
      profile.groupIds.push(found.id);
    }
    socket.join('g:' + found.id);
    io.to('g:' + found.id).emit('groupUpdated', found);
    cb({ group: found });
  });

  socket.on('getGroup', ({ groupId }, cb) => {
    cb({ group: groups.get(groupId) || null });
  });

  // ── Sessions ──
  socket.on('createSession', ({ groupId }, cb) => {
    const group = groups.get(groupId);
    if (!group) return cb({ error: 'קבוצה לא נמצאה' });

    const id = 's-' + Date.now();
    const session = {
      id, groupId,
      safeMembers: [],
      currentGameIndex: -1,
      games: [],
      status: 'waiting',
      scores: {},
      createdAt: Date.now(),
    };
    sessions.set(id, session);
    group.currentSession = id;

    for (const memberUid of group.members) {
      const socks = uidSockets.get(memberUid);
      if (socks) for (const sid of socks) {
        io.sockets.sockets.get(sid)?.join('s:' + id);
      }
    }

    io.to('g:' + groupId).emit('groupUpdated', group);
    io.to('s:' + id).emit('sessionUpdated', session);
    cb({ sessionId: id });
  });

  socket.on('getSession', ({ sessionId }, cb) => {
    cb({ session: sessions.get(sessionId) || null });
  });

  socket.on('markSafe', ({ sessionId }) => {
    const uid = socketUid.get(socket.id);
    const session = sessions.get(sessionId);
    if (!session || !uid) return;
    if (!session.safeMembers.includes(uid)) session.safeMembers.push(uid);
    io.to('s:' + sessionId).emit('sessionUpdated', session);
  });

  socket.on('startNextGame', ({ sessionId, game }) => {
    const session = sessions.get(sessionId);
    if (!session) return;
    session.games.push(game);
    session.currentGameIndex = session.games.length - 1;
    session.status = 'active';
    io.to('s:' + sessionId).emit('sessionUpdated', session);
  });

  socket.on('updateCurrentGame', ({ sessionId, updates }) => {
    const session = sessions.get(sessionId);
    if (!session || session.games.length === 0) return;
    const cur = session.games[session.currentGameIndex];
    if (updates.playerData) cur.playerData = { ...cur.playerData, ...updates.playerData };
    if (updates.roundData) cur.roundData = { ...cur.roundData, ...updates.roundData };
    if (updates.phase !== undefined) cur.phase = updates.phase;
    if (updates.scores) cur.scores = { ...cur.scores, ...updates.scores };
    io.to('s:' + sessionId).emit('sessionUpdated', session);
  });

  socket.on('finishGame', ({ sessionId, gameScores }) => {
    const session = sessions.get(sessionId);
    if (!session) return;
    const merged = { ...session.scores };
    for (const [uid, pts] of Object.entries(gameScores)) {
      merged[uid] = (merged[uid] || 0) + pts;
    }
    const cur = session.games[session.currentGameIndex];
    cur.phase = 'results';
    cur.scores = gameScores;
    session.scores = merged;
    io.to('s:' + sessionId).emit('sessionUpdated', session);
  });

  socket.on('endSession', ({ sessionId }) => {
    const session = sessions.get(sessionId);
    if (!session) return;
    session.status = 'ended';
    const group = groups.get(session.groupId);
    if (group) {
      delete group.currentSession;
      io.to('g:' + group.id).emit('groupUpdated', group);
    }
    io.to('s:' + sessionId).emit('sessionUpdated', session);
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    const uid = socketUid.get(socket.id);
    socketUid.delete(socket.id);
    if (uid && uidSockets.has(uid)) {
      uidSockets.get(uid).delete(socket.id);
      if (uidSockets.get(uid).size === 0) uidSockets.delete(uid);
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
