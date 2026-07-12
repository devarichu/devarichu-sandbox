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
    let tasks = JSON.parse(localStorage.getItem('taskieTasks')) || [];

    // functions
    function saveTasks() {
        localStorage.setItem('taskieTasks', JSON.stringify(tasks));
    }

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        totalSpan.textContent = total;
        pendingSpan.textContent = pending;
        completedSpan.textContent = completed;
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
        const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    let html = '';
    sorted.forEach((task, index) => {
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
    function addTask() {
        const text = taskInput.value.trim();
        if (text === '') {
            alert('Please write a task!');
            return;
        }
        const priority = prioritySelect.value;
        tasks.push({
            text: text,
            priority: priority,
            completed: false
        });
        saveTasks();
        renderTasks();
        taskInput.value = ''; // helps clear the input field
        taskInput.focus();
    }

    function toggleComplete(index) {
        tasks[index].completed = !tasks[index].completed;
        saveTasks();
        renderTasks();
    }

    function deleteTask(index) {
        if (confirm(`Delete "${tasks[index].text}"?`)) {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
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

    // initial render
    renderTasks();
});
