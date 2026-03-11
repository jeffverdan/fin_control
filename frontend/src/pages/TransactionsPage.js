import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createTransaction, deleteTransaction, getAccounts, getCards, getCategories, getTransactions, updateTransaction } from '@/lib/api';
import { formatCurrency, formatCurrencyInput, formatDate, parseCurrencyInput } from '@/lib/utils';
import { CARD_BRANDS } from '@/components/lists';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Briefcase,
  Calendar,
  Car,
  CreditCard,
  Folder,
  Funnel,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  House,
  Loader2,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  ShoppingCart,
  Trash2,
  Utensils,
  Wallet,
  X
} from 'lucide-react';
import { toast } from 'sonner';

const CATEGORY_ICON_MAP = {
  utensils: Utensils,
  home: House,
  car: Car,
  'gamepad-2': Gamepad2,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  'shopping-cart': ShoppingCart,
  briefcase: Briefcase,
  banknote: Banknote,
  'receipt-text': ReceiptText,
  folder: Folder
};

const defaultFormState = () => ({
  amount: '',
  description: '',
  transaction_type: 'expense',
  payment_method: 'cash',
  date: new Date().toISOString().split('T')[0],
  category_id: '',
  account_id: '',
  card_id: '',
  installments: 1
});

const defaultFiltersState = () => ({
  query: '',
  transaction_type: 'all',
  source_type: 'all',
  category_id: 'all',
  account_id: 'all',
  card_id: 'all',
  start_date: '',
  end_date: '',
  min_amount: '',
  max_amount: ''
});

const TransactionsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [filters, setFilters] = useState(defaultFiltersState());
  const [formData, setFormData] = useState(defaultFormState());
  const [editFormData, setEditFormData] = useState(defaultFormState());

  const categoryById = useMemo(() => Object.fromEntries(categories.map((category) => [category.id, category])), [categories]);
  const accountById = useMemo(() => Object.fromEntries(accounts.map((account) => [account.id, account])), [accounts]);
  const cardById = useMemo(() => Object.fromEntries(cards.map((card) => [card.id, card])), [cards]);

  const findBrand = (brand) => {
    const normalized = String(brand || '').toLowerCase().trim();
    if (!normalized) return null;
    return (
      CARD_BRANDS.find((item) => item.value === normalized) ||
      CARD_BRANDS.find((item) => item.label.toLowerCase() === normalized) ||
      null
    );
  };

  const getCategoryIcon = (categoryId) => {
    const category = categoryById[categoryId];
    const iconKey = category?.icon || 'folder';
    return CATEGORY_ICON_MAP[iconKey] || Folder;
  };

  const serverFilters = useMemo(() => {
    const params = {};
    if (filters.transaction_type !== 'all') params.transaction_type = filters.transaction_type;
    if (filters.category_id !== 'all') params.category_id = filters.category_id;
    if (filters.account_id !== 'all') params.account_id = filters.account_id;
    if (filters.card_id !== 'all') params.card_id = filters.card_id;
    if (filters.start_date) params.start_date = new Date(filters.start_date).toISOString();
    if (filters.end_date) params.end_date = new Date(filters.end_date).toISOString();
    return params;
  }, [filters.transaction_type, filters.category_id, filters.account_id, filters.card_id, filters.start_date, filters.end_date]);

  const fetchData = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const [transRes, accRes, cardRes, catRes] = await Promise.all([
        getTransactions(serverFilters),
        getAccounts(),
        getCards(),
        getCategories()
      ]);
      setTransactions(transRes.data || []);
      setAccounts(accRes.data || []);
      setCards(cardRes.data || []);
      setCategories(catRes.data || []);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [serverFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const quickAction = location.state?.quickAction;
    if (quickAction !== 'expense' && quickAction !== 'income') return;

    setFormData((prev) => ({ ...prev, transaction_type: quickAction }));
    setOpen(true);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (filters.source_type === 'account' && !transaction.account_id) return false;
      if (filters.source_type === 'card' && !transaction.card_id) return false;

      const query = filters.query.trim().toLowerCase();
      if (query) {
        const categoryName = categoryById[transaction.category_id]?.name || '';
        const accountName = accountById[transaction.account_id]?.name || '';
        const cardName = cardById[transaction.card_id]?.name || '';
        const haystack = `${transaction.description || ''} ${categoryName} ${accountName} ${cardName}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      const minAmount = parseCurrencyInput(filters.min_amount);
      if (filters.min_amount && transaction.amount < minAmount) return false;
      const maxAmount = parseCurrencyInput(filters.max_amount);
      if (filters.max_amount && transaction.amount > maxAmount) return false;

      return true;
    });
  }, [transactions, filters, categoryById, accountById, cardById]);

  const submitTransaction = async (payload, { isEdit = false, id = null } = {}) => {
    if (isEdit && !id) return;
    if (payload.payment_method === 'installment' && !payload.card_id) {
      toast.error('Selecione um cartão para transação parcelada');
      return;
    }
    if (payload.payment_method !== 'installment' && !payload.account_id) {
      toast.error('Selecione uma conta para transação à vista');
      return;
    }

    const requestData = {
      amount: parseCurrencyInput(payload.amount),
      description: payload.description,
      transaction_type: payload.transaction_type,
      date: new Date(payload.date).toISOString(),
      category_id: payload.category_id || null,
      account_id: payload.payment_method !== 'installment' ? payload.account_id || null : null,
      card_id: payload.payment_method === 'installment' ? payload.card_id || null : null,
      installment_total: payload.payment_method === 'installment' ? parseInt(payload.installments, 10) : null
    };

    if (isEdit) {
      await updateTransaction(id, requestData);
    } else {
      await createTransaction(requestData);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await submitTransaction(formData);
      toast.success('Transação criada com sucesso!');
      await fetchData({ silent: true });
      setOpen(false);
      setFormData(defaultFormState());
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao criar transação');
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    try {
      await submitTransaction(editFormData, { isEdit: true, id: editingTransactionId });
      toast.success('Transação atualizada com sucesso!');
      await fetchData({ silent: true });
      setEditOpen(false);
      setEditingTransactionId(null);
      setEditFormData(defaultFormState());
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao atualizar transação');
    }
  };

  const handleOpenEdit = (transaction) => {
    setEditingTransactionId(transaction.id);
    setEditFormData({
      amount: formatCurrency(transaction.amount),
      description: transaction.description || '',
      transaction_type: transaction.transaction_type || 'expense',
      payment_method: transaction.card_id ? 'installment' : 'cash',
      date: new Date(transaction.date).toISOString().split('T')[0],
      category_id: transaction.category_id || '',
      account_id: transaction.account_id || '',
      card_id: transaction.card_id || '',
      installments: transaction.installment_total || transaction.installments || 1
    });
    setEditOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return;
    try {
      await deleteTransaction(id);
      toast.success('Transação excluída com sucesso!');
      await fetchData({ silent: true });
    } catch (error) {
      toast.error('Erro ao excluir transação');
    }
  };

  const resetFilters = () => setFilters(defaultFiltersState());

  const renderTransactionForm = (values, setValues, onSubmit, submitLabel) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <Tabs value={values.transaction_type} onValueChange={(value) => setValues({ ...values, transaction_type: value })}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="income">Receita</TabsTrigger>
          <TabsTrigger value="expense">Despesa</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        <Label htmlFor="amount">Valor</Label>
        <Input
          id="amount"
          type="text"
          inputMode="numeric"
          value={values.amount}
          onChange={(event) => setValues({ ...values, amount: formatCurrencyInput(event.target.value) })}
          placeholder="R$ 0,00"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          value={values.description}
          onChange={(event) => setValues({ ...values, description: event.target.value })}
          placeholder="Ex: Supermercado"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Data da transação</Label>
        <Input
          id="date"
          type="date"
          value={values.date}
          onChange={(event) => setValues({ ...values, date: event.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="payment_method">Forma de pagamento</Label>
        <Select value={values.payment_method} onValueChange={(value) => setValues({ ...values, payment_method: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cash">À vista (conta)</SelectItem>
            <SelectItem value="installment">Cartão</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {values.payment_method === 'installment' && (
        <div className="space-y-2">
          <Label htmlFor="installments">Número de parcelas</Label>
          <Input
            id="installments"
            type="number"
            min="1"
            value={values.installments}
            onChange={(event) => setValues({ ...values, installments: event.target.value })}
            required
          />
        </div>
      )}

      {values.payment_method === 'installment' ? (
        <div className="space-y-2">
          <Label htmlFor="card_id">Cartão</Label>
          <Select value={values.card_id} onValueChange={(value) => setValues({ ...values, card_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cartão" />
            </SelectTrigger>
            <SelectContent>
              {cards.map((card) => (
                <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="account_id">Conta</Label>
          <Select value={values.account_id} onValueChange={(value) => setValues({ ...values, account_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="category_id">Categoria</Label>
        <Select value={values.category_id} onValueChange={(value) => setValues({ ...values, category_id: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter>
        <Button type="submit">{submitLabel}</Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="space-y-8" data-testid="transactions-page">
      <section className="rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card/95 to-primary/10 p-6 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Transações</h1>
            <p className="mt-2 text-muted-foreground" style={{ fontFamily: '"Public Sans", sans-serif' }}>Gestão completa de receitas e despesas</p>
          </div>
          <div className="flex items-center gap-3">
            {isRefreshing && (
              <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Atualizando
              </span>
            )}
            <Dialog
              open={open}
              onOpenChange={(nextOpen) => {
                if (!nextOpen) {
                  setOpen(false);
                  setFormData(defaultFormState());
                  return;
                }
                setOpen(true);
              }}
            >
              <DialogTrigger asChild>
                <Button data-testid="add-transaction-button">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Transação
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nova Transação</DialogTitle>
                </DialogHeader>
                {renderTransactionForm(formData, setFormData, handleSubmit, 'Criar')}
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </section>

      <Dialog
        open={editOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setEditOpen(false);
            setEditingTransactionId(null);
            setEditFormData(defaultFormState());
            return;
          }
          setEditOpen(true);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          {renderTransactionForm(editFormData, setEditFormData, handleEditSubmit, 'Salvar alterações')}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>Todas as Transações</CardTitle>
            <span className="text-xs text-muted-foreground">{filteredTransactions.length} registros</span>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar por descrição..."
                value={filters.query}
                onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
              />
            </div>

            <Select value={filters.transaction_type} onValueChange={(value) => setFilters((prev) => ({ ...prev, transaction_type: value }))}>
              <SelectTrigger>
                <Funnel className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.source_type} onValueChange={(value) => setFilters((prev) => ({ ...prev, source_type: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Conta + Cartão</SelectItem>
                <SelectItem value="account">Somente conta</SelectItem>
                <SelectItem value="card">Somente cartão</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.category_id} onValueChange={(value) => setFilters((prev) => ({ ...prev, category_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.account_id} onValueChange={(value) => setFilters((prev) => ({ ...prev, account_id: value, card_id: value !== 'all' ? 'all' : prev.card_id }))}>
              <SelectTrigger>
                <SelectValue placeholder="Conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas contas</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.card_id} onValueChange={(value) => setFilters((prev) => ({ ...prev, card_id: value, account_id: value !== 'all' ? 'all' : prev.account_id }))}>
              <SelectTrigger>
                <SelectValue placeholder="Cartão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos cartões</SelectItem>
                {cards.map((card) => (
                  <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={filters.start_date}
              onChange={(event) => setFilters((prev) => ({ ...prev, start_date: event.target.value }))}
            />

            <Input
              type="date"
              value={filters.end_date}
              onChange={(event) => setFilters((prev) => ({ ...prev, end_date: event.target.value }))}
            />

            <Input
              placeholder="Valor mínimo"
              inputMode="numeric"
              value={filters.min_amount}
              onChange={(event) => setFilters((prev) => ({ ...prev, min_amount: formatCurrencyInput(event.target.value) }))}
            />

            <Input
              placeholder="Valor máximo"
              inputMode="numeric"
              value={filters.max_amount}
              onChange={(event) => setFilters((prev) => ({ ...prev, max_amount: formatCurrencyInput(event.target.value) }))}
            />
          </div>

          <div className="flex justify-end">
            <Button variant="ghost" onClick={resetFilters}>
              <X className="mr-2 h-4 w-4" />
              Limpar filtros
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={`txn-skeleton-${idx}`} className="rounded-xl border border-border/70 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-1 items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/5" />
                        <Skeleton className="h-3 w-3/5" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-28" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">Nenhuma transação encontrada para os filtros selecionados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => {
                const category = categoryById[transaction.category_id];
                const account = accountById[transaction.account_id];
                const card = cardById[transaction.card_id];
                const CardBrand = findBrand(card?.brand);
                const CategoryIcon = getCategoryIcon(transaction.category_id);
                const isIncome = transaction.transaction_type === 'income';
                const sourceLabel = transaction.card_id ? 'Cartão' : 'Conta';

                return (
                  <div
                    key={transaction.id}
                    data-testid={`transaction-${transaction.id}`}
                    className={`rounded-xl border-l-4 border border-border/70 bg-card/65 p-4 transition-colors hover:bg-muted/25 ${isIncome ? 'border-l-success' : 'border-l-error'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-1 items-start gap-4">
                        <div className={`rounded-full p-2 ${isIncome ? 'bg-success/12 text-success' : 'bg-error/12 text-error'}`}>
                          {isIncome ? <ArrowUpCircle className="h-5 w-5" /> : <ArrowDownCircle className="h-5 w-5" />}
                        </div>

                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-medium">{transaction.description}</p>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isIncome ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                              {isIncome ? 'Receita' : 'Despesa'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              Efetuada em {formatDate(transaction.date)}
                            </span>

                            {category && (
                              <span className="inline-flex items-center gap-1">
                                <CategoryIcon className="h-3.5 w-3.5" />
                                {category.name}
                              </span>
                            )}
                            {!category && (
                              <span className="inline-flex items-center gap-1">
                                <Folder className="h-3.5 w-3.5" />
                                Sem categoria
                              </span>
                            )}

                            {transaction.account_id && (
                              <span className="inline-flex items-center gap-1">
                                <Wallet className="h-3.5 w-3.5" />
                                {sourceLabel}: {account?.name || '-'}
                              </span>
                            )}

                            {transaction.card_id && (
                              <span className="inline-flex items-center gap-1">
                                {CardBrand?.icon ? (
                                  <img src={CardBrand.icon} alt={CardBrand.label} className="h-3.5 w-5 object-contain" />
                                ) : (
                                  <CreditCard className="h-3.5 w-3.5" />
                                )}
                                {sourceLabel}: {card?.name || '-'}
                                {(transaction.installment_total || transaction.installments) && transaction.current_installment && (
                                  <span>({transaction.current_installment}/{transaction.installment_total || transaction.installments}x)</span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className={`font-mono text-lg font-bold ${isIncome ? 'text-success' : 'text-error'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                          {isIncome ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(transaction)} data-testid={`edit-transaction-${transaction.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(transaction.id)} data-testid={`delete-transaction-${transaction.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;
