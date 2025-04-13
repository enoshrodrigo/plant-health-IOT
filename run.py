from app import create_app

app = create_app()

if __name__ == '__main__':
    app.socketio.run(app.flask_app, debug=True, host='0.0.0.0', 
                    port=5000, allow_unsafe_werkzeug=True)