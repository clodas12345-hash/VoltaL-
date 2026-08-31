# Regras Persistentes do Projeto VoltaLá (GKD Mobility)

1. **Atualização Contínua Sem Versionamento Distinto (In-Place Update)**:
   - Manter o identificador de aplicativo estável (`com.voltala.app`) e atualizar sempre de forma contínua e sobreposta no mesmo fluxo.
   - Não criar ramificações ou estruturas paralelas de versões sem necessidade; toda atualização deve sobrescrever e atualizar diretamente o pacote principal.

2. **GitHub Actions & Automação CI/CD**:
   - Usar estritamente as ações modernas e ativas do GitHub Actions:
     - `actions/checkout@v4`
     - `actions/setup-node@v4`
     - `actions/setup-java@v4`
     - `actions/upload-artifact@v4` (A versão `v3` foi descontinuada pelo GitHub e causa falha imediata).
   - Verificar se `android/app/src/main/AndroidManifest.xml` existe antes de rodar qualquer `sed` ou assumir que a pasta está pronta. Se a pasta `android` existir incompleta (sem AndroidManifest.xml), ela deve ser recriada com `npx cap add android`.

3. **Geração e Ajuste de Ícones Android**:
   - Manter a Safe Zone do Android (60% do tamanho da tela com padding/margem de 86px em 512x512 ou equivalente) para evitar cortes na One UI (Samsung) e outras interfaces customizadas.
   - Gerar camadas separadas com fundo branco (`ic_launcher_background.xml`) e vetor adaptativo (`mipmap-anydpi-v26/ic_launcher.xml`).

4. **Transparência, Precisão e Estrito Escopo**:
   - Não afirmar que algo está 100% resolvido sem antes checar todas as dependências de ponta a ponta (inclusive versões de plugins e ações de CI/CD).
   - Ao atender pedidos de remoção (como remover o campo de chave de API), remover **exclusivamente** o elemento alvo solicitado, preservando intactas todas as demais abas, seções de ajuda, tutoriais, personalização de categorias e recursos de UI.
   - Fornecer blocos de código completos quando solicitado, sem exigir edições manuais fragmentadas.
