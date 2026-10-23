import { useState } from 'react';
import { useAuth } from './auth/AuthContext';
import { BottomNav, type Tab } from './components/BottomNav';
import { AddExpense } from './screens/AddExpense';
import { Bills } from './screens/Bills';
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { Payments } from './screens/Payments';
import { Savings } from './screens/Savings';
import { EMPTY_FILTERS, type Filters } from './lib/filters';

export default function App() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('home');
  const [adding, setAdding] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  if (!user) return <Login />;

  // Opens Payments with the given filters applied.
  const drill = (partial: Partial<Filters>) => {
    setFilters({ ...EMPTY_FILTERS, ...partial });
    setTab('payments');
  };

  return (
    <div className="app">
      <main className="content">
        {tab === 'home' && <Home onAdd={() => setAdding(true)} onDrill={drill} onNavigate={setTab} />}
        {tab === 'payments' && <Payments filters={filters} onChange={setFilters} />}
        {tab === 'bills' && <Bills />}
        {tab === 'savings' && <Savings />}
      </main>

      <BottomNav tab={tab} onChange={setTab} />

      {adding && <AddExpense user={user} onClose={() => setAdding(false)} />}
    </div>
  );
}
