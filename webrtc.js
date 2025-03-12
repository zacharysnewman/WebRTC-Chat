let localStream;
let localPeerConnection;
let remotePeerConnection;
let localDataChannel;
let remoteDataChannel;

let localVideo = document.getElementById('localVideo');
let remoteVideo = document.getElementById('remoteVideo');
let messageInput = document.getElementById('messageInput');
let messagesDiv = document.getElementById('messages');

const iceServers = [
  { urls: "stun:stun.l.google.com:19302" }
];

// Function to start media capture (camera and mic)
async function start() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStream = stream;
    localVideo.srcObject = stream;
  } catch (error) {
    console.error("Error accessing media devices.", error);
  }
}

// Create peer connection and set up data channel
function createPeerConnection() {
  localPeerConnection = new RTCPeerConnection({ iceServers });
  remotePeerConnection = new RTCPeerConnection({ iceServers });

  // Handle ICE candidate exchange
  localPeerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      remotePeerConnection.addIceCandidate(event.candidate);
    }
  };
  remotePeerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      localPeerConnection.addIceCandidate(event.candidate);
    }
  };

  // Display remote video stream
  remotePeerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  // Add local media stream to the peer connection
  localStream.getTracks().forEach(track => localPeerConnection.addTrack(track, localStream));

  // Create data channel for sending messages
  localDataChannel = localPeerConnection.createDataChannel("chat");
  localDataChannel.onmessage = (event) => {
    displayMessage('Remote: ' + event.data);
  };

  // Set up the remote data channel to handle incoming messages
  remotePeerConnection.ondatachannel = (event) => {
    remoteDataChannel = event.channel;
    remoteDataChannel.onmessage = (event) => {
      displayMessage('Remote: ' + event.data);
    };
  };
}

// Display received messages
function displayMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.textContent = message;
  messagesDiv.appendChild(messageDiv);
}

// Send a message over the data channel
function sendMessage() {
  const message = messageInput.value;
  if (message && localDataChannel && localDataChannel.readyState === 'open') {
    localDataChannel.send(message);
    displayMessage('You: ' + message);
    messageInput.value = ''; // Clear the input field
  }
}

// Start the call (create offer and answer)
async function call() {
  createPeerConnection();
  
  try {
    // Create an offer
    const offer = await localPeerConnection.createOffer();
    await localPeerConnection.setLocalDescription(offer);

    // Send the offer to the remote peer
    await remotePeerConnection.setRemoteDescription(offer);

    // Create an answer
    const answer = await remotePeerConnection.createAnswer();
    await remotePeerConnection.setLocalDescription(answer);

    // Send the answer back to the local peer
    await localPeerConnection.setRemoteDescription(answer);
  } catch (error) {
    console.error("Error during the call process", error);
  }
}

// Hang up the call and clean up
function hangup() {
  localPeerConnection.close();
  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;
  localDataChannel = null;
  remoteDataChannel = null;
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
}
