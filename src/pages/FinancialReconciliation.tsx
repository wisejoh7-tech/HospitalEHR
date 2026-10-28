import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  BankAccount,
  BankStatementImport,
  BankTransaction,
  PaymentRecord,
  RefundRecord,
  InsuranceReimbursement,
  ProviderSettlement,
  DailyReconciliationReport
} from '../types';
import {
  Building2,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
  Plus,
  DollarSign,
  CreditCard,
  ShieldCheck,
  Filter,
  Search,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

export default function FinancialReconciliation() {
  const { profile, isAdmin, isFinance, isFinanceAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'bank_accounts' | 'transactions' | 'payments' | 'refunds' | 'insurance' | 'settlements'>('overview');

  // State data
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [statements, setStatements] = useState<BankStatementImport[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [claims, setClaims] = useState<InsuranceReimbursement[]>([]);
  const [settlements, setSettlements] = useState<ProviderSettlement[]>([]);
  const [dailyReports, setDailyReports] = useState<DailyReconciliationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [txFilter, setTxFilter] = useState<'all' | 'unmatched' | 'matched' | 'discrepancy'>('unmatched');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Form states
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showImportStatementModal, setShowImportStatementModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState<BankTransaction | null>(null);

  // New Bank Account Form
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');

  // Import Statement Form
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [statementText, setStatementText] = useState('');

  // New Payment Receipt Form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'pos' | 'card' | 'cash' | 'insurance'>('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentBillId, setPaymentBillId] = useState('');
  const [paymentPatientId, setPaymentPatientId] = useState('');

  // New Refund Form
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'bank_transfer' | 'card' | 'cash'>('bank_transfer');
  const [refundReference, setRefundReference] = useState('');

  // New Insurance Claim Form
  const [claimNumber, setClaimNumber] = useState('');
  const [providerName, setProviderName] = useState('');
  const [billedAmount, setBilledAmount] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');

  // New Provider Settlement Form
  const [settlementBatchId, setSettlementBatchId] = useState('');
  const [provider, setProvider] = useState('Paystack');
  const [grossAmount, setGrossAmount] = useState('');
  const [feeAmount, setFeeAmount] = useState('');

  // Matching Selection
  const [matchType, setMatchType] = useState<'payment' | 'refund' | 'insurance' | 'settlement'>('payment');
  const [selectedTargetId, setSelectedTargetId] = useState('');

  // Reveal Account Numbers toggle
  const [revealAccounts, setRevealAccounts] = useState<Record<string, boolean>>({});

  const headers = {
    'Content-Type': 'application/json',
    'x-user-id': profile?.uid || 'user',
    'x-user-name': profile?.name || 'Staff',
    'x-user-role': profile?.role || ''
  };

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [accRes, stmtRes, txRes, payRes, rfdRes, insRes, setRes, rptRes] = await Promise.all([
        fetch('/api/reconciliation/bank-accounts', { headers }),
        fetch('/api/reconciliation/statements', { headers }),
        fetch('/api/reconciliation/transactions', { headers }),
        fetch('/api/reconciliation/payments', { headers }),
        fetch('/api/reconciliation/refunds', { headers }),
        fetch('/api/reconciliation/insurance', { headers }),
        fetch('/api/reconciliation/settlements', { headers }),
        fetch('/api/reconciliation/reports/daily', { headers })
      ]);

      if (!accRes.ok) throw new Error('Unauthorized or failed to fetch bank accounts');

      const [accData, stmtData, txData, payData, rfdData, insData, setData, rptData] = await Promise.all([
        accRes.json(),
        stmtRes.json(),
        txRes.json(),
        payRes.json(),
        rfdRes.json(),
        insRes.json(),
        setRes.json(),
        rptRes.json()
      ]);

      setBankAccounts(accData);
      setStatements(stmtData);
      setTransactions(txData);
      setPayments(payData);
      setRefunds(rfdData);
      setClaims(insData);
      setSettlements(setData);
      setDailyReports(rptData);
      if (accData.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load financial reconciliation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reconciliation/bank-accounts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ accountName, accountNumber, bankName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add bank account');

      setSuccessMsg('Bank account registered successfully');
      setShowAddAccountModal(false);
      setAccountName('');
      setAccountNumber('');
      setBankName('');
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleImportStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let parsedRecords: any[] = [];
      try {
        parsedRecords = JSON.parse(statementText);
      } catch {
        // Fallback: parse CSV line by line
        const lines = statementText.trim().split('\n');
        parsedRecords = lines.map((line, idx) => {
          if (idx === 0 && line.toLowerCase().includes('date')) return null; // header
          const cols = line.split(',').map(c => c.trim().replace(/^"/, '').replace(/"$/, ''));
          if (cols.length < 2) return null;
          return {
            transactionDate: cols[0],
            description: cols[1],
            amount: cols[2],
            reference: cols[3] || cols[1]
          };
        }).filter(Boolean);
      }

      if (parsedRecords.length === 0) {
        throw new Error('No valid records found in JSON/CSV input. Expected columns: Date, Description, Amount, Reference');
      }

      const res = await fetch('/api/reconciliation/statements/import', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bankAccountId: selectedAccountId,
          filename: `Import_${new Date().toISOString().slice(0,10)}.csv`,
          records: parsedRecords
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to import bank statement');

      setSuccessMsg(`Bank statement imported: ${data.insertedCount} new transactions added, ${data.duplicateCount} duplicates prevented.`);
      setShowImportStatementModal(false);
      setStatementText('');
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAutoReconcile = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reconciliation/auto-match', {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Automated reconciliation failed');

      setSuccessMsg(`Automated reconciliation completed: ${data.autoMatchCount} transactions matched automatically.`);
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleManualMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMatchModal || !selectedTargetId) return;
    try {
      const res = await fetch('/api/reconciliation/match', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          transactionId: showMatchModal.id,
          matchType,
          targetId: selectedTargetId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Matching failed');

      setSuccessMsg(`Transaction reconciled successfully with status: ${data.reconciliationStatus}`);
      setShowMatchModal(null);
      setSelectedTargetId('');
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reconciliation/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          billId: paymentBillId || undefined,
          patientId: paymentPatientId || undefined,
          amount: paymentAmount,
          paymentMethod,
          paymentReference: paymentReference || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue receipt');

      setSuccessMsg(`Receipt ${data.receiptNumber} issued successfully.`);
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentBillId('');
      setPaymentPatientId('');
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVerifyPayment = async (id: string) => {
    try {
      const res = await fetch(`/api/reconciliation/payments/${id}/verify`, {
        method: 'POST',
        headers
      });
      if (!res.ok) throw new Error('Verification failed');
      setSuccessMsg('Payment verified.');
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reconciliation/refunds', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: refundAmount,
          reason: refundReason,
          refundMethod,
          refundReference: refundReference || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit refund');

      setSuccessMsg(`Refund request ${data.refundNumber} created.`);
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
      setRefundReference('');
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApproveRefund = async (id: string) => {
    try {
      const res = await fetch(`/api/reconciliation/refunds/${id}/approve`, {
        method: 'POST',
        headers
      });
      if (!res.ok) throw new Error('Failed to approve refund');
      setSuccessMsg('Refund approved.');
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateInsuranceClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reconciliation/insurance', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          claimNumber,
          providerName,
          billedAmount,
          approvedAmount: approvedAmount || billedAmount
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit claim');

      setSuccessMsg(`Insurance claim ${data.claimNumber} registered.`);
      setShowInsuranceModal(false);
      setClaimNumber('');
      setProviderName('');
      setBilledAmount('');
      setApprovedAmount('');
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reconciliation/settlements', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          settlementBatchId,
          provider,
          grossAmount,
          feeAmount: feeAmount || '0'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to ingest settlement batch');

      setSuccessMsg(`Settlement batch ${data.settlementBatchId} ingested.`);
      setShowSettlementModal(false);
      setSettlementBatchId('');
      setGrossAmount('');
      setFeeAmount('');
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGenerateDailyReport = async () => {
    try {
      const res = await fetch('/api/reconciliation/reports/daily/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ date: new Date().toISOString() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate report');

      setSuccessMsg("Today's financial reconciliation report generated & finalized.");
      fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amt);
  };

  const toggleAccountMask = (accId: string) => {
    setRevealAccounts(prev => ({ ...prev, [accId]: !prev[accId] }));
  };

  const maskedDisplay = (accNo: string, isRevealed: boolean) => {
    if (isRevealed) return accNo;
    if (!accNo || accNo.length <= 4) return '****';
    return '•••• •••• ' + accNo.slice(-4);
  };

  const filteredTx = transactions.filter(t => {
    if (txFilter !== 'all' && t.reconciliationStatus !== txFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        t.description.toLowerCase().includes(term) ||
        (t.reference && t.reference.toLowerCase().includes(term)) ||
        t.amount.toString().includes(term)
      );
    }
    return true;
  });

  if (!isAdmin && !isFinance && !isFinanceAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl shadow-xs border border-red-100 my-8">
        <ShieldAlert size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-black text-gray-900">Access Restricted</h2>
        <p className="text-sm font-semibold text-gray-500 mt-2">
          Financial reconciliation and banking account records are restricted to authorized finance personnel. Clinical records remain segregated.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} className="text-emerald-600" />
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Financial Reconciliation Module</h1>
          </div>
          <p className="text-xs font-semibold text-gray-500 mt-1">
            Bank import integration, receipt verification, refunds, insurance claims & provider settlements with PHI privacy guards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoReconcile}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            <Sparkles size={16} />
            Run Auto-Reconcile
          </button>
          <button
            onClick={handleGenerateDailyReport}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors"
          >
            <FileText size={16} />
            Generate Daily Report
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl font-semibold text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-semibold text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            activeTab === 'overview' ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
          )}
        >
          Daily Summary & Reports
        </button>
        <button
          onClick={() => setActiveTab('bank_accounts')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            activeTab === 'bank_accounts' ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
          )}
        >
          Bank Accounts & Imports ({bankAccounts.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
            activeTab === 'transactions' ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
          )}
        >
          Bank Transactions Workspace
          {transactions.filter(t => t.reconciliationStatus === 'unmatched').length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-white rounded-full text-[10px]">
              {transactions.filter(t => t.reconciliationStatus === 'unmatched').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            activeTab === 'payments' ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
          )}
        >
          Receipts & Billing ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('refunds')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            activeTab === 'refunds' ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
          )}
        >
          Refunds ({refunds.length})
        </button>
        <button
          onClick={() => setActiveTab('insurance')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            activeTab === 'insurance' ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
          )}
        >
          Insurance Reimbursements ({claims.length})
        </button>
        <button
          onClick={() => setActiveTab('settlements')}
          className={cn(
            "px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
            activeTab === 'settlements' ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100"
          )}
        >
          Provider Settlements ({settlements.length})
        </button>
      </div>

      {/* Tab 1: Daily Summary & Reports */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Bank Credits</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {formatCurrency(transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0))}
              </p>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold">Incoming bank deposits</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Verified Patient Receipts</p>
              <p className="text-2xl font-black text-blue-600 mt-1">
                {formatCurrency(payments.filter(p => p.status !== 'rejected').reduce((sum, p) => sum + p.amount, 0))}
              </p>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold">{payments.length} total receipts issued</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Processed Refunds</p>
              <p className="text-2xl font-black text-rose-600 mt-1">
                {formatCurrency(refunds.reduce((sum, r) => sum + r.amount, 0))}
              </p>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold">{refunds.length} refund requests</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Matched vs Unmatched</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-600">
                  {transactions.filter(t => t.reconciliationStatus === 'matched').length}
                </span>
                <span className="text-sm font-bold text-gray-400">/</span>
                <span className="text-2xl font-black text-amber-600">
                  {transactions.filter(t => t.reconciliationStatus === 'unmatched').length}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-semibold">Bank transactions matched ratio</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Daily Financial Reconciliation Reports</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Bank Credits</th>
                    <th className="py-3 px-4">Verified Payments</th>
                    <th className="py-3 px-4">Refunds</th>
                    <th className="py-3 px-4">Matched / Unmatched</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Generated By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                  {dailyReports.map(rpt => (
                    <tr key={rpt.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-bold text-gray-900">{formatDate(rpt.reportDate)}</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">{formatCurrency(rpt.totalBankCredits)}</td>
                      <td className="py-3 px-4 text-blue-600 font-bold">{formatCurrency(rpt.totalVerifiedPayments)}</td>
                      <td className="py-3 px-4 text-rose-600 font-bold">{formatCurrency(rpt.totalProcessedRefunds)}</td>
                      <td className="py-3 px-4 font-bold">
                        <span className="text-emerald-600">{rpt.matchedTransactionsCount} matched</span> / <span className="text-amber-600">{rpt.unmatchedTransactionsCount} pending</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md uppercase font-bold text-[10px]">
                          {rpt.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">{rpt.generatedBy}</td>
                    </tr>
                  ))}
                  {dailyReports.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">
                        No daily reports generated yet. Click "Generate Daily Report" above to finalize today's figures.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bank Accounts & Statement Imports */}
      {activeTab === 'bank_accounts' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-base font-bold text-gray-900">Hospital Bank Accounts</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddAccountModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs"
              >
                <Plus size={14} /> Add Bank Account
              </button>
              <button
                onClick={() => setShowImportStatementModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs"
              >
                <Upload size={14} /> Import Statement
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bankAccounts.map(acc => (
              <div key={acc.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <Building2 size={20} />
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold uppercase">
                      {acc.status}
                    </span>
                  </div>
                  <h4 className="font-black text-gray-900 text-base mt-3">{acc.bankName}</h4>
                  <p className="text-xs font-semibold text-gray-500">{acc.accountName}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Account Number</p>
                    <p className="font-mono text-sm font-bold text-gray-900">
                      {maskedDisplay(acc.accountNumber, !!revealAccounts[acc.id])}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleAccountMask(acc.id)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Toggle Account Privacy"
                  >
                    {revealAccounts[acc.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}
            {bankAccounts.length === 0 && (
              <div className="col-span-3 p-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                No bank accounts registered. Click "Add Bank Account" to begin.
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-base font-bold text-gray-900 mb-4">Import History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Filename</th>
                    <th className="py-3 px-4">Bank Account</th>
                    <th className="py-3 px-4">Records Imported</th>
                    <th className="py-3 px-4">Imported By</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                  {statements.map(s => (
                    <tr key={s.id}>
                      <td className="py-3 px-4 font-bold text-gray-900">{s.filename}</td>
                      <td className="py-3 px-4">{s.bankAccount?.bankName}</td>
                      <td className="py-3 px-4 text-blue-600 font-bold">{s.totalRecords} records</td>
                      <td className="py-3 px-4">{s.importedByName}</td>
                      <td className="py-3 px-4">{formatDate(s.createdAt)}</td>
                    </tr>
                  ))}
                  {statements.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">No bank statements imported yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Bank Transactions Workspace */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTxFilter('unmatched')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  txFilter === 'unmatched' ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"
                )}
              >
                Unmatched ({transactions.filter(t => t.reconciliationStatus === 'unmatched').length})
              </button>
              <button
                onClick={() => setTxFilter('matched')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  txFilter === 'matched' ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                )}
              >
                Matched ({transactions.filter(t => t.reconciliationStatus === 'matched').length})
              </button>
              <button
                onClick={() => setTxFilter('all')}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  txFilter === 'all' ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                )}
              >
                All Transactions ({transactions.length})
              </button>
            </div>

            <div className="relative max-w-xs w-full">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search description, ref, amount..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-gray-50/50">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Narration / Reference</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                  {filteredTx.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50/60">
                      <td className="py-3.5 px-4 font-bold text-gray-900">{formatDate(tx.transactionDate)}</td>
                      <td className="py-3.5 px-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase inline-flex items-center gap-1",
                          tx.type === 'credit' ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                        )}>
                          {tx.type === 'credit' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                          {tx.type}
                        </span>
                      </td>
                      <td className={cn("py-3.5 px-4 font-black text-sm", tx.type === 'credit' ? "text-emerald-600" : "text-rose-600")}>
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="font-bold text-gray-900 truncate">{tx.description}</p>
                        {tx.reference && <p className="text-[10px] text-gray-400 font-mono">Ref: {tx.reference}</p>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                          tx.reconciliationStatus === 'matched' && "bg-emerald-100 text-emerald-800",
                          tx.reconciliationStatus === 'unmatched' && "bg-amber-100 text-amber-800",
                          tx.reconciliationStatus === 'discrepancy' && "bg-rose-100 text-rose-800"
                        )}>
                          {tx.reconciliationStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {tx.reconciliationStatus === 'unmatched' ? (
                          <button
                            onClick={() => {
                              setShowMatchModal(tx);
                              setSelectedTargetId('');
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs"
                          >
                            Match Line
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[10px] font-bold">Reconciled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredTx.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                        No transactions match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Receipts & Payments */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-base font-bold text-gray-900">Patient Billing Payment Records</h3>
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs"
            >
              <Plus size={14} /> Issue New Receipt
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="py-3.5 px-4">Receipt #</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Reference</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Issued By</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 font-bold text-gray-900">{p.receiptNumber}</td>
                    <td className="py-3 px-4 font-black text-emerald-600">{formatCurrency(p.amount)}</td>
                    <td className="py-3 px-4 uppercase font-bold text-gray-500">{p.paymentMethod}</td>
                    <td className="py-3 px-4 font-mono text-gray-500">{p.paymentReference || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase",
                        p.status === 'verified' && "bg-blue-100 text-blue-800",
                        p.status === 'reconciled' && "bg-emerald-100 text-emerald-800",
                        p.status === 'pending_verification' && "bg-amber-100 text-amber-800"
                      )}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{p.receivedBy}</td>
                    <td className="py-3 px-4 text-right">
                      {p.status === 'pending_verification' && (
                        <button
                          onClick={() => handleVerifyPayment(p.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold"
                        >
                          Verify Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">No payment receipts registered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Refunds */}
      {activeTab === 'refunds' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-base font-bold text-gray-900">Refund Processing</h3>
            <button
              onClick={() => setShowRefundModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs"
            >
              <Plus size={14} /> Request Refund
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="py-3.5 px-4">Refund #</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Reason</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                {refunds.map(r => (
                  <tr key={r.id}>
                    <td className="py-3 px-4 font-bold text-gray-900">{r.refundNumber}</td>
                    <td className="py-3 px-4 font-black text-rose-600">{formatCurrency(r.amount)}</td>
                    <td className="py-3 px-4">{r.reason}</td>
                    <td className="py-3 px-4 uppercase font-bold text-gray-500">{r.refundMethod}</td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase",
                        r.status === 'approved' && "bg-blue-100 text-blue-800",
                        r.status === 'reconciled' && "bg-emerald-100 text-emerald-800",
                        r.status === 'pending_approval' && "bg-amber-100 text-amber-800"
                      )}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'pending_approval' && (isAdmin || isFinanceAdmin) && (
                        <button
                          onClick={() => handleApproveRefund(r.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold"
                        >
                          Approve Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {refunds.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">No refunds recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 6: Insurance Reimbursements */}
      {activeTab === 'insurance' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-base font-bold text-gray-900">Insurance Reimbursement Claims</h3>
            <button
              onClick={() => setShowInsuranceModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs"
            >
              <Plus size={14} /> Register Claim
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="py-3.5 px-4">Claim #</th>
                  <th className="py-3.5 px-4">HMO / Provider</th>
                  <th className="py-3.5 px-4">Billed Amount</th>
                  <th className="py-3.5 px-4">Approved Amount</th>
                  <th className="py-3.5 px-4">Paid Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                {claims.map(c => (
                  <tr key={c.id}>
                    <td className="py-3 px-4 font-bold text-gray-900">{c.claimNumber}</td>
                    <td className="py-3 px-4 font-bold">{c.providerName}</td>
                    <td className="py-3 px-4 font-bold text-gray-600">{formatCurrency(c.billedAmount)}</td>
                    <td className="py-3 px-4 font-bold text-blue-600">{formatCurrency(c.approvedAmount)}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{formatCurrency(c.paidAmount)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 bg-gray-100 text-gray-800 rounded-md text-[10px] font-bold uppercase">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {claims.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">No insurance claims registered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 7: Provider Settlements */}
      {activeTab === 'settlements' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <h3 className="text-base font-bold text-gray-900">POS / Payment Gateway Provider Settlements</h3>
            <button
              onClick={() => setShowSettlementModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs"
            >
              <Plus size={14} /> Ingest Settlement Batch
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="py-3.5 px-4">Batch ID</th>
                  <th className="py-3.5 px-4">Provider</th>
                  <th className="py-3.5 px-4">Gross Amount</th>
                  <th className="py-3.5 px-4">Gateway Fee</th>
                  <th className="py-3.5 px-4">Net Payout</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-700">
                {settlements.map(s => (
                  <tr key={s.id}>
                    <td className="py-3 px-4 font-bold text-gray-900">{s.settlementBatchId}</td>
                    <td className="py-3 px-4 font-bold">{s.provider}</td>
                    <td className="py-3 px-4 text-gray-600 font-bold">{formatCurrency(s.grossAmount)}</td>
                    <td className="py-3 px-4 text-rose-600 font-bold">{formatCurrency(s.feeAmount)}</td>
                    <td className="py-3 px-4 text-emerald-600 font-bold">{formatCurrency(s.netAmount)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 bg-gray-100 text-gray-800 rounded-md text-[10px] font-bold uppercase">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {settlements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">No payment provider settlements ingested.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Add Bank Account */}
      {showAddAccountModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Add Hospital Bank Account</h3>
            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600">Bank Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zenith Bank / Access Bank"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Account Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIVO Teaching Hospital Collections"
                  value={accountName}
                  onChange={e => setAccountName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Account Number</label>
                <input
                  type="text"
                  required
                  placeholder="10 digit NUBAN number"
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAccountModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Import Statement */}
      {showImportStatementModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Import Bank Statement</h3>
            <form onSubmit={handleImportStatement} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600">Select Bank Account</label>
                <select
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none"
                >
                  {bankAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.bankName} - {a.accountName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Statement CSV or JSON Records</label>
                <textarea
                  required
                  rows={6}
                  placeholder={`Paste CSV (Date, Description, Amount, Reference) or JSON array\nExample CSV:\n2025-05-10, Transfer from Patient John, 15000, TXN123456`}
                  value={statementText}
                  onChange={e => setStatementText(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-[10px] text-gray-400 font-semibold">
                Note: Patient Health Information (PHI) in narrations will be automatically redacted before saving.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowImportStatementModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs"
                >
                  Import Records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Manual Match */}
      {showMatchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Reconcile Bank Transaction Line</h3>
            <div className="p-3 bg-gray-50 rounded-xl text-xs font-semibold space-y-1">
              <p><span className="text-gray-400">Date:</span> {formatDate(showMatchModal.transactionDate)}</p>
              <p><span className="text-gray-400">Amount:</span> <strong className="text-emerald-600">{formatCurrency(showMatchModal.amount)}</strong> ({showMatchModal.type})</p>
              <p><span className="text-gray-400">Narration:</span> {showMatchModal.description}</p>
            </div>

            <form onSubmit={handleManualMatch} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600">Reconcile Against</label>
                <select
                  value={matchType}
                  onChange={e => {
                    setMatchType(e.target.value as any);
                    setSelectedTargetId('');
                  }}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none"
                >
                  <option value="payment">Patient Payment Receipt</option>
                  <option value="refund">Hospital Refund Record</option>
                  <option value="insurance">Insurance Reimbursement Claim</option>
                  <option value="settlement">Provider POS / Gateway Settlement Batch</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600">Select Target Record</label>
                <select
                  required
                  value={selectedTargetId}
                  onChange={e => setSelectedTargetId(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none"
                >
                  <option value="">-- Choose matching record --</option>
                  {matchType === 'payment' && payments.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.receiptNumber} - {formatCurrency(p.amount)} ({p.paymentMethod}) - Ref: {p.paymentReference || 'N/A'}
                    </option>
                  ))}
                  {matchType === 'refund' && refunds.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.refundNumber} - {formatCurrency(r.amount)} ({r.reason})
                    </option>
                  ))}
                  {matchType === 'insurance' && claims.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.claimNumber} - {c.providerName} - Approved: {formatCurrency(c.approvedAmount)}
                    </option>
                  ))}
                  {matchType === 'settlement' && settlements.map(s => (
                    <option key={s.id} value={s.id}>
                      Batch: {s.settlementBatchId} - {s.provider} - Net: {formatCurrency(s.netAmount)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMatchModal(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs"
                >
                  Confirm Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue Payment Receipt */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Issue Payment Receipt</h3>
            <form onSubmit={handleCreatePayment} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600">Amount (NGN)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="pos">POS Terminal</option>
                  <option value="card">Card Payment</option>
                  <option value="cash">Cash</option>
                  <option value="insurance">Insurance Coverage</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Payment Reference / Transfer Ref</label>
                <input
                  type="text"
                  placeholder="Bank Reference / RRR / Ref #"
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs"
                >
                  Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Refund Request */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Request Refund</h3>
            <form onSubmit={handleCreateRefund} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600">Refund Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Reason</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cancelled Investigation / Duplicate Payment"
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Method</label>
                <select
                  value={refundMethod}
                  onChange={e => setRefundMethod(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card Reversal</option>
                  <option value="cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Refund Transfer Reference</label>
                <input
                  type="text"
                  placeholder="Outbound Bank Reference"
                  value={refundReference}
                  onChange={e => setRefundReference(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs"
                >
                  Submit Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Insurance Claim */}
      {showInsuranceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Register Insurance Claim</h3>
            <form onSubmit={handleCreateInsuranceClaim} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600">Claim Number</label>
                <input
                  type="text"
                  required
                  placeholder="CLM-998822"
                  value={claimNumber}
                  onChange={e => setClaimNumber(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">HMO / Provider Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hygeia / Reliance HMO"
                  value={providerName}
                  onChange={e => setProviderName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Billed Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={billedAmount}
                  onChange={e => setBilledAmount(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Approved Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={approvedAmount}
                  onChange={e => setApprovedAmount(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInsuranceModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs"
                >
                  Register Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ingest Settlement */}
      {showSettlementModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Ingest Provider Settlement Batch</h3>
            <form onSubmit={handleCreateSettlement} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600">Settlement Batch ID</label>
                <input
                  type="text"
                  required
                  placeholder="SETTLE-2025-05-10-01"
                  value={settlementBatchId}
                  onChange={e => setSettlementBatchId(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Payment Gateway / POS Provider</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paystack / Flutterwave / Monnify / POS"
                  value={provider}
                  onChange={e => setProvider(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Gross Collected Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={grossAmount}
                  onChange={e => setGrossAmount(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600">Provider Processing Fee</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={feeAmount}
                  onChange={e => setFeeAmount(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold mt-1 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettlementModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs"
                >
                  Ingest Settlement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
