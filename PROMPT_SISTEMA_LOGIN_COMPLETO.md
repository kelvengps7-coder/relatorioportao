# Prompt para Implementação de Sistema de Login e Controle de Atividades

"Implemente um sistema completo de autenticação e controle de atividades para um site de gerenciamento de publicações da igreja, integrado com Supabase. O sistema deve incluir:

## 1. SISTEMA DE AUTENTICAÇÃO

### Estrutura de Usuários:
- Crie uma tabela `profiles` no Supabase com campos: user_id (FK para auth.users), full_name, username, role ('admin' ou 'user'), created_by, created_at, updated_at
- Implemente Edge Function `create-user` para admins criarem novos usuários
- Implemente Edge Function `create-admin` para criar usuário administrador inicial (admin@congregacao.local / admin123)

### Páginas de Autenticação:
- Página de login (/auth) com formulários para login e cadastro
- Validação de credenciais e tratamento de erros
- Redirecionamento automático após login/logout
- Limpeza completa do estado de autenticação (localStorage/sessionStorage)

### Controle de Permissões:
- Apenas usuários com role 'admin' podem criar/editar/excluir usuários
- Usuários comuns só podem visualizar dados e fazer pedidos
- Implementar verificação de permissões em todas as operações

## 2. GESTÃO DE USUÁRIOS (ADMIN)

### Funcionalidades para Administradores:
- Listar todos os usuários cadastrados
- Criar novos usuários (nome completo, username, senha, role)
- Editar dados de usuários existentes
- Alterar senhas de usuários
- Desativar/reativar usuários
- Interface administrativa clara e intuitiva

### Validações:
- Username único no sistema
- Senhas com mínimo 6 caracteres
- Verificação de duplicatas antes de criar usuários

## 3. SISTEMA DE AUDITORIA

### Tabela de Logs:
- Criar tabela `audit_logs` com: id, user_id, action ('create', 'update', 'delete', 'movement', 'login', 'logout'), table_name, record_id, old_data (JSON), new_data (JSON), timestamp, user_details (nome e username)

### Hook de Auditoria:
- Criar hook `useAuditLog` para registrar todas as ações
- Registrar automaticamente: criação/edição/exclusão de publicações, movimentações de estoque, criação/edição de pedidos, login/logout de usuários
- Armazenar dados antigos e novos para comparação futura

### Interface de Visualização:
- Página dedicada para admins visualizarem histórico de atividades
- Filtros por usuário, data, tipo de ação
- Exibição detalhada de quem fez o quê e quando

## 4. UPLOAD E GESTÃO DE IMAGENS

### Storage Supabase:
- Configurar bucket 'publication-covers' como público
- Políticas RLS para upload seguro de imagens
- Validação de tipo de arquivo (JPG, PNG, WebP)
- Limite de tamanho (5MB)

### Componente de Upload:
- Interface para seleção e preview de imagens
- Upload automático para Supabase Storage
- Armazenamento da URL da imagem na tabela publications
- Componente `PublicationCover` para exibir imagens em formato A4 (aspect-ratio 3:4)

### Exibição de Imagens:
- Imagens visíveis em todas as páginas do sistema (Estoque, Movimentação, Pedidos, Dashboard)
- Layout estilo Amazon com cards, hover effects e badges
- Lazy loading para performance
- Fallback para publicações sem imagem

## 5. INTEGRAÇÃO COMPLETA

### Base de Dados:
- Tabelas: publications, movements, pedidos, profiles, audit_logs
- RLS policies configuradas corretamente
- Triggers para update automático de timestamps
- Foreign keys e constraints apropriados

### Componentes Reutilizáveis:
- `PublicationCover`: Exibe imagens das publicações
- `PublicationFormDialog`: Formulário com upload de imagem
- `UserManagementDialog`: Gestão de usuários (admin)
- `AuditLogViewer`: Visualização de logs de auditoria

### Funcionalidades de Sistema:
- Toast notifications para feedback ao usuário
- Loading states durante operações
- Error handling robusto
- Responsive design para todos os dispositivos

## 6. FLUXO DE TRABALHO

### Para Usuários Comuns:
1. Login com username/senha
2. Visualizar publicações com imagens
3. Fazer pedidos de publicações
4. Registrar movimentações de estoque
5. Todas as ações ficam registradas no audit log

### Para Administradores:
1. Todas as funcionalidades de usuário comum
2. Criar/editar/excluir usuários
3. Alterar senhas de outros usuários
4. Visualizar histórico completo de atividades
5. Gerenciar publicações e imagens

## 7. SEGURANÇA

### Implementações de Segurança:
- Senhas hasheadas pelo Supabase Auth
- RLS policies em todas as tabelas
- Validação de permissões no frontend e backend
- Edge Functions com CORS configurado
- Cleanup completo do estado de autenticação

### Auditoria de Segurança:
- Log de todos os logins/logouts
- Rastreamento de todas as modificações de dados
- Histórico imutável de ações realizadas
- Identificação clara de quem fez cada ação

Use toda a infraestrutura do Supabase (auth, database, storage, edge functions) para implementar este sistema completo e robusto. Garanta que todas as operações sejam auditadas e que as imagens funcionem corretamente em todas as páginas do sistema."