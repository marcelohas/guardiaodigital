// Guardião Digital Web Portal Logic

document.addEventListener('DOMContentLoaded', () => {
    // Seletores DOM
    const siteUrlInput = document.getElementById('site-url');
    const urlValidationDot = document.getElementById('url-validation-dot');
    const urlHelper = document.getElementById('url-helper');
    const reportToneSelect = document.getElementById('report-tone');
    const btnSubmit = document.getElementById('btn-submit');
    const toastContainer = document.getElementById('toast-container');
    const presetOptions = document.querySelectorAll('.preset-option');
    const copyModal = document.getElementById('copy-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');

    // Link do Custom GPT do Guardião Digital
    const AGENT_BASE_URL = 'https://chatgpt.com/g/g-6a419db8b8e08191a1982dc14621cc97-guardiao-digital-by-tchelo-educa';

    // Dicionário de Tons
    const TONES = {
        executivo: 'Executivo (focado em riscos de negócios, conformidade corporativa e tomada de decisão)',
        tecnico: 'Técnico (focado em desenvolvedores, com detalhes técnicos de correção de código e vulnerabilidades)',
        compliance: 'Compliance (focado em auditoria jurídica, referenciando os artigos infringidos da LGPD)'
    };

    // Dicionário de Templates de Prompt (Formatados em linha única para funcionar via parâmetro de URL ?q=)
    const PROMPT_TEMPLATES = {
        completa: "Olá Guardião Digital! 🛡️ Por favor, realize uma Auditoria Geral Completa de conformidade com a LGPD e segurança para o site: [URL]. Utilize a metodologia do Playbook do Auditor para buscar evidências, calcule a nota usando o Score GDS, classifique os riscos com a Matriz de Riscos e estruture a resposta no padrão do Modelo de Relatório Executivo. O tom do relatório deve ser [TOM].",
        cookies: "Olá Guardião Digital! 🛡️ Por favor, realize uma auditoria focada em Cookies e Consentimento de LGPD para o site: [URL]. Avalie se há um Banner de Cookies ativo, se há bloqueio prévio de scripts não essenciais (Opt-in) e se há opções fáceis de aceitar/rejeitar. Use o Score GDS e a Matriz de Riscos. O tom do relatório deve ser [TOM].",
        politica: "Olá Guardião Digital! 🛡️ Por favor, realize uma análise crítica da Política de Privacidade e Termos de Uso do site: [URL]. Verifique se o documento atende aos requisitos de transparência da LGPD, se há indicação do DPO e canal de contato para titulares. Pontue usando o Score GDS. O tom do relatório deve ser [TOM].",
        seguranca: "Olá Guardião Digital! 🛡️ Por favor, realize uma auditoria de Coleta de Dados e Segurança de Formulários do site: [URL]. Avalie o uso de HTTPS, examine os formulários de cadastro/contato e verifique se há caixas de consentimento explícitas desmarcadas por padrão. Classifique com o Playbook e a Matriz de Riscos. O tom do relatório deve ser [TOM].",
        academicos: "Olá Guardião Digital! 🛡️ Por favor, realize uma auditoria focada em Exposição de Dados de Alunos e Classificações Acadêmicas para o site: [URL]. Investigue se há exposição pública de dados de estudantes, como nomes completos, fotos, documentos e listas de classificação (vestibulares/rankings). Avalie a conformidade com a LGPD e use o Score GDS e a Matriz de Riscos. O tom do relatório deve ser [TOM]."
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

    // Função para Gerar o Prompt
    function generatePrompt() {
        const urlText = siteUrlInput.value;
        const validation = validateURL(urlText);
        
        let urlPlaceholder = '';
        if (validation.isValid) {
            urlPlaceholder = validation.formatted;
        }

        const preset = getSelectedPreset();
        const toneKey = reportToneSelect.value;
        const toneText = TONES[toneKey] || TONES.executivo;

        // Recuperar template e substituir placeholders
        const template = PROMPT_TEMPLATES[preset] || PROMPT_TEMPLATES.completa;
        const finalPrompt = template
            .replace('[URL]', urlPlaceholder)
            .replace('[TOM]', toneText);

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
                // 2. Exibir modal explicativo de instrução de colar
                copyModal.classList.add('show');
                
                // 3. Montar URL do ChatGPT e abrir em nova aba imediatamente para evitar pop-up blocker
                const encodedPrompt = encodeURIComponent(promptText);
                const chatGptUrl = `${AGENT_BASE_URL}?q=${encodedPrompt}`;
                
                window.open(chatGptUrl, '_blank', 'noopener,noreferrer');
            })
            .catch(err => {
                console.error('Falha ao acionar fluxo de cópia:', err);
                copyModal.classList.add('show');
                const encodedPrompt = encodeURIComponent(promptText);
                const chatGptUrl = `${AGENT_BASE_URL}?q=${encodedPrompt}`;
                window.open(chatGptUrl, '_blank', 'noopener,noreferrer');
            });
    });

    // Fechar modal ao clicar no botão
    btnCloseModal.addEventListener('click', () => {
        copyModal.classList.remove('show');
    });

    // Fechar modal ao clicar no overlay escuro
    copyModal.addEventListener('click', (e) => {
        if (e.target === copyModal) {
            copyModal.classList.remove('show');
        }
    });

    // Inicialização da página
    updateUrlUI();
    generatePrompt();
    lucide.createIcons();
});
