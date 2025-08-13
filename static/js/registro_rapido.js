            const BASE_API_URL = 'http://127.0.0.1:8000';

            
            document.addEventListener('DOMContentLoaded', () => {
            const registroForm = document.getElementById('registroForm');
            const registroBtn = document.getElementById('registroBtn');
            const registroBtnText = document.getElementById('registroBtnText');
            const documentoInput = document.getElementById('documento'); // Alterado para documento
            const radioCpf = document.getElementById('radioCpf');
            const radioCnpj = document.getElementById('radioCnpj');
            const togglePasswordBtn = document.getElementById('togglePassword');
            const passwordInput = document.getElementById('password');

            const API_BASE_URL = window.location.origin;

            // Função para mostrar notificações personalizadas
            function showNotification(message, type = 'success') {
                const notificationContainer = document.getElementById('notificationContainer');
                const notification = document.createElement('div');
                
                let bgColor = '';
                let iconHtml = '';
                if (type === 'success') {
                    bgColor = 'bg-green-500';
                    iconHtml = '<i class="fas fa-check-circle"></i>';
                } else if (type === 'error') {
                    bgColor = 'bg-red-500';
                    iconHtml = '<i class="fas fa-times-circle"></i>';
                }

                notification.className = `p-4 text-white rounded-lg shadow-lg flex items-center transition-opacity duration-300 ${bgColor}`;
                notification.innerHTML = `
                    <div class="mr-3">${iconHtml}</div>
                    <span>${message}</span>
                `;

                notificationContainer.appendChild(notification);

                // Remove a notificação após 5 segundos
                setTimeout(() => {
                    notification.classList.add('opacity-0');
                    setTimeout(() => notification.remove(), 300);
                }, 5000);
            }

            // Funções de máscara para CPF e CNPJ
            function maskCpf(value) {
                value = value.replace(/\D/g, ''); // Remove tudo que não é dígito
                value = value.slice(0, 11); // Limita a 11 dígitos
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                return value;
            }

            function maskCnpj(value) {
                value = value.replace(/\D/g, ''); // Remove tudo que não é dígito
                value = value.slice(0, 14); // Limita a 14 dígitos
                value = value.replace(/^(\d{2})(\d)/, '$1.$2');
                value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
                value = value.replace(/(\d{4})(\d)/, '$1-$2');
                return value;
            }
            
            // Evento para aplicar a máscara correta ao input
            documentoInput.addEventListener('input', (event) => {
                const tipoDocumento = document.querySelector('input[name="tipo_documento"]:checked').value;
                let value = event.target.value;

                if (tipoDocumento === 'cpf') {
                    event.target.value = maskCpf(value);
                } else if (tipoDocumento === 'cnpj') {
                    event.target.value = maskCnpj(value);
                }
            });

            // Evento para mudar o placeholder e limpar o campo ao selecionar o tipo de documento
            radioCpf.addEventListener('change', () => {
                documentoInput.placeholder = 'CPF';
                documentoInput.value = '';
                documentoInput.name = 'cpf_cnpj';
                documentoInput.maxLength = 14; // Inclui os pontos e traços
            });

            radioCnpj.addEventListener('change', () => {
                documentoInput.placeholder = 'CNPJ';
                documentoInput.value = '';
                documentoInput.name = 'cpf_cnpj';
                documentoInput.maxLength = 18; // Inclui os pontos, barra e traço
            });

            // Botão de mostrar/esconder senha
            togglePasswordBtn.addEventListener('click', () => {
                const isPassword = passwordInput.type === 'password';
                passwordInput.type = isPassword ? 'text' : 'password';
                togglePasswordBtn.querySelector('i').className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
            });

            // Envio do formulário
            registroForm.addEventListener('submit', async (e) => {
                e.preventDefault(); // Impede o envio padrão do formulário

                // Desabilita o botão e mostra o feedback
                registroBtn.disabled = true;
                registroBtnText.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Registrando...';

                const formData = new FormData(registroForm);
                const data = Object.fromEntries(formData.entries());
                
                // Mapeia os dados do formulário para os campos do modelo Pydantic
                const payload = {
                    nome: data.nome_completo,
                    email: data.email,
                    cpf_cnpj: data.cpf_cnpj.replace(/\D/g, ''), // Remove a máscara antes de enviar
                    senha: data.password,
                };
                
                try {
                    const response = await fetch(`${API_BASE_URL}/clientes/registro_rapido`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    });

                    if (response.status === 201) {
                        showNotification('Conta criada com sucesso! Redirecionando para login...', 'success');
                        setTimeout(() => {
                            window.location.href = '/login';
                        }, 3000); // Redireciona após 3 segundos
                    } else {
                        const errorData = await response.json();
                        showNotification(`Erro ao registrar: ${errorData.detail || 'Erro desconhecido'}`, 'error');
                    }
                } catch (error) {
                    showNotification(`Erro de conexão: ${error.message}`, 'error');
                } finally {
                    // Reabilita o botão
                    registroBtn.disabled = false;
                    registroBtnText.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Registrar';
                }
            });
        });

