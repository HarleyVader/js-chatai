// Connect to the server
var socket = io();

// Function to send a message to the server
function sendMessage() {
  console.log('SendMessage function called'); // Debug log
  var message = document.getElementById('message').value;

  if (message.trim() !== '') {
    console.log('Sending message:', { message }); // Debug log
    socket.emit('chat message', { message });
  } else {
    console.log('Message is empty'); // Debug log
  }

  // Clear input fields after sending
  document.getElementById('message').value = '';
}

// Listen for 'chat error' events from the server
socket.on('chat error', function(err) {
  console.log('Received chat error:', err); // Debug log
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

$('form').submit(function(e) {
    e.preventDefault(); // Prevents page reloading
    socket.emit('chat message', {
        message: $('#message').val() // Only send message now
    });
    $('#message').val('');
    return false;
});