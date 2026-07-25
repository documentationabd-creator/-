import React from 'react';
import { Laptop, CheckCircle2, DollarSign, Layers, ArrowUpRight } from 'lucide-react';
import { DocumentRecord, ExchangeRates } from '../types/document';
import { convertToTotalLAK, formatCurrencyLAK } from '../utils/formatters';

interface Props {
  documents: DocumentRecord[];
  rates: ExchangeRates;
}

export const SoftwareSummaryView: React.FC<Props> = ({ documents, rates }) => {
  const softwareTypes = [
    { key: 'apis', label: 'ໂປຣແກຣມ APIS', color: 'from-purple-500 to-indigo-700', badge: 'bg-purple-100 text-purple-700' },
    { key: 'tsd', label: 'ໂປຣແກຣມ TSD', color: 'from-indigo-500 to-blue-700', badge: 'bg-indigo-100 text-indigo-700' },
    { key: 'pkt', label: 'ໂປຣແກຣມ ປະກາຍທິບ (PKT)', color: 'from-pink-500 to-rose-700', badge: 'bg-pink-100 text-pink-700' },
    { key: 'renew2026', label: 'ຕໍ່ອາຍຸ 2026', color: 'from-amber-500 to-orange-700', badge: 'bg-amber-100 text-amber-700' },
    { key: 'other', label: 'ໂປຣແກຣມອື່ນໆ', color: 'from-slate-600 to-slate-800', badge: 'bg-slate-200 text-slate-800' },
  ];

  const getSoftwareStats = (key: string) => {
    const installedDocs = documents.filter((doc) => {
      const sw = doc.softwareInstallation;
      if (key === 'apis') return sw.apis;
      if (key === 'tsd') return sw.tsd;
      if (key === 'pkt') return sw.pkt;
      if (key === 'renew2026') return sw.renew2026;
      if (key === 'other') return !!sw.other;
      return false;
    });

    const totalInstalledCount = installedDocs.filter((d) => d.softwareInstallation.isInstalled).length;

    // Financial revenue and installation expenses for these docs
    const totalRev = installedDocs.reduce((acc, d) => acc + convertToTotalLAK(d.totalValue, rates), 0);
    const totalExpense = installedDocs.reduce((acc, d) => acc + (d.installationExpense.lakCost || 0), 0);

    return {
      docs: installedDocs,
      totalCount: installedDocs.length,
      installedCount: totalInstalledCount,
      totalRev,
      totalExpense,
      netProfit: totalRev - totalExpense,
    };
  };

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm flex items-center space-x-3">
        <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl dark:bg-purple-950/60 dark:text-purple-300">
          <Laptop className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-slate-100 text-xl">
            ສັງລວມຄ່າຕິດຕັ້ງໂປຣແກຣມ ແຕ່ລະໂປຣແກຣມທັງໝົດ (Page 3)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ສະຖິຕິຈຳນວນການຕິດຕັ້ງ, ລາຍຮັບ, ລາຍຈ່າຍຄ່າຕິດຕັ້ງ ແລະ ເປີເຊັນສຳເລັດຂອງ APIS, TSD, PKT ປະກາຍທິບ
          </p>
        </div>
      </div>

      {/* Program Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {softwareTypes.map((item) => {
          const stats = getSoftwareStats(item.key);
          const completionRate = stats.totalCount > 0 ? Math.round((stats.installedCount / stats.totalCount) * 100) : 0;

          return (
            <div
              key={item.key}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Header Gradient */}
                <div className={`p-4 bg-gradient-to-r ${item.color} text-white flex items-center justify-between`}>
                  <div>
                    <h3 className="font-extrabold text-base">{item.label}</h3>
                    <p className="text-xs text-white/80 mt-0.5">
                      ຈຳນວນບໍລິສັດທີ່ເລືອກ: {stats.totalCount} ບໍລິສັດ
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold">
                    {completionRate}% ຕິດຕັ້ງແລ້ວ
                  </div>
                </div>

                {/* Content Stats */}
                <div className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[11px]">ຕິດຕັ້ງສຳເລັດແລ້ວ</span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {stats.installedCount} / {stats.totalCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">ກຳໄລສຸດທິ</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrencyLAK(stats.netProfit)}
                      </span>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>ລາຍຮັບຄ່າຕິດຕັ້ງລວມ:</span>
                      <span className="font-bold text-emerald-600">{formatCurrencyLAK(stats.totalRev)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>ລາຍຈ່າຍເບີກຄ່າຕິດຕັ້ງ:</span>
                      <span className="font-bold text-rose-500">-{formatCurrencyLAK(stats.totalExpense)}</span>
                    </div>
                  </div>

                  {/* List of Companies */}
                  <div className="pt-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
                      ລາຍຊື່ບໍລິສັດ ({stats.docs.length}):
                    </span>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                      {stats.docs.length === 0 ? (
                        <p className="text-slate-400 italic">ບໍ່ມີບໍລິສັດໃນໝວດນີ້</p>
                      ) : (
                        stats.docs.map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800"
                          >
                            <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                              {d.companyName}
                            </span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${d.softwareInstallation.isInstalled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {d.softwareInstallation.isInstalled ? '✓ ຕິດຕັ້ງແລ້ວ' : 'ລໍຖ້າ'}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-400 text-center">
                ລະບົບຄິດໄລ່ຕົ້ນທຶນ ແລະ ລາຍຮັບອັດໂຕໂນມັດ
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
