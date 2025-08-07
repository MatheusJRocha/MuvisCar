// URL base da sua API
const BASE_API_URL = 'http://127.0.0.1:8000';

// Elementos da UI
const rentalModal = document.getElementById('rentalModal');
const returnModal = document.getElementById('returnModal');
const newRentalBtn = document.getElementById('newRentalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const closeReturnModalBtn = document.getElementById('closeReturnModalBtn');
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

// Flatpickr instances
let flatpickrStartDate;
let flatpickrEndDate;
let flatpickrReturnDate;

// Dados em memória para referência
let allClients = [];
let allCars = [];
let allRentals = [];

// Elementos da CNH
const cnhUpload = document.getElementById('cnhUpload');
const cnhPreview = document.getElementById('cnhPreview');
const cnhPlaceholder = document.getElementById('cnhPlaceholder');
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

// Funções de formatação
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (dateString) => {
    if (!dateString) return '';
    const dateObj = new Date(dateString);
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');
    return `${day}/${month}/${year}`;
};

// Função para mostrar notificações
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Funções de API
async function loadRentals() {
    rentalsTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-500"><div class="loading-spinner"></div>Carregando locações...</td></tr>`;
    try {
        const response = await fetch(`${BASE_API_URL}/rental/locacoes`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao carregar locações: ${response.status} - ${errorText}`);
        }
        allRentals = await response.json();
        console.log('Dados das locações recebidos:', allRentals); // Debug
        renderRentalsTable(allRentals);
    } catch (error) {
        console.error('Erro ao buscar locações:', error);
        showNotification('Erro ao carregar locações. Verifique o console para mais detalhes.', 'error');
        rentalsTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-red-500">Erro ao carregar dados.</td></tr>`;
    }
}

async function populateClientAndCarSelects() {
    try {
        const [clientsResponse, carsResponse] = await Promise.all([
            fetch(`${BASE_API_URL}/clientes/`),
            fetch(`${BASE_API_URL}/cars/carros`)
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
        allCars = carsData.data || carsData || []; // Adapta para diferentes estruturas de resposta
        
        console.log('Clientes carregados:', allClients); // Debug
        console.log('Carros carregados:', allCars); // Debug
        
        clientSelect.innerHTML = '<option value="" disabled selected>Selecione um cliente</option>';
        allClients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.nome;
            option.dataset.cnhUrl = client.cnh_url;
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

async function deleteRental(id) {
    try {
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: "Você não poderá reverter isso!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, deletar!'
        });

        if (result.isConfirmed) {
            const response = await fetch(`${BASE_API_URL}/rental/locacoes/${id}`, {
                method: 'DELETE',
            });

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

async function finalizeRental(id, returnData) {
    try {
        const response = await fetch(`${BASE_API_URL}/rental/locacoes/${id}/finalize`, {
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
        closeReturnModal();
        loadRentals();
    } catch (error) {
        console.error('Erro ao finalizar locação:', error);
        showNotification(`Erro: ${error.message}`, 'error');
    }
}

// Funções de UI
function showModal(isNew = true, rental = null) {
    rentalModal.style.display = 'flex';
    document.body.classList.add('overflow-hidden');
    rentalForm.reset();
    cnhPreview.classList.add('hidden');
    cnhPlaceholder.classList.remove('hidden');
    cnhPreview.src = '#';
    document.getElementById('modalTitle').textContent = isNew ? 'Nova Locação' : 'Editar Locação';
    rentalIdInput.value = '';

    // Resetar os seletores
    clientSelect.value = '';
    carSelect.value = '';
    
    // Resetar o Flatpickr
    if (flatpickrStartDate) flatpickrStartDate.clear();
    if (flatpickrEndDate) flatpickrEndDate.clear();

    if (!isNew && rental) {
        rentalIdInput.value = rental.id;
        clientSelect.value = rental.client_id;
        carSelect.value = rental.car_id;
        mileageStartInput.value = rental.start_mileage;
        additionalFeesInput.value = rental.additional_fees;
        insuranceSelect.value = rental.insurance_rate || 0;
        paymentMethodSelect.value = rental.payment_method;
        observations.value = rental.observations || '';
        
        if (rental.cnh_url) {
            cnhPreview.src = rental.cnh_url;
            cnhPreview.classList.remove('hidden');
            cnhPlaceholder.classList.add('hidden');
        }

        if (flatpickrStartDate) flatpickrStartDate.setDate(new Date(rental.start_date));
        if (flatpickrEndDate) flatpickrEndDate.setDate(new Date(rental.end_date));

        // Trigger change events para atualizar cálculos
        carSelect.dispatchEvent(new Event('change'));
        startDateInput.dispatchEvent(new Event('change'));
        endDateInput.dispatchEvent(new Event('change'));
    }
}

function showReturnModal(rental) {
    returnModal.style.display = 'flex';
    document.body.classList.add('overflow-hidden');
    returnForm.reset();
    document.getElementById('returnRentalId').value = rental.id;

    if (flatpickrReturnDate) {
        flatpickrReturnDate.setDate(new Date());
    }

    document.getElementById('originalAmount').textContent = formatCurrency(rental.total_amount);
    document.getElementById('lateAmount').textContent = formatCurrency(0);
    document.getElementById('finalAmount').textContent = formatCurrency(rental.total_amount);
}

function closeModal() {
    rentalModal.style.display = 'none';
    document.body.classList.remove('overflow-hidden');
}

function closeReturnModal() {
    returnModal.style.display = 'none';
    document.body.classList.remove('overflow-hidden');
}

function calculateTotal() {
    const startDate = flatpickrStartDate.selectedDates[0];
    const endDate = flatpickrEndDate.selectedDates[0];
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
    const originalAmount = parseFloat(document.getElementById('originalAmount').textContent.replace('R$', '').replace(',', '.')) || 0;
    const lateFee = parseFloat(document.getElementById('lateFee').value) || 0;
    const finalTotal = originalAmount + lateFee;
    document.getElementById('lateAmount').textContent = formatCurrency(lateFee);
    document.getElementById('finalAmount').textContent = formatCurrency(finalTotal);
}

function renderRentalsTable(rentals) {
    rentalsTableBody.innerHTML = '';
    if (rentals.length === 0) {
        rentalsTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-500">Nenhuma locação encontrada.</td></tr>`;
        return;
    }

    rentals.forEach(rental => {
        const car = allCars.find(c => c.id === rental.car_id);
        const client = allClients.find(c => c.id === rental.client_id);
        const carName = car ? `${car.brand || car.marca} ${car.model || car.modelo} (${car.license_plate || car.placa})` : 'Carro não encontrado';
        const clientName = client ? client.nome : 'Cliente não encontrado';

        let statusText, statusColor;
        switch(rental.status) {
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
                statusText = 'Desconhecido';
                statusColor = 'bg-gray-100 text-gray-800';
        }
        
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${rental.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${clientName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${carName}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${rental.cnh_url ? `<button class="text-blue-600 hover:text-blue-800" onclick="showCnhImage('${rental.cnh_url}')">Ver CNH</button>` : 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(rental.start_date)} - ${formatDate(rental.end_date)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(rental.total_amount)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">
                    ${statusText}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center space-x-2">
                    ${rental.status !== 'finalizada' ? `<button onclick="showReturnModalForRental(${rental.id})" class="text-green-600 hover:text-green-900" title="Finalizar Locação"><i class="fas fa-check-circle"></i></button>` : ''}
                    <button onclick="editRental(${rental.id})" class="text-blue-600 hover:text-blue-900" title="Editar"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteRental(${rental.id})" class="text-red-600 hover:text-red-900" title="Excluir"><i class="fas fa-trash-alt"></i></button>
                </div>
            </td>
        `;
        rentalsTableBody.appendChild(row);
    });
}

function filterAndSearchRentals() {
    const searchText = searchInput.value.toLowerCase();
    const selectedStatus = statusFilter.value;

    const filteredRentals = allRentals.filter(rental => {
        const car = allCars.find(c => c.id === rental.car_id);
        const client = allClients.find(c => c.id === rental.client_id);
        const carText = car ? `${car.brand || car.marca} ${car.model || car.modelo} (${car.license_plate || car.placa})`.toLowerCase() : '';
        const clientText = client ? client.nome.toLowerCase() : '';
        const matchesSearch = clientText.includes(searchText) || carText.includes(searchText);
        const matchesStatus = selectedStatus === '' || rental.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    renderRentalsTable(filteredRentals);
}

function showCnhImage(url) {
    const cnhImageView = document.getElementById('cnhImageView');
    cnhImageView.src = url;
    cnhModal.style.display = 'flex';
}

function showReturnModalForRental(id) {
    const rental = allRentals.find(r => r.id === id);
    if (rental) {
        showReturnModal(rental);
    }
}

function editRental(id) {
    const rental = allRentals.find(r => r.id === id);
    if (rental) {
        showModal(false, rental);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Inicialização
    loadRentals();
    populateClientAndCarSelects();

    // Inicilizar Flatpickr
    flatpickrStartDate = flatpickr(startDateInput, {
        dateFormat: 'Y-m-d',
        locale: 'pt',
        onChange: calculateTotal
    });
    flatpickrEndDate = flatpickr(endDateInput, {
        dateFormat: 'Y-m-d',
        locale: 'pt',
        onChange: calculateTotal
    });
    flatpickrReturnDate = flatpickr(document.getElementById('returnDate'), {
        dateFormat: 'Y-m-d',
        locale: 'pt'
    });

    newRentalBtn.addEventListener('click', () => showModal(true));
    closeModalBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        backdrop.classList.remove('active');
    });

    closeReturnModalBtn.addEventListener('click', closeReturnModal);
    
    rentalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const rentalId = rentalIdInput.value;
        const isNew = !rentalId;
        
        const rentalFormData = new FormData();
        
        // Mapeamento de chaves para o backend (usando cliente_id, car_id)
        rentalFormData.append('cliente_id', clientSelect.value);
        rentalFormData.append('car_id', carSelect.value);
        rentalFormData.append('start_date', startDateInput.value);
        rentalFormData.append('end_date', endDateInput.value);
        rentalFormData.append('total_days', totalDaysInput.value);
        rentalFormData.append('daily_rate', dailyRateInput.value);
        rentalFormData.append('total_amount', totalAmountInput.value);
        rentalFormData.append('additional_fees', additionalFeesInput.value);
        rentalFormData.append('mileage_start', mileageStartInput.value);
        rentalFormData.append('observations', observations.value);
        rentalFormData.append('status', 'ativa'); 
        rentalFormData.append('payment_method', paymentMethodSelect.value);

        // Lógica para o upload da CNH e uso da CNH existente
        if (cnhUpload.files[0]) {
            // Upload do novo arquivo
            const cnhFormData = new FormData();
            cnhFormData.append('cnh_file', cnhUpload.files[0]);

            try {
                const uploadResponse = await fetch(`${BASE_API_URL}/rental/upload-cnh/`, {
                    method: 'POST',
                    body: cnhFormData,
                });
                if (!uploadResponse.ok) {
                    const errorData = await uploadResponse.json();
                    throw new Error(errorData.error || 'Erro ao fazer upload da CNH');
                }
                const uploadResult = await uploadResponse.json();
                rentalFormData.append('cnh_url', uploadResult.cnh_url);
            } catch (error) {
                console.error('Erro ao fazer upload da CNH:', error);
                showNotification(`Erro no upload da CNH: ${error.message}`, 'error');
                return;
            }
        } else if (clientSelect.value) {
            // Se não houver novo arquivo, use a URL da CNH do cliente selecionado
            const selectedOption = clientSelect.options[clientSelect.selectedIndex];
            const cnhUrl = selectedOption.dataset.cnhUrl;
            if (cnhUrl && cnhUrl !== 'null') {
                rentalFormData.append('cnh_url', cnhUrl);
            }
        }

        // Determinar URL e método da requisição, corrigindo o URL de edição
        const url = isNew
            ? `${BASE_API_URL}/rental/locacoes`
            : `${BASE_API_URL}/rental/locacoes/${rentalId}`;
        const method = isNew ? 'POST' : 'PUT';
        
        try {
            const response = await fetch(url, {
                method: method,
                body: rentalFormData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'Erro ao salvar a locação');
            }

            showNotification('Locação salva com sucesso!', 'success');
            closeModal();
            loadRentals();
        } catch (error) {
            console.error('Erro ao salvar locação:', error);
            showNotification(`Erro: ${error.message}`, 'error');
        }
    });

    returnForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rentalId = document.getElementById('returnRentalId').value;
        const returnData = {
            return_date: document.getElementById('returnDate').value,
            final_mileage: parseFloat(document.getElementById('finalMileage').value),
            fuel_level: parseFloat(document.getElementById('fuelLevel').value),
            late_fee: parseFloat(document.getElementById('lateFee').value),
            observations: document.getElementById('returnNotes').value
        };
        await finalizeRental(rentalId, returnData);
    });

    carSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const dailyRate = selectedOption.dataset.dailyRate || 0;
        dailyRateInput.value = dailyRate;
        calculateTotal();
    });

    startDateInput.addEventListener('change', calculateTotal);
    endDateInput.addEventListener('change', calculateTotal);
    insuranceSelect.addEventListener('change', calculateTotal);
    additionalFeesInput.addEventListener('input', calculateTotal);
    
    // Atualiza o resumo da devolução
    document.getElementById('lateFee').addEventListener('input', updateReturnSummary);
    
    // Filtros e busca
    searchInput.addEventListener('input', filterAndSearchRentals);
    statusFilter.addEventListener('change', filterAndSearchRentals);

    // CNH
    clientSelect.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const cnhUrl = selectedOption.dataset.cnhUrl;
        
        if (cnhUrl && cnhUrl !== 'null') {
            cnhPreview.src = cnhUrl;
            cnhPreview.classList.remove('hidden');
            cnhPlaceholder.classList.add('hidden');
        } else {
            cnhPreview.src = '#';
            cnhPreview.classList.add('hidden');
            cnhPlaceholder.classList.remove('hidden');
        }
    });

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
        }
    });

    // Mobile Menu
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
        backdrop.classList.toggle('active');
    });

    closeMobileMenu.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        backdrop.classList.remove('active');
    });
});