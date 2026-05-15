import { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  History, 
  Wallet, 
  Plus, 
  Minus,
  Calendar,
  Tag,
  AlignLeft,
  Banknote,
  Menu,
  X,
  Settings,
  Filter,
  Printer,
  LogOut,
  User as UserIcon,
  Lock,
  Users,
  Key,
  ShieldAlert,
  Database,
  Pencil,
  Trash2,
  Landmark,
  Coins
} from 'lucide-react';

// === IMPORT FIREBASE ===
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc 
} from 'firebase/firestore';

// --- DEFINISI TIPE DATA (TypeScript Interfaces) ---
interface Transaction {
  id?: string;
  type: 'in' | 'out';
  amount: number;
  category: string;
  date: string;
  description: string;
  paymentMethod?: 'cash' | 'bank';
}

interface Account {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
}

// =====================================================================
// KONFIGURASI FIREBASE
// =====================================================================
const firebaseConfig = {
  apiKey: "AIzaSyAgAN7TuEbW0OuhHrcj-gzwge-ndSgsbjE",
  authDomain: "keuangan-masjid-9cc38.firebaseapp.com",
  projectId: "keuangan-masjid-9cc38",
  storageBucket: "keuangan-masjid-9cc38.firebasestorage.app",
  messagingSenderId: "411058101047",
  appId: "1:411058101047:web:a3df1d61b03179452758b2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const INITIAL_INCOME_CATEGORIES = ['Kotak Amal Jum\'at', 'Kotak Amal Harian', 'Infaq/Sedekah', 'Zakat', 'Lain-lain'];
const INITIAL_EXPENSE_CATEGORIES = ['Operasional (Listrik/Air/Internet)', 'Kebersihan & Perawatan', 'Honor (Imam/Khatib/Marbot)', 'Lain-lain'];
const INITIAL_ACCOUNTS: Account[] = [
  { id: '1', username: 'admin', password: 'admin123', role: 'admin' },
  { id: '2', username: 'user', password: 'user123', role: 'user' }
];

const formatCurrency = (value: number | string) => {
  const num = typeof value === 'string' ? parseInt(value) : value;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('id-ID', options);
};

// --- Komponen Antarmuka ---

const Sidebar = ({ currentView, setCurrentView, handleLogout, currentUser }: any) => (
  <div className="bg-emerald-800 text-white w-64 flex-shrink-0 hidden md:flex flex-col min-h-screen print:hidden">
    <div className="p-6 border-b border-emerald-700">
      <h1 className="text-xl font-bold leading-tight">Masjid Darussalam</h1>
      <p className="text-emerald-300 text-xs mt-1">Taman Margasatwa Ragunan</p>
    </div>
    <nav className="flex-1 py-4">
      <button 
        onClick={() => setCurrentView('dashboard')}
        className={`w-full flex items-center px-6 py-3 hover:bg-emerald-700 transition-colors ${currentView === 'dashboard' ? 'bg-emerald-700 border-l-4 border-emerald-400' : ''}`}
      >
        <LayoutDashboard className="w-5 h-5 mr-3" /> Dasbor
      </button>

      {currentUser?.role === 'admin' && (
        <>
          <button 
            onClick={() => setCurrentView('add-income')}
            className={`w-full flex items-center px-6 py-3 hover:bg-emerald-700 transition-colors ${currentView === 'add-income' ? 'bg-emerald-700 border-l-4 border-emerald-400' : ''}`}
          >
            <ArrowDownCircle className="w-5 h-5 mr-3 text-emerald-300" /> Catat Pemasukan
          </button>
          <button 
            onClick={() => setCurrentView('add-expense')}
            className={`w-full flex items-center px-6 py-3 hover:bg-emerald-700 transition-colors ${currentView === 'add-expense' ? 'bg-emerald-700 border-l-4 border-emerald-400' : ''}`}
          >
            <ArrowUpCircle className="w-5 h-5 mr-3 text-red-300" /> Catat Pengeluaran
          </button>
        </>
      )}

      <button 
        onClick={() => setCurrentView('history')}
        className={`w-full flex items-center px-6 py-3 hover:bg-emerald-700 transition-colors ${currentView === 'history' ? 'bg-emerald-700 border-l-4 border-emerald-400' : ''}`}
      >
        <History className="w-5 h-5 mr-3" /> Buku Kas (Riwayat)
      </button>

      {currentUser?.role === 'admin' && (
        <button 
          onClick={() => setCurrentView('settings')}
          className={`w-full flex items-center px-6 py-3 hover:bg-emerald-700 transition-colors ${currentView === 'settings' ? 'bg-emerald-700 border-l-4 border-emerald-400' : ''}`}
        >
          <Settings className="w-5 h-5 mr-3" /> Pengaturan Kategori
        </button>
      )}

      <button 
        onClick={() => setCurrentView('account')}
        className={`w-full flex items-center px-6 py-3 hover:bg-emerald-700 transition-colors ${currentView === 'account' ? 'bg-emerald-700 border-l-4 border-emerald-400' : ''}`}
      >
        <Users className="w-5 h-5 mr-3" /> Pengaturan Akun
      </button>
    </nav>
    <div className="p-6 border-t border-emerald-700">
      <div className="text-xs text-emerald-300 mb-4 px-2 flex items-center">
        <UserIcon className="w-4 h-4 mr-2" /> {currentUser?.username} ({currentUser?.role})
      </div>
      <button 
        onClick={handleLogout}
        className="w-full flex items-center justify-center px-4 py-2 bg-emerald-900 hover:bg-red-600 text-white rounded transition-colors text-sm"
      >
        <LogOut className="w-4 h-4 mr-2" /> Keluar
      </button>
      <p className="text-xs text-emerald-400 text-center mt-4">Sistem Keuangan Masjid TMR</p>
    </div>
  </div>
);

const MobileNav = ({ isMobileMenuOpen, setIsMobileMenuOpen }: any) => (
  <div className="md:hidden bg-emerald-800 text-white flex justify-between items-center p-4 sticky top-0 z-50 print:hidden">
    <div>
      <h1 className="text-lg font-bold">Masjid Darussalam</h1>
      <p className="text-emerald-300 text-[10px]">Taman Margasatwa Ragunan</p>
    </div>
    <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
      {isMobileMenuOpen ? <X /> : <Menu />}
    </button>
  </div>
);

const MobileMenu = ({ isMobileMenuOpen, setIsMobileMenuOpen, setCurrentView, handleLogout, currentUser }: any) => {
  if (!isMobileMenuOpen) return null;
  return (
    <div className="md:hidden bg-emerald-700 text-white absolute w-full z-40 shadow-xl print:hidden">
      <button 
        onClick={() => {setCurrentView('dashboard'); setIsMobileMenuOpen(false);}}
        className="w-full flex items-center px-6 py-4 border-b border-emerald-600"
      >
        <LayoutDashboard className="w-5 h-5 mr-3" /> Dasbor
      </button>

      {currentUser?.role === 'admin' && (
        <>
          <button 
            onClick={() => {setCurrentView('add-income'); setIsMobileMenuOpen(false);}}
            className="w-full flex items-center px-6 py-4 border-b border-emerald-600"
          >
            <ArrowDownCircle className="w-5 h-5 mr-3 text-emerald-300" /> Catat Pemasukan
          </button>
          <button 
            onClick={() => {setCurrentView('add-expense'); setIsMobileMenuOpen(false);}}
            className="w-full flex items-center px-6 py-4 border-b border-emerald-600"
          >
            <ArrowUpCircle className="w-5 h-5 mr-3 text-red-300" /> Catat Pengeluaran
          </button>
        </>
      )}

      <button 
        onClick={() => {setCurrentView('history'); setIsMobileMenuOpen(false);}}
        className="w-full flex items-center px-6 py-4 border-b border-emerald-600"
      >
        <History className="w-5 h-5 mr-3" /> Buku Kas (Riwayat)
      </button>

      {currentUser?.role === 'admin' && (
        <button 
          onClick={() => {setCurrentView('settings'); setIsMobileMenuOpen(false);}}
          className="w-full flex items-center px-6 py-4 border-b border-emerald-600"
        >
          <Settings className="w-5 h-5 mr-3" /> Pengaturan Kategori
        </button>
      )}

      <button 
        onClick={() => {setCurrentView('account'); setIsMobileMenuOpen(false);}}
        className="w-full flex items-center px-6 py-4 border-b border-emerald-600"
      >
        <Users className="w-5 h-5 mr-3" /> Pengaturan Akun
      </button>

      <button 
        onClick={() => {handleLogout(); setIsMobileMenuOpen(false);}}
        className="w-full flex items-center px-6 py-4 border-t border-emerald-600 text-red-300 hover:text-white hover:bg-red-600 transition-colors"
      >
        <LogOut className="w-5 h-5 mr-3" /> Keluar
      </button>
    </div>
  );
};

const LoginView = ({ onLogin, accounts }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const user = accounts.find((u: Account) => u.username === username && u.password === password);
    
    if (user) {
      onLogin(user);
    } else {
      setLoginError('Username atau password salah!');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-emerald-700 p-8 text-center relative">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Wallet className="w-8 h-8 text-emerald-700" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Masjid Darussalam</h1>
          <p className="text-emerald-200 text-sm">Sistem Informasi Keuangan</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {loginError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
              {loginError}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <UserIcon className="w-5 h-5" />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors"
          >
            Masuk ke Sistem
          </button>
        </form>
      </div>
    </div>
  );
};

const DashboardView = ({ balance, cashBalance, bankBalance, totalIncome, totalExpense, setCurrentView, transactions, currentUser }: any) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-800">Ringkasan Keuangan</h2>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
        <div className="bg-emerald-100 p-4 rounded-full mr-4 flex-shrink-0">
          <Wallet className="w-8 h-8 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 font-medium">Total Saldo Saat Ini</p>
          <p className="text-2xl font-bold text-gray-800 truncate">{formatCurrency(balance)}</p>
          <div className="mt-2 flex flex-col text-xs space-y-1">
             <div className="flex justify-between items-center bg-gray-50 p-1.5 rounded border border-gray-100">
               <span className="flex items-center text-gray-600"><Coins className="w-3 h-3 mr-1"/> Tunai (Kas)</span>
               <span className="font-semibold text-emerald-700">{formatCurrency(cashBalance)}</span>
             </div>
             <div className="flex justify-between items-center bg-gray-50 p-1.5 rounded border border-gray-100">
               <span className="flex items-center text-gray-600"><Landmark className="w-3 h-3 mr-1"/> Rekening Bank</span>
               <span className="font-semibold text-blue-700">{formatCurrency(bankBalance)}</span>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
        <div className="bg-green-100 p-4 rounded-full mr-4">
          <ArrowDownCircle className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Total Pemasukan</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
        <div className="bg-red-100 p-4 rounded-full mr-4">
          <ArrowUpCircle className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500 font-medium">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalExpense)}</p>
        </div>
      </div>
    </div>

    {currentUser?.role === 'admin' && (
      <div className="flex flex-wrap gap-4">
        <button 
          onClick={() => setCurrentView('add-income')}
          className="flex items-center bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" /> Pemasukan Baru
        </button>
        <button 
          onClick={() => setCurrentView('add-expense')}
          className="flex items-center bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Minus className="w-5 h-5 mr-2" /> Pengeluaran Baru
        </button>
      </div>
    )}

    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">Transaksi Terakhir</h3>
        <button onClick={() => setCurrentView('history')} className="text-emerald-600 text-sm font-medium hover:underline">
          Lihat Semua
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {transactions.slice(0, 5).map((t: Transaction) => (
          <div key={t.id} className="p-4 sm:p-6 flex justify-between items-center hover:bg-gray-50 transition-colors">
            <div className="flex items-start">
              <div className={`p-2 rounded-full mr-4 mt-1 ${t.type === 'in' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {t.type === 'in' ? <ArrowDownCircle className="w-5 h-5" /> : <ArrowUpCircle className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800">{t.category}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded border ${t.paymentMethod === 'bank' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                    {t.paymentMethod === 'bank' ? 'Bank' : 'Tunai'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t.description || 'Tidak ada keterangan'}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(t.date)}</p>
              </div>
            </div>
            <div className={`font-bold whitespace-nowrap ${t.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
              {t.type === 'in' ? '+' : '-'}{formatCurrency(t.amount)}
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Belum ada data transaksi.
          </div>
        )}
      </div>
    </div>
  </div>
);

const TransactionForm = ({ type, incomeCategories, expenseCategories, onSave, onCancel, initialData }: any) => {
  const isIncome = type === 'in';
  const categories = isIncome ? incomeCategories : expenseCategories;
  const colorTheme = isIncome ? 'emerald' : 'red';
  const isEditMode = !!initialData;

  const [amount, setAmount] = useState(initialData ? formatCurrency(initialData.amount).replace('Rp', '').replace(/\./g, '').trim() : '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(initialData?.description || '');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>(initialData?.paymentMethod || 'cash');
  const [isSaving, setIsSaving] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value) {
      setAmount(formatCurrency(value).replace('Rp', '').trim());
    } else {
      setAmount('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !date) return;
    setIsSaving(true);
    
    await onSave({
      type,
      amount: parseInt(amount.replace(/[^0-9]/g, ''), 10),
      category,
      date,
      description,
      paymentMethod
    });
    
    setIsSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className={`bg-${colorTheme}-600 p-6 text-white flex justify-between items-center`}>
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            {isIncome ? <ArrowDownCircle className="w-6 h-6 mr-2" /> : <ArrowUpCircle className="w-6 h-6 mr-2" />}
            {isEditMode ? 'Edit Transaksi' : `Form ${isIncome ? 'Pemasukan' : 'Pengeluaran'} Baru`}
          </h2>
          {!isEditMode && (
            <p className={`text-${colorTheme}-100 mt-1 text-sm`}>
              Catat dana yang {isIncome ? 'masuk ke' : 'keluar dari'} kas masjid.
            </p>
          )}
        </div>
        {isEditMode && (
          <button onClick={onCancel} className={`text-${colorTheme}-100 hover:text-white`}>
            <X className="w-6 h-6" />
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Banknote className="w-4 h-4 mr-2" /> Nominal (Rp) <span className="text-red-500 ml-1">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Rp</span>
              <input
                type="text"
                required
                value={amount}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-lg font-semibold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Wallet className="w-4 h-4 mr-2" /> Metode Penyimpanan <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              required
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'bank')}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white text-gray-800"
            >
              <option value="cash">Tunai (Kas/Brankas)</option>
              <option value="bank">Rekening Bank</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Tag className="w-4 h-4 mr-2" /> Kategori <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
            >
              <option value="" disabled>-- Pilih Kategori --</option>
              {categories.map((cat: string, idx: number) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4 mr-2" /> Tanggal <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <AlignLeft className="w-4 h-4 mr-2" /> Keterangan (Opsional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contoh: Infak dari Bapak H. Ahmad, atau Pembayaran listrik bulan Mei"
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
          ></textarea>
        </div>

        <div className="pt-4 flex gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`flex-1 py-3 px-4 text-white font-medium rounded-lg shadow-sm transition-colors ${
              isIncome ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
            } disabled:opacity-50`}
          >
            {isSaving ? 'Menyimpan...' : (isEditMode ? 'Update Transaksi' : 'Simpan Transaksi')}
          </button>
        </div>
      </form>
    </div>
  );
};

const HistoryView = ({ transactions, currentUser, onUpdateTransaction, onDeleteTransaction, incomeCategories, expenseCategories }: any) => {
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterYear, setFilterYear] = useState('all');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map((t: Transaction) => t.date.substring(0, 4)));
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort((a: any, b: any) => b - a);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t: Transaction) => {
      const tYear = t.date.substring(0, 4);
      const tMonth = t.date.substring(5, 7);
      const matchYear = filterYear === 'all' || tYear === filterYear;
      const matchMonth = filterMonth === 'all' || tMonth === filterMonth;
      return matchYear && matchMonth;
    });
  }, [transactions, filterMonth, filterYear]);

  const { filteredIncome, filteredExpense, filteredCashBalance, filteredBankBalance } = useMemo(() => {
    return filteredTransactions.reduce(
      (acc: any, curr: Transaction) => {
        const method = curr.paymentMethod || 'cash';
        if (curr.type === 'in') {
          acc.filteredIncome += curr.amount;
          if (method === 'cash') acc.filteredCashBalance += curr.amount;
          if (method === 'bank') acc.filteredBankBalance += curr.amount;
        } else {
          acc.filteredExpense += curr.amount;
          if (method === 'cash') acc.filteredCashBalance -= curr.amount;
          if (method === 'bank') acc.filteredBankBalance -= curr.amount;
        }
        return acc;
      },
      { filteredIncome: 0, filteredExpense: 0, filteredCashBalance: 0, filteredBankBalance: 0 }
    );
  }, [filteredTransactions]);

  const getMonthName = (monthStr: string) => {
    if (monthStr === 'all') return 'Semua Bulan';
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return months[parseInt(monthStr, 10) - 1];
  };

  return (
    <div className="space-y-6 relative">
      {/* Modal Edit Transaksi */}
      {editingTx && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">
            <TransactionForm
              type={editingTx.type}
              incomeCategories={incomeCategories}
              expenseCategories={expenseCategories}
              initialData={editingTx}
              onSave={(updatedData: any) => {
                onUpdateTransaction(editingTx.id, updatedData);
                setEditingTx(null);
              }}
              onCancel={() => setEditingTx(null)}
            />
          </div>
        </div>
      )}

      <div className="hidden print:block text-center mb-8 border-b-2 border-gray-800 pb-4 mt-8">
        <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-wider">Laporan Keuangan Masjid Darussalam</h1>
        <p className="text-gray-700">Taman Margasatwa Ragunan</p>
        <p className="text-gray-700 mt-2 font-medium">
          Periode Laporan: {getMonthName(filterMonth)} {filterYear !== 'all' ? filterYear : ''}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <h2 className="text-2xl font-bold text-gray-800">Buku Kas (Riwayat Transaksi)</h2>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => window.print()}
            className="flex items-center bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 mr-2" /> Cetak / PDF
          </button>
          <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 p-2 gap-2 flex-1 sm:flex-initial">
            <div className="flex items-center text-sm text-gray-500 px-2">
              <Filter className="w-4 h-4 mr-1" /> Filter:
            </div>
            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-md focus:ring-emerald-500 focus:border-emerald-500 p-2 outline-none"
            >
              <option value="all">Semua Bulan</option>
              <option value="01">Januari</option>
              <option value="02">Februari</option>
              <option value="03">Maret</option>
              <option value="04">April</option>
              <option value="05">Mei</option>
              <option value="06">Juni</option>
              <option value="07">Juli</option>
              <option value="08">Agustus</option>
              <option value="09">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-md focus:ring-emerald-500 focus:border-emerald-500 p-2 outline-none"
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map((year: any) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print:shadow-none print:border-gray-300 print:rounded-none">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse print:border print:border-gray-300">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200 print:bg-gray-100 print:text-black">
                <th className="p-4 font-semibold print:border print:border-gray-300">Tanggal</th>
                <th className="p-4 font-semibold print:border print:border-gray-300">Kategori & Keterangan</th>
                <th className="p-4 font-semibold print:border print:border-gray-300">Metode</th>
                <th className="p-4 font-semibold text-right print:border print:border-gray-300">Pemasukan</th>
                <th className="p-4 font-semibold text-right print:border print:border-gray-300">Pengeluaran</th>
                {currentUser?.role === 'admin' && <th className="p-4 font-semibold text-center print:hidden">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTransactions.length > 0 ? filteredTransactions.map((t: Transaction) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors text-sm sm:text-base print:text-black">
                  <td className="p-4 text-gray-600 whitespace-nowrap print:border print:border-gray-300 print:text-black">{formatDate(t.date)}</td>
                  <td className="p-4 print:border print:border-gray-300">
                    <p className="font-semibold text-gray-800 print:text-black">{t.category}</p>
                    <p className="text-xs text-gray-500 mt-1 print:text-gray-700">{t.description || '-'}</p>
                  </td>
                  <td className="p-4 print:border print:border-gray-300">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${t.paymentMethod === 'bank' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                      {t.paymentMethod === 'bank' ? 'Bank' : 'Tunai'}
                    </span>
                  </td>
                  <td className="p-4 text-right font-medium text-green-600 whitespace-nowrap print:border print:border-gray-300 print:text-black">
                    {t.type === 'in' ? formatCurrency(t.amount) : '-'}
                  </td>
                  <td className="p-4 text-right font-medium text-red-600 whitespace-nowrap print:border print:border-gray-300 print:text-black">
                    {t.type === 'out' ? formatCurrency(t.amount) : '-'}
                  </td>
                  {currentUser?.role === 'admin' && (
                    <td className="p-4 text-center print:hidden">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => setEditingTx(t)}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                          title="Edit Transaksi"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if(window.confirm('Yakin ingin menghapus transaksi ini? Data tidak bisa dikembalikan.')) {
                              onDeleteTransaction(t.id);
                            }
                          }}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              )) : (
                <tr>
                  <td colSpan={currentUser?.role === 'admin' ? 6 : 5} className="p-8 text-center text-gray-500 print:border print:border-gray-300">
                    Tidak ada transaksi yang cocok dengan filter yang dipilih.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredTransactions.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-200 print:bg-gray-100">
                <tr>
                  <td colSpan={3} className="p-4 font-bold text-right text-gray-800 print:border print:border-gray-300">TOTAL PERIODE INI:</td>
                  <td className="p-4 text-right font-bold text-green-700 print:border print:border-gray-300 print:text-black">{formatCurrency(filteredIncome)}</td>
                  <td className="p-4 text-right font-bold text-red-700 print:border print:border-gray-300 print:text-black">{formatCurrency(filteredExpense)}</td>
                  {currentUser?.role === 'admin' && <td className="print:hidden"></td>}
                </tr>
                <tr>
                  <td colSpan={3} className="p-4 font-bold text-right text-gray-800 print:border print:border-gray-300">SALDO PERIODE INI:</td>
                  <td colSpan={2} className="p-4 text-center print:border print:border-gray-300 print:text-black">
                    <div className="font-bold text-lg text-emerald-700">{formatCurrency(filteredIncome - filteredExpense)}</div>
                    <div className="flex justify-center gap-4 mt-2 text-xs font-medium text-gray-600 bg-white p-2 rounded-lg border border-gray-200 w-fit mx-auto print:border-none print:bg-transparent">
                      <span className="flex items-center"><Coins className="w-3 h-3 mr-1"/> Tunai: {formatCurrency(filteredCashBalance)}</span>
                      <span className="flex items-center"><Landmark className="w-3 h-3 mr-1"/> Bank: {formatCurrency(filteredBankBalance)}</span>
                    </div>
                  </td>
                  {currentUser?.role === 'admin' && <td className="print:hidden"></td>}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

const SettingsView = ({ incomeCategories, setIncomeCategories, expenseCategories, setExpenseCategories }: any) => {
  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState('');

  const handleAddIncomeCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIncomeCat.trim() && !incomeCategories.includes(newIncomeCat.trim())) {
      setIncomeCategories([...incomeCategories, newIncomeCat.trim()]);
      setNewIncomeCat('');
    }
  };

  const handleAddExpenseCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpenseCat.trim() && !expenseCategories.includes(newExpenseCat.trim())) {
      setExpenseCategories([...expenseCategories, newExpenseCat.trim()]);
      setNewExpenseCat('');
    }
  };

  const removeIncomeCat = (catToRemove: string) => {
    setIncomeCategories(incomeCategories.filter((cat: string) => cat !== catToRemove));
  };

  const removeExpenseCat = (catToRemove: string) => {
    setExpenseCategories(expenseCategories.filter((cat: string) => cat !== catToRemove));
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        <Settings className="w-6 h-6 mr-3 text-gray-600" /> Pengaturan Kategori
      </h2>
      <p className="text-gray-500 text-sm">Tambahkan atau hapus kategori pemasukan dan pengeluaran sesuai kebutuhan masjid.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-emerald-600 p-4 text-white">
            <h3 className="font-bold flex items-center">
              <ArrowDownCircle className="w-5 h-5 mr-2" /> Kategori Pemasukan
            </h3>
          </div>
          <div className="p-4">
            <form onSubmit={handleAddIncomeCat} className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newIncomeCat}
                onChange={(e) => setNewIncomeCat(e.target.value)}
                placeholder="Nama kategori baru..." 
                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button type="submit" className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700">
                <Plus className="w-5 h-5" />
              </button>
            </form>
            <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {incomeCategories.map((cat: string, idx: number) => (
                <li key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100 text-sm">
                  <span className="text-gray-700 font-medium">{cat}</span>
                  <button onClick={() => removeIncomeCat(cat)} className="text-red-400 hover:text-red-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-red-600 p-4 text-white">
            <h3 className="font-bold flex items-center">
              <ArrowUpCircle className="w-5 h-5 mr-2" /> Kategori Pengeluaran
            </h3>
          </div>
          <div className="p-4">
            <form onSubmit={handleAddExpenseCat} className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newExpenseCat}
                onChange={(e) => setNewExpenseCat(e.target.value)}
                placeholder="Nama kategori baru..." 
                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
              />
              <button type="submit" className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700">
                <Plus className="w-5 h-5" />
              </button>
            </form>
            <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {expenseCategories.map((cat: string, idx: number) => (
                <li key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-100 text-sm">
                  <span className="text-gray-700 font-medium">{cat}</span>
                  <button onClick={() => removeExpenseCat(cat)} className="text-red-400 hover:text-red-600 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const AccountSettingsView = ({ currentUser, accounts }: any) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const [newUsername, setNewUsername] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [accountMsg, setAccountMsg] = useState({ type: '', text: '' });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (oldPassword !== currentUser.password) {
      setPasswordMsg({ type: 'error', text: 'Password lama salah!' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password baru minimal 6 karakter!' });
      return;
    }

    try {
      const accRef = doc(db, 'accounts', currentUser.id);
      await updateDoc(accRef, { password: newPassword });
      currentUser.password = newPassword; 
      setPasswordMsg({ type: 'success', text: 'Password berhasil diubah!' });
      setOldPassword('');
      setNewPassword('');
    } catch (error) {
      setPasswordMsg({ type: 'error', text: 'Gagal mengubah password!' });
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accounts.some((acc: Account) => acc.username === newUsername)) {
      setAccountMsg({ type: 'error', text: 'Username sudah digunakan!' });
      return;
    }
    if (newAccountPassword.length < 6) {
      setAccountMsg({ type: 'error', text: 'Password minimal 6 karakter!' });
      return;
    }

    try {
      await addDoc(collection(db, 'accounts'), { 
        username: newUsername, 
        password: newAccountPassword, 
        role: newRole 
      });
      setAccountMsg({ type: 'success', text: 'Akun baru berhasil ditambahkan!' });
      setNewUsername('');
      setNewAccountPassword('');
      setNewRole('user');
    } catch (error) {
      setAccountMsg({ type: 'error', text: 'Gagal menambahkan akun!' });
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (accounts.length <= 1) return;
    try {
      await deleteDoc(doc(db, 'accounts', id));
    } catch (error) {
      alert("Gagal menghapus akun.");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        <Users className="w-6 h-6 mr-3 text-gray-600" /> Pengaturan Akun
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-emerald-600 p-4 text-white">
            <h3 className="font-bold flex items-center">
              <Key className="w-5 h-5 mr-2" /> Ubah Password
            </h3>
          </div>
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            {passwordMsg.text && (
              <div className={`p-3 rounded-lg text-sm ${passwordMsg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                {passwordMsg.text}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Password Lama</label>
              <input 
                type="password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Password Baru</label>
              <input 
                type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white font-medium p-2 rounded-lg hover:bg-emerald-700 transition-colors">
              Simpan Password
            </button>
          </form>
        </div>

        {currentUser?.role === 'admin' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-blue-600 p-4 text-white">
              <h3 className="font-bold flex items-center">
                <UserIcon className="w-5 h-5 mr-2" /> Tambah Akun Baru
              </h3>
            </div>
            <form onSubmit={handleAddAccount} className="p-6 space-y-4">
              {accountMsg.text && (
                <div className={`p-3 rounded-lg text-sm ${accountMsg.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                  {accountMsg.text}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Username</label>
                <input 
                  type="text" required value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <input 
                    type="password" required value={newAccountPassword} onChange={(e) => setNewAccountPassword(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Hak Akses</label>
                  <select 
                    value={newRole} onChange={(e: any) => setNewRole(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="user">User (Hanya Lihat)</option>
                    <option value="admin">Admin (Input/Edit)</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-medium p-2 rounded-lg hover:bg-blue-700 transition-colors">
                Buat Akun
              </button>
            </form>
          </div>
        )}
      </div>

      {currentUser?.role === 'admin' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">Daftar Pengguna Sistem</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                  <th className="p-4 font-semibold">Username</th>
                  <th className="p-4 font-semibold">Hak Akses</th>
                  <th className="p-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {accounts.map((acc: Account) => (
                  <tr key={acc.id} className="hover:bg-gray-50 text-sm">
                    <td className="p-4 text-gray-800 font-medium">{acc.username}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${acc.role === 'admin' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {acc.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {acc.id !== currentUser.id && (
                        <button 
                          onClick={() => handleDeleteAccount(acc.id)}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          Hapus
                        </button>
                      )}
                      {acc.id === currentUser.id && <span className="text-gray-400 italic">Anda saat ini</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};


export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [incomeCategories, setIncomeCategories] = useState(INITIAL_INCOME_CATEGORIES);
  const [expenseCategories, setExpenseCategories] = useState(INITIAL_EXPENSE_CATEGORIES);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Account | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dbError, setDbError] = useState('');
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error: any) {
        if (error.code === 'auth/admin-restricted-operation') {
          setDbError("Satu Langkah Terakhir! Anda belum mengaktifkan fitur 'Anonymous' di Firebase.");
        } else {
          setDbError("Koneksi ditolak oleh Firebase: " + error.message);
        }
        setIsLoadingData(false);
      }
    };

    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isFallbackMode) {
      setTransactions([]);
      setAccounts(INITIAL_ACCOUNTS);
      setDbError('');
      setIsLoadingData(false);
      return;
    }

    if (!authUser) return;

    const timeoutId = setTimeout(() => {
      if(isLoadingData) {
        setDbError("Koneksi lambat/gagal. Pastikan pengaturan Rules sudah benar.");
        setIsLoadingData(false);
      }
    }, 10000);

    const unsubAccounts = onSnapshot(collection(db, 'accounts'), (snapshot) => {
      if (snapshot.empty) {
        addDoc(collection(db, 'accounts'), { username: 'admin', password: 'admin123', role: 'admin' }).catch(() => {});
        addDoc(collection(db, 'accounts'), { username: 'user', password: 'user123', role: 'user' }).catch(() => {});
      } else {
        const accData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Account[];
        setAccounts(accData);
      }
      clearTimeout(timeoutId);
      setDbError('');
      setIsLoadingData(false);
    }, (error) => {
      if (error.code === 'permission-denied') setDbError("permission-denied");
      else setDbError("Error akun: " + error.message);
      setIsLoadingData(false);
    });

    const unsubTx = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      const txData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
      txData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(txData);
      setIsLoadingData(false); 
    }, (error) => {
      if (error.code === 'permission-denied') setDbError("permission-denied");
      else setDbError("Error transaksi: " + error.message);
      setIsLoadingData(false);
    });

    return () => {
      unsubAccounts();
      unsubTx();
      clearTimeout(timeoutId);
    };
  }, [authUser, isFallbackMode]);

  const { totalIncome, totalExpense, balance, cashBalance, bankBalance } = useMemo(() => {
    return transactions.reduce(
      (acc, curr) => {
        const method = curr.paymentMethod || 'cash';
        if (curr.type === 'in') {
          acc.totalIncome += curr.amount;
          acc.balance += curr.amount;
          if (method === 'cash') acc.cashBalance += curr.amount;
          if (method === 'bank') acc.bankBalance += curr.amount;
        } else {
          acc.totalExpense += curr.amount;
          acc.balance -= curr.amount;
          if (method === 'cash') acc.cashBalance -= curr.amount;
          if (method === 'bank') acc.bankBalance -= curr.amount;
        }
        return acc;
      },
      { totalIncome: 0, totalExpense: 0, balance: 0, cashBalance: 0, bankBalance: 0 }
    );
  }, [transactions]);

  const handleAddTransaction = async (newTx: any) => {
    if (isFallbackMode) {
       const newTransaction = { id: Date.now().toString(), ...newTx };
       setTransactions(prev => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
       setCurrentView('dashboard');
       return;
    }

    try {
      await addDoc(collection(db, 'transactions'), newTx);
      setCurrentView('dashboard');
    } catch (e) {
      alert("Gagal menyimpan ke database!");
    }
  };

  const handleUpdateTransaction = async (id: string, updatedTx: any) => {
    if (isFallbackMode) {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updatedTx } : t).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      return;
    }

    try {
      const { id: txId, ...dataToUpdate } = updatedTx;
      await updateDoc(doc(db, 'transactions', id), dataToUpdate);
    } catch (e) {
      alert("Gagal memperbarui transaksi di database!");
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (isFallbackMode) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      return;
    }

    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (e) {
      alert("Gagal menghapus transaksi dari database!");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  if (dbError) {
    if (dbError === 'permission-denied') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
           <div className="bg-white p-8 rounded-xl max-w-2xl border border-red-200 shadow-xl w-full">
             <div className="flex items-center text-red-600 mb-6 border-b border-red-100 pb-4">
               <ShieldAlert className="w-10 h-10 mr-3" />
               <div>
                 <h2 className="font-bold text-2xl text-gray-800">Akses Ditolak Firebase</h2>
                 <p className="text-sm font-medium">Missing or insufficient permissions.</p>
               </div>
             </div>
             
             <div className="text-left text-gray-700 space-y-4 mb-8">
               <p>Aplikasi Anda diblokir oleh sistem keamanan Firebase. Untuk sementara waktu agar aplikasi bisa berjalan, gunakan pengaturan <b>Mode Uji Coba</b>.</p>
               
               <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                 <h3 className="font-bold text-blue-800 mb-2">Cara Mengatasinya:</h3>
                 <ol className="list-decimal pl-5 space-y-2 text-blue-900 text-sm">
                   <li>Buka <b>Firebase Console</b>.</li>
                   <li>Pilih <b>Firestore Database</b> &gt; tab <b>Rules</b>.</li>
                   <li>Tempelkan kode ini:</li>
                 </ol>
                 
                 <div className="bg-gray-900 text-green-400 p-4 rounded-md mt-4 font-mono text-xs overflow-x-auto">
                   rules_version = '2';<br/>
                   service cloud.firestore {'{'}<br/>
                   &nbsp;&nbsp;match /databases/{'{database}'}/documents {'{'}<br/>
                   &nbsp;&nbsp;&nbsp;&nbsp;match /{'{document=**}'} {'{'}<br/>
                   &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-white font-bold">allow read, write: if true;</span><br/>
                   &nbsp;&nbsp;&nbsp;&nbsp;{'}'}<br/>
                   &nbsp;&nbsp;{'}'}<br/>
                   {'}'}
                 </div>
                 <ol className="list-decimal pl-5 space-y-2 text-blue-900 text-sm mt-4" start={5}>
                   <li>Klik <b>Publish</b>.</li>
                 </ol>
               </div>
             </div>
             
             <div className="flex flex-col sm:flex-row gap-3">
               <button onClick={() => window.location.reload()} className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-sm">Muat Ulang</button>
               <button onClick={() => setIsFallbackMode(true)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg border border-gray-300 flex items-center justify-center"><Database className="w-4 h-4 mr-2" /> Mode Offline</button>
             </div>
           </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
         <div className="bg-white p-8 rounded-xl max-w-lg border border-red-200 shadow-lg text-center">
           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <Settings className="w-8 h-8 text-red-600" />
           </div>
           <h2 className="font-bold text-xl mb-2 text-gray-800">Error Firebase</h2>
           <p className="text-red-600 font-medium mb-6">{dbError}</p>
           <button onClick={() => window.location.reload()} className="w-full px-4 py-3 bg-emerald-600 text-white font-bold rounded-lg">Muat Ulang</button>
         </div>
      </div>
    );
  }

  if (!currentUser) {
    if (isLoadingData) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-emerald-700">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mb-4"></div>
          <p className="font-bold">Menghubungkan ke Firestore Masjid...</p>
        </div>
      );
    }
    return <LoginView onLogin={(user: Account) => setCurrentUser(user)} accounts={accounts} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans print:bg-white">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} handleLogout={handleLogout} currentUser={currentUser} />
      <div className="flex-1 flex flex-col min-h-screen">
        <MobileNav isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <MobileMenu isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} setCurrentView={setCurrentView} handleLogout={handleLogout} currentUser={currentUser} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto print:p-0 print:m-0 print:overflow-visible">
          {currentView === 'dashboard' && <DashboardView balance={balance} cashBalance={cashBalance} bankBalance={bankBalance} totalIncome={totalIncome} totalExpense={totalExpense} setCurrentView={setCurrentView} transactions={transactions} currentUser={currentUser} />}
          {currentView === 'add-income' && currentUser?.role === 'admin' && <TransactionForm type="in" incomeCategories={incomeCategories} expenseCategories={expenseCategories} onSave={handleAddTransaction} onCancel={() => setCurrentView('dashboard')} />}
          {currentView === 'add-expense' && currentUser?.role === 'admin' && <TransactionForm type="out" incomeCategories={incomeCategories} expenseCategories={expenseCategories} onSave={handleAddTransaction} onCancel={() => setCurrentView('dashboard')} />}
          {currentView === 'history' && <HistoryView transactions={transactions} currentUser={currentUser} onUpdateTransaction={handleUpdateTransaction} onDeleteTransaction={handleDeleteTransaction} incomeCategories={incomeCategories} expenseCategories={expenseCategories} />}
          {currentView === 'settings' && currentUser?.role === 'admin' && <SettingsView incomeCategories={incomeCategories} setIncomeCategories={setIncomeCategories} expenseCategories={expenseCategories} setExpenseCategories={setExpenseCategories} />}
          {currentView === 'account' && <AccountSettingsView currentUser={currentUser} accounts={accounts} />}
        </main>
      </div>
    </div>
  );
}
