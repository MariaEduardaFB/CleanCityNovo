# 🔥 Configuração do Firebase

Este guia explica como configurar o Firebase para o projeto CleanCity.

## 📋 Pré-requisitos

- Conta Google
- Projeto criado no [Firebase Console](https://console.firebase.google.com/)

## 🚀 Passo a Passo

### 1. Criar Projeto no Firebase Console

1. Acesse [console.firebase.google.com](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Nome do projeto: `CleanCity` (ou nome de sua escolha)
4. Aceite os termos e clique em "Criar projeto"

### 2. Adicionar App ao Projeto

1. No Dashboard do projeto, clique no ícone **Web** (`</>`)
2. Nome do app: `CleanCity Web` 
3. **NÃO** marque "Firebase Hosting"
4. Clique em "Registrar app"

### 3. Copiar Credenciais

Você verá um objeto `firebaseConfig`. Copie os valores:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 4. Configurar no Projeto

1. Abra o arquivo `config/firebase.ts`
2. Substitua os valores em `firebaseConfig` com suas credenciais:

```typescript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",  // Cole sua API Key
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
};
```

### 5. Ativar Autenticação

1. No Firebase Console, vá em **Authentication** → **Get Started**
2. Ative os métodos de login:
   - ✅ **Email/Password** → Ativar
   - ✅ **Google** (opcional) → Ativar e configurar

### 6. Configurar Firestore Database

1. No menu lateral, clique em **Firestore Database** → **Create database**
2. Escolha o modo:
   - **Modo de produção** (recomendado para início)
   - **Modo de teste** (acesso aberto por 30 dias)
3. Selecione a região: `us-central` ou `southamerica-east1` (São Paulo)
4. Clique em "Enable"

#### 6.1. Regras de Segurança (Importante!)

Após criar o banco, vá em **Rules** e adicione:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Regras para usuários
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Regras para registros de resíduos
    match /waste-locations/{locationId} {
      // Qualquer usuário autenticado pode ler registros públicos
      allow read: if request.auth != null && resource.data.isPublic == true;
      
      // Apenas o dono pode criar/atualizar/deletar seus registros
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### 7. Configurar Storage

1. No menu lateral, clique em **Storage** → **Get Started**
2. Aceite as regras padrão
3. Escolha a mesma região do Firestore
4. Clique em "Done"

#### 7.1. Regras de Segurança do Storage

Vá em **Rules** e adicione:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /waste-photos/{userId}/{allPaths=**} {
      // Apenas o dono pode fazer upload
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Qualquer usuário autenticado pode ler
      allow read: if request.auth != null;
    }
  }
}
```

### 8. Estrutura do Firestore

O app criará automaticamente as seguintes coleções:

#### **users** (coleção)
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string | null,
  createdAt: Timestamp,
  lastLogin: Timestamp,
  registrationsCount: number
}
```

#### **waste-locations** (coleção)
```javascript
{
  userId: string,
  userName: string,
  description: string,
  photoUrls: string[],  // URLs do Storage
  location: {
    latitude: number,
    longitude: number
  },
  timestamp: Timestamp,
  noiseLevel: number | null,
  lightLevel: number | null,
  accelerometer: {
    x: number,
    y: number,
    z: number,
    magnitude: number
  } | null,
  isPublic: boolean
}
```

## ✅ Verificar Configuração

Para testar se está tudo certo:

1. Inicie o app: `npm start`
2. Tente fazer login/criar conta
3. Crie um registro de resíduo
4. Verifique no Firebase Console:
   - **Authentication** → Veja o usuário criado
   - **Firestore** → Veja os documentos em `waste-locations`
   - **Storage** → Veja as fotos em `waste-photos/`

## 🔐 Segurança

**IMPORTANTE:** 
- ❌ **NUNCA** commite o arquivo `config/firebase.ts` com suas credenciais reais
- ✅ Adicione `config/firebase.ts` ao `.gitignore`
- ✅ Use variáveis de ambiente em produção

## 📚 Recursos Úteis

- [Documentação Firebase](https://firebase.google.com/docs)
- [Firestore Getting Started](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Storage](https://firebase.google.com/docs/storage)

## 🆘 Problemas Comuns

### Erro: "Firebase: Error (auth/operation-not-allowed)"
**Solução:** Ative o método de autenticação no Console (Email/Password)

### Erro: "Missing or insufficient permissions"
**Solução:** Verifique as regras de segurança do Firestore

### Erro: "Storage object not found"
**Solução:** Verifique as regras de segurança do Storage

### Fotos não aparecem
**Solução:** Verifique se o CORS está configurado no Storage ou se as URLs estão corretas
