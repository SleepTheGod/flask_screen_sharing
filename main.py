from flask import Flask, render_template
from flask_socketio import SocketIO
import eventlet

eventlet.monkey_patch()

app = Flask(__name__)
socketio = SocketIO(app)

@app.route('/')
def index():
    return render_template('index.html')

# Handle signaling (WebRTC negotiation)
@socketio.on('offer')
def handle_offer(data):
    socketio.emit('offer', data, broadcast=True)

@socketio.on('answer')
def handle_answer(data):
    socketio.emit('answer', data, broadcast=True)

@socketio.on('candidate')
def handle_candidate(data):
    socketio.emit('candidate', data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True)
