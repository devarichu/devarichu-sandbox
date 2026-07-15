from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

# database setup
def init_db():
    conn = sqlite3.connect('tasks.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            priority TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT 0
            )
        ''')
    conn.commit()
    conn.close()

init_db()

# 1. get all tasks
@app.route('/tasks', methods=['GET'])
def get_tasks():
    conn = sqlite3.connect('tasks.db')
    c = conn.cursor()
    c.execute('SELECT id, text, priority, completed FROM tasks')
    rows = c.fetchall()
    conn.close()

    # convert rows to a list of dictionaries
    tasks = []
    for row in rows:
        tasks.append({
            'id': row[0],
            'text': row[1],
            'priority': row[2],
            'completed': bool(row[3])
        })
    return jsonify(tasks)

# 2. post a new task
@app.route('/tasks', methods=['POST'])
def add_task():
    data = request.json
    text = data.get('text')
    priority = data.get('priority')

    if not text:
        return jsonify({'error': 'Text is required'}), 400
    
    conn = sqlite3.connect('tasks.db')
    c = conn.cursor()
    c.execute('INSERT INTO tasks (text, priority, completed) VALUES (?, ?, ?)', (text, priority, 0))
    conn.commit()
    task_id = c.lastrowid
    conn.close()

    return jsonify({'id': task_id, 'text': text, 'priority': priority, 'completed': False}), 201

# 3. PUT (Update) a task completion status
@app.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    data = request.json
    completed = data.get('completed')

    conn = sqlite3.connect('tasks.db')
    c = conn.cursor()
    c.execute('UPDATE tasks SET completed = ? WHERE id = ?', (completed, task_id))
    conn.commit()
    conn.close()

    return jsonify({'success': True})

# 4. DELETE a task
@app.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    conn = sqlite3.connect('tasks.db')
    c = conn.cursor()
    c.execute('DELETE FROM tasks WHERE id = ?', (task_id,))
    conn.commit()
    conn.close()

    return jsonify({'success': True})

# Run the server
if __name__ == '__main__':
    app.run(debug=True, port=5050)