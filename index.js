// Inicializar Supabase - Ponlo al inicio del archivo
const supabaseClient = supabase.createClient(
    'https://ykmlszsdwdbjedvgiqoy.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrbWxzenNkd2RiamVkdmdpcW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NDQ3NjcsImV4cCI6MjA0NzUyMDc2N30.zMFRUqomzrkd6DwdtDUmlh6Ygn_8rA63o2i2U8n5yVM'
);

document.addEventListener('DOMContentLoaded', () => {
    // Handlers para cambiar entre login y registro
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('loginBox').style.display = 'none';
        document.getElementById('registerBox').style.display = 'block';
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('registerBox').style.display = 'none';
        document.getElementById('loginBox').style.display = 'block';
    });

    // Form handlers
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('addTaskBtn').addEventListener('click', addTask);

    checkSession();
});

async function handleRegister(e) {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }

    try {
        // Verificar si el email ya existe
        const { data: existingUser } = await supabaseClient
            .from('users')
            .select('email')
            .eq('email', email)
            .single();

        if (existingUser) {
            alert('Este email ya está registrado');
            return;
        }

        // Crear nuevo usuario
        const { data, error } = await supabaseClient
            .from('users')
            .insert([
                {
                    email: email,
                    password: password  // En producción, deberías hashear la contraseña
                }
            ])
            .select();

        if (error) throw error;

        alert('Registro exitoso! Por favor, inicia sesión.');
        document.getElementById('registerBox').style.display = 'none';
        document.getElementById('loginBox').style.display = 'block';
        document.getElementById('registerForm').reset();
    } catch (error) {
        alert('Error en el registro: ' + error.message);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const { data, error } = await supabaseClient
            .from('users')
            .select('*')
            .eq('email', email)
            .eq('password', password)  // En producción, deberías comparar con hash
            .single();

        if (error || !data) {
            throw new Error('Credenciales incorrectas');
        }

        // Guardar información del usuario en localStorage
        localStorage.setItem('userId', data.id);
        localStorage.setItem('userEmail', data.email);
        showMainContainer();
    } catch (error) {
        alert('Error en el inicio de sesión: ' + error.message);
    }
}

async function handleLogout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    hideMainContainer();
}

async function addTask() {
    const taskInput = document.getElementById('taskInput');
    const quadrantSelect = document.getElementById('quadrantSelect');
    const taskText = taskInput.value.trim();
    const userId = localStorage.getItem('userId');
    
    if (!taskText) {
        alert('Por favor, ingresa una tarea');
        return;
    }

    try {
        const { data, error } = await supabaseClient
            .from('tasks')
            .insert([
                {
                    user_id: userId,
                    content: taskText,
                    quadrant: quadrantSelect.value
                }
            ])
            .select();

        if (error) throw error;

        const quadrant = document.getElementById(quadrantSelect.value);
        const taskList = quadrant.querySelector('ul');
        
        const li = document.createElement('li');
        li.innerHTML = `
            ${taskText}
            <button class="delete-btn" onclick="deleteTask(this, '${data[0].id}')">Eliminar</button>
        `;
        
        taskList.appendChild(li);
        taskInput.value = '';
    } catch (error) {
        alert('Error al agregar tarea: ' + error.message);
    }
}

async function deleteTask(button, taskId) {
    try {
        const { error } = await supabaseClient
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) throw error;

        button.parentElement.remove();
    } catch (error) {
        alert('Error al eliminar tarea: ' + error.message);
    }
}

async function loadTasks() {
    const userId = localStorage.getItem('userId');
    
    try {
        const { data, error } = await supabaseClient
            .from('tasks')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        // Limpiar todas las listas
        document.querySelectorAll('.quadrant ul').forEach(ul => ul.innerHTML = '');

        // Cargar tareas
        data.forEach(task => {
            const quadrant = document.getElementById(task.quadrant);
            const taskList = quadrant.querySelector('ul');
            
            const li = document.createElement('li');
            li.innerHTML = `
                ${task.content}
                <button class="delete-btn" onclick="deleteTask(this, '${task.id}')">Eliminar</button>
            `;
            taskList.appendChild(li);
        });
    } catch (error) {
        alert('Error al cargar tareas: ' + error.message);
    }
}

function checkSession() {
    const userId = localStorage.getItem('userId');
    if (userId) {
        showMainContainer();
    }
}

function showMainContainer() {
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('mainContainer').style.display = 'block';
    loadTasks();
}

function hideMainContainer() {
    document.getElementById('authContainer').style.display = 'flex';
    document.getElementById('mainContainer').style.display = 'none';
    // Limpiar formularios
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
}