// Configuração da API
const API_CONFIG = {
    BASE_URL: 'http://127.0.0.1:8000',
    ENDPOINTS: {
        LIST_RENTALS: '/rental/locacoes',
        CREATE_RENTAL: '/rental/locacoes',
        UPDATE_RENTAL: (id) => `/rental/locacoes/${id}`,
        DELETE_RENTAL: (id) => `/rental/locacoes/${id}`,
        FINALIZE_RENTAL: (id) => `/rental/locacoes/${id}/finalize`,
        LIST_CLIENTS: '/clientes/',
        LIST_CARS: '/cars/carros',
        UPLOAD_CNH: '/rental/upload-cnh'
    }
};

// Elementos do DOM
const rentalModal = document.getElementById('rentalModal');
const returnModal = document.getElementById('returnModal');
const detailsModal = document.getElementById('detailsModal');
const newRentalBtn = document.getElementById('newRentalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeReturnModalBtn = document.getElementById('closeReturnModalBtn');
const closeDetailsModalBtn = document.getElementById('closeDetailsModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const cancelReturnBtn = document.getElementById('cancelReturnBtn');
const rentalForm = document.getElementById('rentalForm');
const returnForm = document.getElementById('returnForm');
const rentalIdInput = document.getElementById('rentalId');
const clientSelect = document.getElementById('clientSelect');
const carSelect = document.getElementById('carSelect');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const dailyRateInput = document.getElementById('dailyRate');
const totalDaysInput = document.getElementById('totalDays');
const totalAmountInput = document.getElementById('totalAmountInput');
const insuranceSelect = document.getElementById('insuranceSelect');
const paymentMethodSelect = document.getElementById('paymentMethodSelect');
const mileageStartInput = document.getElementById('mileageStartInput');
const additionalFeesInput = document.getElementById('additionalFeesInput');
const observations = document.getElementById('observations');
const rentalsTableBody = document.getElementById('rentalsTableBody');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const closeMobileMenu = document.getElementById('closeMobileMenu');
const backdrop = document.getElementById('backdrop');
const cnhUpload = document.getElementById('cnhUpload');
const cnhPreview = document.getElementById('cnhPreview');
const cnhPlaceholder = document.getElementById('cnhPlaceholder');

// Modal para visualização de CNH
const cnhModal = document.createElement('div');
cnhModal.className = 'fixed inset-0 bg-black bg-opacity-75 hidden items-center justify-center z-[60]';
cnhModal.innerHTML = `
    <div class="relative bg-white p-4 rounded-lg shadow-xl">
        <button class="absolute top-2 right-2 text-white bg-red-500 rounded-full w-8 h-8 flex items-center justify-center text-xl hover:bg-red-700 transition" onclick="this.parentNode.parentNode.style.display='none'">
            <i class="fas fa-times"></i>
        </button>
        <img id="cnhImageView" src="" alt="CNH do Cliente" class="max-w-full max-h-[90vh]" />
    </div>
`;
document.body.appendChild(cnhModal);

// Flatpickr instances
let flatpickrStartDate = null;
let flatpickrEndDate = null;
let flatpickrReturnDate = null;

// Dados em memória
let allClients = [];
let allCars = [];
let allRentals = [];

// Função para validar UUID
function isValidUUID(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

// Funções de utilidade
function showNotification(message, type = 'info') {
    Swal.fire({
        icon: type,
        title: type === 'error' ? 'Erro' : type === 'success' ? 'Sucesso' : 'Aviso',
        text: message,
        timer: 5000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
    });
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${day}/${month}/${year}`;
}

function formatDateForBackend(dateString) {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Funções de API
async function loadRentals() {
    rentalsTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-500"><div class="loading-spinner"></div>Carregando locações...</td></tr>`;
    try {
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LIST_RENTALS}`;
        if (url.includes('undefined')) throw new Error('Rota inválida detectada: UNDEFINED');
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao carregar locações: ${response.status} - ${errorText}`);
        }
        allRentals = await response.json();
        renderRentalsTable(allRentals);
    } catch (error) {
        console.error('Erro ao buscar locações:', error);
        showNotification('Erro ao carregar locações.', 'error');
        rentalsTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-red-500">Erro ao carregar dados.</td></tr>`;
    }
}

async function populateClientAndCarSelects() {
    try {
        const [clientsResponse, carsResponse] = await Promise.all([
            fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LIST_CLIENTS}`),
            fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LIST_CARS}`)
        ]);

        if (!clientsResponse.ok) {
            const errorText = await clientsResponse.text();
            throw new Error(`Erro ao carregar clientes: ${clientsResponse.status} - ${errorText}`);
        }
        if (!carsResponse.ok) {
            const errorText = await carsResponse.text();
            throw new Error(`Erro ao carregar carros: ${carsResponse.status} - ${errorText}`);
        }

        allClients = await clientsResponse.json();
        const carsData = await carsResponse.json();
        allCars = carsData.data || carsData || [];

        clientSelect.innerHTML = '<option value="" disabled selected>Selecione um cliente</option>';
        allClients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.nome;
            option.dataset.cnhUrl = client.cnh_url || '';
            clientSelect.appendChild(option);
        });

        carSelect.innerHTML = '<option value="" disabled selected>Selecione um carro</option>';
        if (Array.isArray(allCars) && allCars.length > 0) {
            allCars.forEach(car => {
                const option = document.createElement('option');
                option.value = car.id;
                option.textContent = `${car.brand || car.marca} ${car.model || car.modelo} (${car.license_plate || car.placa})`;
                option.dataset.dailyRate = car.daily_rate || car.diaria;
                carSelect.appendChild(option);
            });
        } else {
            carSelect.innerHTML = '<option value="" disabled>Nenhum carro disponível</option>';
        }
    } catch (error) {
        console.error('Erro ao popular selects:', error);
        showNotification('Erro ao carregar dados de clientes e carros.', 'error');
    }
}

async function deleteRental(rentalId) {
    try {
        const confirmed = await Swal.fire({
            title: 'Tem certeza?',
            text: 'Esta ação não pode ser desfeita.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, deletar',
            cancelButtonText: 'Cancelar'
        });

        if (confirmed.isConfirmed) {
            const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DELETE_RENTAL(rentalId)}`;
            if (url.includes('undefined')) throw new Error('Rota inválida detectada: UNDEFINED');
            const response = await fetch(url, { method: 'DELETE' });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ao deletar: ${response.status} - ${errorText}`);
            }
            showNotification('Locação deletada com sucesso!', 'success');
            loadRentals();
        }
    } catch (error) {
        console.error('Erro ao deletar locação:', error);
        showNotification('Erro ao deletar a locação.', 'error');
    }
}

async function finalizeRental(rentalId, returnData) {
    try {
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FINALIZE_RENTAL(rentalId)}`;
        if (url.includes('undefined')) throw new Error('Rota inválida detectada: UNDEFINED');
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(returnData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao finalizar a locação');
        }

        showNotification('Locação finalizada com sucesso!', 'success');
        returnModal.style.display = 'none';
        document.body.classList.remove('overflow-hidden');
        loadRentals();
    } catch (error) {
        console.error('Erro ao finalizar locação:', error);
        showNotification(`Erro: ${error.message}`, 'error');
    }
}

// Funções de UI
function calculateTotal() {
    const startDate = flatpickrStartDate && flatpickrStartDate.selectedDates.length > 0 
        ? flatpickrStartDate.selectedDates[0] 
        : new Date(startDateInput.value);
    const endDate = flatpickrEndDate && flatpickrEndDate.selectedDates.length > 0 
        ? flatpickrEndDate.selectedDates[0] 
        : new Date(endDateInput.value);
    const dailyRate = parseFloat(dailyRateInput.value) || 0;
    const insuranceRate = parseFloat(insuranceSelect.value) || 0;
    const additionalFees = parseFloat(additionalFeesInput.value) || 0;

    if (startDate && endDate && endDate >= startDate) {
        const oneDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.round(Math.abs((endDate - startDate) / oneDay)) + 1;
        totalDaysInput.value = diffDays;
        const totalDailyRate = diffDays * dailyRate;
        const totalInsurance = diffDays * insuranceRate;
        const total = totalDailyRate + totalInsurance + additionalFees;
        totalAmountInput.value = total.toFixed(2);
    } else {
        totalDaysInput.value = 0;
        totalAmountInput.value = 0;
    }
}

function updateReturnSummary() {
    const originalAmountText = document.getElementById('originalAmount').textContent;
    const originalAmount = parseFloat(originalAmountText.replace('R$', '').replace('.', '').replace(',', '.')) || 0;
    const lateFee = parseFloat(document.getElementById('lateFee').value) || 0;
    const finalTotal = originalAmount + lateFee;
    document.getElementById('lateAmount').textContent = formatCurrency(lateFee);
    document.getElementById('finalAmount').textContent = formatCurrency(finalTotal);
}

function showModal(isNew = true, rental = null) {
    if (!rentalModal) {
        showNotification('Erro: Modal de locação não encontrado.', 'error');
        return;
    }
    rentalModal.style.display = 'flex';
    rentalModal.classList.remove('hidden');
    rentalModal.classList.add('flex');
    document.body.classList.add('overflow-hidden');

    rentalForm.reset();
    cnhPreview.classList.add('hidden');
    cnhPlaceholder.classList.remove('hidden');
    cnhPreview.src = '#';
    document.getElementById('modalTitle').textContent = isNew ? 'Nova Locação' : 'Editar Locação';
    rentalIdInput.value = '';

    if (flatpickrStartDate) flatpickrStartDate.clear();
    if (flatpickrEndDate) flatpickrEndDate.clear();

    if (!isNew && rental) {
        rentalIdInput.value = rental.id;
        clientSelect.value = rental.cliente_id || rental.client_id;
        carSelect.value = rental.car_id;
        mileageStartInput.value = rental.mileage_start;
        additionalFeesInput.value = rental.additional_fees;
        insuranceSelect.value = rental.insurance_rate || 0;
        paymentMethodSelect.value = rental.payment_method;
        observations.value = rental.observations || '';

        const selectedClient = allClients.find(c => String(c.id) === String(rental.cliente_id || rental.client_id));
        if (selectedClient && selectedClient.cnh_url) {
            cnhPreview.src = selectedClient.cnh_url;
            cnhPreview.classList.remove('hidden');
            cnhPlaceholder.classList.add('hidden');
        }

        if (flatpickrStartDate) flatpickrStartDate.setDate(new Date(rental.start_date));
        if (flatpickrEndDate) flatpickrEndDate.setDate(new Date(rental.end_date));

        carSelect.dispatchEvent(new Event('change'));
        setTimeout(() => calculateTotal(), 100);
    }
}

function closeModal() {
    if (!rentalModal) return;
    rentalModal.style.display = 'none';
    rentalModal.classList.add('hidden');
    rentalModal.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
}

function showReturnModal(rental) {
    if (!returnModal) {
        showNotification('Erro: Modal de devolução não encontrado.', 'error');
        return;
    }
    returnModal.style.display = 'flex';
    returnModal.classList.remove('hidden');
    returnModal.classList.add('flex');
    document.body.classList.add('overflow-hidden');

    returnForm.reset();
    document.getElementById('returnRentalId').value = rental.id;
    document.getElementById('originalAmount').textContent = formatCurrency(rental.total_amount);
    document.getElementById('lateAmount').textContent = formatCurrency(0);
    document.getElementById('finalAmount').textContent = formatCurrency(rental.total_amount);

    if (flatpickrReturnDate) flatpickrReturnDate.setDate(new Date());
}

function closeReturnModal() {
    if (!returnModal) return;
    returnModal.style.display = 'none';
    returnModal.classList.add('hidden');
    returnModal.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
}

function showDetailsModal(rental) {
    const client = allClients.find(c => String(c.id) === String(rental.cliente_id || rental.client_id));
    const car = allCars.find(c => String(c.id) === String(rental.car_id));
    const detailsContent = document.getElementById('detailsContent');
    if (!detailsContent || !detailsModal) return;

    detailsContent.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Cliente -->
            <div class="bg-gray-50 rounded-lg p-4 border">
                <h4 class="font-bold text-blue-600 mb-3 text-lg flex items-center">
                    <i class="fas fa-user mr-2"></i> Dados do Cliente
                </h4>
                <div class="mb-2"><strong>Nome:</strong> ${client ? client.nome : 'Não encontrado'}</div>
                <div class="mb-2"><strong>Email:</strong> ${client && client.email ? client.email : '-'}</div>
                <div class="mb-2"><strong>Telefone:</strong> ${client && client.telefone ? client.telefone : '-'}</div>
                <div class="mb-2"><strong>CPF:</strong> ${client && client.cpf ? client.cpf : '-'}</div>
                <div class="mb-2"><strong>Endereço:</strong> ${client && client.endereco ? client.endereco : '-'}</div>
                ${client && client.cnh_url ? `<div class="mb-2"><strong>CNH:</strong><br><img src="${client.cnh_url}" alt="CNH do cliente" class="max-w-xs rounded-lg border mt-2 cursor-pointer" onclick="showCnhImage('${client.cnh_url}')"></div>` : ''}
            </div>
            <!-- Carro -->
            <div class="bg-gray-50 rounded-lg p-4 border">
                <h4 class="font-bold text-blue-600 mb-3 text-lg flex items-center">
                    <i class="fas fa-car mr-2"></i> Dados do Carro
                </h4>
                <div class="mb-2"><strong>Carro:</strong> ${car ? `${car.brand || car.marca} ${car.model || car.modelo}` : 'Não encontrado'}</div>
                <div class="mb-2"><strong>Placa:</strong> ${car ? (car.license_plate || car.placa) : ''}</div>
                <div class="mb-2"><strong>Diária:</strong> ${formatCurrency(car ? (car.daily_rate || car.diaria) : 0)}</div>
                <div class="mb-2"><strong>Cor:</strong> ${car ? (car.color || car.cor) : '-'}</div>
                <div class="mb-2"><strong>Ano:</strong> ${car ? (car.year || car.ano) : '-'}</div>
                <div class="mb-2"><strong>Quilometragem:</strong> ${car ? (car.mileage || car.quilometragem || '-') : '-'}</div>
                <div class="mb-2 flex justify-center items-center">
                    ${car && car.images && car.images.length > 0 ? 
                        `<img src="${car.images[0]}" alt="${car.brand || car.marca} ${car.model || car.modelo}" class="max-w-xs rounded-lg border shadow mt-2" onerror="this.onerror=null;this.src='https://placehold.co/200x120?text=Sem+Imagem';">` 
                        : `<img src="https://placehold.co/200x120?text=Sem+Imagem" alt="Sem imagem" class="max-w-xs rounded-lg border shadow mt-2">`
                    }
                </div>
            </div>
        </div>
        <div class="bg-white rounded-lg p-4 border">
            <h4 class="font-bold text-blue-600 mb-3 text-lg flex items-center">
                <i class="fas fa-file-contract mr-2"></i> Dados da Locação
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <div class="mb-2"><strong>ID:</strong> ${rental.id}</div>
                    <div class="mb-2"><strong>Período:</strong> ${formatDate(rental.start_date)} - ${formatDate(rental.end_date)}</div>
                    <div class="mb-2"><strong>Diária:</strong> ${formatCurrency(rental.daily_rate)}</div>
                    <div class="mb-2"><strong>Total de Dias:</strong> ${rental.total_days}</div>
                    <div class="mb-2"><strong>Valor Total:</strong> ${formatCurrency(rental.total_amount)}</div>
                    <div class="mb-2"><strong>Status:</strong> ${rental.status}</div>
                </div>
                <div>
                    <div class="mb-2"><strong>Método de Pagamento:</strong> ${rental.payment_method}</div>
                    <div class="mb-2"><strong>Quilometragem Inicial:</strong> ${rental.mileage_start}</div>
                    <div class="mb-2"><strong>Quilometragem Final:</strong> ${rental.mileage_end !== undefined ? rental.mileage_end : '-'}</div>
                    <div class="mb-2"><strong>Taxas Adicionais:</strong> ${formatCurrency(rental.additional_fees)}</div>
                    <div class="mb-2"><strong>Seguro:</strong> ${formatCurrency(rental.insurance_rate)}</div>
                    <div class="mb-2"><strong>Observações:</strong> ${rental.observations || '-'}</div>
                    ${rental.cnh_photo_path ? `<div class="mb-2"><strong>CNH enviada:</strong><br><img src="${rental.cnh_photo_path}" alt="CNH" class="max-w-xs rounded-lg border mt-2 cursor-pointer" onclick="showCnhImage('${rental.cnh_photo_path}')"></div>` : ''}
                </div>
            </div>
        </div>
    `;
    detailsModal.style.display = 'flex';
    document.body.classList.add('overflow-hidden');
}

function showCarDetails(carId) {
    const car = allCars.find(c => c.id === carId);
    if (car) {
        Swal.fire({
            title: 'Detalhes do Carro',
            html: `
                <div class="text-left">
                    <p><strong>Marca:</strong> ${car.brand || car.marca}</p>
                    <p><strong>Modelo:</strong> ${car.model || car.modelo}</p>
                    <p><strong>Ano:</strong> ${car.year || car.ano}</p>
                    <p><strong>Placa:</strong> ${car.license_plate || car.placa}</p>
                    <p><strong>Diária:</strong> ${formatCurrency(car.daily_rate || car.diaria)}</p>
                    <p><strong>Quilometragem:</strong> ${car.mileage || car.quilometragem || '-'} km</p>
                    <p><strong>Status:</strong> ${car.status || car.disponivel ? 'Disponível' : 'Em locação'}</p>
                    ${car.images && car.images.length > 0 ? `<img src="${car.images[0]}" alt="Foto do carro" class="max-w-xs rounded-lg border mt-2">` : ''}
                </div>
            `,
            icon: 'info',
            confirmButtonText: 'Fechar'
        });
    } else {
        showNotification('Detalhes do carro não encontrados.', 'error');
    }
}

function showCnhImage(url) {
    const cnhImageView = document.getElementById('cnhImageView');
    cnhImageView.src = url;
    cnhModal.style.display = 'flex';
}

function renderRentalsTable(rentals) {
    rentalsTableBody.innerHTML = '';
    if (rentals.length === 0) {
        rentalsTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-500">Nenhuma locação encontrada.</td></tr>`;
        return;
    }

    rentals.forEach(rental => {
        const client = allClients.find(c => String(c.id) === String(rental.cliente_id || rental.client_id));
        const car = allCars.find(c => String(c.id) === String(rental.car_id));
        const clientName = client ? client.nome : 'Cliente não encontrado';
        const carInfo = car ? `${car.brand || car.marca} ${car.model || car.modelo}` : 'Carro não encontrado';
        const carLicensePlate = car ? (car.license_plate || car.placa) : 'N/A';

        let statusText, statusColor;
        switch (rental.status.toLowerCase()) {
            case 'ativa':
                statusText = 'Ativa';
                statusColor = 'bg-green-100 text-green-800';
                break;
            case 'finalizada':
                statusText = 'Finalizada';
                statusColor = 'bg-gray-100 text-gray-800';
                break;
            case 'atrasada':
                statusText = 'Atrasada';
                statusColor = 'bg-red-100 text-red-800';
                break;
            case 'pendente':
                statusText = 'Pendente';
                statusColor = 'bg-yellow-100 text-yellow-800';
                break;
            default:
                statusText = rental.status;
                statusColor = 'bg-blue-100 text-blue-800';
        }

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-all duration-200';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${rental.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${clientName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${carInfo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${carLicensePlate}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(rental.start_date)} - ${formatDate(rental.end_date)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(rental.total_amount)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                    ${statusText}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center space-x-2">
                    <button class="text-blue-600 hover:text-blue-900 view-btn" data-rental-id="${rental.id}" title="Visualizar">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${rental.status.toLowerCase() !== 'finalizada' ? `<button class="text-green-600 hover:text-green-900 finalize-btn" data-rental-id="${rental.id}" title="Finalizar"><i class="fas fa-check-circle"></i></button>` : ''}
                    <button class="text-purple-600 hover:text-purple-900 car-details-btn" data-car-id="${rental.car_id}" title="Ver Detalhes do Carro"><i class="fas fa-car"></i></button>
                    <button class="text-blue-600 hover:text-blue-900 edit-btn" data-rental-id="${rental.id}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="text-red-600 hover:text-red-900 delete-btn" data-rental-id="${rental.id}" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        `;
        rentalsTableBody.appendChild(row);
    });

    // Adiciona eventos aos botões
    document.querySelectorAll('.view-btn').forEach(button => {
        button.addEventListener('click', () => {
            const rentalId = button.dataset.rentalId;
            const rental = allRentals.find(r => String(r.id) === String(rentalId));
            if (rental) showDetailsModal(rental);
        });
    });

    document.querySelectorAll('.finalize-btn').forEach(button => {
        button.addEventListener('click', () => {
            const rentalId = button.dataset.rentalId;
            const rental = allRentals.find(r => String(r.id) === String(rentalId));
            if (!rental) {
                showNotification('Locação não encontrada.', 'error');
                return;
            }
            Swal.fire({
                title: 'Finalizar locação?',
                text: 'Deseja finalizar esta locação?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sim, finalizar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    showReturnModal(rental);
                }
            });
        });
    });

    document.querySelectorAll('.car-details-btn').forEach(button => {
        button.addEventListener('click', () => {
            const carId = button.dataset.carId;
            showCarDetails(carId);
        });
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => {
            const rentalId = button.dataset.rentalId;
            const rental = allRentals.find(r => String(r.id) === String(rentalId));
            if (rental) showModal(false, rental);
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async () => {
            const rentalId = button.dataset.rentalId;
            await deleteRental(rentalId);
        });
    });
}

function filterAndSearchRentals() {
    const searchText = searchInput.value.toLowerCase();
    const selectedStatus = statusFilter.value;

    const filteredRentals = allRentals.filter(rental => {
        const car = allCars.find(c => String(c.id) === String(rental.car_id));
        const client = allClients.find(c => String(c.id) === String(rental.cliente_id || rental.client_id));
        const carText = car ? `${car.brand || car.marca} ${car.model || car.modelo} (${car.license_plate || car.placa})`.toLowerCase() : '';
        const clientText = client ? client.nome.toLowerCase() : '';
        const matchesSearch = clientText.includes(searchText) || carText.includes(searchText);
        const matchesStatus = selectedStatus === '' || rental.status.toLowerCase() === selectedStatus.toLowerCase();
        return matchesSearch && matchesStatus;
    });

    renderRentalsTable(filteredRentals);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Verificação de elementos críticos
    if (!newRentalBtn || !rentalModal || !rentalForm || !returnModal) {
        console.error('Elementos críticos não encontrados');
        showNotification('Erro: Elementos críticos da interface não encontrados.', 'error');
        return;
    }

    // Inicializar Flatpickr
    try {
        const flatpickrOptions = {
            dateFormat: 'Y-m-d',
            altInput: true,
            altFormat: 'd/m/Y',
            allowInput: true,
            clickOpens: true,
            minDate: 'today',
            locale: 'pt',
            onChange: calculateTotal
        };

        if (startDateInput) flatpickrStartDate = flatpickr(startDateInput, flatpickrOptions);
        if (endDateInput) flatpickrEndDate = flatpickr(endDateInput, flatpickrOptions);
        const returnDateInput = document.getElementById('returnDate');
        if (returnDateInput) {
            flatpickrReturnDate = flatpickr(returnDateInput, {
                dateFormat: 'Y-m-d',
                altInput: true,
                altFormat: 'd/m/Y',
                allowInput: true,
                clickOpens: true,
                minDate: 'today',
                locale: 'pt'
            });
        }
    } catch (error) {
        console.error('Erro ao inicializar Flatpickr:', error);
        showNotification('Erro ao carregar o seletor de datas. Usando campos nativos.', 'warning');
        if (startDateInput) startDateInput.type = 'date';
        if (endDateInput) endDateInput.type = 'date';
        const returnDateInput = document.getElementById('returnDate');
        if (returnDateInput) returnDateInput.type = 'date';
    }

    // Carregar dados iniciais
    try {
        await populateClientAndCarSelects();
        await loadRentals();
    } catch (error) {
        console.error('Falha na inicialização da página:', error);
        showNotification('Erro ao inicializar a página.', 'error');
    }

    // Configurar eventos
    if (newRentalBtn) newRentalBtn.addEventListener('click', () => showModal(true));
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (closeReturnModalBtn) closeReturnModalBtn.addEventListener('click', closeReturnModal);
    if (cancelReturnBtn) cancelReturnBtn.addEventListener('click', closeReturnModal);
    if (closeDetailsModalBtn) closeDetailsModalBtn.addEventListener('click', () => {
        detailsModal.style.display = 'none';
        document.body.classList.remove('overflow-hidden');
    });

    if (rentalModal) {
        rentalModal.addEventListener('click', (e) => {
            if (e.target === rentalModal) closeModal();
        });
    }

    if (returnModal) {
        returnModal.addEventListener('click', (e) => {
            if (e.target === returnModal) closeReturnModal();
        });
    }

    if (detailsModal) {
        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) {
                detailsModal.style.display = 'none';
                document.body.classList.remove('overflow-hidden');
            }
        });
    }

    if (mobileMenuBtn && mobileMenu && backdrop) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.add('open');
            backdrop.classList.add('active');
        });
        closeMobileMenu.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            backdrop.classList.remove('active');
        });
        backdrop.addEventListener('click', () => {
            mobileMenu.classList.remove('open');
            backdrop.classList.remove('active');
        });
    }

    if (carSelect) {
        carSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const dailyRate = selectedOption.dataset.dailyRate || 0;
            dailyRateInput.value = dailyRate;
            calculateTotal();
        });
    }

    if (startDateInput) startDateInput.addEventListener('change', calculateTotal);
    if (endDateInput) endDateInput.addEventListener('change', calculateTotal);
    if (insuranceSelect) insuranceSelect.addEventListener('change', calculateTotal);
    if (additionalFeesInput) additionalFeesInput.addEventListener('input', calculateTotal);

    const lateFeeInput = document.getElementById('lateFee');
    if (lateFeeInput) lateFeeInput.addEventListener('input', updateReturnSummary);

    if (searchInput) searchInput.addEventListener('input', filterAndSearchRentals);
    if (statusFilter) statusFilter.addEventListener('change', filterAndSearchRentals);

    if (cnhUpload) {
        cnhUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    cnhPreview.src = e.target.result;
                    cnhPreview.classList.remove('hidden');
                    cnhPlaceholder.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            } else {
                cnhPreview.src = '#';
                cnhPreview.classList.add('hidden');
                cnhPlaceholder.classList.remove('hidden');
            }
        });
    }

    if (clientSelect) {
        clientSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const cnhUrl = selectedOption.dataset.cnhUrl;
            if (cnhUrl && cnhUrl !== 'null' && cnhUrl !== '') {
                cnhPreview.src = cnhUrl;
                cnhPreview.classList.remove('hidden');
                cnhPlaceholder.classList.add('hidden');
            } else {
                cnhPreview.src = '#';
                cnhPreview.classList.add('hidden');
                cnhPlaceholder.classList.remove('hidden');
            }
        });
    }

    if (rentalForm) {
        rentalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rentalId = rentalIdInput.value;
            const isNew = !rentalId;

            const rentalData = {
                cliente_id: parseInt(clientSelect.value) || null,
                car_id: carSelect.value,
                start_date: formatDateForBackend(startDateInput.value),
                end_date: formatDateForBackend(endDateInput.value),
                total_days: parseInt(totalDaysInput.value) || 0,
                daily_rate: parseFloat(dailyRateInput.value) || 0,
                total_amount: parseFloat(totalAmountInput.value) || 0,
                additional_fees: parseFloat(additionalFeesInput.value) || 0,
                mileage_start: parseInt(mileageStartInput.value) || 0,
                observations: observations.value !== null && observations.value !== undefined ? observations.value.toString() : "",
                status: 'ATIVA',
                payment_method: paymentMethodSelect.value || '',
                cnh_photo_path: null,
                insurance_rate: parseFloat(insuranceSelect.value) || 0
            };

            if (!rentalData.cliente_id) {
                showNotification('Selecione um cliente.', 'error');
                return;
            }
            if (!rentalData.car_id || !isValidUUID(rentalData.car_id)) {
                showNotification('Selecione um carro válido.', 'error');
                return;
            }
            if (!rentalData.start_date || !rentalData.end_date) {
                showNotification('Preencha as datas de início e fim.', 'error');
                return;
            }
            if (new Date(rentalData.end_date) < new Date(rentalData.start_date)) {
                showNotification('A data de fim não pode ser anterior à data de início.', 'error');
                return;
            }
            if (rentalData.total_days <= 0) {
                showNotification('O período de locação deve ser de pelo menos 1 dia.', 'error');
                return;
            }
            if (!rentalData.payment_method) {
                showNotification('Selecione um método de pagamento.', 'error');
                return;
            }
            if (rentalData.mileage_start < 0) {
                showNotification('A quilometragem inicial não pode ser negativa.', 'error');
                return;
            }
            if (rentalData.daily_rate <= 0) {
                showNotification('A diária deve ser maior que zero.', 'error');
                return;
            }
            if (rentalData.total_amount <= 0) {
                showNotification('O valor total deve ser maior que zero.', 'error');
                return;
            }

            if (cnhUpload.files[0]) {
                const cnhFormData = new FormData();
                cnhFormData.append('cnh_file', cnhUpload.files[0]);
                try {
                    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD_CNH}`;
                    if (url.includes('undefined')) throw new Error('Rota inválida detectada: UNDEFINED');
                    const uploadResponse = await fetch(url, {
                        method: 'POST',
                        body: cnhFormData,
                    });
                    if (!uploadResponse.ok) {
                        const errorData = await uploadResponse.json();
                        throw new Error(errorData.error || 'Erro ao fazer upload da CNH');
                    }
                    const uploadResult = await uploadResponse.json();
                    rentalData.cnh_photo_path = uploadResult.cnh_url;
                } catch (error) {
                    console.error('Erro ao fazer upload da CNH:', error);
                    showNotification(`Erro no upload da CNH: ${error.message}`, 'error');
                    return;
                }
            } else if (clientSelect.value) {
                const selectedOption = clientSelect.options[clientSelect.selectedIndex];
                const cnhUrl = selectedOption.dataset.cnhUrl;
                if (cnhUrl && cnhUrl !== 'null' && cnhUrl !== '') {
                    rentalData.cnh_photo_path = cnhUrl;
                }
            }

            const url = isNew ? `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREATE_RENTAL}` : `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPDATE_RENTAL(rentalId)}`;
            const method = isNew ? 'POST' : 'PUT';

            try {
                const response = await fetch(url, {
                    method,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(rentalData)
                });
                if (!response.ok) {
                    let errorMessage = 'Erro ao salvar a locação.';
                    try {
                        const errorData = await response.json();
                        if (Array.isArray(errorData.detail)) {
                            errorMessage = errorData.detail.map(err => `${err.loc ? err.loc.join('.') : 'Campo'}: ${err.msg}`).join('; ');
                        } else if (errorData.detail) {
                            errorMessage = errorData.detail;
                        }
                    } catch (e) {
                        console.error('Erro ao processar resposta do servidor:', e);
                    }
                    throw new Error(`Erro ${response.status}: ${errorMessage}`);
                }
                showNotification('Locação salva com sucesso!', 'success');
                closeModal();
                loadRentals();
            } catch (error) {
                console.error('Erro ao salvar locação:', error);
                showNotification(error.message, 'error');
            }
        });
    }

    if (returnForm) {
        returnForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const rentalId = document.getElementById('returnRentalId').value;
            const returnData = {
                return_date: formatDateForBackend(document.getElementById('returnDate').value),
                final_mileage: parseInt(document.getElementById('finalMileage').value) || 0,
                fuel_level: parseInt(document.getElementById('fuelLevel').value) || 0,
                late_fee: parseFloat(document.getElementById('lateFee').value) || 0,
                observations: document.getElementById('returnNotes').value || ''
            };

            if (!returnData.return_date) {
                showNotification('Preencha a data de devolução.', 'error');
                return;
            }
            if (returnData.final_mileage < 0) {
                showNotification('A quilometragem final não pode ser negativa.', 'error');
                return;
            }

            await finalizeRental(rentalId, returnData);
        });
    }

    // Configurações adicionais (tema, perfil, logout)
    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark');
            sunIcon.classList.toggle('hidden');
            moonIcon.classList.toggle('hidden');
        });
    }

    const profileButton = document.getElementById('profileButton');
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (profileButton && dropdownMenu) {
        profileButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', () => {
            dropdownMenu.classList.add('hidden');
        });
    }

    const loginButton = document.getElementById('loginButton');
    const logoutButton = document.getElementById('logoutButton');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            window.location.href = '/login';
        });
    }
    if (logoutButton) {
        logoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await fetch(`${API_CONFIG.BASE_URL}/user/logout`, { method: 'POST', credentials: 'include' });
                window.location.href = '/login';
            } catch {
                showNotification('Erro ao sair.', 'error');
            }
        });
    }
});