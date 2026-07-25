import React, { useState } from 'react';
import { RefreshCw, DollarSign, Coins, X, Check } from 'lucide-react';
import { ExchangeRates } from '../types/document';
import { formatCurrencyLAK } from '../utils/formatters';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  rates: ExchangeRates;
  onSaveRates: (newRates: ExchangeRates) => void;
}

export const ExchangeRateModal: React.FC<Props> = ({ isOpen, onClose, rates, onSaveRates }) => {
  const [usdRate, setUsdRate] = useState<number>(rates.USD_TO_LAK);
  const [cnyRate, setCnyRate] = useState<number>(rates.CNY_TO_LAK);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRates({
      USD_TO_LAK: Number(usdRate) || 21800,
      CNY_TO_LAK: Number(cnyRate) || 3050,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl dark:bg-emerald-950/60 dark:text-emerald-300">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">ອັດຕາແລກປ່ຽນປະຈຳມື້</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">ກຳນົດອັດຕາແລກປ່ຽນເພື່ອຄິດໄລ່ລາຍຮັບລວມເປັນ LAK Auto</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              ອັດຕາ 1 USD ($) ຄິດເປັນເງິນກີບ (LAK)
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <input
                type="number"
                value={usdRate}
                onChange={(e) => setUsdRate(Number(e.target.value))}
                className="w-full pl-10 pr-16 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 font-semibold"
                required
                min={1}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-semibold text-slate-400">
                LAK
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">ຕົວຢ່າງ: $100 = {formatCurrencyLAK(100 * usdRate)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              ອັດຕາ 1 CNY (¥) ຄິດເປັນເງິນກີບ (LAK)
            </label>
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Coins className="w-5 h-5 text-red-600" />
              </div>
              <input
                type="number"
                value={cnyRate}
                onChange={(e) => setCnyRate(Number(e.target.value))}
                className="w-full pl-10 pr-16 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 font-semibold"
                required
                min={1}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-semibold text-slate-400">
                LAK
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">ຕົວຢ່າງ: ¥1,000 = {formatCurrencyLAK(1000 * cnyRate)}</p>
          </div>

          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-sm transition"
            >
              ຍົກເລີກ
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-md transition"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>ບັນທຶກສຳເລັດ!</span>
                </>
              ) : (
                <span>ບັນທຶກອັດຕາແລກປ່ຽນ</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
