export interface Lottery {
  id: string;
  name: string;
  fullName: string;
  color: string;
  gradientColors: [string, string];
  icon: string;
  minNumber: number;
  maxNumber: number;
  pickCount: number;
  extraPick?: {
    label: string;
    min: number;
    max: number;
    count: number;
    options?: string[];
  };
  description: string;
  priceMin: number;
}

export const LOTTERIES: Lottery[] = [
  {
    id: 'mega-sena',
    name: 'Mega-Sena',
    fullName: 'Mega-Sena',
    color: '#009B3A',
    gradientColors: ['#007A2E', '#00C44F'],
    icon: '🟢',
    minNumber: 1,
    maxNumber: 60,
    pickCount: 6,
    description: 'Escolha 6 números de 1 a 60',
    priceMin: 5.0,
  },
  {
    id: 'lotofacil',
    name: 'Lotofácil',
    fullName: 'Lotofácil',
    color: '#930089',
    gradientColors: ['#6B0065', '#C000B3'],
    icon: '🟣',
    minNumber: 1,
    maxNumber: 25,
    pickCount: 15,
    description: 'Escolha 15 números de 1 a 25',
    priceMin: 3.0,
  },
  {
    id: 'quina',
    name: 'Quina',
    fullName: 'Quina',
    color: '#260085',
    gradientColors: ['#1A005C', '#3600B3'],
    icon: '🔵',
    minNumber: 1,
    maxNumber: 80,
    pickCount: 5,
    description: 'Escolha 5 números de 1 a 80',
    priceMin: 2.0,
  },
  {
    id: 'lotomania',
    name: 'Lotomania',
    fullName: 'Lotomania',
    color: '#F78100',
    gradientColors: ['#C06400', '#FFB347'],
    icon: '🟠',
    minNumber: 0,
    maxNumber: 99,
    pickCount: 20,
    description: 'Escolha 20 números de 00 a 99',
    priceMin: 3.0,
  },
  {
    id: 'dupla-sena',
    name: 'Dupla Sena',
    fullName: 'Dupla Sena',
    color: '#D21E1E',
    gradientColors: ['#A01010', '#FF4444'],
    icon: '🔴',
    minNumber: 1,
    maxNumber: 50,
    pickCount: 6,
    description: 'Escolha 6 números de 1 a 50 (2 sorteios)',
    priceMin: 2.5,
  },
  {
    id: 'dia-de-sorte',
    name: 'Dia de Sorte',
    fullName: 'Dia de Sorte',
    color: '#B35400',
    gradientColors: ['#8B4000', '#E67E22'],
    icon: '🍀',
    minNumber: 1,
    maxNumber: 31,
    pickCount: 7,
    extraPick: {
      label: 'Mês da Sorte',
      min: 1,
      max: 12,
      count: 1,
      options: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
    },
    description: 'Escolha 7 números de 1 a 31 + 1 mês',
    priceMin: 2.5,
  },
  {
    id: 'mais-milionaria',
    name: '+Milionária',
    fullName: 'Mega da Virada +Milionária',
    color: '#1A6B9A',
    gradientColors: ['#0D4A6B', '#2196C8'],
    icon: '💎',
    minNumber: 1,
    maxNumber: 50,
    pickCount: 6,
    extraPick: {
      label: 'Trevos',
      min: 1,
      max: 6,
      count: 2,
    },
    description: 'Escolha 6 números de 1 a 50 + 2 trevos',
    priceMin: 6.0,
  },
];
