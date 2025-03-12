let localPeerConnection;
let remotePeerConnection;
let localDataChannel;
let remoteDataChannel;

let messageInput = document.getElementById('messageInput');
let messagesDiv = document.getElementById('messages');
let connectionStatus = document.getElementById('connectionStatus');
let dataChannelStatus = document.getElementById('dataChannelStatus');
let iceStatus = document.getElementById('iceStatus');

const iceServers = [
  { urls: "stun:stun.l.google.com:19302" } // Google's public STUN server
];

// Create peer connections and setup data channels
function startConnection() {
  connectionStatus.textContent = "Connecting...";
  iceStatus.textContent = "Waiting for ICE Candidates...";

  localPeerConnection = new RTCPeerConnection({ iceServers });
  remotePeerConnection = new RTCPeerConnection({ iceServers });

  // Handle ICE Candidate exchange
  localPeerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      remotePeerConnection.addIceCandidate(event.candidate);
      iceStatus.textContent = "ICE Candidate Exchanged ✅";
    }
  };
  remotePeerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      localPeerConnection.addIceCandidate(event.candidate);
    }
  };

  // Create data channel for chat
  localDataChannel = localPeerConnection.createDataChannel("chat");

  // Open and handle messages
  localDataChannel.onopen = () => {
    console.log("Data channel open!");
    dataChannelStatus.textContent = "Open ✅";
  };
  
  localDataChannel.onclose = () => {
    console.log("Data channel closed!");
    dataChannelStatus.textContent = "Closed ❌";
  };
  
  localDataChannel.onerror = (error) => {
    console.error("Data channel error:", error);
    dataChannelStatus.textContent = "Error ⚠️";
  };

  localDataChannel.onmessage = (event) => displayMessage('Remote: ' + event.data);

  // Set up the remote peer to listen for the data channel
  remotePeerConnection.ondatachannel = (event) => {
    remoteDataChannel = event.channel;

    remoteDataChannel.onopen = () => {
      console.log("Remote data channel open!");
      connectionStatus.textContent = "Connected ✅";
    };

    remoteDataChannel.onclose = () => {
      console.log("Remote data channel closed!");
      connectionStatus.textContent = "Disconnected ❌";
    };

    remoteDataChannel.onmessage = (event) => displayMessage('Remote: ' + event.data);
  };

  console.log("Peer connections and data channels created.");
}

// Send a message over WebRTC data channel
function sendMessage() {
  const message = messageInput.value.trim();
  if (message && localDataChannel.readyState === 'open') {
    localDataChannel.send(message);
    displayMessage('You: ' + message);
    messageInput.value = ''; // Clear input
  } else {
    console.warn("Data channel not open or empty message.");
  }
}

// Display messages in the chat box
function displayMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.textContent = message;
  messagesDiv.appendChild(messageDiv);
  messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll
}

// Start WebRTC connection (offer/answer exchange)
async function call() {
  try {
    connectionStatus.textContent = "Connecting... 🔄";
    
    const offer = await localPeerConnection.createOffer();
    await localPeerConnection.setLocalDescription(offer);
    await remotePeerConnection.setRemoteDescription(offer);

    const answer = await remotePeerConnection.createAnswer();
    await remotePeerConnection.setLocalDescription(answer);
    await localPeerConnection.setRemoteDescription(answer);

    console.log("WebRTC chat connection established.");
    connectionStatus.textContent = "Connected ✅";
  } catch (error) {
    console.error("Error setting up WebRTC connection:", error);
    connectionStatus.textContent = "Connection Failed ❌";
  }
}

// Close connection
function hangup() {
  if (localPeerConnection) localPeerConnection.close();
  if (remotePeerConnection) remotePeerConnection.close();
  
  localPeerConnection = null;
  remotePeerConnection = null;
  localDataChannel = null;
  remoteDataChannel = null;

  connectionStatus.textContent = "Disconnected ❌";
  dataChannelStatus.textContent = "Not Available";
  iceStatus.textContent = "No ICE Candidates Yet";

  console.log("Disconnected.");
}

