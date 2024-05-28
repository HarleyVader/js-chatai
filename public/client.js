// Connect to the server
var socket = io();

// Function to send a message to the server
function sendMessage() {
  var message = document.getElementById('message').value;
  var preprompt = document.getElementById('preprompt').value;

  if (message.trim() !== '') {
    socket.emit('chat message', { message, preprompt });
  }

  // Clear input fields after sending
  document.getElementById('message').value = '';
  document.getElementById('preprompt').value = '';
}

// Listen for 'chat error' events from the server
socket.on('chat error', function(err) {
  var node = document.createElement('p');
  var textnode = document.createTextNode('Error: ' + err);
  node.style.color = 'red';
  node.appendChild(textnode);
  document.getElementById('ai-reply').appendChild(node);
});

// Attach the sendMessage function to the send button
document.getElementById('send').onclick = sendMessage;

// Attach sendMessage function to the enter key
document.getElementById('message').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Optional: Store the last reply for continuity
let lastReply = '';

socket.on('chat message', function(msg) {
    var node = document.createElement('p');
    var textnode = document.createTextNode(msg);
    node.appendChild(textnode);
    document.getElementById('ai-reply').appendChild(node);
    lastReply = msg; // Store the last reply
});