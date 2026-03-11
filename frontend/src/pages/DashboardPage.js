import React, { useEffect, useState } from 'react';
import { getDashboard } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpCircle, ArrowDownCircle, Wallet, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const ACCOUNT_TYPE_LABELS = {
  checking: 'Conta Corrente',
  wallet: 'Carteira',
  savings: 'Poupanca',
  credit_card: 'Conta Cartao',
  investment: 'Investimento',
  cash: 'Dinheiro',
  other: 'Outros'
};

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getDashboard();
        setData(response.data);
      } catch (error) {
        toast.error('Erro ao carregar dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const summary = data?.summary || {};
  const accounts = data?.accounts || [];

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <section className="rounded-2xl border border-border/70 bg-gradient-to-r from-card via-card/95 to-primary/10 p-6 shadow-lg shadow-black/10">
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Dashboard</h1>
        <p className="mt-2 text-muted-foreground" style={{ fontFamily: '"Public Sans", sans-serif' }}>Visao geral das suas financas</p>
      </section>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="total-income-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receitas do Mes</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-28" /> : <div className="font-mono text-2xl font-bold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{formatCurrency(summary.total_income || 0)}</div>}
          </CardContent>
        </Card>

        <Card data-testid="total-expense-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Despesas do Mes</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-error" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-28" /> : <div className="font-mono text-2xl font-bold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{formatCurrency(summary.total_expense || 0)}</div>}
          </CardContent>
        </Card>

        <Card data-testid="balance-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo do Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-28" /> : <div className="font-mono text-2xl font-bold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{formatCurrency(summary.balance || 0)}</div>}
          </CardContent>
        </Card>

        <Card data-testid="accounts-balance-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Total em Contas</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-28" /> : <div className="font-mono text-2xl font-bold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{formatCurrency(summary.total_accounts_balance || 0)}</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={`account-skeleton-${idx}`} className="flex items-center justify-between rounded-xl border border-border/70 p-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada</p>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-card/65 p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: account.color }} />
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-xs text-muted-foreground">{ACCOUNT_TYPE_LABELS[account.account_type] || account.account_type}</p>
                    </div>
                  </div>
                  <p className="font-mono font-semibold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                    {formatCurrency(account.current_balance)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
