console.log("Taskie JavaScript is LOADED!");

// Wait for our DOM to load
document.addEventListener('DOMContentLoaded', () => {

    // --- Elements ---
    const taskInput = document.getElementById('taskInput');
    const prioritySelect = document.getElementById('prioritySelect');
    const addBtn = document.getElementById('addBtn');
    const taskContainer = document.getElementById('taskContainer');
    const totalSpan = document.getElementById('totalTasks');
    const pendingSpan = document.getElementById('pendingTasks');
    const completedSpan = document.getElementById('completedTasks');

    // loading task from local
    let tasks = [];

    //filter state
    let currentFilter = 'all'; // 'all', 'active', 'completed'

    // functions

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        totalSpan.textContent = total;
        pendingSpan.textContent = pending;
        completedSpan.textContent = completed;
    }

    // connect to backend on port 5050
    async function loadTaskFromDB() {
        const response = await fetch('http://127.0.0.1:5050/tasks');
        tasks = await response.json();
        renderTasks();
    }

    function renderTasks() {
        if (tasks.length === 0) {
            taskContainer.innerHTML = `<li class="empty-message">✨ No tasks yet. Add one above!</li>`;
            updateStats();
            return;
        }

        // Sort: incomplete first, then by priority (High > Medium > Low)
        const sorted = [...tasks].sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1;
            const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        // --- Filter the sorted list ---
        let filtered = sorted;
        if (currentFilter === 'active') {
            filtered = sorted.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filtered = sorted.filter(task => task.completed);
        }

        let html = '';
        filtered.forEach((task, index) => {
            const originalIndex = tasks.indexOf(task);
            const completedClass = task.completed ? 'completed-task' : '';
            const priorityClass = task.priority.toLowerCase();
            const buttonText = task.completed ? '↩ Undo' : 'Complete';
            const buttonClass = task.completed ? 'complete-btn completed' : 'complete-btn';

            html += `
                <li class="${completedClass}" data-index="${originalIndex}">
                    <div class="task-left">
                        <span class="task-text">${task.text}</span>
                        <span class="priority-badge ${priorityClass}">${task.priority}</span>
                    </div>
                    <div class="task-actions">
                        <button class="${buttonClass}" data-index="${originalIndex}">${buttonText}</button>
                        <button class="delete-btn" data-index="${originalIndex}">Delete</button>
                    </div>
                </li>
            `;
        });
        taskContainer.innerHTML = html;
        updateStats();
    }

    // actions
    async function addTask() {
        console.log("Add task button clicked!"); // Debug line
        
        const text = taskInput.value.trim();
        if (text === '') {
            alert('Please write a task!')
            return;
        }
        const priority = prioritySelect.value;

        console.log("Sending task to backend:", { text, priority }); // Debug line

        // send to backend
        try {
            const response = await fetch('http://127.0.0.1:5050/tasks', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ text, priority })
            });
            const newTask = await response.json();
            console.log("Task saved successfully:", newTask); // Debug line
            tasks.push(newTask);
            renderTasks();
            taskInput.value = '';
            taskInput.focus();
        } catch (error) {
            console.error("Error adding task:", error);
            alert("Failed to add task. Check console for details.");
        }
    }

    async function toggleComplete(index) {
        const task = tasks[index];
        const updatedCompleted = !task.completed;

        try {
            await fetch(`http://127.0.0.1:5050/tasks/${task.id}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'}, // ✅ FIXED: added 's'
                body: JSON.stringify({completed: updatedCompleted})
            });
            task.completed = updatedCompleted;
            renderTasks();
        } catch (error) {
            console.error("Error toggling task:", error);
            alert("Failed to update task. Check console for details.");
        }
    }

    async function deleteTask(index) {
        const task = tasks[index];
        if (confirm(`Delete "${task.text}"?`)) {
            try {
                await fetch(`http://127.0.0.1:5050/tasks/${task.id}`, { // ✅ FIXED: added '//'
                    method: 'DELETE'
                });
                tasks.splice(index, 1);
                renderTasks();
            } catch (error) {
                console.error("Error deleting task:", error);
                alert("Failed to delete task. Check console for details.");
            }
        }
    }

    // here are the event listeners
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // event delegation for buttons inside the task list
    taskContainer.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        
        const index = target.getAttribute('data-index');
        if (index === null) return;

        if (target.classList.contains('complete-btn')) {
            toggleComplete(parseInt(index));
        } else if (target.classList.contains('delete-btn')) {
            deleteTask(parseInt(index));
        }
    });

    // initial render - load from database
    loadTaskFromDB();

    // ===== DARK MODE TOGGLE =====
    const themeToggle = document.getElementById('themeToggle');

    // Check for saved preference
    const savedTheme = localStorage.getItem('taskie-theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.textContent = 'Light Mode';
    }

    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('taskie-theme', 'light');
            themeToggle.textContent = 'Dark Mode';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('taskie-theme', 'dark');
            themeToggle.textContent = 'Light Mode';
        }
    });

    // ===== FILTER BUTTONS =====
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.getAttribute('data-filter');
            renderTasks();
        });
    });

});