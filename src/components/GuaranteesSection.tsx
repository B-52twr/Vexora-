import React from 'react';
import { ShieldCheck, Zap, Lock, Headphones, RefreshCw, CheckCircle2 } from 'lucide-react';

export function GuaranteesSection() {
  const guarantees = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: 'الضمان الذهبي المستمر 100%',
      desc: 'استمرارية الاشتراك طوال المدة المحددة بالكامل مع استبدال فوري أو تعويض مباشر في حال طرأ أي انقطاع.'
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: 'تسليم آلي ومشفر (Instant Delivery)',
      desc: 'تأكيد السداد يتم عبر إشعار خادم مشفر (Webhook Callback) لتسليم كود الاشتراك وبيانات الدخول فوراً.'
    },
    {
      icon: <Lock className="w-6 h-6 text-purple-400" />,
      title: 'أمان مصرفي بنظام (3D Secure & OTP)',
      desc: 'بوابات دفع معتمدة رسمياً بدون جمع أو حفظ أي بيانات بطاقات محلياً (Zero-Card Storage) لمنع البيانات الوهمية.'
    },
    {
      icon: <Headphones className="w-6 h-6 text-indigo-400" />,
      title: 'تدقيق يدوي للحوالات البنكية',
      desc: 'تدقيق إيصالات التحويل البنكي الرسمية من لوحة الإدارة لضمان حقوق العميل ومطابقة المبالغ المحولة.'
    }
  ];

  return (
    <section id="guarantee" className="py-16 border-t border-purple-500/15 relative bg-[#080512]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-2">
            معايير الأمان المصرفي والضمانات
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
            لماذا يثق بنا آلاف العملاء في المملكة والخليج؟
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            نوفر لك أرقى تجربة اشتراكات رقمية بأمان بنكي حقيقي وتدقيق مالي صارم
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {guarantees.map((item, idx) => (
            <div 
              key={idx}
              className="p-5 rounded-2xl bg-[#120D29] border border-purple-500/20 hover:border-purple-500/40 transition-colors flex flex-col"
            >
              <div className="w-11 h-11 rounded-xl bg-purple-950/70 border border-purple-500/30 flex items-center justify-center mb-3.5">
                {item.icon}
              </div>
              <h3 className="text-sm font-bold text-white mb-2 font-display">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
