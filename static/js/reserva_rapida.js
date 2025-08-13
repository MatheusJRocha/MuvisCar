// // reserva_rapida.js

// document.addEventListener('DOMContentLoaded', () => {
//     // Referências do DOM
//     const loadingSpinner = document.getElementById('loadingSpinner');
//     const carInfoCard = document.getElementById('car-info-card');
//     const reservationForm = document.getElementById('reservationForm');
    
//     // Obtém o ID do carro da URL
//     const urlParams = new URLSearchParams(window.location.search);
//     const carId = urlParams.get('carId');

//     if (carId) {
//         fetchCarDetails(carId);
//     } else {
//         displayError('Nenhum carro selecionado para reserva.');
//     }

//     // Adiciona o event listener ao formulário
//     if (reservationForm) {
//         reservationForm.addEventListener('submit', handleReservation);
//     }

//     // Função para buscar os detalhes do carro
//     async function fetchCarDetails(id) {
//         showLoading(true);
//         try {
//             const response = await fetch(`/carros/${id}`);
//             if (!response.ok) {
//                 throw new Error(`Erro ao buscar carro com ID: ${id}`);
//             }
//             const car = await response.json();
//             populateCarDetails(car);
//         } catch (error) {
//             console.error("Erro na reserva:", error);
//             displayError('Não foi possível carregar os detalhes do carro. Tente novamente.');
//         } finally {
//             showLoading(false);
//         }
//     }

//     // Função para preencher a seção de detalhes do carro
//     function populateCarDetails(car) {
//         if (!car) return;

//         document.getElementById('carImage').src = car.images?.[0] || 'https://via.placeholder.com/400x200?text=Sem+Imagem';
//         document.getElementById('carImage').alt = car.name || `${car.brand} ${car.model}`;
//         document.getElementById('carTitle').textContent = car.name || `${car.brand} ${car.model}`;
//         document.getElementById('carBrandModel').textContent = `${car.brand} ${car.model}`;
//         document.getElementById('carYear').textContent = car.year || 'N/A';
//         document.getElementById('carFuelType').textContent = car.fuel_type || 'Gasolina';
//         document.getElementById('carColor').textContent = car.color || 'N/A';
//         document.getElementById('carPassengers').textContent = `${car.passengers || '5'} pessoas`;
//         document.getElementById('carPrice').textContent = car.daily_rate ? 
//             `R$ ${car.daily_rate.toFixed(2).replace('.', ',')}/dia` : 
//             'Preço não disponível';
//     }

//     // Função para lidar com o envio do formulário
//     function handleReservation(event) {
//         event.preventDefault();

//         const fullName = document.getElementById('fullName').value;
//         const startDate = document.getElementById('startDate').value;
//         const endDate = document.getElementById('endDate').value;
//         const location = document.getElementById('location').value;

//         if (fullName && startDate && endDate && location) {
//             // Lógica de reserva simulada
//             console.log("Dados da Reserva:", {
//                 carId: carId,
//                 fullName,
//                 startDate,
//                 endDate,
//                 location
//             });

//             // Exibe mensagem de sucesso
//             alert(`Reserva de ${fullName} confirmada! Carro ${carId} de ${startDate} a ${endDate}.`);

//             // Aqui você faria uma chamada real para a API de reserva
//             // Ex: fetch('/api/reservar', { method: 'POST', body: JSON.stringify(...) });
            
//             // Redireciona para a página inicial
//             window.location.href = '/'; 
//         } else {
//             alert("Por favor, preencha todos os campos obrigatórios.");
//         }
//     }

//     // Funções de feedback visual
//     function showLoading(show) {
//         if (loadingSpinner) loadingSpinner.classList.toggle('hidden', !show);
//         if (carInfoCard) carInfoCard.classList.toggle('hidden', show);
//     }
    
//     function displayError(message) {
//         const container = document.getElementById('booking-details-container');
//         if (container) {
//             container.innerHTML = `
//                 <div class="col-span-2 text-center py-16">
//                     <i class="fas fa-exclamation-triangle text-4xl text-red-600 mb-4"></i>
//                     <h3 class="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Erro</h3>
//                     <p class="text-gray-500 dark:text-gray-400">${message}</p>
//                     <a href="/" class="mt-4 inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">Voltar para o Início</a>
//                 </div>
//             `;
//         }
//     }
// });