import { House } from '@/types';

// Placeholder properties to display when no real properties are available
export const placeholderProperties: Partial<House>[] = [
  {
    id: 'placeholder-1',
    title: 'Modern 4-Bedroom Duplex in Maitama',
    description: `<p>Experience luxury living in this stunning 4-bedroom duplex located in the heart of Maitama. Features include:</p>
    <ul>
      <li>Spacious living areas with modern finishes</li>
      <li>Fully fitted kitchen with granite countertops</li>
      <li>Master bedroom with en-suite bathroom and walk-in closet</li>
      <li>24/7 security and power supply</li>
      <li>Landscaped garden and parking space</li>
    </ul>`,
    price: 85000000,
    location: 'Maitama, Abuja, FCT',
    type: 'duplex',
    bedrooms: 4,
    bathrooms: 5,
    area: 450,
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop',
    ],
    featured: true,
    agent: {
      id: 'placeholder-agent-1',
      name: 'House me Agent',
      email: 'housemedream@gmail.com',
      phone: '+2349152087229',
      role: 'agent',
    },
  },
  {
    id: 'placeholder-2',
    title: 'Elegant 3-Bedroom Apartment in Wuse 2',
    description: `<p>A beautifully designed 3-bedroom apartment in the prestigious Wuse 2 district. Perfect for families and professionals.</p>
    <ul>
      <li>Open-plan living and dining area</li>
      <li>Modern kitchen with appliances</li>
      <li>Balcony with city views</li>
      <li>Swimming pool and gym facilities</li>
    </ul>`,
    price: 45000000,
    location: 'Wuse 2, Abuja, FCT',
    type: 'apartment',
    bedrooms: 3,
    bathrooms: 3,
    area: 200,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=800&auto=format&fit=crop',
    ],
    featured: false,
    agent: {
      id: 'placeholder-agent-2',
      name: 'House me Agent',
      email: 'housemedream@gmail.com',
      phone: '+2349152087229',
      role: 'agent',
    },
  },
  {
    id: 'placeholder-3',
    title: 'Luxury 5-Bedroom Mansion in Asokoro',
    description: `<p>An exquisite 5-bedroom mansion in the exclusive Asokoro neighborhood. This property defines elegance and sophistication.</p>
    <ul>
      <li>Grand entrance and reception hall</li>
      <li>Cinema room and entertainment area</li>
      <li>Private pool and landscaped gardens</li>
      <li>Staff quarters and security post</li>
    </ul>`,
    price: 350000000,
    location: 'Asokoro, Abuja, FCT',
    type: 'mansion',
    bedrooms: 5,
    bathrooms: 6,
    area: 800,
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&auto=format&fit=crop',
    ],
    featured: true,
    agent: {
      id: 'placeholder-agent-3',
      name: 'House me Agent',
      email: 'housemedream@gmail.com',
      phone: '+2349152087229',
      role: 'agent',
    },
  },
  {
    id: 'placeholder-4',
    title: 'Cozy 2-Bedroom Bungalow in Gwarinpa',
    description: `<p>A charming 2-bedroom bungalow in the serene Gwarinpa estate. Ideal for young families or couples.</p>
    <ul>
      <li>Well-maintained compound</li>
      <li>Spacious rooms with good ventilation</li>
      <li>Close to schools and shopping centers</li>
      <li>Secure gated community</li>
    </ul>`,
    price: 25000000,
    location: 'Gwarinpa, Abuja, FCT',
    type: 'bungalow',
    bedrooms: 2,
    bathrooms: 2,
    area: 150,
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&auto=format&fit=crop',
    ],
    featured: false,
    agent: {
      id: 'placeholder-agent-4',
      name: 'House me Agent',
      email: 'housemedream@gmail.com',
      phone: '+2349152087229',
      role: 'agent',
    },
  },
  {
    id: 'placeholder-5',
    title: 'Self-Contained Studio in Garki',
    description: `<p>A modern self-contained studio apartment perfect for singles and young professionals in Garki Area 11.</p>
    <ul>
      <li>Fully furnished with modern amenities</li>
      <li>Kitchenette with basic appliances</li>
      <li>Close to business districts</li>
      <li>Affordable and convenient</li>
    </ul>`,
    price: 8000000,
    location: 'Garki Area 11, Abuja, FCT',
    type: 'self-con',
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&auto=format&fit=crop',
    ],
    featured: false,
    agent: {
      id: 'placeholder-agent-5',
      name: 'House me Agent',
      email: 'housemedream@gmail.com',
      phone: '+2349152087229',
      role: 'agent',
    },
  },
  {
    id: 'placeholder-6',
    title: 'Executive 4-Bedroom Terrace in Jabi',
    description: `<p>A stunning executive terrace duplex in the vibrant Jabi district. Perfect blend of comfort and accessibility.</p>
    <ul>
      <li>Contemporary architecture and design</li>
      <li>Fitted kitchen with storage</li>
      <li>Boys' quarters available</li>
      <li>Close to Jabi Lake Mall</li>
    </ul>`,
    price: 65000000,
    location: 'Jabi, Abuja, FCT',
    type: 'duplex',
    bedrooms: 4,
    bathrooms: 4,
    area: 350,
    images: [
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&auto=format&fit=crop',
    ],
    featured: true,
    agent: {
      id: 'placeholder-agent-6',
      name: 'House me Agent',
      email: 'housemedream@gmail.com',
      phone: '+2349152087229',
      role: 'agent',
    },
  },
];
