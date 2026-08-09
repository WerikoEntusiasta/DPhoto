export const APP_CONFIG = {
  appName: process.env.APP_NAME || 'FotoVenda',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000',
  monthlyPlanPrice: 97.90,
  monthlyPlanCurrency: 'BRL',
  platformFeePercent: 0.05, // 5% de comissão sobre cada foto vendida
  
  // Sugestões de nomes comerciais para o SaaS (Requisito #63)
  commercialNameSuggestions: [
    'FotoVenda',
    'PicVenda',
    'SnapClick',
    'FotoSpot',
    'GaleRia',
    'ClickPro',
    'FotoFlash',
    'Picoo',
    'FocalSaaS',
    'FotoLink'
  ]
};
