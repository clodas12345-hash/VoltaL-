# VoltaLá 📍

O **VoltaLá** foi pensado para pessoas que passam por um estabelecimento interessante (restaurante, cafeteria, loja, oficina, etc.) e querem salvar o local instantaneamente para voltar depois com facilidade, sem perder a localização.

---

## ✨ Funcionalidades Principais

- 📌 **Salvar Locais Instantaneamente**: Salve com um toque a sua posição GPS atual ou selecione qualquer ponto no mapa.
- 🎯 **Radar de Proximidade em Tempo Real**: Configure alertas para ser avisado quando estiver perto de tipos específicos de comida ou estabelecimentos (ex: *pastel*, *hambúrguer*, *café*).
- 🧭 **Navegação Integrada**:
  - Traçado de rota direto na tela com distância e tempo estimado.
  - Botão de atalho para abrir no **Google Maps** ou **Waze** com um clique.
- 🕒 **Horários de Funcionamento**: Status em tempo real (*Aberto agora* / *Fechado*), horário do dia e grade semanal completa (segunda a domingo).
- 🔍 **Busca & Filtro por Raio Dinâmico**: Escolha o raio de alcance (500 m a 20 km) e visualize os locais em lista ordenada por proximidade ou direto no mapa.
- 📸 **Fotos, Notas e Categorias**: Adicione fotos, telefone para contato, faixa de preço, avaliação e notas personalizadas para cada local salvo.
- 🗺️ **Modo Mapa Completo**: Suporte a Google Maps API com fallback integrado para modo demonstração offline/sem chave.

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior
- Gerenciador de pacotes `npm` ou `yarn`

### 1. Clonar o repositório
```bash
git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
cd voltala
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente (opcional)
Crie um arquivo `.env` baseado no `.env.example`:
```bash
cp .env.example .env
```

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
O aplicativo estará disponível em: `http://localhost:3000` (ou na porta indicada pelo terminal).

---

## 🛠️ Scripts Disponíveis

- `npm run dev`: Inicia o servidor local de desenvolvimento.
- `npm run build`: Compila a aplicação otimizada para produção.
- `npm run preview`: Visualiza o build de produção localmente.
- `npm run lint`: Executa a verificação de tipos TypeScript (`tsc --noEmit`).

---

## 📦 Tecnologias Utilizadas

- **React 19** + **TypeScript**
- **Vite**
- **Tailwind CSS**
- **Motion** (Framer Motion)
- **Lucide Icons**
- **Google Maps Platform** (`@vis.gl/react-google-maps`)
