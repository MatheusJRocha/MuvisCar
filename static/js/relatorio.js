// URL base da sua API
const BASE_API_URL = 'http://127.0.0.1:8000';

// Elementos da UI
const activeRentalsSpan = document.getElementById('activeRentals');
const monthlyRevenueSpan = document.getElementById('monthlyRevenue');
const returnsTodaySpan = document.getElementById('returnsToday');
const overdueRentalsSpan = document.getElementById('overdueRentals');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const newRentalBtn = document.getElementById('newRentalBtn');
const rentalsTableBody = document.getElementById('rentalsTableBody');
const rentalModal = document.getElementById('rentalModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const rentalForm = document.getElementById('rentalForm');
const modalTitle = document.getElementById('modalTitle');
const rentalIdInput = document.getElementById('rentalId');
const clientSelect = document.getElementById('clientSelect');
const carSelect = document.getElementById('carSelect');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const dailyRateInput = document.getElementById('dailyRate');
const totalDaysInput = document.getElementById('totalDays');
const totalValueInput = document.getElementById('totalValue');
const insuranceSelect = document.getElementById('insurance');
const observationsTextarea = document.getElementById('observations');
const cancelBtn = document.getElementById('cancelBtn');

// Elementos do modal de devolução
const returnModal = document.getElementById('returnModal');
const closeReturnModalBtn = document.getElementById('closeReturnModalBtn');
const returnForm = document.getElementById('returnForm');
const returnRentalIdInput = document.getElementById('returnRentalId');
const returnDateInput = document.getElementById('returnDate');
const finalMileageInput = document.getElementById('finalMileage');
const fuelLevelSelect = document.getElementById('fuelLevel');
const lateFeeInput = document.getElementById('lateFee');
const returnNotesTextarea = document.getElementById('returnNotes');
const originalAmountSpan = document.getElementById('originalAmount');
const lateAmountSpan = document.getElementById('lateAmount');
const finalAmountSpan = document.getElementById('finalAmount');
const cancelReturnBtn = document.getElementById('cancelReturnBtn');

// Gráficos
let revenueChartInstance;
let statusChartInstance;

// Dados em memória
let allRentals = [];
let allClients = [];
let allCars = [];

// Funções de formatação
const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Notificações
function showNotification(message, type = 'info', duration = 5000) {
    const notificationContainer = document.getElementById('notificationContainer');
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

// Funções de carregamento de dados
async function fetchRentals() {
    rentalsTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-500"><div class="loading-spinner"></div>Carregando locações...</td></tr>`;
    try {
        const response = await fetch(`${BASE_API_URL}/locacoes/`);
        if (!response.ok) throw new Error('Erro ao buscar locações.');
        allRentals = await response.json();
        renderRentals(allRentals);
        updateDashboardStats(allRentals);
        updateCharts(allRentals);
    } catch (error) {
        console.error('Erro ao carregar locações:', error);
        rentalsTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-red-500">Erro ao carregar locações: ${error.message}</td></tr>`;
        showNotification('Erro ao carregar locações.', 'error');
    }
}

async function fetchClientsAndCars() {
    try {
        const clientsResponse = await fetch(`${BASE_API_URL}/clientes/`);
        if (!clientsResponse.ok) throw new Error('Erro ao buscar clientes.');
        allClients = await clientsResponse.json();
        populateSelect(clientSelect, allClients, 'id', 'nome', 'Selecione um Cliente');

        const carsResponse = await fetch(`${BASE_API_URL}/carros/`);
        if (!carsResponse.ok) throw new Error('Erro ao buscar carros.');
        allCars = await carsResponse.json();
        populateSelect(carSelect, allCars.filter(car => car.status === 'DISPONIVEL'), 'license_plate', 'model', 'Selecione um Carro');
    } catch (error) {
        console.error('Erro ao carregar clientes ou carros:', error);
        showNotification('Erro ao carregar clientes ou carros para o formulário.', 'error');
    }
}

function populateSelect(selectElement, data, valueKey, textKey, defaultOptionText) {
    selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`;
    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item[valueKey];
        option.textContent = item[textKey];
        selectElement.appendChild(option);
    });
}

function renderRentals(rentalsList) {
    rentalsTableBody.innerHTML = '';
    if (rentalsList.length === 0) {
        rentalsTableBody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-gray-500">Nenhuma locação encontrada.</td></tr>`;
        return;
    }

    rentalsList.forEach(rental => {
        const row = document.createElement('tr');
        row.className = 'bg-white border-b hover:bg-gray-50';

        const clientName = rental.client ? rental.client.nome : 'N/A';
        const carInfo = rental.car ? `${rental.car.brand} ${rental.car.model} (${rental.car.license_plate})` : 'N/A';
        const startDate = new Date(rental.start_date).toLocaleDateString('pt-BR');
        const endDate = new Date(rental.end_date).toLocaleDateString('pt-BR');
        const totalAmount = formatCurrency(rental.total_amount);
        const statusClass = `status-${rental.status.toLowerCase().replace(/ /g, '_')}`;

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">${rental.id}</td>
            <td class="px-6 py-4 whitespace-nowrap">${clientName}</td>
            <td class="px-6 py-4 whitespace-nowrap">${carInfo}</td>
            <td class="px-6 py-4 whitespace-nowrap">${startDate} a ${endDate}</td>
            <td class="px-6 py-4 whitespace-nowrap">${totalAmount}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge ${statusClass}">${rental.status}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center space-x-2">
                    <button class="text-blue-600 hover:text-blue-900 edit-btn" data-id="${rental.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${rental.status.toLowerCase() === 'ativa' || rental.status.toLowerCase() === 'atrasada' ? `
                    <button class="text-green-600 hover:text-green-900 return-btn" data-id="${rental.id}" title="Registrar Devolução">
                        <i class="fas fa-undo"></i>
                    </button>
                    ` : ''}
                    <button class="text-red-600 hover:text-red-900 delete-btn" data-id="${rental.id}" title="Excluir">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        rentalsTableBody.appendChild(row);
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (e) => editRental(parseInt(e.currentTarget.dataset.id)));
    });
    document.querySelectorAll('.return-btn').forEach(button => {
        button.addEventListener('click', (e) => openReturnModal(parseInt(e.currentTarget.dataset.id)));
    });
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => deleteRental(parseInt(e.currentTarget.dataset.id)));
    });
}

function updateDashboardStats(rentals) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const active = rentals.filter(r => r.status.toLowerCase() === 'ativa').length;
    const overdue = rentals.filter(r => r.status.toLowerCase() === 'atrasada').length;

    const monthlyRevenue = rentals
        .filter(r => {
            const rentalMonth = new Date(r.start_date).getMonth();
            const rentalYear = new Date(r.start_date).getFullYear();
            return rentalMonth === today.getMonth() && rentalYear === today.getFullYear();
        })
        .reduce((sum, r) => sum + r.total_amount, 0);

    const returnsToday = rentals.filter(r => {
        if (r.end_date) {
            const endDate = new Date(r.end_date);
            endDate.setHours(0, 0, 0, 0);
            return endDate.getTime() === today.getTime() && r.status.toLowerCase() === 'ativa';
        }
        return false;
    }).length;

    activeRentalsSpan.textContent = active;
    monthlyRevenueSpan.textContent = formatCurrency(monthlyRevenue);
    returnsTodaySpan.textContent = returnsToday;
    overdueRentalsSpan.textContent = overdue;
}

function updateCharts(rentals) {
    // Gráfico de Receita Mensal (exemplo simplificado)
    const monthlyData = {};
    rentals.forEach(r => {
        const date = new Date(r.start_date);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        monthlyData[monthYear] = (monthlyData[monthYear] || 0) + r.total_amount;
    });

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
        const [m1, y1] = a.split('/').map(Number);
        const [m2, y2] = b.split('/').map(Number);
        if (y1 !== y2) return y1 - y2;
        return m1 - m2;
    });

    const revenueLabels = sortedMonths;
    const revenueValues = sortedMonths.map(month => monthlyData[month]);

    if (revenueChartInstance) revenueChartInstance.destroy();
    revenueChartInstance = new Chart(document.getElementById('revenueChart'), {
        type: 'line',
        data: {
            labels: revenueLabels,
            datasets: [{
                label: 'Receita Mensal (R$)',
                data: revenueValues,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Gráfico de Status das Locações
    const statusCounts = {
        ativa: 0,
        finalizada: 0,
        atrasada: 0,
        pendente: 0
    };
    rentals.forEach(r => {
        const status = r.status.toLowerCase();
        if (statusCounts.hasOwnProperty(status)) {
            statusCounts[status]++;
        }
    });

    const statusLabels = Object.keys(statusCounts).map(s => s.charAt(0).toUpperCase() + s.slice(1));
    const statusValues = Object.values(statusCounts);
    const statusColors = ['#10b981', '#6b7280', '#ef4444', '#f59e0b'];

    if (statusChartInstance) statusChartInstance.destroy();
    statusChartInstance = new Chart(document.getElementById('statusChart'), {
        type: 'doughnut',
        data: {
            labels: statusLabels,
            datasets: [{
                label: 'Número de Locações',
                data: statusValues,
                backgroundColor: statusColors,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}

// Funções do Modal de Locação
newRentalBtn.addEventListener('click', () => {
    rentalForm.reset();
    rentalIdInput.value = '';
    modalTitle.textContent = 'Nova Locação';
    // Habilita os selects de cliente e carro para nova locação
    clientSelect.disabled = false;
    carSelect.disabled = false;
    // Limpa os valores calculados
    dailyRateInput.value = '';
    totalDaysInput.value = '';
    totalValueInput.value = '';
    rentalModal.classList.remove('hidden');
    rentalModal.classList.add('flex');
});

closeModalBtn.addEventListener('click', () => {
    rentalModal.classList.add('hidden');
    rentalModal.classList.remove('flex');
});

cancelBtn.addEventListener('click', () => {
    rentalModal.classList.add('hidden');
    rentalModal.classList.remove('flex');
});

// Flatpickr para datas
flatpickr(startDateInput, { dateFormat: "Y-m-d", onChange: calculateRentalValues });
flatpickr(endDateInput, { dateFormat: "Y-m-d", onChange: calculateRentalValues });

// Cálculo de valores da locação
carSelect.addEventListener('change', calculateRentalValues);
insuranceSelect.addEventListener('change', calculateRentalValues);

function calculateRentalValues() {
    const selectedCarPlate = carSelect.value;
    const selectedCar = allCars.find(car => car.license_plate === selectedCarPlate);
    const startDate = flatpickr.parseDate(startDateInput.value, "Y-m-d");
    const endDate = flatpickr.parseDate(endDateInput.value, "Y-m-d");
    const insuranceCostPerDay = parseFloat(insuranceSelect.value || 0);

    if (selectedCar && startDate && endDate && endDate >= startDate) {
        const dailyRate = selectedCar.daily_rate;
        dailyRateInput.value = dailyRate.toFixed(2);

        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir o dia de início e fim
        totalDaysInput.value = diffDays;

        const totalValue = (dailyRate * diffDays) + (insuranceCostPerDay * diffDays);
        totalValueInput.value = totalValue.toFixed(2);
    } else {
        dailyRateInput.value = '';
        totalDaysInput.value = '';
        totalValueInput.value = '';
    }
}

// Submissão do formulário de locação
rentalForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rentalData = {
        client_id: parseInt(clientSelect.value),
        car_license_plate: carSelect.value,
        start_date: startDateInput.value,
        end_date: endDateInput.value,
        total_amount: parseFloat(totalValueInput.value),
        insurance_cost: parseFloat(insuranceSelect.value),
        observations: observationsTextarea.value.trim(),
        status: 'ativa' // Nova locação sempre começa como 'ativa'
    };

    const rentalId = rentalIdInput.value;
    const method = rentalId ? 'PUT' : 'POST';
    const url = rentalId ? `${BASE_API_URL}/locacoes/${rentalId}` : `${BASE_API_URL}/locacoes/`;

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rentalData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro ao salvar locação.');
        }

        showNotification(`Locação ${rentalId ? 'atualizada' : 'registrada'} com sucesso!`, 'success');
        rentalModal.classList.add('hidden');
        fetchRentals(); // Recarrega a tabela de locações
        fetchClientsAndCars(); // Recarrega clientes e carros para atualizar status de carros
    } catch (error) {
        console.error('Erro ao salvar locação:', error);
        showNotification(error.message || 'Erro desconhecido ao salvar locação.', 'error');
    }
});

// Editar locação
async function editRental(id) {
    const rental = allRentals.find(r => r.id === id);
    if (rental) {
        modalTitle.textContent = `Editar Locação (ID: ${rental.id})`;
        rentalIdInput.value = rental.id;

        // Preencher selects de cliente e carro
        // Para edição, precisamos garantir que o cliente e o carro da locação estejam nas opções
        // Mesmo que o carro não esteja mais "DISPONIVEL"
        await fetchClientsAndCars(); // Recarrega para ter certeza que todos os clientes e carros estão disponíveis
        
        clientSelect.value = rental.client_id;
        carSelect.value = rental.car_license_plate;
        
        // Desabilita os selects de cliente e carro na edição
        clientSelect.disabled = true;
        carSelect.disabled = true;

        startDateInput.value = rental.start_date;
        endDateInput.value = rental.end_date;
        dailyRateInput.value = rental.car.daily_rate.toFixed(2); // Usa a diária do carro associado
        totalDaysInput.value = Math.ceil(Math.abs(new Date(rental.end_date) - new Date(rental.start_date)) / (1000 * 60 * 60 * 24)) + 1;
        totalValueInput.value = rental.total_amount.toFixed(2);
        insuranceSelect.value = rental.insurance_cost;
        observationsTextarea.value = rental.observations || '';

        rentalModal.classList.remove('hidden');
        rentalModal.classList.add('flex');
    }
}

// Excluir locação
async function deleteRental(id) {
    if (!confirm('Tem certeza que deseja excluir esta locação?')) {
        return;
    }
    try {
        const response = await fetch(`${BASE_API_URL}/locacoes/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro ao excluir locação.');
        }
        showNotification('Locação excluída com sucesso!', 'success');
        fetchRentals(); // Recarrega a tabela
        fetchClientsAndCars(); // Recarrega clientes e carros para atualizar status de carros
    } catch (error) {
        console.error('Erro ao excluir locação:', error);
        showNotification(error.message || 'Erro desconhecido ao excluir locação.', 'error');
    }
}

// Funções do Modal de Devolução
async function openReturnModal(rentalId) {
    const rental = allRentals.find(r => r.id === rentalId);
    if (rental) {
        returnForm.reset();
        returnRentalIdInput.value = rental.id;
        returnDateInput.value = new Date().toISOString().split('T')[0]; // Data de hoje
        finalMileageInput.value = rental.car.mileage; // Sugere a quilometragem atual do carro
        fuelLevelSelect.value = '100'; // Sugere tanque cheio
        lateFeeInput.value = '0.00'; // Começa com 0
        returnNotesTextarea.value = '';

        originalAmountSpan.textContent = formatCurrency(rental.total_amount);
        lateAmountSpan.textContent = formatCurrency(0);
        finalAmountSpan.textContent = formatCurrency(rental.total_amount);

        // Configura Flatpickr para a data de devolução
        flatpickr(returnDateInput, { dateFormat: "Y-m-d", maxDate: "today" });

        returnModal.classList.remove('hidden');
        returnModal.classList.add('flex');
    }
}

closeReturnModalBtn.addEventListener('click', () => {
    returnModal.classList.add('hidden');
    returnModal.classList.remove('flex');
});

cancelReturnBtn.addEventListener('click', () => {
    returnModal.classList.add('hidden');
    returnModal.classList.remove('flex');
});

// Cálculo de valores na devolução
lateFeeInput.addEventListener('input', calculateReturnSummary);

function calculateReturnSummary() {
    const originalAmount = parseFloat(originalAmountSpan.textContent.replace(/[R$\s.,]/g, '').replace(',', '.'));
    const lateFee = parseFloat(lateFeeInput.value || 0);
    const finalTotal = originalAmount + lateFee;

    lateAmountSpan.textContent = formatCurrency(lateFee);
    finalAmountSpan.textContent = formatCurrency(finalTotal);
}

// Submissão do formulário de devolução
returnForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rentalId = returnRentalIdInput.value;
    const returnData = {
        return_date: returnDateInput.value,
        final_mileage: parseFloat(finalMileageInput.value),
        fuel_level: parseInt(fuelLevelSelect.value),
        late_fee: parseFloat(lateFeeInput.value),
        return_notes: returnNotesTextarea.value.trim(),
    };

    try {
        const response = await fetch(`${BASE_API_URL}/locacoes/${rentalId}/devolucao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(returnData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro ao registrar devolução.');
        }

        showNotification('Devolução registrada com sucesso!', 'success');
        returnModal.classList.add('hidden');
        fetchRentals(); // Recarrega a tabela de locações
        fetchClientsAndCars(); // Recarrega clientes e carros para atualizar status de carros
    } catch (error) {
        console.error('Erro ao registrar devolução:', error);
        showNotification(error.message || 'Erro desconhecido ao registrar devolução.', 'error');
    }
});


// Filtros e busca
searchInput.addEventListener('input', filterRentals);
statusFilter.addEventListener('change', filterRentals);

function filterRentals() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedStatus = statusFilter.value.toLowerCase();

    const filteredRentals = allRentals.filter(rental => {
        const matchesSearch = (rental.client && rental.client.nome.toLowerCase().includes(searchTerm)) ||
                              (rental.car && rental.car.license_plate.toLowerCase().includes(searchTerm)) ||
                              rental.id.toString().includes(searchTerm);
        
        const matchesStatus = selectedStatus === '' || rental.status.toLowerCase() === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    renderRentals(filteredRentals);
}

// Mobile menu toggle
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const closeMobileMenu = document.getElementById('closeMobileMenu');
const backdrop = document.getElementById('backdrop');

if (mobileMenuBtn && mobileMenu && closeMobileMenu && backdrop) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.add('active');
        backdrop.classList.add('active');
    });

    closeMobileMenu.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        backdrop.classList.remove('active');
    });

    backdrop.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        backdrop.classList.remove('active');
    });
} else {
    console.warn("Elementos do menu mobile não encontrados. Verifique se os IDs estão corretos.");
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    fetchRentals();
    fetchClientsAndCars();
});
