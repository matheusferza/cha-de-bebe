# 👶 Chá de Bebê — Lista de Presentes

Aplicação web estática, delicada e responsiva para lista de presentes de chá de bebê com confirmação de reserva em tempo real e painel administrativo, construída em HTML5, CSS3 e JavaScript puro com Firebase (Firestore + Authentication).

## 🚀 Funcionalidades

### 🎁 Página Pública (`index.html` + `app.js`)
- Lista de presentes em tempo real via Firestore snapshot.
- Barra de progresso visual indicando a porcentagem e contagem de presentes reservados.
- Filtro interativo para alternar entre "Todos os presentes" e "Apenas disponíveis".
- Botão "Ver sugestão no [Loja]" com link direto para produtos no Mercado Livre, Amazon, Shopee, etc.
- Modal de reserva acessível e seguro com proteção contra condições de corrida (`runTransaction`).
- Design responsivo pensado prioritariamente para visualização no celular via links compartilhados no WhatsApp.

### 🔑 Painel Administrativo (`admin.html` + `admin.js`)
- Autenticação restrita com Firebase Authentication (e-mail e senha).
- Cadastro de novos presentes com validação de campos.
- **Modo Edição**: permite editar nome, descrição, preço, imagem e link de sugestão de presentes livres ou já reservados, preservando o estado da reserva.
- **Pré-visualização de Imagem**: preview dinâmico com debounce e tratamento amigável de erro caso o link direto não carregue.
- Liberação manual de reservas e exclusão de itens com diálogo modal customizado.
- Toasts de notificação acessíveis para feedback visual instantâneo.

## 🛠️ Tecnologias
- **HTML5** & **CSS3 puro** (Mobile-first, variáveis CSS, acessibilidade WCAG AA).
- **JavaScript ES Modules** (sem frameworks ou etapas de build).
- **Firebase 10.14.1** (Authentication + Firestore Modular SDK via CDN).

## 📁 Estrutura de Arquivos
```text
├── index.html        # Página pública do evento
├── app.js            # Lógica pública e reservas em tempo real
├── admin.html        # Interface do painel de administração
├── admin.js          # Lógica administrativa e gestão de presentes
├── ui.js             # Módulo compartilhado de helpers, toasts e segurança
├── firebase.js       # Inicialização dos serviços Firebase
└── style.css         # Sistema de design compartilhado e responsivo
```
