// Configuração da URL da API
const BASE_API_URL = window.location.origin;
// const BASE_API_URL = 'http://localhost:8000'; // Use esta linha para desenvolvimento local

// Verifica se o usuário já está autenticado
if (document.cookie.includes('auth_token')) {
    // Redireciona para a página inicial se já estiver autenticado
    window.location.href = '/home';
}

// Verifica se o usuário está em uma página de login
if (window.location.pathname === '/login') {
    document.title = 'Login - Locacar';
}

// --- Seleção de Elementos do DOM ---
// Certifique-se de que os elementos existem antes de tentar acessá-los
if (!document.getElementById('loginForm')) {
    console.error("Elemento 'loginForm' não encontrado no DOM.");
}
// Elementos do DOM
const loginForm = document.getElementById('loginForm');
const cpfCnpjInput = document.getElementById('cpf_cnpj');
const passwordInput = document.getElementById('password');
const rememberCheckbox = document.getElementById('remember');
const loginBtn = document.getElementById('loginBtn');
const loginBtnText = document.getElementById('loginBtnText');
const toggleCpfCnpjBtn = document.getElementById('toggleCpfCnpj');
const togglePasswordBtn = document.getElementById('togglePassword');
const notificationContainer = document.getElementById('notificationContainer');
const themeToggleBtn = document.getElementById('themeToggleBtn'); // Novo elemento
const appBody = document.body; // O corpo da página para aplicar a classe do tema

// --- Funções de Utilidade ---

/**
 * Exibe uma notificação pop-up na tela.
 * @param {string} message - A mensagem a ser exibida.
 * @param {'success'|'error'|'info'|'warning'} type - O tipo de notificação (afeta a cor e o ícone).
 * @param {number} duration - Duração em milissegundos antes da notificação desaparecer.
 */
function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification px-6 py-4 rounded-lg shadow-lg text-white max-w-md ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
    }`;
    
    const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${icon} mr-3"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    notificationContainer.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// --- Lógica de Interação da UI ---

// Toggle mostrar/ocultar CPF/CNPJ
if (toggleCpfCnpjBtn && cpfCnpjInput) {
    toggleCpfCnpjBtn.addEventListener('click', () => {
        const type = cpfCnpjInput.getAttribute('type') === 'password' ? 'text' : 'password';
        cpfCnpjInput.setAttribute('type', type);
        const icon = toggleCpfCnpjBtn.querySelector('i');
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });
} else {
    console.warn("Elemento 'toggleCpfCnpj' ou 'cpf_cnpj' não encontrado.");
}

// Toggle mostrar/ocultar senha
if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const icon = togglePasswordBtn.querySelector('i');
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });
} else {
    console.warn("Elemento 'togglePassword' ou 'password' não encontrado.");
}

// Lógica para alternar tema (claro/escuro)
if (themeToggleBtn && appBody) {
    themeToggleBtn.addEventListener('click', () => {
        appBody.classList.toggle('dark-mode');
        const isDarkMode = appBody.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        // Atualiza o ícone do botão
        themeToggleBtn.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        themeToggleBtn.title = isDarkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro';
    });

    // Aplica o tema salvo no localStorage ao carregar a página
    window.addEventListener('DOMContentLoaded', () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            appBody.classList.add('dark-mode');
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
            themeToggleBtn.title = 'Mudar para tema claro';
        } else {
            // Garante que o tema padrão (claro) e o ícone de lua estejam corretos
            appBody.classList.remove('dark-mode');
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
            themeToggleBtn.title = 'Mudar para tema escuro';
        }
    });
} else {
    console.warn("Elemento 'themeToggleBtn' ou 'appBody' não encontrado.");
}


// --- Lógica de Autenticação ---

/**
 * Realiza a requisição de login para o backend.
 * @param {string} cpf_cnpj - CPF ou CNPJ do usuário.
 * @param {string} password - Senha do usuário.
 */
async function performLogin(cpf_cnpj, password) {
    try {
        // Remove a máscara do CPF/CNPJ antes de enviar para o backend
        const cleanCpfCnpj = cpf_cnpj.replace(/[^\d]/g, '');

        const response = await fetch(`${BASE_API_URL}/login/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf_cnpj: cleanCpfCnpj, senha: password }),
        credentials: 'include'  // 👈 IMPORTANTE: permite o envio e recebimento de cookies
        }); 


        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Credenciais inválidas');
        }

        // Não há necessidade de ler o corpo da resposta ou armazenar o token.
        // O backend agora define o cookie de autenticação diretamente na resposta.

        showNotification('Login realizado com sucesso!', 'success');

        // Redireciona após um pequeno atraso.
        // O backend vai verificar o cookie e direcionar para a página correta.
        setTimeout(() => {
            window.location.href = '/home';
        }, 1500);

    } catch (error) {
        console.error('Erro no login:', error);
        showNotification(error.message || 'Erro ao fazer login. Tente novamente.', 'error');
    }
}

// Event listener para o formulário de login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede o recarregamento da página

        const cpf_cnpj = cpfCnpjInput.value.trim();
        const password = passwordInput.value;

        // Validações básicas do formulário
        if (!cpf_cnpj) {
            showNotification('Por favor, insira seu CPF ou CNPJ.', 'warning');
            cpfCnpjInput.focus();
            return;
        }

        if (!password) {
            showNotification('Por favor, insira sua senha.', 'warning');
            passwordInput.focus();
            return;
        }

        // Desabilita o botão e mostra spinner durante o login
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtnText.innerHTML = '<div class="loading-spinner"></div><span class="ml-2">Entrando...</span>';
        }

        try {
            // Removido o argumento `remember`
            await performLogin(cpf_cnpj, password);
        } finally {
            // Habilita o botão e restaura o texto após a tentativa de login (sucesso ou falha)
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtnText.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Entrar';
            }
        }
    });
} else {
    console.error("Elemento 'loginForm' não encontrado no DOM.");
}

// Auto-focus no campo de CPF/CNPJ quando a página carrega
window.addEventListener('load', function() {
    if (cpfCnpjInput) {
        cpfCnpjInput.focus();
    }
});

// A lógica de verificação de token prévia foi removida daqui,
// pois o redirecionamento agora é controlado pelo backend.

// Handler para tecla Enter nos inputs
if (cpfCnpjInput && passwordInput && loginForm) {
    cpfCnpjInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            passwordInput.focus();
        }
    });
    
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            loginForm.dispatchEvent(new Event('submit'));
        }
    });
}