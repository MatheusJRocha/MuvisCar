// frontend/static/js/main.js
document.addEventListener('DOMContentLoaded', () => {
    console.log('Frontend JavaScript principal carregado com sucesso!');

    // Exemplo: Log simples ao clicar no título (substitui o alert)
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) {
        headerTitle.addEventListener('click', () => {
            console.log('Bem-vindo à LocaCar!');
            // Numa aplicação real, você poderia exibir um modal personalizado aqui
            // ou redirecionar para uma página de boas-vindas mais elaborada.
        });
    }

    // Exemplo de como você faria uma chamada de API no futuro, usando fetch()
    // Esta função seria chamada quando você precisasse buscar dados, por exemplo,
    // ao carregar uma lista de carros ou clientes.
    async function fetchDataFromBackend(endpoint) {
        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                throw new Error(`Erro HTTP! Status: ${response.status}`);
            }
            const data = await response.json();
            console.log(`Dados recebidos de ${endpoint}:`, data);
            return data;
        } catch (error) {
            console.error(`Erro ao buscar dados de ${endpoint}:`, error);
            // Numa aplicação real, você exibiria uma mensagem de erro para o utilizador
            return null;
        }
    }

    // Exemplo de uso (descomente para testar se tiver um backend rodando)
    fetchDataFromBackend('/api/v1/login');
    fetchDataFromBackend('/api/v1/carros');
    fetchDataFromBackend('/api/v1/clientes');
    fetchDataFromBackend('/api/v1/rental/locacoes');
});
