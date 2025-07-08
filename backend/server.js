  const WebSocket = require('ws');
  const http = require('http');
  const { v4: uuidv4 } = require('uuid');

  const wss = new WebSocket.Server({ noServer: true });
  const activeConnections = new Map(); // Utilisation d'une Map pour stocker les connexions avec leur ID

  // Désactiver les logs de connexion/déconnexion en production
  const DEBUG_LOGS = process.env.NODE_ENV !== 'production';
  const HEARTBEAT_INTERVAL = 30000; // 30 secondes

  function setupWebSocket(ws, request) {
    const clientId = uuidv4();
    let isAlive = true;
    const clientIP = request.socket.remoteAddress;
    
    console.log(`Nouvelle connexion depuis ${clientIP} (${clientId})`);
    
    // Fonction pour envoyer un ping
    const heartbeat = () => {
      if (!isAlive) {
        ws.terminate();
        return;
      }
      
      isAlive = false;
      ws.ping(() => {});
    };
    
    // Configurer le timeout de déconnexion
    const heartbeatInterval = setInterval(heartbeat, HEARTBEAT_INTERVAL);
    
    // Stocker la connexion avec ses métadonnées
    activeConnections.set(clientId, {
      ws,
      isAlive: true,
      lastActivity: Date.now()
    });
    
    if (DEBUG_LOGS) {
      console.log(`Client connecté (${clientId}). Total: ${activeConnections.size}`);
    }
    
    // Gestion des messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`Message de ${clientId}:`, data);
        
        // Mise à jour de l'activité
        if (activeConnections.has(clientId)) {
          activeConnections.get(clientId).lastActivity = Date.now();
          console.log(`Activité mise à jour pour ${clientId}`);
        }
        
        if (data.type === 'pong') {
          isAlive = true;
          return;
        }
        
        if (DEBUG_LOGS) {
          console.log(`Message de ${clientId}:`, data);
        }
        
        // Ajoutez ici la logique de traitement des messages personnalisés
        
      } catch (error) {
        console.error('Erreur lors du traitement du message:', error);
      }
    });
    
    // Gestion des pongs
    ws.on('pong', () => {
      isAlive = true;
      if (activeConnections.has(clientId)) {
        activeConnections.get(clientId).isAlive = true;
        activeConnections.get(clientId).lastActivity = Date.now();
      }
    });
    
    // Nettoyage lors de la déconnexion
    ws.on('close', (code, reason) => {
      clearInterval(heartbeatInterval);
      activeConnections.delete(clientId);
      console.log(`Déconnexion de ${clientId}. Code: ${code}, Raison: ${reason || 'Aucune raison fournie'}`);
      console.log(`Connexions actives restantes: ${activeConnections.size}`);
    });
    
    // Gestion des erreurs
    ws.on('error', (error) => {
      console.error(`Erreur WebSocket (${clientId}):`, error);
      ws.terminate();
    });
    
    // Envoyer un message de bienvenue avec l'ID client
    ws.send(JSON.stringify({
      type: 'connection_established',
      clientId: clientId,
      timestamp: Date.now()
    }));
  }

  wss.on('connection', setupWebSocket);

  function broadcast(data) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    
    activeConnections.forEach(({ ws }, clientId) => {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message, (error) => {
            if (error) {
              console.error(`Erreur d'envoi au client ${clientId}:`, error);
              ws.terminate();
              activeConnections.delete(clientId);
            }
          });
        } else if (ws.readyState !== WebSocket.CONNECTING) {
          // Si la connexion n'est ni ouverte ni en cours d'établissement
          activeConnections.delete(clientId);
        }
      } catch (error) {
        console.error(`Erreur lors du broadcast au client ${clientId}:`, error);
        ws.terminate();
        activeConnections.delete(clientId);
      }
    });
  }

  // Nettoyage des connexions inactives
  setInterval(() => {
    const now = Date.now();
    const timeout = HEARTBEAT_INTERVAL * 2; // Temps d'inactivité avant déconnexion
    
    activeConnections.forEach(({ ws, lastActivity }, clientId) => {
      if (now - lastActivity > timeout) {
        if (DEBUG_LOGS) {
          console.log(`Déconnexion du client inactif: ${clientId}`);
        }
        ws.terminate();
        activeConnections.delete(clientId);
      }
    });
  }, HEARTBEAT_INTERVAL);

  // Configuration des en-têtes CORS
const setCorsHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const server = http.createServer((req, res) => {
  // Gestion des requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(200);
    res.end();
    return;
  }

  // Gestion des requêtes POST
  if (req.method === 'POST' && req.url === '/update') {
    setCorsHeaders(res);
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const data = JSON.parse(body);
      broadcast(data);
      res.writeHead(200);
      res.end('OK');
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.on('upgrade', (request, socket, head) => {
  console.log('Tentative de mise à niveau WebSocket');
  
  // Vérifier l'origine si nécessaire
  const origin = request.headers.origin;
  console.log('Origine de la requête:', origin);
  
  // Gestion des erreurs de socket
  socket.on('error', (error) => {
    console.error('Erreur de socket:', error);
  });
  
  wss.handleUpgrade(request, socket, head, (ws) => {
    console.log('Connexion WebSocket établie avec succès');
    wss.emit('connection', ws, request);
  });
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`Serveur WebSocket + HTTP démarré sur le port ${PORT}`);
  console.log('Mode debug:', DEBUG_LOGS ? 'activé' : 'désactivé');
});
