document.addEventListener('DOMContentLoaded', () => {
    loadTasks(); // Load tasks on startup

    // --- Drag and Drop Logic ---
    const lanes = document.querySelectorAll('.tasks');
    lanes.forEach(lane => {
        lane.addEventListener('dragover', e => {
            e.preventDefault();
            const afterElement = getDragAfterElement(lane, e.clientY);
            const draggable = document.querySelector('.dragging');
            if (afterElement == null) {
                lane.appendChild(draggable);
            } else {
                lane.insertBefore(draggable, afterElement);
            }
        });

        lane.addEventListener('drop', e => {
            e.preventDefault();
            saveTasks(); // Save on drop
        });
    });

    // --- Task Creation Logic ---
    const addTaskBtns = document.querySelectorAll('.add-task-btn');
    addTaskBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const form = btn.previousElementSibling;
            form.style.display = 'block';
            btn.style.display = 'none';
            form.querySelector('input').focus();
        });
    });

    const confirmAddBtns = document.querySelectorAll('.confirm-add-btn');
    confirmAddBtns.forEach(btn => {
        const action = () => {
            const form = btn.parentElement;
            const input = form.querySelector('input');
            const taskText = input.value.trim();
            const lane = form.closest('.lane').querySelector('.tasks');

            if (taskText) {
                const newTask = createTaskElement(taskText);
                lane.appendChild(newTask);
                input.value = '';
                saveTasks();
            }

            form.style.display = 'none';
            form.nextElementSibling.style.display = 'block';
        };

        btn.addEventListener('click', action);
        btn.previousElementSibling.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                action();
            }
        });
    });

    // --- Event Delegation for Deleting and Editing Tasks ---
    document.getElementById('app').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-task-btn')) {
            e.target.closest('.task').remove();
            saveTasks();
        }
    });

    document.getElementById('app').addEventListener('dblclick', (e) => {
        if (e.target.classList.contains('task-content')) {
            const taskContent = e.target;
            taskContent.contentEditable = 'true';
            taskContent.focus();

            const originalText = taskContent.textContent;

            const saveAndBlur = () => {
                taskContent.contentEditable = 'false';
                if (taskContent.textContent.trim() === '') {
                    taskContent.textContent = originalText;
                }
                if (originalText !== taskContent.textContent) {
                    saveTasks();
                }
            };

            taskContent.addEventListener('blur', saveAndBlur, { once: true });
            taskContent.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    taskContent.blur();
                }
            });
        }
    });
});

function createTaskElement(text) {
    const div = document.createElement('div');
    div.classList.add('task');
    div.draggable = true;

    const content = document.createElement('span');
    content.classList.add('task-content');
    content.textContent = text;

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-task-btn');
    deleteBtn.innerHTML = '×';

    div.appendChild(content);
    div.appendChild(deleteBtn);

    addDragEvents(div);
    return div;
}

function addDragEvents(task) {
    task.addEventListener('dragstart', () => {
        task.classList.add('dragging');
    });
    task.addEventListener('dragend', () => {
        task.classList.remove('dragging');
        // Note: Drop event handles saving. Dragend is sometimes unreliable.
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// --- Data Persistence Functions ---
function saveTasks() {
    const tasks = {
        todo: [],
        doing: [],
        done: []
    };
    document.querySelectorAll('.tasks').forEach(lane => {
        const laneId = lane.id.split('-')[0]; // "todo-tasks" -> "todo"
        const taskContents = lane.querySelectorAll('.task-content');
        taskContents.forEach(task => {
            tasks[laneId].push(task.textContent);
        });
    });
    window.electronAPI.setTasks(tasks);
}

async function loadTasks() {
    const tasks = await window.electronAPI.getTasks();

    // Clear existing sample tasks
    document.querySelectorAll('.tasks').forEach(lane => lane.innerHTML = '');

    for (const laneId in tasks) {
        const laneElement = document.getElementById(`${laneId}-tasks`);
        if (laneElement) {
            tasks[laneId].forEach(taskText => {
                const taskElement = createTaskElement(taskText);
                laneElement.appendChild(taskElement);
            });
        }
    }
}
