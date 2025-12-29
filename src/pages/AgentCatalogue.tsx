import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, MapPin, Home, SlidersHorizontal } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { HouseCard } from '@/components/HouseCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { VerificationBadge } from '@/components/VerificationBadge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { api } from '@/lib/api';

const AgentCatalogue = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    bedrooms: 'any',
    type: 'all',
    sortBy: 'newest',
  });

  const agentQuery = useQuery({
    queryKey: ['agent', id],
    queryFn: () => api.agents.get(id as string),
    enabled: Boolean(id),
  });

  const agent = agentQuery.data?.agent;
  const allListings = useMemo(() => agentQuery.data?.listings ?? [], [agentQuery.data]);

  // Apply filters
  const filteredListings = useMemo(() => {
    let filtered = [...allListings];

    // Price filter
    if (filters.minPrice) {
      filtered = filtered.filter((house) => house.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter((house) => house.price <= Number(filters.maxPrice));
    }

    // Bedrooms filter
    if (filters.bedrooms && filters.bedrooms !== 'any') {
      filtered = filtered.filter((house) => house.bedrooms === Number(filters.bedrooms));
    }

    // Type filter
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter((house) => house.type === filters.type);
    }

    // Sort
    switch (filters.sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'oldest':
        filtered.sort((a, b) => 
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        break;
    }

    return filtered;
  }, [allListings, filters]);

  const isNotFound =
    agentQuery.isError &&
    agentQuery.error instanceof Error &&
    /not found/i.test(agentQuery.error.message);

  const hasActiveFilters = 
    filters.minPrice || 
    filters.maxPrice || 
    (filters.bedrooms && filters.bedrooms !== 'any') || 
    (filters.type && filters.type !== 'all');

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      bedrooms: 'any',
      type: 'all',
      sortBy: 'newest',
    });
  };

  const FilterContent = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Price Range</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice}
            onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice}
            onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Bedrooms</Label>
        <Select
          value={filters.bedrooms}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, bedrooms: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="1">1</SelectItem>
            <SelectItem value="2">2</SelectItem>
            <SelectItem value="3">3</SelectItem>
            <SelectItem value="4">4</SelectItem>
            <SelectItem value="5">5+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Property Type</Label>
        <Select
          value={filters.type}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="house">House</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="duplex">Duplex</SelectItem>
            <SelectItem value="flat">Flat</SelectItem>
            <SelectItem value="bungalow">Bungalow</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Sort By</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(value) => setFilters((prev) => ({ ...prev, sortBy: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {agentQuery.isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isNotFound || !agent ? (
          <div className="text-center py-24 space-y-4">
            <h1 className="text-2xl font-bold">Agent not found</h1>
            <p className="text-muted-foreground">
              The agent you are looking for does not exist or has been removed.
            </p>
            <Link to="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex items-start gap-4 mb-6">
                <img
                  src={
                    agent.avatarUrl ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${agent.name}`
                  }
                  alt={agent.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl font-bold">{agent.name}'s Properties</h1>
                    <VerificationBadge verified={agent.verified} size="lg" />
                  </div>
                  <p className="text-muted-foreground mb-2">{agent.bio}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      {filteredListings.length} of {allListings.length} Properties
                    </span>
                    {agent.phone && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        Abuja, Nigeria
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Mobile Filter Sheet */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="md:hidden">
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                      <SheetHeader>
                        <SheetTitle>Filter Properties</SheetTitle>
                        <SheetDescription>
                          Refine your search results
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-6">
                        <FilterContent />
                      </div>
                    </SheetContent>
                  </Sheet>

                  <Link to={`/agents/${id}`}>
                    <Button variant="outline">View Full Profile</Button>
                  </Link>
                </div>
              </div>

              {/* Desktop Filters */}
              <Card className="hidden md:block">
                <CardContent className="p-6">
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <Label className="text-xs mb-2 block">Min Price</Label>
                      <Input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice}
                        onChange={(e) => setFilters((prev) => ({ ...prev, minPrice: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-2 block">Max Price</Label>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-2 block">Bedrooms</Label>
                      <Select
                        value={filters.bedrooms}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, bedrooms: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-2 block">Type</Label>
                      <Select
                        value={filters.type}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="house">House</SelectItem>
                          <SelectItem value="apartment">Apartment</SelectItem>
                          <SelectItem value="duplex">Duplex</SelectItem>
                          <SelectItem value="flat">Flat</SelectItem>
                          <SelectItem value="bungalow">Bungalow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-2 block">Sort By</Label>
                      <Select
                        value={filters.sortBy}
                        onValueChange={(value) => setFilters((prev) => ({ ...prev, sortBy: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Newest</SelectItem>
                          <SelectItem value="oldest">Oldest</SelectItem>
                          <SelectItem value="price-low">Price ↑</SelectItem>
                          <SelectItem value="price-high">Price ↓</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" className="mt-4" onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {filteredListings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-xl text-muted-foreground">
                    {hasActiveFilters ? 'No properties match your filters' : 'No properties available'}
                  </p>
                  {hasActiveFilters && (
                    <Button variant="outline" className="mt-4" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((house) => (
                  <HouseCard key={house.id} house={house} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AgentCatalogue;
