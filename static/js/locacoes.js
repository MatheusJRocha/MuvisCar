
        // Configuração da API
        const API_CONFIG = {
            BASE_URL: 'http://127.0.0.1:8000',
            ENDPOINTS: {
                LIST_RENTALS: '/rental/locacoes',
                CREATE_RENTAL: '/rental/locacoes',
                UPDATE_RENTAL: (id) => `/rental/locacoes/${id}`,
                DELETE_RENTAL: (id) => `/rental/locacoes/${id}`, // Endpoint para deletar
                FINALIZE_RENTAL: (id) => `/rental/locacoes/${id}/finalize`, // Endpoint para finalizar
                LIST_CLIENTS: '/clientes/',
                LIST_CARS: '/cars/carros'
            }
        };
        console.log("API Base URL:", API_CONFIG.BASE_URL);

        // Elementos do DOM
        console.log('locacoes: Verificando elementos DOM');
        const rentalModal = document.getElementById('rentalModal');
        const newRentalBtn = document.getElementById('newRentalBtn');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const rentalForm = document.getElementById('rentalForm');
        const rentalsTableBody = document.getElementById('rentalsTableBody');
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
        const cnhUpload = document.getElementById('cnhUpload');
        const cnhPreview = document.getElementById('cnhPreview');
        const cnhPlaceholder = document.getElementById('cnhPlaceholder');
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const mobileMenu = document.getElementById('mobileMenu');
        const closeMobileMenu = document.getElementById('closeMobileMenu');
        const backdrop = document.getElementById('backdrop');

        // Verificação de elementos críticos
        if (!newRentalBtn) {
            console.error('newRentalBtn não encontrado');
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Botão Nova Locação não encontrado.'
            });
        }
        if (!rentalModal) {
            console.error('rentalModal não encontrado');
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Modal de locação não encontrado.'
            });
        }
        if (!rentalForm) {
            console.error('rentalForm não encontrado');
            Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Formulário de locação não encontrado.'
            });
        }

        // Flatpickr instances
        let flatpickrStartDate = null;
        let flatpickrEndDate = null;

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
                title: type === 'error' ? 'Erro' : 'Sucesso',
                text: message,
                timer: 5000,
                showConfirmButton: false
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

        function calculateTotal() {
            const startDate = flatpickrStartDate ? flatpickrStartDate.selectedDates[0] : new Date(startDateInput.value);
            const endDate = flatpickrEndDate ? flatpickrEndDate.selectedDates[0] : new Date(endDateInput.value);
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

        // Funções de API
        async function loadRentals() {
            rentalsTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-500"><div class="loading-spinner"></div>Carregando locações...</td></tr>`;
            try {
                const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LIST_RENTALS}`);
                if (!response.ok) throw new Error(`Erro ao carregar locações: ${response.status}`);
                allRentals = await response.json();
                console.log('Dados das locações recebidos:', allRentals);
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

                if (!clientsResponse.ok) throw new Error(`Erro ao carregar clientes: ${clientsResponse.status}`);
                if (!carsResponse.ok) throw new Error(`Erro ao carregar carros: ${carsResponse.status}`);

                allClients = await clientsResponse.json();
                const carsData = await carsResponse.json();
                allCars = carsData.data || carsData || [];

                console.log('Clientes carregados:', allClients);
                console.log('Carros carregados:', allCars);

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
                        option.value = car.id; // UUID como string
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
                const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.DELETE_RENTAL(rentalId)}`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    throw new Error('Erro ao excluir locação.');
                }
                return true;
            } catch (error) {
                console.error('Erro ao excluir locação:', error);
                throw error;
            }
        }
        // Funções de UI
        // ...existing code...
        function renderRentalsTable(rentals) {
            rentalsTableBody.innerHTML = '';
            if (rentals.length === 0) {
                rentalsTableBody.innerHTML = `<tr><td colspan="8" class="text-center py-8 text-gray-500">Nenhuma locação encontrada.</td></tr>`;
                return;
            }

            rentals.forEach(rental => {
                const client = allClients.find(c => String(c.id) === String(rental.cliente_id));
                const car = allCars.find(c => String(c.id) === String(rental.car_id));
                const row = document.createElement('tr');
                row.classList.add('hover:bg-gray-50', 'transition-all', 'duration-200');

                const clientName = client ? (client.nome || client.name) : 'Cliente não encontrado';
                const carInfo = car ? `${car.brand || car.marca} ${car.model || car.modelo}` : 'Carro não encontrado';
                const carLicensePlate = car ? (car.license_plate || car.placa) : '';

                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${rental.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${clientName}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${carInfo}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${carLicensePlate}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(rental.start_date)} - ${formatDate(rental.end_date)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(rental.total_amount)}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="status-badge bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">${rental.status}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="text-blue-600 hover:text-blue-900 mr-2 view-btn" data-rental-id="${rental.id}" title="Visualizar">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="text-green-600 hover:text-green-900 mr-2 finalize-btn" data-rental-id="${rental.id}" title="Finalizar">
                            <i class="fas fa-check-circle"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-900 mr-2 delete-btn" data-rental-id="${rental.id}" title="Excluir">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                        <button class="text-indigo-600 hover:text-indigo-900 edit-btn" data-rental-id="${rental.id}" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                `;
                rentalsTableBody.appendChild(row);
            });

            // Adiciona os eventos aos botões
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

            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', async () => {
                    const rentalId = button.dataset.rentalId;
                    Swal.fire({
                        title: 'Excluir locação?',
                        text: 'Esta ação não pode ser desfeita.',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Sim, excluir',
                        cancelButtonText: 'Cancelar'
                    }).then(async (result) => {
                        if (result.isConfirmed) {
                            try {
                                await deleteRental(rentalId);
                                showNotification('Locação excluída com sucesso!', 'success');
                                loadRentals();
                            } catch (error) {
                                showNotification('Erro ao excluir locação.', 'error');
                            }
                        }
                    });
                });
            });

            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', () => {
                    const rentalId = button.dataset.rentalId;
                    const rental = allRentals.find(r => String(r.id) === String(rentalId));
                    if (rental) showModal(false, rental);
                });
            });
        }

        function showDetailsModal(rental) {
            const client = allClients.find(c => String(c.id) === String(rental.cliente_id));
            const car = allCars.find(c => String(c.id) === String(rental.car_id));
            const detailsContent = document.getElementById('detailsContent');
            if (!detailsContent) return;

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
                        ${client && client.cnh_url ? `<div class="mb-2"><strong>CNH:</strong><br><img src="${client.cnh_url}" alt="CNH do cliente" class="max-w-xs rounded-lg border mt-2"></div>` : ''}
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
                        <div class="mb-2 flex justify-center items-center">
                            ${car && (car.image_url || car.foto_url) ? 
                                `<img src="${car.image_url || car.foto_url}" alt="Foto do carro" class="max-w-xs rounded-lg border shadow mt-2">` 
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
                            ${rental.cnh_photo_path ? `<div class="mb-2"><strong>CNH enviada:</strong><br><img src="${rental.cnh_photo_path}" alt="CNH" class="max-w-xs rounded-lg border mt-2"></div>` : ''}
                        </div>
                    </div>
                </div>
            `;
            const detailsModal = document.getElementById('detailsModal');
            if (detailsModal) {
                detailsModal.classList.remove('hidden');
                detailsModal.classList.add('flex');
                document.body.classList.add('overflow-hidden');
            }

            const closeDetailsModalBtn = document.getElementById('closeDetailsModalBtn');
            if (closeDetailsModalBtn) {
                closeDetailsModalBtn.onclick = () => {
                    detailsModal.classList.add('hidden');
                    detailsModal.classList.remove('flex');
                    document.body.classList.remove('overflow-hidden');
                };
            }
        }

// ...existing code...

        function showModal(isNew = true, rental = null) {
            console.log('showModal: Iniciando abertura do modal');
            if (!rentalModal) {
                console.error('showModal: Elemento rentalModal não encontrado');
                showNotification('Erro: Modal de locação não encontrado.', 'error');
                return;
            }
            rentalModal.classList.remove('hidden');
            rentalModal.classList.add('flex');
            document.body.classList.add('overflow-hidden');
            console.log('showModal: Modal visível, classes:', rentalModal.className);

            rentalForm.reset();
            cnhPreview.classList.add('hidden');
            cnhPlaceholder.classList.remove('hidden');
            cnhPreview.src = '#';
            document.getElementById('modalTitle').textContent = isNew ? 'Nova Locação' : 'Editar Locação';
            document.getElementById('rentalId').value = '';

            if (flatpickrStartDate) flatpickrStartDate.clear();
            if (flatpickrEndDate) flatpickrEndDate.clear();

            if (!isNew && rental) {
                document.getElementById('rentalId').value = rental.id;
                clientSelect.value = rental.cliente_id;
                carSelect.value = rental.car_id;
                mileageStartInput.value = rental.mileage_start;
                additionalFeesInput.value = rental.additional_fees;
                insuranceSelect.value = rental.insurance_rate || 0;
                paymentMethodSelect.value = rental.payment_method;
                observations.value = rental.observations || '';

                const selectedClient = allClients.find(c => c.id === rental.cliente_id);
                if (selectedClient && selectedClient.cnh_url) {
                    cnhPreview.src = selectedClient.cnh_url;
                    cnhPreview.classList.remove('hidden');
                    cnhPlaceholder.classList.add('hidden');
                }

                if (flatpickrStartDate) flatpickrStartDate.setDate(new Date(rental.start_date));
                if (flatpickrEndDate) flatpickrEndDate.setDate(new Date(rental.end_date));

                carSelect.dispatchEvent(new Event('change'));
                startDateInput.dispatchEvent(new Event('change'));
                endDateInput.dispatchEvent(new Event('change'));
            }
        }

        function closeModal() {
            console.log('closeModal: Fechando modal de locação');
            if (!rentalModal) {
                console.error('closeModal: Elemento rentalModal não encontrado');
                return;
            }
            rentalModal.classList.add('hidden');
            rentalModal.classList.remove('flex');
            document.body.classList.remove('overflow-hidden');
        }

        // Event Listeners
        if (newRentalBtn) {
            newRentalBtn.addEventListener('click', (e) => {
                console.log('Botão Nova Locação clicado');
                e.stopImmediatePropagation();
                showModal(true);
            });
        } else {
            console.error('newRentalBtn não encontrado para adicionar o listener');
            showNotification('Erro: Botão Nova Locação não encontrado.', 'error');
        }

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeModal);
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeModal);
        }

        if (rentalModal) {
            rentalModal.addEventListener('click', (e) => {
                if (e.target === rentalModal) closeModal();
            });
        }

        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.add('open');
                backdrop.classList.add('active');
            });
        }

        if (closeMobileMenu) {
            closeMobileMenu.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                backdrop.classList.remove('active');
            });
        }

        if (backdrop) {
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
                }
            });
        }

        if (clientSelect) {
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
        }

        if (rentalForm) {
            rentalForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('Formulário de locação enviado');
                const rentalId = document.getElementById('rentalId').value;
                const isNew = !rentalId;

                // Montar dados como objeto JSON
                const rentalData = {
                    cliente_id: parseInt(clientSelect.value) || null,
                    car_id: carSelect.value, // Enviar como string UUID
                    start_date: formatDateForBackend(startDateInput.value),
                    end_date: formatDateForBackend(endDateInput.value),
                    total_days: parseInt(totalDaysInput.value) || 0,
                    daily_rate: parseFloat(dailyRateInput.value) || 0,
                    total_amount: parseFloat(totalAmountInput.value) || 0,
                    additional_fees: parseFloat(additionalFeesInput.value) || 0,
                    mileage_start: parseInt(mileageStartInput.value) || 0,
                    observations: observations.value || null,
                    status: 'ATIVA',
                    payment_method: paymentMethodSelect.value || '',
                    cnh_photo_path: null,
                    insurance_rate: parseFloat(insuranceSelect.value) || 0
                };

                console.log('Dados preparados para envio:', rentalData);

                // Validar dados antes do envio
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

                // Upload de CNH, se houver
                if (cnhUpload.files[0]) {
                    const cnhFormData = new FormData();
                    cnhFormData.append('cnh_file', cnhUpload.files[0]);
                    try {
                        console.log('Enviando upload de CNH para:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD_CNH}`);
                        const uploadResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD_CNH}`, {
                            method: 'POST',
                            body: cnhFormData
                        });
                        if (!uploadResponse.ok) throw new Error(`Erro ao fazer upload da CNH: ${uploadResponse.status}`);
                        const uploadResult = await uploadResponse.json();
                        console.log('Upload de CNH bem-sucedido:', uploadResult);
                        rentalData.cnh_photo_path = uploadResult.cnh_url;
                    } catch (error) {
                        console.error('Erro ao fazer upload da CNH:', error);
                        showNotification('Erro no upload da CNH.', 'error');
                        return;
                    }
                } else if (clientSelect.value) {
                    const selectedOption = clientSelect.options[clientSelect.selectedIndex];
                    const cnhUrl = selectedOption.dataset.cnhUrl;
                    if (cnhUrl && cnhUrl !== 'null') {
                        console.log('Reutilizando CNH existente:', cnhUrl);
                        rentalData.cnh_photo_path = cnhUrl;
                    }
                }

                const url = isNew ? `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREATE_RENTAL}` : `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPDATE_RENTAL(rentalId)}`;
                const method = isNew ? 'POST' : 'PUT';
                console.log(`Enviando ${method} para: ${url}`, rentalData);

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
                            console.error('Detalhes do erro do servidor:', errorData);
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
                    console.log('Locação salva com sucesso:', await response.json());
                    showNotification('Locação salva com sucesso!', 'success');
                    closeModal();
                    loadRentals();
                } catch (error) {
                    console.error('Erro ao salvar locação:', error);
                    showNotification(error.message, 'error');
                }
            });
        }

        document.addEventListener('DOMContentLoaded', () => {
            console.log('locacoes: DOMContentLoaded disparado');

            // Event listeners dos botões do topo
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
                        await fetch('http://127.0.0.1:8000/user/logout', { method: 'POST', credentials: 'include' });
                        window.location.href = '/login';
                    } catch {
                        showNotification('Erro ao sair.', 'error');
                    }
                });
            }

            // Inicializar Flatpickr se estiver disponível
            if (typeof flatpickr !== 'undefined') {
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
            } else {
                console.warn('Flatpickr não está carregado. Usando campos de data nativos.');
                startDateInput.type = 'date';
                endDateInput.type = 'date';
            }

            // Carregar dados iniciais
            populateClientAndCarSelects().then(() => loadRentals());
        });
        
