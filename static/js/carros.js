// Configuração da API
const API_CONFIG = {
    BASE_URL: 'http://localhost:8000', // Altere para a URL do seu backend
    ENDPOINTS: {
        LIST_CARS: '/cars/carros', // Rota para listar todos os carros (GET /)
        CREATE_CAR: '/cars/carros', // Rota para criar um carro (POST /carros)
        CAR_BY_PLATE: (plate) => `/cars/carros/${plate}`, // Rota para operações por placa (PUT/DELETE /cars/carros/{plate})
        HEALTH: '/health'
    },
    TIMEOUT: 10000 // 10 segundos (Nota: Para um timeout real em fetch, seria necessário usar AbortController)
};
console.log("API Base URL:", API_CONFIG.BASE_URL);

// --- Elementos do DOM ---
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const closeMobileMenu = document.getElementById('closeMobileMenu');
const mobileMenu = document.getElementById('mobileMenu');
const backdrop = document.getElementById('backdrop');

const addCarBtn = document.getElementById('addCarBtn');
const carFormModal = document.getElementById('carFormModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const carForm = document.getElementById('carForm');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');
const submitBtnText = document.getElementById('submitBtnText');
const loadingSpinner = submitBtn.querySelector('.loading-spinner');
const originalPlateInput = document.getElementById('originalPlate');
const editModeInput = document.getElementById('editMode');
const cancelFormBtn = document.getElementById('cancelFormBtn');

const carsTableBody = document.getElementById('carsTableBody');
const carCountSpan = document.getElementById('carCount');
const loadingMessage = document.getElementById('loadingMessage');
const noCarsMessage = document.getElementById('noCarsMessage');

// Campos do formulário de carro
const brandInput = document.getElementById('brand');
const modelInput = document.getElementById('model');
const yearInput = document.getElementById('year');
const mileageInput = document.getElementById('mileage');
const colorInput = document.getElementById('color');
const licensePlateInput = document.getElementById('licensePlate');
const carCategorySelect = document.getElementById('carCategory');
const dailyRateInput = document.getElementById('dailyRate');
const statusSelect = document.getElementById('status');
const featuresTextarea = document.getElementById('features');
const imageUrlsTextarea = document.getElementById('imageUrls'); // Manter o ID do textarea por conveniência
const imagePreviewDiv = document.getElementById('imagePreview');
const imageGalleryDiv = imagePreviewDiv.querySelector('.image-gallery');

// Elementos dos filtros
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const brandFilter = document.getElementById('brandFilter');
const categoryFilter = document.getElementById('categoryFilter');
const priceRangeMin = document.getElementById('priceRangeMin');
const priceRangeMax = document.getElementById('priceRangeMax');
const priceRangeValueSpan = document.getElementById('priceRangeValue');
const refreshBtn = document.getElementById('refreshBtn');

// Elementos de notificação
const notificationToast = document.getElementById('notificationToast');
const carDetailsModal = document.getElementById('carDetailsModal');

// Variáveis globais
let allCars = []; // Este será o array de carros
let filteredCars = [];

// --- Funções de Utilidade ---

function showNotification(message, type = 'info') {
    if (notificationToast) {
        notificationToast.textContent = message;
        notificationToast.className = `notification show ${type}`;
        setTimeout(() => {
            notificationToast.className = 'notification';
        }, 3000);
    } else {
        console.error("Erro: Elemento de notificação (notificationToast) não encontrado no DOM.");
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatPlate(plate) {
    if (plate && plate.length === 7) {
        // Formato Mercosul: AAA0A00, Antigo: AAA0000
        const mercosulPattern = /^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/;
        if (mercosulPattern.test(plate)) {
            return `${plate.substring(0, 3)}-${plate.substring(3, 4)}${plate.substring(4, 5)}${plate.substring(5, 7)}`;
        }
        return `${plate.substring(0, 3)}-${plate.substring(3)}`;
    }
    return plate;
}

function validateForm() {
    let isValid = true;

    const showError = (element, message) => {
        element.classList.add('border-red-500');
        // Encontra o elemento de erro que geralmente vem depois do input/select/textarea
        const errorElement = element.nextElementSibling;
        if (errorElement && errorElement.id.endsWith('Error')) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
        isValid = false;
    };

    const clearError = (element) => {
        element.classList.remove('border-red-500');
        const errorElement = element.nextElementSibling;
        if (errorElement && errorElement.id.endsWith('Error')) {
            errorElement.classList.add('hidden');
        }
    };

    // Validar Marca
    if (brandInput.value.trim() === '') {
        showError(brandInput, 'A marca é obrigatória.');
    } else {
        clearError(brandInput);
    }

    // Validar Modelo
    if (modelInput.value.trim() === '') {
        showError(modelInput, 'O modelo é obrigatório.');
    } else {
        clearError(modelInput);
    }

    // Validar Ano
    const currentYear = new Date().getFullYear();
    const year = parseInt(yearInput.value);
    if (isNaN(year) || year < 1900 || year > (currentYear + 2)) {
        showError(yearInput, `Ano inválido. Deve ser entre 1900 e ${currentYear + 2}.`);
    } else {
        clearError(yearInput);
    }

    // Validar Quilometragem
    const mileage = parseInt(mileageInput.value);
    if (isNaN(mileage) || mileage < 0) {
        showError(mileageInput, 'Quilometragem inválida. Deve ser um número positivo.');
    } else {
        clearError(mileageInput);
    }

    // Validar Cor
    if (colorInput.value.trim() === '') {
        showError(colorInput, 'A cor é obrigatória.');
    } else {
        clearError(colorInput);
    }

    // Validar Placa
    const plate = licensePlateInput.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''); // Limpa e padroniza
    const mercosulPattern = /^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/; // Ex: ABC4E67
    const oldPattern = /^[A-Z]{3}[0-9]{4}$/; // Ex: ABC1234

    if (!plate) {
        showError(licensePlateInput, 'A placa é obrigatória.');
    } else if (!(mercosulPattern.test(plate) || oldPattern.test(plate))) {
        showError(licensePlateInput, 'Formato de placa inválido. Use ABC1234 ou ABC1D23.');
    } else {
        clearError(licensePlateInput);
    }

    // Validar Categoria
    if (carCategorySelect.value === '') {
        showError(carCategorySelect, 'A categoria é obrigatória.');
    } else {
        clearError(carCategorySelect);
    }

    // Validar Diária
    const dailyRate = parseFloat(dailyRateInput.value);
    if (isNaN(dailyRate) || dailyRate <= 0) {
        showError(dailyRateInput, 'A diária é obrigatória e deve ser um valor positivo.');
    } else {
        clearError(dailyRateInput);
    }

    // Validar Status
    if (statusSelect.value === '') {
        showError(statusSelect, 'O status é obrigatório.');
    } else {
        clearError(statusSelect);
    }

    return isValid;
}

// --- Funções de Manipulação da UI ---

function openModal(isEdit = false, carData = {}) {
    carForm.reset();
    clearFormErrors();
    imageGalleryDiv.innerHTML = ''; // Limpa preview de imagens
    imagePreviewDiv.classList.add('hidden');

    if (isEdit) {
        formTitle.innerHTML = '<i class="fas fa-edit text-blue-600 mr-2"></i>Editar Carro';
        submitBtnText.textContent = 'Salvar Alterações';
        editModeInput.value = 'true';
        originalPlateInput.value = carData.license_plate; // Armazena a placa original para edição

        // Preencher o formulário
        brandInput.value = carData.brand;
        modelInput.value = carData.model;
        yearInput.value = carData.year;
        mileageInput.value = carData.mileage;
        colorInput.value = carData.color;
        licensePlateInput.value = carData.license_plate;
        carCategorySelect.value = carData.category;
        dailyRateInput.value = carData.daily_rate;
        statusSelect.value = carData.status;
        featuresTextarea.value = carData.features ? carData.features.join(', ') : '';
        // MODIFICADO: De carData.image_urls para carData.images
        imageUrlsTextarea.value = carData.images ? carData.images.join('\n') : '';

        // Atualiza preview de imagens ao editar
        // MODIFICADO: De carData.image_urls para carData.images
        if (carData.images && carData.images.length > 0) {
            updateImagePreview();
        }
    } else {
        formTitle.innerHTML = '<i class="fas fa-car text-blue-600 mr-2"></i>Adicionar Carro';
        submitBtnText.textContent = 'Salvar Carro';
        editModeInput.value = 'false';
        originalPlateInput.value = '';
    }
    carFormModal.classList.remove('hidden');
}

function closeModal() {
    carFormModal.classList.add('hidden');
    clearFormErrors();
}

function clearFormErrors() {
    const errorElements = document.querySelectorAll('#carForm p[id$="Error"]');
    errorElements.forEach(el => el.classList.add('hidden'));
    const inputElements = carForm.querySelectorAll('input, select, textarea');
    inputElements.forEach(el => el.classList.remove('border-red-500'));
}

function showLoading(show) {
    if (show) {
        loadingMessage.classList.remove('hidden');
        noCarsMessage.classList.add('hidden');
        carsTableBody.innerHTML = ''; // Limpa a tabela
    } else {
        loadingMessage.classList.add('hidden');
    }
}

function updateImagePreview() {
    const urls = imageUrlsTextarea.value.split('\n').map(url => url.trim()).filter(url => url);
    imageGalleryDiv.innerHTML = '';
    if (urls.length > 0) {
        imagePreviewDiv.classList.remove('hidden');
        urls.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Pré-visualização de Imagem';
            img.classList.add('rounded-lg', 'shadow', 'hover:shadow-md', 'w-full', 'h-24', 'object-cover');
            imageGalleryDiv.appendChild(img);
        });
    } else {
        imagePreviewDiv.classList.add('hidden');
    }
}

function updatePriceRangeValue() {
    const min = parseFloat(priceRangeMin.value);
    const max = parseFloat(priceRangeMax.value);
    priceRangeValueSpan.textContent = `${formatCurrency(min)} - ${formatCurrency(max)}`;
}

// --- Funções de Requisição à API ---

async function fetchCars() {
    showLoading(true);
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LIST_CARS}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Dados recebidos da API (objeto completo):", data); // DEBUG

        // Verifica se 'data' é um objeto e se contém a propriedade 'data' que é um array
        if (data && Array.isArray(data.data)) {
            allCars = data.data; // Atribui o array de carros à variável global allCars
            console.log("Array de carros extraído:", allCars); // DEBUG
        } else if (Array.isArray(data)) { // Caso a API retorne diretamente o array de carros
            allCars = data;
            console.log("Array de carros recebido diretamente:", allCars); // DEBUG
        } else {
            // Se não for nem um objeto com 'data' nem um array direto, algo está errado
            throw new Error("Formato de resposta da API inesperado. Esperava um objeto com 'data' ou um array.");
        }

        populateBrandFilter();
        filterCars(); // Chama a função de filtro e renderização

    } catch (error) {
        console.error("Erro ao buscar carros:", error);
        showNotification('Erro ao carregar a lista de carros. Verifique a conexão com o backend.', 'error');
        noCarsMessage.classList.remove('hidden');
    } finally {
        showLoading(false);
    }
}

async function createCar(carData) {
    submitBtn.disabled = true;
    loadingSpinner.classList.remove('hidden');
    submitBtnText.textContent = 'Salvando...';
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREATE_CAR}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(carData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || errorData.message || 'Erro ao adicionar carro.');
        }
        showNotification('Carro adicionado com sucesso!', 'success');
        closeModal();
        fetchCars(); // Recarrega a lista
    } catch (error) {
        console.error("Erro ao criar carro:", error);
        showNotification(error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
        submitBtnText.textContent = 'Salvar Carro';
    }
}

async function updateCar(originalPlate, carData) {
    submitBtn.disabled = true;
    loadingSpinner.classList.remove('hidden');
    submitBtnText.textContent = 'Atualizando...';
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CAR_BY_PLATE(originalPlate)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(carData)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || errorData.message || 'Erro ao atualizar carro.');
        }
        showNotification('Carro atualizado com sucesso!', 'success');
        closeModal();
        fetchCars(); // Recarrega a lista
    } catch (error) {
        console.error("Erro ao atualizar carro:", error);
        showNotification(error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
        submitBtnText.textContent = 'Salvar Alterações';
    }
}

async function deleteCar(plate) {
    // Substituído o `confirm()` pelo SweetAlert2
    Swal.fire({
        title: 'Excluir carro?',
        text: 'Esta ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CAR_BY_PLATE(plate)}`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || errorData.message || 'Erro ao excluir carro.');
                }
                showNotification('Carro excluído com sucesso!', 'success');
                fetchCars(); // Recarrega a lista
            } catch (error) {
                console.error("Erro ao excluir carro:", error);
                showNotification(error.message, 'error');
            }
        }
    });
}

// --- Renderização e Filtros ---

function renderCars(carsToRender) {
    carsTableBody.innerHTML = '';
    carCountSpan.textContent = `${carsToRender.length} Carros Encontrados`;

    if (carsToRender.length === 0) {
        noCarsMessage.classList.remove('hidden');
        return;
    } else {
        noCarsMessage.classList.add('hidden');
    }

    carsToRender.forEach(car => {
        const row = document.createElement('tr');
        row.classList.add('hover:bg-gray-50', 'transition-all', 'duration-200');

        // MODIFICADO: De car.image_urls para car.images
        const imageUrl = car.images && car.images.length > 0 ? car.images[0] : '/static/images/default_car.png';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <img src="${imageUrl}" alt="${car.brand} ${car.model}" class="w-20 h-12 object-cover rounded-md shadow car-image" onerror="this.onerror=null;this.src='/static/images/default_car.png';">
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${car.brand}</div>
                <div class="text-sm text-gray-500">${car.model}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatPlate(car.license_plate)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${car.year} / ${car.mileage.toLocaleString('pt-BR')} km
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${car.category} / ${formatCurrency(car.daily_rate)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-badge status-${car.status}">${car.status.replace('_', ' ')}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="text-blue-600 hover:text-blue-900 mr-2 view-car-btn" data-plate="${car.license_plate}">
                    <i class="fas fa-eye"></i> Ver
                </button>
                <button class="text-indigo-600 hover:text-indigo-900 mr-4 edit-btn" data-plate="${car.license_plate}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="text-red-600 hover:text-red-900 delete-btn" data-plate="${car.license_plate}">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </td>
        `;
        carsTableBody.appendChild(row);
    });

    // Adicionar listeners aos botões de editar e excluir após a renderização
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const plateToEdit = event.currentTarget.dataset.plate;
            const carToEdit = allCars.find(car => car.license_plate === plateToEdit);
            if (carToEdit) {
                openModal(true, carToEdit);
            }
        });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const plateToDelete = event.currentTarget.dataset.plate;
            deleteCar(plateToDelete);
        });
    });

    // NOVO: Adicionar listener para o botão "Ver"
    document.querySelectorAll('.view-car-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const plateToView = event.currentTarget.dataset.plate;
            const carToView = allCars.find(car => car.license_plate === plateToView);
            if (carToView) {
                showCarDetailsModal(carToView);
            }
        });
    });
}

/**
 * NOVO: Função para exibir os detalhes do carro em um modal
 * @param {Object} car - O objeto do carro a ser exibido
 */
function showCarDetailsModal(car) {
    // Encontrar o modal de detalhes (certifique-se de que este elemento existe no seu HTML)
    const carDetailsModal = document.getElementById('carDetailsModal');
    if (!carDetailsModal) {
        console.error("Erro: Elemento 'carDetailsModal' não encontrado no DOM.");
        return;
    }

    // Construir o HTML do modal com base nos dados do carro
    let imagesHtml = '';
    const images = car.images || [];
    if (images.length) {
        imagesHtml = images.map(url => `
            <a href="${url}" target="_blank">
                <img src="${url}" alt="Foto do carro" class="aspect-square w-full h-auto object-cover rounded-md" onerror="this.onerror=null;this.src='/static/images/default_car.png';">
            </a>
        `).join('');
    } else {
        imagesHtml = `
            <img src="/static/images/default_car.png" alt="Sem imagem" class="aspect-square w-full h-auto object-cover rounded-md">
        `;
    }

    carDetailsModal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-5xl mx-auto dark:bg-gray-800 dark:text-white">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-2xl font-bold text-gray-800 dark:text-white"><i class="fas fa-car text-blue-600 mr-2"></i>Detalhes do Carro</h3>
                <button id="closeCarDetailsModal" class="text-gray-500 hover:text-gray-700 text-2xl dark:text-gray-400 dark:hover:text-white"><i class="fas fa-times"></i></button>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    <h4 class="font-bold text-blue-600 mb-3 text-lg flex items-center">
                        <i class="fas fa-info-circle mr-2"></i> Informações do Veículo
                    </h4>
                    <div class="space-y-2">
                        <div class="mb-2"><strong>Marca:</strong> ${car.brand}</div>
                        <div class="mb-2"><strong>Modelo:</strong> ${car.model}</div>
                        <div class="mb-2"><strong>Placa:</strong> ${formatPlate(car.license_plate)}</div>
                        <div class="mb-2"><strong>Ano:</strong> ${car.year}</div>
                        <div class="mb-2"><strong>Quilometragem:</strong> ${car.mileage.toLocaleString('pt-BR')} km</div>
                        <div class="mb-2"><strong>Cor:</strong> ${car.color}</div>
                        <div class="mb-2"><strong>Tipo de Combustível:</strong> ${car.fuel_type}</div>
                        <div class="mb-2"><strong>Tipo de Transmissão:</strong> ${car.transmission_type}</div>
                        <div class="mb-2"><strong>Direção:</strong> ${car.steering_type}</div>
                        <div class="mb-2"><strong>Passageiros:</strong> ${car.passengers}</div>
                        <div class="mb-2"><strong>Categoria:</strong> ${car.category}</div>
                        <div class="mb-2"><strong>Diária:</strong> ${formatCurrency(car.daily_rate)}</div>
                        <div class="mb-2"><strong>Status:</strong> ${car.status}</div>
                        <div class="mb-2"><strong>Recursos:</strong> ${car.features ? car.features.join(', ') : '-'}</div>
                    </div>
                </div>
                <div>
                    <h4 class="font-semibold text-gray-700 mb-2 dark:text-gray-200">Fotos do Carro</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                        ${imagesHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
    // Mostrar o modal
    carDetailsModal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');

    // Adicionar listener para fechar o modal
    const closeDetailsBtn = document.getElementById('closeCarDetailsModal');
    if (closeDetailsBtn) {
        closeDetailsBtn.onclick = () => {
            carDetailsModal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        };
    }

    // Fechar o modal clicando fora dele
    carDetailsModal.addEventListener('click', (e) => {
        if (e.target === carDetailsModal) {
            carDetailsModal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }
    });
}

function filterCars() { // Renomeado de applyFiltersAndRenderCars para filterCars
    let cars = [...allCars]; // Cria uma cópia para não modificar o array original

    const searchTerm = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    const brand = brandFilter.value;
    const category = categoryFilter.value;
    const minPrice = parseFloat(priceRangeMin.value);
    const maxPrice = parseFloat(priceRangeMax.value);

    // Filtrar por termo de busca
    if (searchTerm) {
        cars = cars.filter(car =>
            car.brand.toLowerCase().includes(searchTerm) ||
            car.model.toLowerCase().includes(searchTerm) ||
            car.license_plate.toLowerCase().includes(searchTerm)
        );
    }

    // Filtrar por status
    if (status) {
        cars = cars.filter(car => car.status === status);
    }

    // Filtrar por marca
    if (brand) {
        cars = cars.filter(car => car.brand === brand);
    }

    // Filtrar por categoria
    if (category) {
        cars = cars.filter(car => car.category === category);
    }

    // Filtrar por faixa de preço
    cars = cars.filter(car => car.daily_rate >= minPrice && car.daily_rate <= maxPrice);

    filteredCars = cars; // Armazena os carros filtrados
    renderCars(filteredCars);
}

function populateBrandFilter() {
    if (!Array.isArray(allCars)) {
        console.error("populateBrandFilter: allCars não é um array. Não é possível popular o filtro de marcas.");
        return;
    }
    const brands = [...new Set(allCars.map(car => car.brand))].sort();
    brandFilter.innerHTML = '<option value="">Todas as marcas</option>';
    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandFilter.appendChild(option);
    });
}

// --- Event Listeners ---

// Mobile Menu
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

// Modal de Carro
addCarBtn.addEventListener('click', () => openModal(false));
closeModalBtn.addEventListener('click', closeModal);
cancelFormBtn.addEventListener('click', closeModal);
carFormModal.addEventListener('click', (e) => {
    if (e.target === carFormModal) {
        closeModal();
    }
});

// Submissão do Formulário
carForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateForm()) {
        showNotification('Por favor, corrija os erros no formulário.', 'error');
        return;
    }

    // Garante que os valores numéricos são parseados corretamente
    const carData = {
        brand: brandInput.value.trim(),
        model: modelInput.value.trim(),
        year: parseInt(yearInput.value, 10), // Parse para inteiro
        mileage: parseInt(mileageInput.value, 10), // Parse para inteiro
        color: colorInput.value.trim(),
        license_plate: licensePlateInput.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''),
        category: carCategorySelect.value,
        daily_rate: parseFloat(dailyRateInput.value), // Parse para float
        status: statusSelect.value,
        features: featuresTextarea.value.split(',').map(f => f.trim()).filter(f => f),
        // MODIFICADO: De imageUrls para images
        images: imageUrlsTextarea.value.split('\n').map(url => url.trim()).filter(url => url)
    };

    const isEdit = editModeInput.value === 'true';
    if (isEdit) {
        const originalPlate = originalPlateInput.value;
        await updateCar(originalPlate, carData);
    } else {
        await createCar(carData);
    }
});

// Preview de Imagens
imageUrlsTextarea.addEventListener('input', updateImagePreview);

// Filtros
searchInput.addEventListener('input', filterCars);
statusFilter.addEventListener('change', filterCars);
brandFilter.addEventListener('change', filterCars);
categoryFilter.addEventListener('change', filterCars);
refreshBtn.addEventListener('click', () => {
    // Resetar filtros ao atualizar
    searchInput.value = '';
    statusFilter.value = '';
    brandFilter.value = '';
    categoryFilter.value = '';
    priceRangeMin.value = priceRangeMin.min;
    priceRangeMax.value = priceRangeMax.max;
    updatePriceRangeValue();
    fetchCars();
});

// Range de Preço
priceRangeMin.addEventListener('input', () => {
    if (parseFloat(priceRangeMin.value) > parseFloat(priceRangeMax.value)) {
        priceRangeMax.value = priceRangeMin.value;
    }
    updatePriceRangeValue();
    filterCars();
});

priceRangeMax.addEventListener('input', () => {
    if (parseFloat(priceRangeMax.value) < parseFloat(priceRangeMin.value)) {
        priceRangeMin.value = priceRangeMax.value;
    }
    updatePriceRangeValue();
    filterCars();
});

// --- Inicialização ---
document.addEventListener('DOMContentLoaded', () => {
    fetchCars();
    updatePriceRangeValue(); // Inicializa o valor do range de preço
});

// ========================================
// INICIALIZAÇÃO
// ========================================

// Aguarda o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', () => {
    // A chamada para fetchCars e updatePriceRangeValue já está aqui em cima,
    // então não precisa repetir. Vamos apenas adicionar os listeners de perfil e tema.

    // Lógica do Dropdown de Perfil
    const profileButton = document.getElementById('profileButton');
    const dropdownMenu = document.getElementById('dropdownMenu');

    if (profileButton && dropdownMenu) {
        profileButton.addEventListener('click', function() {
            dropdownMenu.classList.toggle('hidden');
        });

        window.addEventListener('click', function(event) {
            if (!profileButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
                dropdownMenu.classList.add('hidden');
            }
        });
    }

    // Lógica do Tema Escuro
    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');
    const htmlTag = document.documentElement;

    if (htmlTag && sunIcon && moonIcon && themeToggle) {
        // Verifica a preferência do usuário ou se já há um tema salvo
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            htmlTag.classList.add('dark');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        } else {
            htmlTag.classList.remove('dark');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        }

        themeToggle.addEventListener('click', function() {
            if (htmlTag.classList.contains('dark')) {
                htmlTag.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                sunIcon.classList.add('hidden');
                moonIcon.classList.remove('hidden');
            } else {
                htmlTag.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                sunIcon.classList.remove('hidden');
                moonIcon.classList.add('hidden');
            }
        });
    }

    // Chamada inicial para carregar os carros e inicializar os filtros
    // fetchCars();
    // updatePriceRangeValue();

});