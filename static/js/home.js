// ========================================
// VARIÁVEIS GLOBAIS
// ========================================
let allCars = []; // Armazenará todos os carros buscados da API
let filteredCars = []; // Armazenará os carros após a aplicação dos filtros

// Referência aos elementos do DOM
const carModal = document.getElementById('carModal');
const modalTitle = document.getElementById('modalTitle');
const modalMainImage = document.getElementById('modalMainImage');
const modalImageGallery = document.getElementById('modalImageGallery');
const modalBrand = document.getElementById('modalBrand');
const modalModel = document.getElementById('modalModel');
const modalYear = document.getElementById('modalYear');
const modalPlate = document.getElementById('modalPlate');
const modalColor = document.getElementById('modalColor');
const modalMileage = document.getElementById('modalMileage');
const modalFuelType = document.getElementById('modalFuelType');
const modalPassengers = document.getElementById('modalPassengers');
const modalCategory = document.getElementById('modalCategory');
const modalPrice = document.getElementById('modalPrice');

// Elementos de filtro
const searchInput = document.getElementById('searchInput');
const brandFilter = document.getElementById('brandFilter');
const categoryFilter = document.getElementById('categoryFilter');
const priceRange = document.getElementById('priceRange');
const priceValue = document.getElementById('priceValue');
const clearFiltersBtn = document.getElementById('clearFilters');

// Elementos do menu mobile
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const closeMobileMenu = document.getElementById('closeMobileMenu');
const mobileMenu = document.getElementById('mobileMenu');
const backdrop = document.getElementById('backdrop');

// ========================================
// FUNÇÕES DE API
// ========================================

/**
 * Busca os carros da API
 */
async function fetchCarros() {
    try {
        showLoading();
        
        // A linha abaixo usa a rota que você especificou
        const response = await fetch('/cars/carros'); 
        
        if (!response.ok) {
            throw new Error(`Erro HTTP! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Atribui um ID único a cada carro se não houver
        allCars = data.data.map((car, index) => ({ 
            ...car, 
            id: car.id || index + 1 
        })); 
        
        filteredCars = [...allCars];
        renderCars(filteredCars);
        
        hideLoading();
    } catch (error) {
        console.error("Erro ao carregar carros:", error);
        hideLoading();
        showError("Não foi possível carregar os carros. Por favor, tente novamente mais tarde.");
    }
}

// ========================================
// FUNÇÕES DE AUTENTICAÇÃO
// ========================================

/**
 * Realiza o logout do usuário através da API
 */
async function handleLogout() {
    try {
        const response = await fetch('/user/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            // Redireciona o usuário para a página de login após o logout bem-sucedido
            window.location.href = '/login';
        } else {
            console.error('Erro ao fazer logout:', response.statusText);
            alert('Não foi possível realizar o logout. Por favor, tente novamente.');
        }
    } catch (error) {
        console.error('Erro de rede ao fazer logout:', error);
        alert('Erro de conexão. Verifique sua rede e tente novamente.');
    }
}


// ========================================
// FUNÇÕES DE RENDERIZAÇÃO
// ========================================

/**
 * Renderiza os carros no grid
 * @param {Array} cars - Array de carros para renderizar
 */
function renderCars(cars) {
    const carsGrid = document.getElementById('carsGrid');
    const noResults = document.getElementById('noResults');
    
    if (cars.length === 0) {
        carsGrid.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }
    
    noResults.classList.add('hidden');
    
    // Mapeia a lista de carros para o HTML das cards
    carsGrid.innerHTML = cars.map(car => createCarCard(car)).join('');

    // Adiciona os event listeners APÓS os elementos terem sido adicionados ao DOM
    addCarCardEventListeners();
}

/**
 * Cria o HTML para um card de carro
 * @param {Object} car - Objeto do carro
 * @returns {string} HTML do card
 */
function createCarCard(car) {
    const imageUrl = car.images && car.images.length > 0 
        ? car.images[0] 
        : 'https://via.placeholder.com/400x200?text=Sem+Imagem';
    
    const price = car.daily_rate 
        ? `R$ ${car.daily_rate.toFixed(2).replace('.', ',')}/Diária`
        : 'Consulte';

    return `
        <div class="car-card rounded-2xl overflow-hidden shadow-lg card-hover fade-in" data-car-id="${car.id}">
            <div class="relative">
                <img src="${imageUrl}" 
                     alt="${car.name}" 
                     class="w-full h-48 object-cover"
                     onerror="this.src='https://via.placeholder.com/400x200?text=Imagem+Indisponível'">
                <div class="price-tag absolute top-4 right-4 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    ${price}
                </div>
            </div>
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-800 mb-2">${car.name}</h3>
                <div class="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div class="flex items-center">
                        <i class="fas fa-calendar mr-2 text-blue-600"></i>
                        ${car.year || 'N/A'}
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-cogs mr-2 text-blue-600"></i>
                        ${car.transmission || 'Automático'}
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-gas-pump mr-2 text-blue-600"></i>
                        ${car.fuelType || 'Gasolina'}
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-users mr-2 text-blue-600"></i>
                        ${car.passengers || '5'} pessoas
                    </div>
                </div>
                <button class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 view-details-btn" 
                        data-car-id="${car.id}">
                    VER DETALHES
                </button>
            </div>
        </div>
    `;
}

/**
 * Adiciona event listeners aos cards de carros
 */
function addCarCardEventListeners() {
    document.querySelectorAll('.view-details-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const carId = event.currentTarget.dataset.carId;
            openCarModal(carId);
        });
    });
}

// ========================================
// FUNÇÕES DO MODAL
// ========================================

/**
 * Abre o modal de detalhes do carro
 * @param {string} carId - ID do carro
 */
function openCarModal(carId) {
    const car = allCars.find(c => c.id == carId);
    if (!car) {
        console.error("Carro não encontrado com ID:", carId);
        return;
    }

    // Preenche o modal com os dados do carro
    populateModal(car);
    carModal.classList.add('active');
    
    // Previne scroll do body quando modal está aberto
    document.body.style.overflow = 'hidden';
}

/**
 * Popula o modal com os dados do carro
 * @param {Object} car - Objeto do carro
 */
function populateModal(car) {
    modalTitle.textContent = car.name || 'Detalhes do Carro';
    
    const mainImageUrl = car.images && car.images.length > 0 
        ? car.images[0] 
        : 'https://via.placeholder.com/600x400?text=Sem+Imagem';
    
    modalMainImage.src = mainImageUrl;
    modalMainImage.onerror = () => {
        modalMainImage.src = 'https://via.placeholder.com/600x400?text=Imagem+Indisponível';
    };
    
    modalBrand.textContent = car.brand || 'N/A';
    modalModel.textContent = car.model || car.name || 'N/A';
    modalYear.textContent = car.year || 'N/A';
    modalPlate.textContent = car.plate || '***-****';
    modalColor.textContent = car.color || 'N/A';
    modalMileage.textContent = car.mileage 
        ? `${car.mileage.toLocaleString('pt-BR')} km` 
        : 'N/A';
    modalFuelType.textContent = car.fuelType || 'Gasolina';
    modalPassengers.textContent = car.passengers 
        ? `${car.passengers} pessoas` 
        : '5 pessoas';
    modalCategory.textContent = car.category || 'N/A';
    modalPrice.textContent = car.daily_rate 
        ? `R$ ${car.daily_rate.toFixed(2).replace('.', ',')}/dia`
        : 'Consulte';

    // Preenche a galeria de imagens
    populateImageGallery(car);
}

/**
 * Popula a galeria de imagens do modal
 * @param {Object} car - Objeto do carro
 */
function populateImageGallery(car) {
    modalImageGallery.innerHTML = '';
    
    if (car.images && car.images.length > 0) {
        car.images.forEach(imgSrc => {
            const imgElement = document.createElement('img');
            imgElement.src = imgSrc;
            imgElement.alt = car.name;
            imgElement.className = 'w-full h-20 object-cover rounded-lg gallery-img';
            imgElement.onclick = () => {
                modalMainImage.src = imgSrc;
            };
            imgElement.onerror = () => {
                imgElement.src = 'https://via.placeholder.com/100x80?text=Erro';
            };
            modalImageGallery.appendChild(imgElement);
        });
    } else {
        modalImageGallery.innerHTML = '<p class="text-gray-500 text-sm col-span-4 text-center">Nenhuma imagem adicional disponível</p>';
    }
}

/**
 * Fecha o modal de detalhes do carro
 */
function closeCarModal() {
    carModal.classList.remove('active');
    
    // Restaura scroll do body
    document.body.style.overflow = 'auto';
}

// ========================================
// FUNÇÕES DE FILTROS
// ========================================

/**
 * Aplica os filtros aos carros
 */
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedBrand = brandFilter.value.toLowerCase();
    const selectedCategory = categoryFilter.value.toLowerCase();
    const maxPrice = parseFloat(priceRange.value);

    filteredCars = allCars.filter(car => {
        const matchesSearch = car.name.toLowerCase().includes(searchTerm) || 
                              (car.brand && car.brand.toLowerCase().includes(searchTerm)) ||
                              (car.model && car.model.toLowerCase().includes(searchTerm));
        
        const matchesBrand = selectedBrand === '' || 
                             (car.brand && car.brand.toLowerCase() === selectedBrand);
        
        const matchesCategory = selectedCategory === '' || 
                                (car.category && car.category.toLowerCase() === selectedCategory);
        
        const matchesPrice = !car.daily_rate || car.daily_rate <= maxPrice;

        return matchesSearch && matchesBrand && matchesCategory && matchesPrice;
    });

    renderCars(filteredCars);
}

/**
 * Limpa todos os filtros
 */
function clearFilters() {
    searchInput.value = '';
    brandFilter.value = '';
    categoryFilter.value = '';
    priceRange.value = 300;
    priceValue.textContent = 'R$ 300';
    applyFilters();
}

// ========================================
// FUNÇÕES DE NAVEGAÇÃO
// ========================================

/**
 * Rola para uma seção específica
 * @param {string} id - ID da seção
 */
function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

/**
 * Abre o menu mobile
 */
function openMobileMenu() {
    mobileMenu.classList.add('active');
    backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * Fecha o menu mobile
 */
function closeMobileMenuHandler() {
    mobileMenu.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ========================================
// FUNÇÕES DE UTILIDADE
// ========================================

/**
 * Mostra indicador de carregamento
 */
function showLoading() {
    const carsGrid = document.getElementById('carsGrid');
    carsGrid.innerHTML = `
        <div class="col-span-full flex justify-center items-center py-16">
            <div class="flex items-center space-x-3">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span class="text-gray-600">Carregando carros...</span>
            </div>
        </div>
    `;
}

/**
 * Esconde indicador de carregamento
 */
function hideLoading() {
    // A função renderCars já limpa o conteúdo do grid
}

/**
 * Mostra mensagem de erro
 * @param {string} message - Mensagem de erro
 */
function showError(message) {
    const carsGrid = document.getElementById('carsGrid');
    carsGrid.innerHTML = `
        <div class="col-span-full">
            <div class="glass-effect rounded-2xl p-8 max-w-md mx-auto text-center">
                <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">Ops! Algo deu errado</h3>
                <p class="text-gray-500 mb-4">${message}</p>
                <button onclick="fetchCarros()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-300">
                    Tentar Novamente
                </button>
            </div>
        </div>
    `;
}

/**
 * Atualiza o valor do range de preço
 */
function updatePriceRange() {
    priceValue.textContent = `R$ ${priceRange.value}`;
    applyFilters();
}

/**
 * Função para alternar o tema (claro/escuro)
 */
function toggleTheme() {
    const htmlTag = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');

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
}

/**
 * Define o tema inicial da página
 */
function setInitialTheme() {
    const htmlTag = document.documentElement;
    const sunIcon = document.getElementById('sunIcon');
    const moonIcon = document.getElementById('moonIcon');

    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlTag.classList.add('dark');
        if (sunIcon) sunIcon.classList.remove('hidden');
        if (moonIcon) moonIcon.classList.add('hidden');
    } else {
        htmlTag.classList.remove('dark');
        if (sunIcon) sunIcon.classList.add('hidden');
        if (moonIcon) moonIcon.classList.remove('hidden');
    }
}

// ========================================
// EVENT LISTENERS E INICIALIZAÇÃO
// ========================================

/**
 * Configura todos os event listeners
 */
function setupEventListeners() {
    // Menu mobile
    mobileMenuBtn?.addEventListener('click', openMobileMenu);
    closeMobileMenu?.addEventListener('click', closeMobileMenuHandler);
    backdrop?.addEventListener('click', closeMobileMenuHandler);

    // Filtros
    priceRange?.addEventListener('input', updatePriceRange);
    priceRange?.addEventListener('change', applyFilters);
    searchInput?.addEventListener('input', applyFilters);
    brandFilter?.addEventListener('change', applyFilters);
    categoryFilter?.addEventListener('change', applyFilters);
    clearFiltersBtn?.addEventListener('click', clearFilters);

    // Modal
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && carModal.classList.contains('active')) {
            closeCarModal();
        }
    });

    // Smooth scroll para links de navegação
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });

    // Dropdown de Perfil
    const profileButton = document.getElementById('profileButton');
    const dropdownMenu = document.getElementById('dropdownMenu');
    profileButton?.addEventListener('click', function() {
        dropdownMenu.classList.toggle('hidden');
    });

    // Fechar dropdown ao clicar fora
    window.addEventListener('click', function(event) {
        if (dropdownMenu && !profileButton.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.add('hidden');
        }
    });

    // Botão de Logout
    const logoutButton = document.getElementById('logoutButton');
    logoutButton?.addEventListener('click', handleLogout);

    // Alternador de Tema
    const themeToggle = document.getElementById('themeToggle');
    themeToggle?.addEventListener('click', toggleTheme);
}

/**
 * Inicializa a aplicação
 */
function initApp() {
    console.log('LocaCar - Sistema iniciado');
    setInitialTheme();
    setupEventListeners();
    fetchCarros();
}

// ========================================
// INICIALIZAÇÃO
// ========================================

// Aguarda o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', initApp);

// Torna algumas funções globais para uso em HTML (onclick)
window.scrollToSection = scrollToSection;
window.closeCarModal = closeCarModal;
window.openCarModal = openCarModal;