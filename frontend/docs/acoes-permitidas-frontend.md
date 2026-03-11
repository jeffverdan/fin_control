# Ações permitidas no frontend

## 1. Acesso e autenticação
- Cadastrar conta (`register`)
- Fazer login (`login`)
- Fazer logout (`logout`)
- Acessar rotas internas apenas com token (sem token redireciona para `/auth`)

## 2. Navegação disponível para usuário autenticado
- Dashboard (`/dashboard`)
- Contas (`/accounts`)
- Cartões (`/cards`)
- Transações (`/transactions`)
- Recorrentes (`/recurring`)
- Relatórios (`/reports`)

## 3. Ações de negócio expostas na interface
- Contas: listar, criar, editar, excluir
- Cartões: listar, criar, editar, excluir
- Transações: listar, criar, excluir (não há edição na tela)
- Recorrentes: listar, criar, editar status (ativo/pausado), excluir
- Relatórios: listar transações por filtro (data, categoria, tipo)
- Dashboard: consultar resumo

## 4. Modelo de permissão atual
- Não há controle por perfil/role no frontend.
- A regra atual é: autenticado vs não autenticado.

## 5. Ações existentes no client API, mas não expostas claramente nas telas principais
- `updateTransaction`
- `createCategory` e `deleteCategory`
- `createTag` e `deleteTag`

## Referências no código
- `frontend/src/contexts/AuthContext.js`
- `frontend/src/components/ProtectedRoute.js`
- `frontend/src/components/Layout.js`
- `frontend/src/App.js`
- `frontend/src/lib/api.js`
- `frontend/src/pages/AccountsPage.js`
- `frontend/src/pages/CardsPage.js`
- `frontend/src/pages/TransactionsPage.js`
- `frontend/src/pages/RecurringPage.js`
- `frontend/src/pages/ReportsPage.js`
- `frontend/src/pages/DashboardPage.js`
