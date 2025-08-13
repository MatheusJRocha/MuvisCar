// Configuração - AJUSTE ESTA URL CONFORME SEU BACKEND
let BASE_API_URL = 'http://localhost:8000'; 
// Garante que BASE_API_URL não termina com uma barra
if (BASE_API_URL.endsWith('/')) {
    BASE_API_URL = BASE_API_URL.slice(0, -1);
}

// Variáveis globais
let clients = [];

// DOM elements
const clientFormContainer = document.getElementById('clientFormContainer');
const addClientBtn = document.getElementById('addClientBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const clientForm = document.getElementById('clientForm');
const formTitle = document.getElementById('formTitle');
const clientTableBody = document.getElementById('clientTableBody');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const statusFilter = document.getElementById('statusFilter');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');
const historyModal = document.getElementById('historyModal');
const closeHistoryModal = document.getElementById('closeHistoryModal');
const historyContent = document.getElementById('historyContent');
const saveClientBtn = document.getElementById('saveClientBtn');
const notificationContainer = document.getElementById('notificationContainer');

// Elementos do modal de detalhes do cliente
const clientDetailsModal = document.getElementById('clientDetailsModal');
const closeClientDetailsModal = document.getElementById('closeClientDetailsModal');
const clientDetailsContent = document.getElementById('clientDetailsContent');

// Form elements
const originalIdInput = document.getElementById('originalId');
const clientTypeSelect = document.getElementById('clientType');
const documentInput = document.getElementById('document');
const documentLabel = document.getElementById('documentLabel');
const nameInput = document.getElementById('name');
const nameLabel = document.getElementById('nameLabel');
const birthDateInput = document.getElementById('birthDate');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const passwordInput = document.getElementById('password'); 
const statusSelect = document.getElementById('status');
const zipCodeInput = document.getElementById('zipCode');
const addressInput = document.getElementById('address');
const cityInput = document.getElementById('city');
const stateSelect = document.getElementById('state');

// Error message elements
const clientTypeError = document.getElementById('clientTypeError');
const documentError = document.getElementById('documentError');
const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const phoneError = document.getElementById('phoneError');
const passwordError = document.getElementById('passwordError'); 
const zipCodeError = document.getElementById('zipCodeError');
const stateError = document.getElementById('stateError');

// Notification system
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

// CPF/CNPJ validation functions
function validateCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let checkDigit = 11 - (sum % 11);
    if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
    if (checkDigit !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    checkDigit = 11 - (sum % 11);
    if (checkDigit === 10 || checkDigit === 11) checkDigit = 0;
    return checkDigit === parseInt(cpf.charAt(10));
}

function validateCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]/g, '');
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
    
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cnpj.charAt(i)) * weights1[i];
    }
    let checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (checkDigit !== parseInt(cnpj.charAt(12))) return false;
    
    sum = 0;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cnpj.charAt(i)) * weights2[i];
    }
    checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return checkDigit === parseInt(cnpj.charAt(13));
}

// Input formatting functions
function formatCPF(value) {
    value = value.replace(/\D/g, ''); // Garante que só tem dígitos
    if (value.length > 11) value = value.slice(0, 11);
    return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatCNPJ(value) {
    value = value.replace(/\D/g, ''); // Garante que só tem dígitos
    if (value.length > 14) value = value.slice(0, 14);
    return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

function formatPhone(value) {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return cleaned; // Retorna apenas dígitos se não formatável
}

function formatZipCode(value) {
    value = value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    return value.replace(/(\d{5})(\d{3})/, '$1-$2');
}

// Form handling
addClientBtn.addEventListener('click', () => {
    clientForm.reset();
    originalIdInput.value = '';
    formTitle.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Adicionar Cliente';
    clientFormContainer.classList.remove('hidden');
    clientFormContainer.classList.add('fade-in');
    // Reset error messages
    document.querySelectorAll('.error-message').forEach(el => el.classList.add('hidden'));
    // Show password field for new client
    passwordInput.closest('div').classList.remove('hidden');
    passwordInput.required = true;
});

cancelFormBtn.addEventListener('click', () => {
    clientFormContainer.classList.add('hidden');
    clientFormContainer.classList.remove('fade-in');
});

clientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.classList.add('hidden'));
    let isValid = true;

    const id = originalIdInput.value;
    const clientType = clientTypeSelect.value;
    const document = documentInput.value;
    const name = nameInput.value;
    const birthDate = birthDateInput.value;
    const email = emailInput.value;
    const phone = phoneInput.value;
    const password = passwordInput.value; 
    const status = statusSelect.value;
    const zipCode = zipCodeInput.value;
    const address = addressInput.value;
    const city = cityInput.value;
    const state = stateSelect.value;

    // Basic validation
    if (!clientType) {
        clientTypeError.textContent = 'Selecione o tipo de cliente.';
        clientTypeError.classList.remove('hidden');
        isValid = false;
    }

    if (!document) {
        documentError.textContent = 'CPF/CNPJ é obrigatório.';
        documentError.classList.remove('hidden');
        isValid = false;
    } else {
        const cleanDoc = document.replace(/[^\d]/g, '');
        if (clientType === 'individual' && !validateCPF(cleanDoc)) {
            documentError.textContent = 'CPF inválido.';
            documentError.classList.remove('hidden');
            isValid = false;
        } else if (clientType === 'corporate' && !validateCNPJ(cleanDoc)) {
            documentError.textContent = 'CNPJ inválido.';
            documentError.classList.remove('hidden');
            isValid = false;
        } else if (clientType === '' && (cleanDoc.length !== 11 && cleanDoc.length !== 14)) {
            documentError.textContent = 'CPF/CNPJ deve ter 11 ou 14 dígitos.';
            documentError.classList.remove('hidden');
            isValid = false;
        }
    }

    if (!name) {
        nameError.textContent = 'Nome é obrigatório.';
        nameError.classList.remove('hidden');
        isValid = false;
    }

    if (!email) {
        emailError.textContent = 'Email é obrigatório.';
        emailError.classList.remove('hidden');
        isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        emailError.textContent = 'Email inválido.';
        emailError.classList.remove('hidden');
        isValid = false;
    }

    if (!phone) {
        phoneError.textContent = 'Telefone é obrigatório.';
        phoneError.classList.remove('hidden');
        isValid = false;
    } else {
        const cleanPhone = phone.replace(/[^\d]/g, '');
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
            phoneError.textContent = 'Telefone deve ter 10 ou 11 dígitos.';
            phoneError.classList.remove('hidden');
            isValid = false;
        }
    }

    // Validação da senha (apenas para criação de novo cliente)
    if (id === '' && password.length < 6) {
        passwordError.textContent = 'A senha deve ter no mínimo 6 caracteres.';
        passwordError.classList.remove('hidden');
        isValid = false;
    }

    if (zipCode && zipCode.replace(/[^\d]/g, '').length !== 8) {
        zipCodeError.textContent = 'CEP deve ter 8 dígitos.';
        zipCodeError.classList.remove('hidden');
        isValid = false;
    }

    if (state && state.length !== 2) {
        stateError.textContent = 'Estado deve ter 2 caracteres.';
        stateError.classList.remove('hidden');
        isValid = false;
    }

    if (!isValid) {
        showNotification('Por favor, corrija os erros no formulário.', 'error');
        return;
    }

    const clientData = {
        nome: name,
        email: email,
        telefone: phone.replace(/[^\d]/g, ''),
        cpf_cnpj: document.replace(/[^\d]/g, ''),
        senha: password, 
        data_nascimento: birthDate ? new Date(birthDate).toISOString() : null,
        endereco: address || null,
        cidade: city || null,
        estado: state || null,
        cep: zipCode ? zipCode.replace(/[^\d]/g, '') : null,
        ativo: status === 'active' ? true : false, 
    };

    const url = id ? `${BASE_API_URL}/clientes/${id}` : `${BASE_API_URL}/clientes/`;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(clientData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro ao salvar cliente.');
        }

        showNotification(`Cliente ${id ? 'atualizado' : 'adicionado'} com sucesso!`, 'success');
        clientFormContainer.classList.add('hidden');
        clientFormContainer.classList.remove('fade-in');
        fetchClients(); // Recarrega a lista
    } catch (error) {
        console.error('Erro:', error);
        showNotification(error.message || 'Erro desconhecido ao salvar cliente.', 'error');
    }
});

async function fetchClients() {
    clientTableBody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-gray-500"><div class="loading-spinner"></div>Carregando clientes...</td></tr>`;
    try {
        const response = await fetch(`${BASE_API_URL}/clientes/`);
        if (!response.ok) {
            throw new Error('Erro ao buscar clientes.');
        }
        clients = await response.json();
        renderClients(clients);
    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        clientTableBody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-red-500">Erro ao carregar clientes: ${error.message}</td></tr>`;
        showNotification('Erro ao carregar clientes.', 'error');
    }
}

function renderClients(clientList) {
    clientTableBody.innerHTML = ''; // Limpa o corpo da tabela
    if (clientList.length === 0) {
        clientTableBody.innerHTML = `<tr><td colspan="9" class="text-center py-8 text-gray-500">Nenhum cliente encontrado.</td></tr>`;
        return;
    }

    clientList.forEach(client => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-200 hover:bg-gray-50';
        
        const statusText = client.ativo ? 'Ativo' : 'Inativo';
        const statusClass = client.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        const clientType = client.cpf_cnpj && client.cpf_cnpj.length === 11 ? 'Pessoa Física' : 
                           (client.cpf_cnpj && client.cpf_cnpj.length === 14 ? 'Pessoa Jurídica' : '-');

        row.innerHTML = `
            <td class="py-3 px-4">${client.id}</td>
            <td class="py-3 px-4">${client.nome}</td>
            <td class="py-3 px-4">${client.email}</td>
            <td class="py-3 px-4">${client.telefone || '-'}</td>
            <td class="py-3 px-4">${client.cpf_cnpj || '-'}</td>
            <td class="py-3 px-4">${clientType}</td>
            <td class="py-3 px-4"><span class="px-2 py-1 rounded-full text-xs font-semibold ${statusClass}">${statusText}</span></td>
            <td class="py-3 px-4">${new Date(client.data_criacao).toLocaleDateString()}</td>
            <td class="py-3 px-4 text-center">
                <div class="flex items-center justify-center space-x-2">
                    <button class="view-details-btn text-blue-600 hover:text-blue-800 transition duration-300" data-id="${client.id}" title="Ver Detalhes">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="edit-btn text-blue-600 hover:text-blue-800 transition duration-300" data-id="${client.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="history-btn text-purple-600 hover:text-purple-800 transition duration-300" data-id="${client.id}" title="Histórico de Locações">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="delete-btn text-red-600 hover:text-red-800 transition duration-300" data-id="${client.id}" title="Excluir">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        clientTableBody.appendChild(row);
    });

    // Add event listeners for buttons
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (e) => showClientDetailsModal(parseInt(e.currentTarget.dataset.id)));
    });
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => editClient(parseInt(e.currentTarget.dataset.id)));
    });
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => deleteClient(parseInt(e.currentTarget.dataset.id)));
    });
    document.querySelectorAll('.history-btn').forEach(button => {
        button.addEventListener('click', (e) => showClientHistory(parseInt(e.currentTarget.dataset.id)));
    });
}

async function editClient(id) {
    const client = clients.find(c => c.id === id);
    if (!client) {
        showNotification('Cliente não encontrado para edição.', 'error');
        return;
    }

    originalIdInput.value = client.id;
    formTitle.innerHTML = `<i class="fas fa-user-edit mr-2"></i>Editar Cliente (ID: ${client.id})`;
    
    // Preencher o formulário
    if (client.cpf_cnpj) {
        clientTypeSelect.value = client.cpf_cnpj.length === 11 ? 'individual' : 'corporate';
    } else {
        clientTypeSelect.value = '';
    }
    documentInput.value = client.cpf_cnpj || '';
    nameInput.value = client.nome || '';
    birthDateInput.value = client.data_nascimento ? new Date(client.data_nascimento).toISOString().split('T')[0] : '';
    emailInput.value = client.email || '';
    phoneInput.value = client.telefone || '';
    statusSelect.value = client.ativo ? 'active' : 'inactive';
    zipCodeInput.value = client.cep || '';
    addressInput.value = client.endereco || '';
    cityInput.value = client.cidade || '';
    stateSelect.value = client.estado || '';

    // Esconder o campo de senha para edição
    passwordInput.closest('div').classList.add('hidden');
    passwordInput.required = false;

    clientFormContainer.classList.remove('hidden');
    clientFormContainer.classList.add('fade-in');
    // Reset error messages
    document.querySelectorAll('.error-message').forEach(el => el.classList.add('hidden'));
}

async function deleteClient(id) {
    if (!confirm('Tem certeza que deseja desativar este cliente?')) {
        return;
    }

    try {
        const response = await fetch(`${BASE_API_URL}/clientes/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro ao desativar cliente.');
        }

        showNotification('Cliente desativado com sucesso!', 'success');
        fetchClients();
    } catch (error) {
        console.error('Erro ao desativar cliente:', error);
        showNotification(error.message || 'Erro desconhecido ao desativar cliente.', 'error');
    }
}

async function showClientHistory(id) {
    historyContent.innerHTML = `
        <div class="text-center py-8 text-gray-500">
            <div class="loading-spinner"></div>
            Carregando histórico...
        </div>
    `;
    historyModal.classList.remove('hidden');

    try {
        const response = await fetch(`${BASE_API_URL}/clientes/${id}/locacoes`);
        if (!response.ok) {
            throw new Error('Erro ao buscar histórico de locações.');
        }
        const clientWithRentals = await response.json();
        
        if (clientWithRentals.locacoes.length === 0) {
            historyContent.innerHTML = `<p class="text-center text-gray-600">Nenhuma locação encontrada para este cliente.</p>`;
            return;
        }

        historyContent.innerHTML = `
            <h4 class="text-xl font-semibold text-gray-800 mb-4">Cliente: ${clientWithRentals.nome} (${clientWithRentals.cpf_cnpj})</h4>
            <div class="space-y-4">
                ${clientWithRentals.locacoes.map(rental => `
                    <div class="bg-gray-100 p-4 rounded-lg shadow-sm border border-gray-200">
                        <p><strong>Locação ID:</strong> ${rental.id}</p>
                        <p><strong>Carro:</strong> ${rental.car.brand} ${rental.car.model} (${rental.car.license_plate})</p>
                        <p><strong>Período:</strong> ${new Date(rental.start_date).toLocaleDateString()} - ${new Date(rental.end_date).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> ${rental.status}</p>
                        <p><strong>Valor Total:</strong> R$ ${rental.total_amount.toFixed(2)}</p>
                    </div>
                `).join('')}
            </div>
        `;

    } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        historyContent.innerHTML = `<p class="text-center text-red-500">Erro ao carregar histórico: ${error.message}</p>`;
        showNotification('Erro ao carregar histórico de locações.', 'error');
    }
}

// Função para exibir o modal de detalhes do cliente
function showClientDetailsModal(id) {
    const client = clients.find(c => c.id === id);
    if (!client) {
        showNotification('Cliente não encontrado.', 'error');
        return;
    }

    const clientType = client.cpf_cnpj && client.cpf_cnpj.length === 11 ? 'Pessoa Física' : 
                       (client.cpf_cnpj && client.cpf_cnpj.length === 14 ? 'Pessoa Jurídica' : '-');
    const statusText = client.ativo ? 'Ativo' : 'Inativo';

    clientDetailsContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><strong>ID:</strong> ${client.id || '-'}</div>
            <div><strong>Nome:</strong> ${client.nome || '-'}</div>
            <div><strong>Email:</strong> ${client.email || '-'}</div>
            <div><strong>Telefone:</strong> ${client.telefone || '-'}</div>
            <div><strong>CPF/CNPJ:</strong> ${client.cpf_cnpj || '-'}</div>
            <div><strong>Tipo:</strong> ${clientType}</div>
            <div><strong>Data Nasc./Fund.:</strong> ${client.data_nascimento ? new Date(client.data_nascimento).toLocaleDateString() : '-'}</div>
            <div><strong>Endereço:</strong> ${client.endereco || '-'}</div>
            <div><strong>Cidade:</strong> ${client.cidade || '-'}</div>
            <div><strong>Estado:</strong> ${client.estado || '-'}</div>
            <div><strong>CEP:</strong> ${client.cep || '-'}</div>
            <div><strong>Status:</strong> ${statusText}</div>
            <div><strong>Data Criação:</strong> ${new Date(client.data_criacao).toLocaleDateString()}</div>
            <div><strong>Última Atualização:</strong> ${client.data_atualizacao ? new Date(client.data_atualizacao).toLocaleDateString() : '-'}</div>
        </div>
    `;
    clientDetailsModal.classList.remove('hidden');
}

closeHistoryModal.addEventListener('click', () => {
    historyModal.classList.add('hidden');
});

// Event listener para fechar o modal de detalhes do cliente
closeClientDetailsModal.addEventListener('click', () => {
    clientDetailsModal.classList.add('hidden');
});

// Initial fetch
fetchClients();

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const backdrop = document.getElementById('backdrop');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('active');
        backdrop.classList.toggle('active');
    });
}

if (backdrop) {
    backdrop.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        backdrop.classList.remove('active');
    });
}