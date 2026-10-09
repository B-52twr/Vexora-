import { SubscriptionService, InventoryCode, BankAccountDetails } from '../types';
import netflixBannerImg from '../assets/images/netflix_official_plans_1791364158508.jpg';
import shahidBannerImg from '../assets/images/shahid_official_plans_1791364177138.jpg';
import osnBannerImg from '../assets/images/osn_official_plans_1791364210172.jpg';
import discordBannerImg from '../assets/images/discord_nitro_official_1791364231781.jpg';

export const OFFICIAL_BANK_DETAILS: BankAccountDetails = {
  bankName: 'مصرف الراجحي (Al Rajhi Bank)',
  accountHolder: 'مؤسسة فولت إكس للتجارة الرقمية',
  accountNumber: '4820000192837465',
  iban: 'SA44800004820000192837465'
};

export const INITIAL_SERVICES: SubscriptionService[] = [
  {
    id: 'netflix',
    title: 'اشتراكات نتفلكس (Netflix) الرسمية',
    titleEn: 'Netflix Official Subscriptions',
    subtitle: 'اختر مدة اشتراكك - مشاهدة بلا حدود، متعة لا تنتهي.',
    description: 'اشتراكات نتفلكس الرسمية المعتمدة بدقة Ultra HD و 4K مع مكتبة الأفلام والمسلسلات الحصرية كاملة. ملف شخصي محمي ومضمون 100% بدون أي فواصل إعلانية.',
    brandColor: '#E50914',
    glowColor: 'rgba(229, 9, 20, 0.45)',
    bannerImage: netflixBannerImg,
    badgeText: 'رسمي 100%',
    footerFeatures: [
      'خصوصية وأمان تام',
      'تحميل ومشاهدة بدون إنترنت',
      'متوافق مع جميع الأجهزة',
      'إلغاء الاشتراك في أي وقت'
    ],
    plans: [
      {
        duration: '1_month',
        label: 'شهر',
        subLabel: '1 MONTH',
        price: 29,
        features: [
          'جودة عالية HD',
          'مشاهدة على جهاز واحد',
          'مكتبة أفلام ومسلسلات',
          'بدون إعلانات'
        ]
      },
      {
        duration: '3_months',
        label: 'ثلاث شهور',
        subLabel: '3 MONTHS',
        price: 79,
        originalPrice: 87,
        savePercent: '10%',
        features: [
          'جودة عالية Full HD',
          'مشاهدة على جهازين',
          'مكتبة أفلام ومسلسلات',
          'بدون إعلانات'
        ]
      },
      {
        duration: '6_months',
        label: 'ست شهور',
        subLabel: '6 MONTHS',
        price: 139,
        originalPrice: 174,
        savePercent: '20%',
        badge: 'الأكثر شيوعاً',
        badgeColor: 'red',
        isFeatured: true,
        features: [
          'جودة عالية Full HD',
          'مشاهدة على 3 أجهزة',
          'مكتبة أفلام ومسلسلات',
          'بدون إعلانات',
          'تحميل للمشاهدة بدون إنترنت'
        ]
      },
      {
        duration: '1_year',
        label: 'سنة',
        subLabel: '12 MONTHS',
        price: 229,
        originalPrice: 348,
        savePercent: '34%',
        features: [
          'جودة عالية Ultra HD',
          'مشاهدة على 4 أجهزة',
          'مكتبة أفلام ومسلسلات',
          'بدون إعلانات',
          'تحميل للمشاهدة بدون إنترنت'
        ]
      },
      {
        duration: '1_year_premium',
        label: 'سنة مميزة',
        subLabel: '12 MONTHS PREMIUM',
        price: 279,
        originalPrice: 420,
        savePercent: '35%',
        badge: 'سنة مميزة 👑',
        badgeColor: 'gold',
        features: [
          'جودة عالية Ultra HD',
          'مشاهدة على 4 أجهزة',
          'مكتبة أفلام ومسلسلات',
          'بدون إعلانات',
          'تحميل للمشاهدة بدون إنترنت',
          'دعم فني مميز على مدار الساعة'
        ]
      }
    ]
  },
  {
    id: 'shahid',
    title: 'اشتراكات شاهد VIP (حكايات لا تنتهي)',
    titleEn: 'Shahid VIP Official Plans',
    subtitle: 'آلاف المسلسلات والأفلام، برامج حصرية، بث مباشر، كل ما تحب... وأكثر.',
    description: 'اشتراكات منصة شاهد VIP الرسمية. استمتع بأضخم الإنتاجات العربية والمسلسلات الحصرية الحائزة على جوائز مع قنوات البث المباشر وأحدث أفلام شباك التذاكر بدقة تصل إلى 4K UHD.',
    brandColor: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.45)',
    bannerImage: shahidBannerImg,
    badgeText: 'بث مباشر وأفلام',
    footerFeatures: [
      'دفع آمن 100%',
      'متوافق مع جميع الأجهزة',
      'تحميل ومشاهدة بدون إنترنت',
      'ملفات شخصية مخصصة',
      'دعم فني على مدار الساعة'
    ],
    plans: [
      {
        duration: '1_month',
        label: 'شهر',
        subLabel: 'مشاهدة مرنة لمدة شهر',
        price: 29,
        features: [
          'مكتبة ضخمة من المسلسلات والأفلام',
          'جودة HD',
          'مشاهدة على جهاز واحد',
          'بدون إعلانات'
        ]
      },
      {
        duration: '3_months',
        label: '3 شهور',
        subLabel: 'توفير أكثر، متعة مستمرة',
        price: 79,
        originalPrice: 87,
        savePercent: '10%',
        features: [
          'مكتبة ضخمة من المسلسلات والأفلام',
          'جودة Full HD',
          'مشاهدة على جهازين',
          'بدون إعلانات'
        ]
      },
      {
        duration: '6_months',
        label: '6 شهور',
        subLabel: 'خيار رائع لعشاق المشاهدة',
        price: 149,
        originalPrice: 174,
        savePercent: '15%',
        badge: 'الأكثر إختياراً',
        badgeColor: 'cyan',
        isFeatured: true,
        features: [
          'مكتبة ضخمة من المسلسلات والأفلام',
          'جودة Full HD',
          'مشاهدة على 3 أجهزة',
          'بدون إعلانات'
        ]
      },
      {
        duration: '1_year',
        label: 'سنة',
        subLabel: 'أفضل قيمة، تجربة بلا حدود',
        price: 249,
        originalPrice: 348,
        savePercent: '30%',
        badge: 'أفضل قيمة 👑',
        badgeColor: 'gold',
        features: [
          'مكتبة ضخمة من المسلسلات والأفلام',
          'جودة 4K UHD',
          'مشاهدة على 4 أجهزة',
          'بدون إعلانات'
        ]
      }
    ]
  },
  {
    id: 'osn',
    title: 'اشتراكات OSN الرسمية (OSN Subscriptions)',
    titleEn: 'Official OSN+ Subscriptions',
    subtitle: 'الموطن الحصري لأضخم إنتاجات HBO العالمية ومسلسلات باراماونت بيكتشرز.',
    description: 'عالم هوليوود المتكامل مع مسلسلات HBO الأصلية (Game of Thrones, House of the Dragon, The Last of Us) وأفلام السينما الحصرية بجودة فائقة وصوت محيطي Dolby Atmos.',
    brandColor: '#E11D48',
    glowColor: 'rgba(225, 29, 72, 0.45)',
    bannerImage: osnBannerImg,
    badgeText: 'أفلام ومسلسلات HBO',
    footerFeatures: [
      'مكتبة HBO الحصرية بالكامل',
      'جودة صوت محيطي Dolby Atmos',
      'تحميل ومشاهدة بدون إنترنت',
      'حساب رسمي ومحمي برمز PIN'
    ],
    plans: [
      {
        duration: '1_month',
        label: 'شهر واحد',
        subLabel: '1 MONTH',
        price: 25,
        features: [
          'مكتبة HBO الحصرية بالكامل',
          'أحدث أفلام السينما العالمية',
          'جودة بث فائقة مع صوت سينمائي',
          'ملف خاص بك محمي برمز PIN'
        ]
      },
      {
        duration: '3_months',
        label: '3 أشهر',
        subLabel: '3 MONTHS',
        price: 69,
        originalPrice: 75,
        savePercent: '8%',
        features: [
          'مكتبة HBO كاملة ومسلسلات باراماونت',
          'عروض تزامنية مع أمريكا',
          'تحميل للمشاهدة بدون إنترنت',
          'ملف شخصي محمي برقم سري'
        ]
      },
      {
        duration: '6_months',
        label: '6 أشهر',
        subLabel: '6 MONTHS',
        price: 115,
        originalPrice: 150,
        savePercent: '23%',
        badge: 'الأكثر إقبالاً',
        badgeColor: 'red',
        isFeatured: true,
        features: [
          'مكتبة HBO وباراماونت بالكامل',
          'دقة 4K وصوت Dolby Atmos',
          'تحميل غير محدود',
          'ضمان ذهبي طوال المدة'
        ]
      },
      {
        duration: '1_year',
        label: 'سنة كاملة',
        subLabel: '12 MONTHS',
        price: 195,
        originalPrice: 300,
        savePercent: '35%',
        badge: 'باقة التوفير 👑',
        badgeColor: 'gold',
        features: [
          'سنة كاملة لمكتبة HBO العالمية',
          'أحدث أفلام هوليوود والمسلسلات',
          'مشاهدة بجودة 4K فائقة',
          'ضمان ذهبي واستبدال فوري'
        ]
      }
    ]
  },
  {
    id: 'discord',
    title: 'ديسكورد نايترو قيمنق (Discord Nitro)',
    titleEn: 'Discord Nitro Gaming + 2 Boosts',
    subtitle: '2 سيرفر بوست مجاناً + إيموجيات متحركة وبث 4K 60FPS ومشاركة ملفات 500MB.',
    description: 'اشتراك ديسكورد نايترو الكامل المخصص للألعاب وصناع المحتوى والسيرفرات، يمنحك شارات حصرية وتخصيص البانر وإيموجيات متحركة في كل مكان ورابط هدية رسمي.',
    brandColor: '#5865F2',
    glowColor: 'rgba(88, 101, 242, 0.45)',
    bannerImage: discordBannerImg,
    badgeText: 'يشمل 2 Server Boosts',
    footerFeatures: [
      'روابط هدايا رسمية 100%',
      'تفعيل فوري وآمن',
      'بث ألعاب 4K 60FPS',
      'رفع ملفات بحجم 500MB'
    ],
    plans: [
      {
        duration: '1_month',
        label: 'شهر واحد',
        subLabel: '1 MONTH',
        price: 19,
        features: [
          '2 سيرفر بوست مجاناً',
          'إيموجيات وستيكرات متحركة',
          'بث ألعاب 4K 60FPS',
          'رفع ملفات حتى 500MB'
        ]
      },
      {
        duration: '3_months',
        label: '3 أشهر',
        subLabel: '3 MONTHS',
        price: 49,
        originalPrice: 57,
        savePercent: '14%',
        features: [
          '2 سيرفر بوست مجاناً',
          'شارة نايترو على بروفايلك',
          'ألوان وبانر بروفايل مخصص',
          'روابط هدايا رسمية 100%'
        ]
      },
      {
        duration: '6_months',
        label: '6 أشهر',
        subLabel: '6 MONTHS',
        price: 89,
        originalPrice: 114,
        savePercent: '22%',
        badge: 'الأكثر طلباً',
        badgeColor: 'cyan',
        isFeatured: true,
        features: [
          '2 سيرفر بوست مجاناً',
          'إيموجيات في كافة السيرفرات',
          'بث شاشة خارق 4K',
          'دعم فني وضمان رسمي'
        ]
      },
      {
        duration: '1_year',
        label: 'سنة كاملة',
        subLabel: '12 MONTHS',
        price: 169,
        originalPrice: 228,
        savePercent: '26%',
        badge: 'قيمة سنوية 👑',
        badgeColor: 'gold',
        features: [
          'سنة كاملة من مزايا النايترو',
          'تعزيز مستمر لسيرفرك المفضل',
          'روابط هدايا مضمونة وغير مسحوبة',
          'دعم فني وضمان استبدال مباشر'
        ]
      }
    ]
  }
];

export const INITIAL_INVENTORY_CODES: InventoryCode[] = [
  // Netflix
  {
    id: 'code-nflx-1m-1',
    serviceId: 'netflix',
    duration: '1_month',
    code: 'NFLX-SECURE-M1-8841-K9',
    pin: '7721',
    extraInfo: 'الملف رقم [2] | رقم PIN: 7721',
    isUsed: false,
    addedAt: '2026-10-07T00:00:00Z'
  },
  {
    id: 'code-nflx-3m-1',
    serviceId: 'netflix',
    duration: '3_months',
    code: 'NFLX-PREM-M3-4412-Z8',
    pin: '8902',
    extraInfo: 'الملف رقم [1] | رقم PIN: 8902',
    isUsed: false,
    addedAt: '2026-10-07T00:00:00Z'
  },
  {
    id: 'code-nflx-6m-1',
    serviceId: 'netflix',
    duration: '6_months',
    code: 'NFLX-UHD-M6-9182-W2',
    pin: '3341',
    extraInfo: 'الملف رقم [3] | رقم PIN: 3341',
    isUsed: false,
    addedAt: '2026-10-07T00:00:00Z'
  },
  {
    id: 'code-nflx-1y-1',
    serviceId: 'netflix',
    duration: '1_year',
    code: 'NFLX-YEAR-ULTRA-2027-X1',
    pin: '5519',
    extraInfo: 'الملف رقم [4] | رقم PIN: 5519',
    isUsed: false,
    addedAt: '2026-10-07T00:00:00Z'
  },
  {
    id: 'code-nflx-1yp-1',
    serviceId: 'netflix',
    duration: '1_year_premium',
    code: 'NFLX-CROWN-VIP-1Y-7734-GOLD',
    pin: '9900',
    extraInfo: 'ملف خاص VIP ذهبي | رقم PIN: 9900',
    isUsed: false,
    addedAt: '2026-10-07T00:00:00Z'
  },

  // Shahid
  {
    id: 'code-shd-1m-1',
    serviceId: 'shahid',
    duration: '1_month',
    code: 'SHD-VIP-TV-8912-XA01',
    extraInfo: 'قسيمة تفعيل رقمية رسمية - تدعم الشاشة بالكامل',
    isUsed: false,
    addedAt: '2026-10-07T00:00:00Z'
  },
  {
    id: 'code-shd-3m-1',
    serviceId: 'shahid',
    duration: '3_months',
    code: 'SHD-VIP-TV-7732-ZB03',
    extraInfo: 'قسيمة تفعيل رقمية رسمية لـ 3 شهور',
    isUsed: false,
    addedAt: '2026-10-07T00:00:00Z'
  },
  {
    id: 'code-shd-6m-1',
    serviceId: 'shahid',
    duration: '6_months',
    code: 'SHD-VIP-TV-6619-CY06',
    extraInfo: 'قسيمة تفعيل رسمية لـ 6 شهور - الأكثر اختياراً',
    isUsed: false,
    addedAt: '2026-10-07T00:00:00Z'
  },
  {
    id: 'code-shd-1y-1',
    serviceId: 'shahid',
    duration: '1_year',
    code: 'SHD-VIP-TV-YEAR-5541-YR',
    extraInfo: 'قسيمة سنة كاملة 4K UHD لجميع الأجهزة',
    isUsed: false,
    addedAt: '2026-10-07T00:00:00Z'
  },


  // OSN
  {
    id: 'code-osn-1m-1',
    serviceId: 'osn',
    duration: '1_month',
    code: 'OSN-PLUS-HBO-9011-M1',
    pin: '1244',
    extraInfo: 'الملف رقم [1] | رقم PIN: 1244',
    isUsed: false,
    addedAt: '2026-10-07T00:00:00Z'
  },
  {
    id: 'code-osn-3m-1',
    serviceId: 'osn',
    duration: '3_months',
    code: 'OSN-PLUS-HBO-3321-M3',
    pin: '7761',
    extraInfo: 'الملف رقم [2] | رقم PIN: 7761',
    isUsed: false,
    addedAt: '2026-10-07T00:00:00Z'
  },
  {
    id: 'code-osn-6m-1',
    serviceId: 'osn',
    duration: '6_months',
    code: 'OSN-PLUS-HBO-8819-M6',
    pin: '9012',
    extraInfo: 'الملف رقم [3] | رقم PIN: 9012',
    isUsed: false,
    addedAt: '2026-10-07T00:00:00Z'
  },
  {
    id: 'code-osn-1y-1',
    serviceId: 'osn',
    duration: '1_year',
    code: 'OSN-PLUS-HBO-YEAR-4190',
    pin: '6651',
    extraInfo: 'الملف رقم [4] | رقم PIN: 6651',
    isUsed: false,
    addedAt: '2026-10-07T00:00:00Z'
  },

  // Discord
  {
    id: 'code-dsc-1m-1',
    serviceId: 'discord',
    duration: '1_month',
    code: 'https://discord.gift/8812xZa9901M1NITRO',
    extraInfo: 'رابط هدية نايترو رسمي غير مسحوب',
    isUsed: false,
    addedAt: '2026-10-07T00:00:00Z'
  },
  {
    id: 'code-dsc-3m-1',
    serviceId: 'discord',
    duration: '3_months',
    code: 'https://discord.gift/3312bWq8812M3NITRO',
    extraInfo: 'رابط هدية نايترو رسمي 3 أشهر',
    isUsed: false,
    addedAt: '2026-10-07T00:00:00Z'
  },
  {
    id: 'code-dsc-6m-1',
    serviceId: 'discord',
    duration: '6_months',
    code: 'https://discord.gift/6612tLp1192M6NITRO',
    extraInfo: 'رابط هدية نايترو رسمي 6 أشهر',
    isUsed: false,
    addedAt: '2026-10-07T00:00:00Z'
  },
  {
    id: 'code-dsc-1y-1',
    serviceId: 'discord',
    duration: '1_year',
    code: 'https://discord.gift/9912yKp5541YR1NITRO',
    extraInfo: 'رابط هدية نايترو رسمي سنة كاملة',
    isUsed: false,
    addedAt: '2026-10-07T00:00:00Z'
  }
];
