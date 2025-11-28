# 🚨 CONFIGURAÇÃO URGENTE: Firebase API Key

## ❌ Erro: "auth/api-key-not-valid"

Você precisa configurar suas credenciais reais do Firebase antes de usar o app.

## ⚡ Solução Rápida (5 minutos):

### **Passo 1: Criar Projeto no Firebase**

1. Acesse: https://console.firebase.google.com/
2. Clique em **"Adicionar projeto"**
3. Nome do projeto: `CleanCity` (ou qualquer nome)
4. Aceite os termos → **Criar projeto**

### **Passo 2: Adicionar App Web**

1. No Dashboard do projeto, clique no ícone **Web** `</>`
2. Nome do app: `CleanCity`
3. **NÃO** marque "Firebase Hosting"
4. Clique em **"Registrar app"**

### **Passo 3: Copiar Credenciais**

Você verá algo assim:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "cleancity-12345.firebaseapp.com",
  projectId: "cleancity-12345",
  storageBucket: "cleancity-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012"
};
```

### **Passo 4: Colar no Projeto**

1. Abra o arquivo: `config/firebase.ts`
2. **Substitua** os valores placeholder pelas suas credenciais:

```typescript
const firebaseConfig = {
  apiKey: "Cole_sua_API_Key_aqui",                    // ← IMPORTANTE!
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
};
```

### **Passo 5: Ativar Autenticação**

1. No Firebase Console, menu lateral → **Authentication**
2. Clique em **"Get Started"**
3. Clique em **"Email/Password"**
4. Ative o switch **"Email/Password"**
5. Clique em **"Salvar"**

### **Passo 6: Criar Firestore Database**

1. Menu lateral → **Firestore Database**
2. Clique em **"Criar banco de dados"**
3. Escolha: **"Iniciar no modo de teste"** (mais fácil para começar)
4. Região: `us-central` ou `southamerica-east1`
5. Clique em **"Ativar"**

### **Passo 7: Ativar Storage**

1. Menu lateral → **Storage**
2. Clique em **"Começar"**
3. Aceite as regras padrão
4. Mesma região do Firestore
5. Clique em **"Concluído"**

---

## ✅ Testar

Após configurar, reinicie o app:

```bash
npm start
```

Tente criar uma conta novamente. Agora deve funcionar!

---

## 🔒 Regras de Segurança (Opcional - Recomendado)

### **Firestore Rules:**

No Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /waste-locations/{locationId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                              request.auth.uid == resource.data.userId;
    }
  }
}
```

### **Storage Rules:**

No Firebase Console → Storage → Rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /waste-photos/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🆘 Problemas?

### "Email já cadastrado"
✅ Normal - use outro email ou faça login

### "Permissão negada"
✅ Configure as regras de segurança acima

### "Storage object not found"
✅ Verifique se ativou o Storage no Firebase Console

---

## 📝 Checklist

- [ ] Projeto criado no Firebase Console
- [ ] App Web registrado
- [ ] API Key copiada e colada em `config/firebase.ts`
- [ ] Authentication ativado (Email/Password)
- [ ] Firestore Database criado
- [ ] Storage ativado
- [ ] App reiniciado (`npm start`)

**Pronto! Agora você pode usar o app com Firebase.** 🚀
