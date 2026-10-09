import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'كيف يتم تسليم الاشتراك بعد الدفع الإلكتروني المباشر؟',
      a: 'في حالة الدفع الإلكتروني عبر بطاقات مدى أو فيزا أو أبل باي أو كي نت، يتم تأكيد المعاملة آلياً برمز التحقق (3DS OTP)، وبمجرد وصول إشعار السداد المشفر (Webhook)، يُسلّم الكود وبيانات الحساب فوراً على شاشتك ورسالة إلى إيميلك.'
    },
    {
      q: 'كيف تتم مراجعة إيصال التحويل البنكي؟',
      a: 'عند اختيار التحويل البنكي، تقوم بتحويل المبلغ لحساب مصرف الراجحي المعتمد وترفق صورة الإيصال. يُحفظ الطلب كـ "قيد المراجعة" ويقوم المالك بمطابقة الإيصال مع كشف الحساب البنكي واعتماد تسليم الكود تلقائياً.'
    },
    {
      q: 'هل يمكن إدخال بطاقات أو بيانات وهمية؟',
      a: 'مستحيل تماماً. يعتمد نظامنا على التحويل لصفحة دفع بنكية مشفرة (Hosted Checkout)، حيث يقوم البنك المصدر للبطاقة بإرسال رمز تحقق مالي (OTP) على جوال حامل البطاقة الحقيقي، ولا يُفعل الاشتراك إلا بعد خصم المبلغ وتأكيد البنك.'
    },
    {
      q: 'ما هو الضمان الذهبي المقدم على الاشتراكات؟',
      a: 'نضمن لك استمرار الحساب والخدمة لكامل مدة الباقة المختارة (شهر، 3 شهور، 6 شهور، أو سنة). وفي حال حدوث أي خلل تقني يتم تعويضك فوراً بكود بديل أو إصلاح الحساب.'
    },
    {
      q: 'هل لوحة الإدارة محمية ولا يدخلها إلا الأونر؟',
      a: 'نعم، لوحة الإدارة محمية برمز سري مخصص يحدده الأونر بنفسه عند أول تشغيل (وليس 1234)، ولا يمكن لأي زائر أو مشرف فرعي الاطلاع على الأرباح أو إدارة الطلبات أو الأكواد.'
    }
  ];

  return (
    <section className="py-16 bg-[#0B0718] border-t border-purple-500/15">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-10">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/30 flex items-center justify-center mx-auto mb-3 text-purple-400">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white font-display">
            الأسئلة الشائعة والأمان
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
            إجابات واضحة ومباشرة حول طرق السداد والتسليم والضمان
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-[#120D29] border border-purple-500/20 overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-right flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-purple-300 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-purple-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-xs text-slate-300 leading-relaxed border-t border-purple-500/10 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
