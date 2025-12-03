# Integração API CleanCity

## 📋 Resumo da Integração

A API do CleanCityAPI foi integrada com sucesso no aplicativo CleanCityNovo. Agora o aplicativo se comunica com o backend através de requisições HTTP.

## 🚀 O que foi implementado

### 1. **Serviços de API**

#### `api.service.ts`
Cliente HTTP centralizado que gerencia:
- Requisições GET, POST, PUT, DELETE
- Autenticação com tokens JWT
- Upload de arquivos
- Tratamento de erros
- Timeout de requisições

#### `auth-api.service.ts`
Serviço de autenticação:
- ✅ Signup (cadastro)
- ✅ Login
- ✅ Logout
- ✅ Obter perfil
- ✅ Atualizar perfil
- ✅ Alterar senha

#### `occurrence-api.service.ts`
Serviço de ocorrências:
- ✅ Criar ocorrência
- ✅ Listar todas ocorrências
- ✅ Listar minhas ocorrências
- ✅ Buscar por localização (bounds)
- ✅ Buscar por ID
- ✅ Atualizar ocorrência
- ✅ Deletar ocorrência
- ✅ Estatísticas

#### `photo-api.service.ts`
Serviço de fotos:
- ✅ Upload de foto
- ✅ Listar fotos da ocorrência
- ✅ Download de foto
- ✅ Deletar foto

#### `share-api.service.ts`
Serviço de compartilhamentos:
- ✅ Compartilhar ocorrência
- ✅ Listar compartilhamentos recebidos
- ✅ Listar compartilhamentos enviados
- ✅ Revogar compartilhamento

### 2. **Configuração**

#### `config/api.config.ts`
Arquivo de configuração com:
- URL base da API (configurável para dev/produção)
- Endpoints organizados
- Headers padrão
- Timeout

**Importante**: Ajuste a URL da API em `api.config.ts`:
```typescript
BASE_URL: __DEV__ 
  ? 'http://10.0.2.2:3000/api'  // Para emulador Android
  : 'https://sua-api-producao.com/api'
```

### 3. **Contexto de Autenticação**

#### `contexts/AuthContext.tsx`
Novo contexto que:
- Gerencia estado do usuário
- Salva token automaticamente
- Cache de dados do usuário
- Sincronização automática

### 4. **Hooks Personalizados**

#### `hooks/useOccurrences.ts`
Hook para facilitar operações com ocorrências:
- `loadOccurrences()` - Carrega todas
- `loadMyOccurrences()` - Carrega minhas
- `loadOccurrencesByBounds()` - Por localização
- `createOccurrence()` - Cria nova
- `updateOccurrence()` - Atualiza
- `deleteOccurrence()` - Remove
- `getOccurrenceById()` - Busca por ID

#### `useOccurrenceStats()`
Hook para estatísticas em tempo real

### 5. **Telas Atualizadas**

- ✅ `app/login.tsx` - Usa API real
- ✅ `app/signup.tsx` - Usa API real
- ✅ `app/(tabs)/profile.tsx` - Mostra dados da API
- ✅ `app/_layout.tsx` - Usa novo AuthContext

## 📝 Como Usar

### 1. **Configurar a API**

Edite `config/api.config.ts` e configure a URL correta:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__ 
    ? 'http://10.0.2.2:3000/api'  // Emulador Android
    // ? 'http://localhost:3000/api'  // iOS Simulator
    : 'https://sua-api-producao.com/api',
  
  TIMEOUT: 30000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};
```

### 2. **Usar Autenticação**

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MeuComponente() {
  const { user, login, logout, signup } = useAuth();
  
  // Login
  await login('email@exemplo.com', 'senha123');
  
  // Signup
  await signup('email@exemplo.com', 'senha123', 'Nome', '11999999999');
  
  // Logout
  await logout();
}
```

### 3. **Usar Ocorrências**

```typescript
import { useOccurrences } from '@/hooks/useOccurrences';

function MinhaLista() {
  const { 
    occurrences, 
    loading, 
    error,
    loadOccurrences,
    createOccurrence 
  } = useOccurrences();
  
  useEffect(() => {
    loadOccurrences();
  }, []);
  
  // Criar nova ocorrência
  const handleCreate = async () => {
    await createOccurrence({
      title: 'Lixo acumulado',
      description: 'Muito lixo na calçada',
      latitude: -23.550520,
      longitude: -46.633308,
      address: 'Av. Paulista, 1000',
      category: 'TRASH',
    });
  };
}
```

### 4. **Upload de Fotos**

```typescript
import { photoApiService } from '@/services/photo-api.service';

const uploadPhoto = async (occurrenceId: string, photo: any) => {
  const result = await photoApiService.uploadPhoto(occurrenceId, {
    uri: photo.uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  });
  
  if (result.success) {
    console.log('Foto enviada!', result.data);
  }
};
```

### 5. **Compartilhamentos**

```typescript
import { shareApiService } from '@/services/share-api.service';

// Compartilhar ocorrência
await shareApiService.shareOccurrence({
  occurrenceId: '123',
  sharedWithEmail: 'amigo@email.com',
});

// Ver compartilhamentos recebidos
const shared = await shareApiService.getSharedWithMe();
```

## 🔧 Configuração do Backend

### 1. **Iniciar a API**

```bash
cd CleanCityAPI
npm install
npm run dev
```

### 2. **Variáveis de Ambiente**

Crie um arquivo `.env` na pasta `CleanCityAPI`:

```env
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/cleancity"
JWT_SECRET="seu-secret-super-seguro"
CORS_ORIGIN="*"
UPLOAD_PATH="./uploads"
MAX_FILE_SIZE="10485760"
```

### 3. **Banco de Dados**

```bash
cd CleanCityAPI
npx prisma migrate dev
npx prisma generate
```

## 📱 Testar no Emulador

### Android:
```bash
cd CleanCityNovo
npm start
# Pressione 'a' para abrir no Android
```

A URL `http://10.0.2.2:3000` aponta para `localhost` do computador host.

### iOS:
```bash
cd CleanCityNovo
npm start
# Pressione 'i' para abrir no iOS
```

Use `http://localhost:3000` no iOS.

## 🐛 Troubleshooting

### Erro de Conexão

1. Verifique se a API está rodando:
```bash
curl http://localhost:3000/health
```

2. Teste do emulador Android:
```bash
curl http://10.0.2.2:3000/health
```

3. Verifique CORS na API

### Token Inválido

O token é salvo automaticamente. Para limpar:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.removeItem('auth_token');
await AsyncStorage.removeItem('cached_user');
```

### Debug

Ative logs para ver requisições:
```typescript
// Em api.service.ts
console.log('Request:', method, url, body);
console.log('Response:', response);
```

## 📦 Dependências Necessárias

Certifique-se de ter instalado:

```bash
cd CleanCityNovo
npm install @react-native-async-storage/async-storage
```

## 🔄 Modo Offline

O aplicativo continua com suporte offline através do `offline-queue.service.ts`. As operações são enfileiradas quando offline e sincronizadas quando a conexão retornar.

## 📖 Próximos Passos

Para usar completamente a API nas telas do app, você pode:

1. **Tela de Mapa** - Usar `loadOccurrencesByBounds()` para carregar marcadores
2. **Tela de Lista** - Usar `loadOccurrences()` ou `loadMyOccurrences()`
3. **Criar Ocorrência** - Usar `createOccurrence()` com dados do formulário
4. **Detalhes** - Usar `getOccurrenceById()` e `photoApiService`
5. **Editar** - Usar `updateOccurrence()` e `deleteOccurrence()`

## 🎯 Exemplo Completo

```typescript
import { useAuth } from '@/contexts/AuthContext';
import { useOccurrences } from '@/hooks/useOccurrences';
import { photoApiService } from '@/services/photo-api.service';

function ExemploCompleto() {
  const { user } = useAuth();
  const { createOccurrence } = useOccurrences();
  
  const criarOcorrenciaComFoto = async () => {
    // 1. Criar ocorrência
    const occurrence = await createOccurrence({
      title: 'Problema de Lixo',
      description: 'Acúmulo de lixo',
      latitude: -23.550520,
      longitude: -46.633308,
      address: 'Av. Paulista, 1000',
    });
    
    if (!occurrence) return;
    
    // 2. Adicionar foto
    const photo = {
      uri: 'file:///path/to/photo.jpg',
      name: 'photo.jpg',
      type: 'image/jpeg',
    };
    
    await photoApiService.uploadPhoto(occurrence.id, photo);
    
    console.log('Ocorrência criada com foto!');
  };
  
  return (
    <View>
      <Button title="Criar" onPress={criarOcorrenciaComFoto} />
    </View>
  );
}
```

## ✅ Status da Integração

- ✅ Configuração da API
- ✅ Serviços criados
- ✅ Autenticação integrada
- ✅ Context provider configurado
- ✅ Telas de login/signup atualizadas
- ✅ Tela de perfil atualizada
- ✅ Hooks personalizados criados
- ⏳ Integração nas telas de ocorrências (pendente)
- ⏳ Integração de fotos nas telas (pendente)
- ⏳ Integração de compartilhamentos (pendente)

## 🆘 Suporte

Para problemas ou dúvidas, verifique:
1. Logs do console do app
2. Logs da API (terminal onde rodou `npm run dev`)
3. Network tab do React Native Debugger
4. Postman para testar endpoints diretamente
