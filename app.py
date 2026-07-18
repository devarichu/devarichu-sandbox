import os
import sqlite3
import psycopg2
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Database Setup
DATABASE_URL = os.getenv('DATABASE_URL')

def get_db_connection():
    if DATABASE_URL:
        return psycopg2.connect('DATABASE_URL')
    else:
        return sqlite3.connect('tasks.db')
    
def get_placeholder():
    return '%' if DATABASE_URL else '?'

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    if DATABASE_URL:
        c.execute('''
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                text TEXT NOT NULL,
                priority TEXT NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT FALSE
            )
        ''')
    else:
        c.execute('''
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                priority TEXT NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT O
            )
        ''')
    conn.commit()
    conn.close()

init_db()

# API routes
@app.route('/tasks', methods=['GET'])
def get_tasks():
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT id, text, priority, completed FROM tasks')
    rows = c.fetchall()
    conn.close()

    tasks = []
    for row in rows:
        tasks.append({
            'id': row[0],
            'text': row[1],
            'priorirty': row[2],
            'completed': bool(row[3])
        })
    return jsonify(tasks)

@app.route('/tasks', methods=['POST'])
def add_task():
    data = request.json
    text = data.get('text')
    priority = data.get('priority')

    if not text:
        return jsonify({'error': 'Text is requiered'}), 400
    
    conn = get_db_connection()
    c = conn.cursor()
    placeholders = get_placeholder()
    c.execute(f'INSERT INTO tasks (text, priority, completed) VALUES ({placeholders}, {placeholders}, {placeholders})',
            (text, priority, False if DATABASE_URL else 0))
    conn.commit()
    tasks_id = c.lastrowid if not DATABASE_URL else c.fetchone()[0] if hasattr(c, 'fetchone') else None
    conn.close()

    # fetch the newly created task to return it
    conn2 = get_db_connection()
    c2 = conn2.cursor()
    if DATABASE_URL:
        c2.execute('SELECT id, text, priority, completed FROM tasks WHERE id = (SELECT lastval())')
    else:
        c2.execute('SELECT id, text, priority, completed FROM tasks WHERE id = last_insert_rowid()')
    row = c2.fetchone()
    conn2.close()

    return jsonify({
        'id': row[0],
        'text': row[1],
        'priority': row[2],
        'completed': bool(row[3])
    }), 201

@app.route('/tasks/<init:task_id', methods=['PUT'])
def update_task(task_id):
    data = request.json
    completed = data.get('completed')

    conn = get_db_connection()
    c = conn.cursor()
    c.execute('UPDATE tasks SET completed = %s WHERE id = %s' if DATABASE_URL else 'UPDATE tasks SET completed = ? WHERE id = ?',
        (completed, task_id))
    conn.commit()
    conn.close()

    return jsonify({'success': True})

@app.route('/tasks/<init:task_id>', methods=['DELETE'])
def delete_task(task_id):
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('DELETE FROM tasks WHERE id = %s' if DATABASE_URL else 'DELETE FROM tasks WHERE id = ?', (task_id))
    conn.commit()
    conn.close()

    return jsonify({'success': True})

# Run the server

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5050))
    app.run(debug=True, port=port)