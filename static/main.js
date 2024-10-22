const socket = io();

let localStream;
let peerConnection;
const videoElement = document.getElementById('screenVideo');
const shareButton = document.getElementById('shareScreen');
const viewButton = document.getElementById('viewScreen');

// STUN server for WebRTC
const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Capture screen and broadcast it
shareButton.onclick = async () => {
  try {
    localStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    videoElement.srcObject = localStream;

    peerConnection = new RTCPeerConnection(config);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('candidate', event.candidate);
      }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', peerConnection.localDescription);

  } catch (err) {
    console.error('Error sharing screen:', err);
  }
};

// Receive screen stream
viewButton.onclick = () => {
  peerConnection = new RTCPeerConnection(config);

  peerConnection.ontrack = (event) => {
    videoElement.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('candidate', event.candidate);
    }
  };
};

// Socket.IO signaling
socket.on('offer', async (offer) => {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection(config);
  }

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', peerConnection.localDescription);
});

socket.on('answer', (answer) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on('candidate', (candidate) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});
