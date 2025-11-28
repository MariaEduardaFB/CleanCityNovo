# 🔥 Como Obter Suas Credenciais do Firebase (Passo a Passo)

## ❌ Erro que você está vendo:
```
auth/api-key-not-valid
```

**Causa:** O app está usando credenciais placeholder. Você precisa das suas próprias.

---

## ✅ Solução (Siga estes passos):

### **1️⃣ Acessar Firebase Console**

Abra no navegador: https://console.firebase.google.com/

**Login** com sua conta Google

---

### **2️⃣ Criar Novo Projeto**

1. Clique no botão **"Adicionar projeto"** (grande, no centro)
2. **Nome do projeto:** Digite `CleanCity` (ou qualquer nome)
3. Clique em **"Continuar"**
4. Google Analytics: **Desative** (não precisa agora)
5. Clique em **"Criar projeto"**
6. Aguarde... (~30 segundos)
7. Clique em **"Continuar"**

---

### **3️⃣ Registrar App Web**

Agora você está no **Dashboard** do projeto.

1. Procure por **"Para começar, adicione o Firebase ao seu app"**
2. Clique no ícone **`</>`** (Web)
3. **Apelido do app:** Digite `CleanCity`
4. **NÃO** marque "Firebase Hosting"
5. Clique em **"Registrar app"**

---

### **4️⃣ COPIAR AS CREDENCIAIS** ⭐

Você verá um código JavaScript assim:

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

**📋 COPIE esses valores!**

---

### **5️⃣ Colar no Projeto**

#### **OPÇÃO A: Editar Diretamente (Mais Rápido)**

1. Abra o arquivo: `config/firebase.ts`
2. Encontre estas linhas:

```typescript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",  // ← COLE AQUI
  authDomain: "seu-projeto.firebaseapp.com",  // ← COLE AQUI
  // ... resto das linhas
};
```

3. **Substitua** cada valor com o que você copiou do Firebase Console

**EXEMPLO:**
```typescript
const firebaseConfig = {
  apiKey: "AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX",  // ← Seu valor real
  authDomain: "cleancity-12345.firebaseapp.com",
  projectId: "cleancity-12345",
  storageBucket: "cleancity-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012"
};
```

#### **OPÇÃO B: Usar .env (Mais Seguro)**

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e cole seus valores:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=cleancity-12345.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=cleancity-12345
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=cleancity-12345.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456789012
   ```

---

### **6️⃣ Ativar Authentication**

Volte ao Firebase Console:

1. Menu lateral esquerdo → **Authentication**
2. Clique em **"Vamos começar"** ou **"Get Started"**
3. Na aba **"Sign-in method"**
4. Clique em **"Email/Password"**
5. **Ative** o primeiro switch (Email/Password)
6. Clique em **"Salvar"**

✅ **Pronto!** Autenticação ativada.

---

### **7️⃣ Criar Firestore Database**

No Firebase Console:

1. Menu lateral → **Firestore Database**
2. Clique em **"Criar banco de dados"**
3. Escolha: **"Iniciar no modo de teste"**
   - ⚠️ Permite leitura/escrita por 30 dias (perfeito para testes)
4. Região: Escolha **"us-central"** ou **"southamerica-east1"** (São Paulo)
5. Clique em **"Ativar"**
6. Aguarde... (~30 segundos)

✅ **Pronto!** Banco criado.

---

### **8️⃣ Ativar Storage**

No Firebase Console:

1. Menu lateral → **Storage**
2. Clique em **"Começar"**
3. Aceite as regras padrão
4. Mesma região do Firestore
5. Clique em **"Concluído"**

✅ **Pronto!** Storage ativado.

---

## 🚀 TESTAR

Agora reinicie o app:

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente
npm start
```

**Tente criar uma conta:**
- Email: `teste@exemplo.com`
- Senha: `123456` (mínimo 6 caracteres)

Se tudo estiver correto, você verá:
- ✅ "Conta criada com sucesso!"
- Será redirecionado para as tabs

---

## ❌ Ainda com erro?

### **Erro: "auth/api-key-not-valid"**
- Verifique se copiou a API Key corretamente
- Não deve ter espaços ou aspas extras
- Reinicie o app após editar

### **Erro: "auth/operation-not-allowed"**
- Ative o Authentication no Firebase Console (Passo 6)

### **Erro: "Missing or insufficient permissions"**
- Configure o Firestore no modo de teste (Passo 7)

---

## 📝 Checklist Final

- [ ] Projeto criado no Firebase
- [ ] App Web registrado
- [ ] Credenciais copiadas e coladas
- [ ] Authentication ativado (Email/Password)
- [ ] Firestore Database criado (modo teste)
- [ ] Storage ativado
- [ ] App reiniciado
- [ ] Conta de teste criada com sucesso

**Se todos os itens estão marcados, o app está funcionando!** 🎉

---

## 🔒 Próximos Passos (Opcional)

Depois de testar, configure as **Regras de Segurança** seguindo o arquivo `FIREBASE_SETUP.md`.
