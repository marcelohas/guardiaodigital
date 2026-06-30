// Guardião Digital Web Portal Logic

document.addEventListener('DOMContentLoaded', () => {
    // Seletores DOM
    const siteUrlInput = document.getElementById('site-url');
    const urlValidationDot = document.getElementById('url-validation-dot');
    const urlHelper = document.getElementById('url-helper');
    const reportToneSelect = document.getElementById('report-tone');
    const promptOutput = document.getElementById('prompt-output');
    const btnCopy = document.getElementById('btn-copy');
    const btnSubmit = document.getElementById('btn-submit');
    const toastContainer = document.getElementById('toast-container');
    const presetOptions = document.querySelectorAll('.preset-option');

    // Link do Custom GPT do Guardião Digital
    const AGENT_BASE_URL = 'https://chatgpt.com/g/g-6a419db8b8e08191a1982dc14621cc97-guardiao-digital-by-tchelo-educa';

    // Dicionário de Tons
    const TONES = {
        executivo: 'Executivo (linguagem corporativa, focada em análise de riscos de negócios, impacto financeiro/reputacional e tomada de decisão para diretoria)',
        tecnico: 'Técnico (linguagem direta para desenvolvedores e TI, focada em vulnerabilidades técnicas, headers de segurança, configurações de cookies e passos objetivos para correção de código)',
        compliance: 'Compliance (linguagem jurídica e de auditoria de dados, com foco nos artigos específicos da Lei Geral de Proteção de Dados - Lei 13.709/2018 - que foram infringidos)'
    };

    // Dicionário de Templates de Prompt
    const PROMPT_TEMPLATES = {
        completa: `Olá, Guardião Digital! 🛡️

Por favor, realize uma **Auditoria Geral Completa** de conformidade com a LGPD e segurança da informação para o seguinte website:
🔗 **URL**: [URL]

### Diretrizes de Análise:
1. Acesse o site e aplique a metodologia descrita no **Playbook do Auditor** para levantar evidências e analisar conformidade.
2. Calcule e apresente a nota do site utilizando a fórmula e faixas do **Framework de Pontuação (Score GDS)**.
3. Classifique os problemas identificados e estruture os riscos encontrados com base na **Matriz de Riscos**.
4. Apresente os resultados consolidados estruturando a resposta no formato do **Modelo de Relatório Executivo**.

### Tom e Formato:
- **Tom do Relatório**: [TOM]
- Apresente um resumo executivo com as vulnerabilidades encontradas e as recomendações práticas de mitigação.`,

        cookies: `Olá, Guardião Digital! 🛡️

Por favor, realize uma auditoria focada em **Cookies e Consentimento de LGPD** para o seguinte website:
🔗 **URL**: [URL]

### Diretrizes de Análise:
1. Identifique se o site possui um Banner de Cookies (Cookie Consent) ativo e visível.
2. Avalie se o site realiza bloqueio prévio de scripts não essenciais (pixels, analytics, tags de rastreamento) antes do consentimento do usuário (Opt-in).
3. Verifique se o site fornece opções claras e equivalentes para aceitar, rejeitar ou gerenciar cookies.
4. Pontue a conformidade de cookies e rastreadores utilizando os critérios do **Score GDS** e identifique riscos com a **Matriz de Riscos**.

### Tom e Formato:
- **Tom do Relatório**: [TOM]
- Liste quais cookies/scripts estão rodando antes do consentimento e dê instruções específicas de como ajustar a conformidade do banner.`,

        politica: `Olá, Guardião Digital! 🛡️

Por favor, realize uma análise crítica da **Política de Privacidade e Termos de Uso** para o seguinte website:
🔗 **URL**: [URL]

### Diretrizes de Análise:
1. Verifique se o site disponibiliza links visíveis e de fácil acesso para a Política de Privacidade.
2. Avalie se a política atende aos princípios de transparência da LGPD (bases legais utilizadas, finalidades do tratamento, tempo de retenção e direitos dos titulares).
3. Verifique a indicação do Encarregado de Proteção de Dados (DPO) e se há canal de contato específico para petições de titulares.
4. Pontue este nível documental com base no **Score GDS** e registre eventuais ausências legais no formato do **Modelo de Relatório Executivo**.

### Tom e Formato:
- **Tom do Relatório**: [TOM]
- Indique os itens que faltam no documento e sugira redações corretivas para as cláusulas ausentes ou em desacordo.`,

        seguranca: `Olá, Guardião Digital! 🛡️

Por favor, realize uma auditoria focada em **Coleta de Dados e Segurança de Formulários** para o seguinte website:
🔗 **URL**: [URL]

### Diretrizes de Análise:
1. Avalie a segurança no tráfego de dados do site (presença e configuração de HTTPS/SSL e criptografia de formulários).
2. Analise todos os formulários públicos de contato, newsletters ou cadastros presentes no endereço.
3. Verifique se os formulários solicitam consentimento explícito e desmarcado por padrão (checkboxes) para o uso de dados pessoais para fins específicos.
4. Classifique as vulnerabilidades e os riscos de vazamento ou exposição indesejada com base no **Playbook do Auditor** e na **Matriz de Riscos**.

### Tom e Formato:
- **Tom do Relatório**: [TOM]
- Destaque falhas de segurança encontradas, riscos de exposição de dados e apresente as soluções corretivas correspondentes.`
    };

    // Função para Validar a URL
    function validateURL(urlText) {
        const trimmed = urlText.trim();
        if (trimmed === "") {
            return { isValid: false, isEmpty: true, formatted: "" };
        }

        // Se não começar com http:// ou https://, adicionamos https:// temporariamente para validação
        let toValidate = trimmed;
        if (!/^https?:\/\//i.test(trimmed)) {
            toValidate = 'https://' + trimmed;
        }

        try {
            const parsedUrl = new URL(toValidate);
            // Deve conter um hostname com ponto e tamanho mínimo aceitável
            const hasDot = parsedUrl.hostname.includes('.');
            const isLongEnough = parsedUrl.hostname.length > 4;
            
            if (hasDot && isLongEnough) {
                return { isValid: true, isEmpty: false, formatted: toValidate };
            }
        } catch (_) {
            // Falha no parser de URL
        }
        
        return { isValid: false, isEmpty: false, formatted: "" };
    }

    // Função para obter o Preset Selecionado
    function getSelectedPreset() {
        const checkedRadio = document.querySelector('input[name="preset"]:checked');
        return checkedRadio ? checkedRadio.value : 'completa';
    }

    // Função para Gerar e Exibir o Prompt
    function generatePrompt() {
        const urlText = siteUrlInput.value;
        const validation = validateURL(urlText);
        
        let urlPlaceholder = '[Insira a URL do site no campo de configuração ao lado]';
        if (validation.isValid) {
            urlPlaceholder = validation.formatted;
        } else if (!validation.isEmpty) {
            urlPlaceholder = `[URL Inválida: ${urlText}]`;
        }

        const preset = getSelectedPreset();
        const toneKey = reportToneSelect.value;
        const toneText = TONES[toneKey] || TONES.executivo;

        // Recuperar template e substituir placeholders
        const template = PROMPT_TEMPLATES[preset] || PROMPT_TEMPLATES.completa;
        const finalPrompt = template
            .replace('[URL]', urlPlaceholder)
            .replace('[TOM]', toneText);

        promptOutput.textContent = finalPrompt;
        return finalPrompt;
    }

    // Função para Atualizar a Interface do Validador de URL
    function updateUrlUI() {
        const urlText = siteUrlInput.value;
        const validation = validateURL(urlText);

        // Resetar classes
        urlValidationDot.className = 'validation-dot';
        urlHelper.className = 'helper-text';

        if (validation.isEmpty) {
            urlHelper.textContent = 'Insira uma URL válida para iniciar.';
            btnSubmit.classList.add('disabled');
        } else if (validation.isValid) {
            urlValidationDot.classList.add('valid');
            urlHelper.textContent = 'URL válida para análise.';
            urlHelper.classList.add('success');
            btnSubmit.classList.remove('disabled');
        } else {
            urlValidationDot.classList.add('invalid');
            urlHelper.textContent = 'Formato inválido. Ex: https://site.com ou site.com.br';
            urlHelper.classList.add('error');
            btnSubmit.classList.add('disabled');
        }
    }

    // Eventos do Input de URL
    siteUrlInput.addEventListener('input', () => {
        updateUrlUI();
        generatePrompt();
    });

    // Eventos dos Presets (Radios)
    presetOptions.forEach(option => {
        const radio = option.querySelector('input[type="radio"]');
        radio.addEventListener('change', () => {
            // Atualizar classes visuais ativas dos labels
            presetOptions.forEach(opt => opt.classList.remove('active'));
            if (radio.checked) {
                option.classList.add('active');
            }
            generatePrompt();
        });
    });

    // Evento de Mudança de Tom
    reportToneSelect.addEventListener('change', generatePrompt);

    // Copiar prompt para a Área de Transferência
    function copyPromptToClipboard(text) {
        return navigator.clipboard.writeText(text);
    }

    // Ação do Botão Copiar
    btnCopy.addEventListener('click', () => {
        const promptText = generatePrompt();
        copyPromptToClipboard(promptText)
            .then(() => {
                // Micro-animação do Botão Copiar
                const originalHtml = btnCopy.innerHTML;
                btnCopy.innerHTML = '<i data-lucide="check" class="btn-icon"></i><span>Copiado!</span>';
                lucide.createIcons();
                btnCopy.classList.add('success-state');

                setTimeout(() => {
                    btnCopy.innerHTML = originalHtml;
                    lucide.createIcons();
                    btnCopy.classList.remove('success-state');
                }, 2000);
            })
            .catch(err => {
                console.error('Falha ao copiar prompt:', err);
                alert('Erro ao copiar prompt para a área de transferência.');
            });
    });

    // Ação do Botão de Envio (Iniciar no ChatGPT)
    btnSubmit.addEventListener('click', () => {
        const urlText = siteUrlInput.value;
        const validation = validateURL(urlText);

        if (!validation.isValid) {
            updateUrlUI();
            return;
        }

        const promptText = generatePrompt();

        // 1. Copiar prompt para a área de transferência
        copyPromptToClipboard(promptText)
            .then(() => {
                // 2. Exibir toast de sucesso
                toastContainer.classList.add('show');
                
                // 3. Montar URL do ChatGPT e abrir em nova aba após um leve delay
                const encodedPrompt = encodeURIComponent(promptText);
                const chatGptUrl = `${AGENT_BASE_URL}?q=${encodedPrompt}`;
                
                setTimeout(() => {
                    window.open(chatGptUrl, '_blank', 'noopener,noreferrer');
                }, 800);

                // Fechar o toast após 4.5 segundos
                setTimeout(() => {
                    toastContainer.classList.remove('show');
                }, 4500);
            })
            .catch(err => {
                console.error('Falha ao acionar fluxo de cópia:', err);
                // Fallback caso a API do Clipboard falhe sem permissão explícita
                const encodedPrompt = encodeURIComponent(promptText);
                const chatGptUrl = `${AGENT_BASE_URL}?q=${encodedPrompt}`;
                window.open(chatGptUrl, '_blank', 'noopener,noreferrer');
            });
    });

    // Inicialização da página
    updateUrlUI();
    generatePrompt();
    lucide.createIcons();
});
