import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getTransactions, getCategories } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const ReportsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [filters, setFilters] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    category_id: '',
    transaction_type: ''
  });

  const fetchTransactions = useCallback(async ({ silent = false } = {}) => {
    if (silent) {
      setLoadingReport(true);
    }

    try {
      const params = {};
      if (filters.start_date) params.start_date = new Date(filters.start_date).toISOString();
      if (filters.end_date) params.end_date = new Date(filters.end_date).toISOString();
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.transaction_type) params.transaction_type = filters.transaction_type;

      const response = await getTransactions(params);
      setTransactions(response.data);
    } catch (error) {
      toast.error('Erro ao carregar transacoes');
    } finally {
      setLoadingReport(false);
    }
  }, [filters]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const catRes = await getCategories();
      setCategories(catRes.data);
      await fetchTransactions();
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilters = () => {
    fetchTransactions({ silent: true });
  };

  const totalIncome = useMemo(() => transactions.filter((t) => t.transaction_type === 'income').reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter((t) => t.transaction_type === 'expense').reduce((sum, t) => sum + t.amount, 0), [transactions]);
  const balance = totalIncome - totalExpense;

  const expensesByCategory = useMemo(() => {
    const grouped = {};
    transactions
      .filter((t) => t.transaction_type === 'expense' && t.category_id)
      .forEach((t) => {
        const category = categories.find((c) => c.id === t.category_id);
        const categoryName = category?.name || 'Outros';
        grouped[categoryName] = (grouped[categoryName] || 0) + t.amount;
      });

    return Object.entries(grouped).sort(([, a], [, b]) => b - a);
  }, [transactions, categories]);

  return (
    <div className="space-y-8" data-testid="reports-page">
      <section className="rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card/95 to-primary/10 p-6 shadow-lg shadow-black/10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Relatorios</h1>
            <p className="mt-2 text-muted-foreground" style={{ fontFamily: '"Public Sans", sans-serif' }}>Analise detalhada das suas financas</p>
          </div>
          {loadingReport && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/80 px-3 py-1 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Recalculando
            </span>
          )}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Data Inicial</Label>
              <Input id="start_date" type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} data-testid="filter-start-date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Data Final</Label>
              <Input id="end_date" type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} data-testid="filter-end-date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category_id">Categoria</Label>
              <Select value={filters.category_id || 'all'} onValueChange={(value) => setFilters({ ...filters, category_id: value === 'all' ? '' : value })}>
                <SelectTrigger data-testid="filter-category">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction_type">Tipo</Label>
              <Select value={filters.transaction_type || 'all'} onValueChange={(value) => setFilters({ ...filters, transaction_type: value === 'all' ? '' : value })}>
                <SelectTrigger data-testid="filter-type">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleApplyFilters} className="mt-4" data-testid="apply-filters-button">
            Aplicar Filtros
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {[{ title: 'Total de Receitas', value: totalIncome, cls: 'text-success' }, { title: 'Total de Despesas', value: totalExpense, cls: 'text-error' }, { title: 'Saldo', value: balance, cls: balance >= 0 ? 'text-success' : 'text-error' }].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-10 w-36" />
              ) : (
                <p className={`font-mono text-3xl font-bold ${item.cls}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {formatCurrency(item.value)}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Despesas por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={`cat-skeleton-${idx}`} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          ) : expensesByCategory.length > 0 ? (
            <div className="space-y-4">
              {expensesByCategory.map(([category, amount]) => {
                const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{category}</span>
                      <span className="font-mono" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        {formatCurrency(amount)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary transition-all duration-500" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Nenhuma transacao encontrada para o periodo selecionado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
