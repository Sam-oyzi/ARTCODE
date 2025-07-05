"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shirt, Sticker, Store, SlidersHorizontal, Star } from 'lucide-react';

// Import T-shirt mockup images
import TShirt1 from '@/assets/TShirt_Mockups_ID1.png';
import TShirt2 from '@/assets/TShirt_Mockups_ID2.png';
import TShirt3 from '@/assets/TShirt_Mockups_ID3.png';
import TShirt4 from '@/assets/TShirt_Mockups_ID4.png';
import TShirt5 from '@/assets/TShirt_Mockups_ID5.png';
import TShirt6 from '@/assets/TShirt_Mockups_ID6.png';

const categories = [
    { name: 'T-Shirts', icon: Shirt, id: 't-shirts' },
    { name: 'Stickers', icon: Sticker, id: 'stickers' },
    { name: '3D Stores', icon: Store, id: 'stores' },
];

const productsData = {
    't-shirts': [
        { name: 'Classic AR Tee', price: 29.99, rating: 4.8, image: TShirt1, hint: 'tshirt', href: '/merch/t-shirt' },
        { name: 'QR Code Longsleeve', price: 34.99, rating: 4.7, image: TShirt2, hint: 'tshirt clothing', href: '/merch/t-shirt' },
        { name: 'V-Neck AR', price: 31.99, rating: 4.9, image: TShirt3, hint: 'tshirt clothing', href: '/merch/t-shirt' },
        { name: 'Minimalist QR Tee', price: 29.99, rating: 4.6, image: TShirt4, hint: 'tshirt', href: '/merch/t-shirt' },
        { name: 'Retro AR Style', price: 32.99, rating: 4.8, image: TShirt5, hint: 'tshirt vintage', href: '/merch/t-shirt' },
        { name: 'Premium QR Tee', price: 39.99, rating: 4.9, image: TShirt6, hint: 'tshirt premium', href: '/merch/t-shirt' },
    ],
    'stickers': [
         { name: 'Holographic QR Sticker', price: 4.99, rating: 4.9, image: 'https://placehold.co/400x400.png', hint: 'sticker', href: '/merch/stickers' },
         { name: 'Vinyl Cut QR', price: 3.99, rating: 4.8, image: 'https://placehold.co/400x400.png', hint: 'sticker design', href: '/merch/stickers' },
    ],
    'stores': [],
};

export default function MerchPage() {
    const [activeCategory, setActiveCategory] = useState('t-shirts');

    const activeProducts = productsData[activeCategory as keyof typeof productsData] || [];

    return (
        <div className="flex-1 flex flex-col p-4 md:p-6">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Merchandise</h1>
                <Button variant="ghost" size="icon">
                    <SlidersHorizontal className="h-5 w-5" />
                    <span className="sr-only">Filters</span>
                </Button>
            </header>

            {/* Category Tabs */}
            <div className="flex items-center gap-2 mb-6">
                {categories.map((category) => (
                    <Button
                        key={category.id}
                        variant={activeCategory === category.id ? 'default' : 'secondary'}
                        onClick={() => setActiveCategory(category.id)}
                        className="rounded-full px-4 py-2"
                    >
                        <category.icon className="mr-2 h-4 w-4" />
                        {category.name}
                    </Button>
                ))}
            </div>

            {/* Sub-header */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">{activeProducts.length} products</p>
                <Select defaultValue="popular">
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="popular">Most popular</SelectItem>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8 flex-1 overflow-y-auto pb-4">
                {activeProducts.map((product) => (
                    <Link href={product.href} key={product.name}>
                        <div className="space-y-3 group">
                             <div className="aspect-[4/5] bg-muted/50 rounded-2xl overflow-hidden">
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    width={400}
                                    height={500}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    data-ai-hint={product.hint}
                                />
                            </div>
                            <h3 className="font-semibold text-base truncate">{product.name}</h3>
                            <div className="flex items-center justify-between text-sm">
                                <p className="font-bold text-foreground">${product.price.toFixed(2)}</p>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Star className="w-4 h-4 fill-primary text-primary" />
                                    <span className="font-medium">{product.rating}</span>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
                 {activeProducts.length === 0 && (
                     <div className="col-span-2 md:col-span-3 text-center py-16">
                         <h3 className="text-lg font-semibold">Coming Soon!</h3>
                         <p className="text-muted-foreground">New items for our 3D Stores are on the way.</p>
                     </div>
                 )}
            </div>
        </div>
    );
}
