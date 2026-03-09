
export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  features: string[];
}

export interface Store {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  contact: string;
  category: string;
}

export const STORES: Store[] = [
  {
    id: '1',
    name: 'Panadería El Sol',
    description: 'Los mejores panes artesanales y repostería fina de la ciudad.',
    imageUrl: 'https://picsum.photos/seed/bakery/800/600',
    contact: '+57 300 123 4567',
    category: 'Alimentos'
  },
  {
    id: '2',
    name: 'TecnoMundo',
    description: 'Lo último en tecnología, gadgets y accesorios electrónicos.',
    imageUrl: 'https://picsum.photos/seed/techstore/800/600',
    contact: '+57 311 987 6543',
    category: 'Tecnología'
  },
  {
    id: '3',
    name: 'Moda Urbana',
    description: 'Ropa con estilo para el día a día. Tendencias actuales.',
    imageUrl: 'https://picsum.photos/seed/fashion/800/600',
    contact: 'contacto@modaurbana.com',
    category: 'Moda'
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 'p1',
    storeId: '1',
    name: 'Croissant de Mantequilla',
    description: 'Croissant hojaldrado artesanal preparado con mantequilla pura.',
    price: 3500,
    category: 'Repostería',
    imageUrl: 'https://picsum.photos/seed/croissant/600/400',
    features: ['Artesanal', 'Mantequilla pura', 'Horneado diario']
  },
  {
    id: 'p2',
    storeId: '1',
    name: 'Pan Integral de Semillas',
    description: 'Pan nutritivo con mezcla de linaza, chía y girasol.',
    price: 8000,
    category: 'Panadería',
    imageUrl: 'https://picsum.photos/seed/bread/600/400',
    features: ['Alto en fibra', 'Sin conservantes']
  },
  {
    id: 'p3',
    storeId: '2',
    name: 'Audífonos Wireless X1',
    description: 'Cancelación de ruido activa y batería de 40 horas.',
    price: 450000,
    category: 'Audio',
    imageUrl: 'https://picsum.photos/seed/headphones/600/400',
    features: ['Bluetooth 5.2', 'USB-C Charging', 'IPX4 Water resistance']
  },
  {
    id: 'p4',
    storeId: '3',
    name: 'Camisa de Lino',
    description: 'Camisa fresca ideal para climas cálidos y ocasiones casuales.',
    price: 120000,
    category: 'Hombre',
    imageUrl: 'https://picsum.photos/seed/shirt/600/400',
    features: ['100% Lino', 'Corte Regular', 'Color Arena']
  }
];
