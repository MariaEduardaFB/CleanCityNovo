# 📡 Sistema Offline & Cache - CleanCity

## ✨ Funcionalidades Implementadas

### 🌐 **1. Detector de Status de Rede**

#### **`services/network.service.ts`**
- Monitora status de conexão em tempo real
- Detecta tipo de conexão (WiFi, Celular, Nenhuma)
- Sistema de listeners para reagir a mudanças
- Cache do status atual para acesso rápido

**Principais Funções:**
```typescript
initializeNetworkListener()  // Inicia monitoramento
getNetworkStatus()           // Status atual
isOnline()                   // Verifica se está online
addNetworkListener()         // Adiciona listener personalizado
```

---

### 💾 **2. Sistema de Cache Inteligente**

#### **`services/cache.service.ts`**
- Cache com TTL (Time To Live) configurável
- Sistema LRU (Least Recently Used)
- Metadata para estatísticas
- Limpeza automática de cache antigo

**Principais Funções:**
```typescript
setCache(key, data, ttlMinutes)  // Salva no cache
getCache(key)                     // Busca do cache
deleteCache(key)                  // Remove entrada
clearAllCache()                   // Limpa tudo
getCacheStats()                   // Estatísticas
cleanOldCache(maxAgeMinutes)     // Limpeza automática
```

**Cache Locations:**
- `waste_locations_list` - Lista de registros (15min TTL)
- `waste_locations_map` - Dados do mapa (15min TTL)

---

### 📤 **3. Fila de Sincronização Offline**

#### **`services/offline-queue.service.ts`**
- Enfileira operações quando offline
- Processa automaticamente ao voltar online
- Sistema de retry com limite (3 tentativas)
- Estatísticas de fila

**Principais Funções:**
```typescript
addToQueue(type, collection, data)  // Adiciona à fila
processQueue(processor)              // Processa fila
getQueueStats()                      // Estatísticas
clearQueue()                         // Limpa fila
cleanOldQueueItems()                 // Remove antigos (7 dias)
```

**Tipos de Operação:**
- `create` - Criar novo registro
- `update` - Atualizar existente
- `delete` - Deletar registro

---

### 🎨 **4. Indicadores Visuais**

#### **`components/NetworkIndicator.tsx`**
Banner animado no topo da tela:
- 🔴 **Vermelho:** Modo Offline
- 🟠 **Laranja:** Conexão Lenta (Celular)
- Aparece por 3 segundos ao mudar status
- Desaparece automaticamente quando online WiFi

#### **`components/SyncIndicator.tsx`**
Badge flutuante no canto inferior direito:
- 🔵 **Azul:** Itens pendentes na fila
- 🔴 **Vermelho:** Itens com erro
- Mostra número de itens pendentes
- Clique para forçar sincronização
- Oculta quando fila vazia

---

### 🪝 **5. Custom Hooks**

#### **`hooks/useNetworkStatus.ts`**
Hook React para monitorar rede:
```typescript
const { isOnline, isOffline, connectionType, isWiFi, isCellular } = useNetworkStatus();
```

#### **`hooks/useOfflineQueue.ts`**
Hook React para gerenciar fila:
```typescript
const { stats, isProcessing, process, refreshStats } = useOfflineQueue(processor);
```

---

## 🚀 Como Funciona

### **Fluxo Offline:**

1. **Usuário perde conexão**
   - `NetworkIndicator` mostra banner "Modo Offline"
   - Cache continua funcionando normalmente

2. **Usuário cria registro**
   - Salvo localmente no AsyncStorage
   - Adicionado à fila de sincronização
   - `SyncIndicator` mostra "1 pendente"

3. **Usuário volta online**
   - `NetworkIndicator` desaparece
   - Fila processa automaticamente
   - `SyncIndicator` atualiza status

4. **Sincronização bem-sucedida**
   - Item removido da fila
   - Cache atualizado
   - `SyncIndicator` desaparece

---

## 📊 Onde os Componentes Foram Integrados

### **`app/_layout.tsx`**
```typescript
// Inicializa listener de rede
useEffect(() => {
  const unsubscribe = initializeNetworkListener();
  return unsubscribe;
}, []);

// Adiciona NetworkIndicator
<NetworkIndicator />
```

### **`app/(tabs)/explore.tsx`**
```typescript
// Hook de status de rede
const { isOnline } = useNetworkStatus();

// Cache na função de carregamento
const cachedData = await getCache<WasteLocation[]>('waste_locations_list');
await setCache('waste_locations_list', locations, 15);

// Indicador de sincronização
<SyncIndicator onPress={loadWasteLocations} />
```

### **`app/(tabs)/map.tsx`**
```typescript
// Cache específico do mapa
const cachedData = await getCache<WasteLocation[]>('waste_locations_map');
await setCache('waste_locations_map', locations, 15);
```

---

## 🔧 Configurações

### **TTL do Cache:**
- Lista de registros: **15 minutos**
- Mapa: **15 minutos**
- Configurável em cada chamada `setCache()`

### **Fila Offline:**
- Máximo de tentativas: **3**
- Limpeza automática: **7 dias**
- Intervalo de atualização: **5 segundos**

### **Network Indicator:**
- Duração da animação: **3 segundos**
- Fade in/out: **300ms**

---

## 🧪 Como Testar

### **1. Testar Modo Offline:**
```bash
# Desligue o WiFi/dados no emulador
# Crie um registro
# Verifique o SyncIndicator (deve mostrar "1 pendente")
# Ligue o WiFi/dados
# Verifique a sincronização automática
```

### **2. Testar Cache:**
```bash
# Carregue os registros (primeira vez - lento)
# Volte para a tela
# Carregue novamente (segunda vez - instantâneo do cache)
```

### **3. Testar Indicadores:**
```bash
# Desligue/ligue WiFi várias vezes
# Observe o NetworkIndicator aparecendo/desaparecendo
# Crie registros offline
# Observe o SyncIndicator atualizando
```

---

## 📈 Benefícios

✅ **Usuário nunca perde dados** - Tudo salvo localmente  
✅ **Experiência fluida offline** - App funciona sem internet  
✅ **Sincronização automática** - Sem intervenção manual  
✅ **Cache inteligente** - Carregamento instantâneo  
✅ **Feedback visual claro** - Usuário sempre sabe o status  
✅ **Economia de dados** - Menos requisições de rede  

---

## 🎯 Próximas Melhorias (Opcional)

- [ ] Compressão de dados do cache
- [ ] Sincronização incremental (delta)
- [ ] Priorização de itens na fila
- [ ] Estatísticas de uso de cache
- [ ] Configurações de usuário (auto-sync on/off)
- [ ] Notificações push quando sincronizar
- [ ] Upload de fotos apenas em WiFi

---

## 🐛 Troubleshooting

### **Cache não funciona:**
- Verifique permissões do AsyncStorage
- Limpe cache: `clearAllCache()`

### **Fila não processa:**
- Verifique conexão de internet
- Force processamento manual: `processQueue()`
- Limpe itens antigos: `cleanOldQueueItems()`

### **Indicadores não aparecem:**
- Reinicie o app
- Verifique se `initializeNetworkListener()` foi chamado
- Verifique se componentes estão montados

---

## 📚 Arquivos Criados/Modificados

### **Novos Arquivos:**
- `services/network.service.ts`
- `services/cache.service.ts`
- `services/offline-queue.service.ts`
- `components/NetworkIndicator.tsx`
- `components/SyncIndicator.tsx`
- `hooks/useNetworkStatus.ts`
- `hooks/useOfflineQueue.ts`

### **Modificados:**
- `app/_layout.tsx`
- `app/(tabs)/explore.tsx`
- `app/(tabs)/map.tsx`

---

**Status:** ✅ Fase 3 Concluída - Sistema Offline & Cache Totalmente Funcional!
