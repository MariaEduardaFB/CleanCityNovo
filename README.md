# CleanCityNovo

## 📋 Descrição

CleanCity é um aplicativo mobile multiplataforma (iOS, Android e Web) desenvolvido com **React Native** e **Expo** para gerenciamento colaborativo de ocorrências de limpeza urbana. Os usuários podem reportar pontos sujos, visualizar ocorrências em mapas em tempo real, compartilhar informações e acompanhar o status de resolução de cada ponto.

## 🎯 Funcionalidades

### 1. Autenticação
- Cadastro de novo usuário (signup)
- Login com email e senha
- Perfil pessoal com edição de dados
- Alteração de senha
- Logout seguro
- Autenticação via tokens JWT
- Persistência de sessão em cache local

### 2. Reporte de Ocorrências
- Criar novo reporte (lixo, buraco, etc)
- Adicionar título e descrição detalhada
- Capturar localização via GPS
- Categorizar ocorrência por tipo
- Anexar múltiplas fotos (câmera ou galeria)
- Upload automático de imagens
- Histórico de minhas ocorrências

### 3. Mapa Interativo
- Visualizar todas as ocorrências no mapa
- Filtrar por status (Pendente, Em Progresso, Resolvida, Rejeitada)
- Buscar por localização geográfica
- Ver detalhes completos de cada ocorrência
- Visualizar fotos anexadas
- Informações do usuário que reportou

## 🛠️ Stacks

- **Framework**: React Native + Expo
- **Linguagem**: TypeScript / JavaScript
- **Navegação**: Expo Router (file-based routing)
- **Mapa**: React Native Maps
- **Ícones**: Expo Vector Icons
- **Câmera**: Expo Camera
- **Localização**: Expo Location
- **Fotos**: Expo Image Picker
- **Armazenamento**: AsyncStorage
- **Notificações**: Expo Notifications

## 📦 Estrutura do Projeto

```
CleanCityNovo/
├── app/                    # Páginas e navegação (Expo Router)
│   ├── _layout.tsx        # Layout principal
│   ├── login.tsx          # Tela de login
│   ├── signup.tsx         # Tela de cadastro
│   ├── modal.tsx          # Modal compartilhado
│   ├── test-api.tsx       # Tela de teste da API
│   └── (tabs)/            # Navegação com abas
│       ├── _layout.tsx    # Layout das abas
│       ├── index.tsx      # Dashboard
│       ├── explore.tsx    # Explorar ocorrências
│       ├── map.tsx        # Mapa interativo
│       ├── list.tsx       # Lista de ocorrências
│       ├── profile.tsx    # Perfil do usuário
│       ├── stats.tsx      # Estatísticas
│       └── styles/        # Estilos
│
├── components/            # Componentes reutilizáveis
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   ├── NetworkIndicator.tsx
│   ├── SyncIndicator.tsx
│   └── ui/
│
├── services/              # Serviços de API
│   ├── api.service.ts            # Cliente HTTP
│   ├── auth-api.service.ts       # Autenticação
│   ├── occurrence-api.service.ts # Ocorrências
│   ├── photo-api.service.ts      # Fotos
│   └── share-api.service.ts      # Compartilhamento
│
├── hooks/                 # React Hooks
│   ├── useOccurrences.ts
│   ├── useNetworkStatus.ts
│   └── useOfflineQueue.ts
│
├── contexts/              # Context API
│   ├── AuthContext.tsx
│   └── LocalAuthContext.tsx
│
├── config/
│   └── api.config.ts      # Configuração da API
│
├── constants/
│   └── theme.ts           # Tema
│
├── utils/                 # Utilitários
│   ├── notifications.ts
│   ├── sensors.ts
│   └── storage.ts
│
├── assets/                # Imagens e ícones
│
├── app.json               # Configuração Expo
├── package.json           # Dependências
├── tsconfig.json
├── eslint.config.js
└── README.md
```

## 🔧 Instalação e Setup

### Pré-requisitos
- Node.js v18+
- npm v9+ ou yarn v3+
- Expo CLI: `npm install -g expo-cli`

### Setup Inicial

```bash
# Clone e instale
git clone https://github.com/MariaEduardaFB/CleanCityNovo.git
cd CleanCityNovo
npm install

# (Opcional) Limpar projeto
npm run reset-project
```

### Configurar API

Edite `config/api.config.ts` e atualize `OVERRIDE_API_URL` com a URL do seu backend:

```typescript
const OVERRIDE_API_URL: string | null = 'http://seu-ip:seu-port/api';
```

### Rodar Desenvolvimento

```bash
# Expo Go (QR code escaneable)
npx expo start

```

## 🚀 Como Usar

### Primeiro Acesso
1. Abra o app e clique em "Criar Conta"
2. Preencha: Email, Senha, Nome Completo
3. Clique em "Cadastrar" e faça login

### Reportar Problema
1. Acesse a aba de reportes
2. Clique em "Reportar Problema"
3. Preencha título e descrição
4. Clique em "Capturar Localização"
5. Adicione fotos (câmera ou galeria)
6. Envie o reporte

### Ver Mapa
1. Acesse a aba "Mapa"
2. Visualize todas as ocorrências
3. Toque em um marcador para detalhes
4. Use filtros por status

### Gerenciar Perfil
1. Acesse a aba "Perfil"
2. Edite seus dados
3. Altere senha
4. Faça logout

## 🔐 Segurança

- Autenticação JWT
- Tokens em AsyncStorage seguro
- Senhas não armazenadas localmente
- HTTPS recomendado em produção

## 📱 Permissões Necessárias

### Android
- `ACCESS_FINE_LOCATION` - GPS preciso
- `CAMERA` - Captura de fotos
- `READ_EXTERNAL_STORAGE` - Acesso à galeria

### iOS
- `NSLocationWhenInUseUsageDescription` - Localização
- `NSCameraUsageDescription` - Câmera
- `NSPhotoLibraryUsageDescription` - Fotos

## 📝 Configuração

### Arquivo: `config/api.config.ts`

```typescript
// URL da API (altere conforme necessário)
const OVERRIDE_API_URL: string | null = 'http://192.168.0.4:3001/api';

// Timeout das requisições
export const API_CONFIG = {
  BASE_URL: getApiUrl(),
  TIMEOUT: 30000,
};
```

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie uma branch: `git checkout -b feature/MinhaFeature`
3. Commit: `git commit -m 'Add MinhaFeature'`
4. Push: `git push origin feature/MinhaFeature`
5. Abra um Pull Request

## 📧 Contato

- **GitHub**: https://github.com/MariaEduardaFB
- **Issues**: Reporte bugs e sugestões na seção Issues

**Desenvolvido com ❤️ para cidades mais limpas**
