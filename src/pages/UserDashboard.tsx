import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Heart, MapPin, History, BellRing, Loader2, BellOff, User, CalendarCheck } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HouseCard } from '@/components/HouseCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFavorites } from '@/hooks/useFavorites';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { UserViewingManagement } from '@/components/ViewingScheduler';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { favorites } = useFavorites();
  const { searchHistory, clearHistory } = useSearchHistory();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const housesQuery = useQuery({
    queryKey: ['all-houses'],
    queryFn: () => api.houses.list(),
  });

  const alertsQuery = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.alerts.list(),
    enabled: isAuthenticated,
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (alertId: string) => api.alerts.delete(alertId),
    onSuccess: () => {
      toast({
        title: 'Alert removed',
        description: 'You will no longer receive notifications for this alert.',
      });
      alertsQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Unable to remove alert',
        description: error.message,
      });
    },
  });

  const allHouses = housesQuery.data?.data ?? [];
  const favoriteHouses = useMemo(
    () => allHouses.filter((house) => favorites.includes(house.id)),
    [allHouses, favorites],
  );
  const totalAvailable = housesQuery.data?.pagination.total ?? allHouses.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">My Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your favorite properties, alerts, and search history.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/profile/edit')}
            className="transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <User className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-4 md:inline-grid mb-8">
            <TabsTrigger value="favorites" className="gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Favorites ({favorites.length})</span>
              <span className="sm:hidden">{favorites.length}</span>
            </TabsTrigger>
            <TabsTrigger value="viewings" className="gap-2">
              <CalendarCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Viewings</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="gap-2">
              <BellRing className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="favorites" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Favorite Properties</CardTitle>
              </CardHeader>
              <CardContent>
                {housesQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : favoriteHouses.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No favorites yet</p>
                    <Link to="/">
                      <Button>Browse Properties</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteHouses.map((house) => (
                      <div 
                        key={house.id}
                        className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <HouseCard house={house} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="viewings" className="space-y-6">
            <UserViewingManagement />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Saved Alerts</CardTitle>
                {isAuthenticated ? (
                  <p className="text-sm text-muted-foreground">
                    Alerts are triggered instantly when matching properties appear.
                  </p>
                ) : (
                  <Button size="sm" asChild>
                    <Link to="/auth">Login to manage alerts</Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  alertsQuery.isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : alertsQuery.data && alertsQuery.data.length > 0 ? (
                    <div className="space-y-3">
                      {alertsQuery.data.map((alert: any) => (
                        <div
                          key={alert._id ?? alert.id}
                          className="flex items-start justify-between p-4 bg-secondary/50 rounded-lg"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <BellRing className="h-4 w-4 text-primary" />
                              <span>
                                Created {new Date(alert.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-sm">
                              {alert.minPrice && (
                                <span className="bg-background px-2 py-1 rounded">
                                  Min ₦{alert.minPrice.toLocaleString()}
                                </span>
                              )}
                              {alert.maxPrice && (
                                <span className="bg-background px-2 py-1 rounded">
                                  Max ₦{alert.maxPrice.toLocaleString()}
                                </span>
                              )}
                              {alert.location && (
                                <span className="bg-background px-2 py-1 rounded">
                                  {alert.location}
                                </span>
                              )}
                              {alert.type && (
                                <span className="bg-background px-2 py-1 rounded">
                                  {alert.type}
                                </span>
                              )}
                            </div>
                            {alert.matches?.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {alert.matches.length} matching property
                                {alert.matches.length === 1 ? '' : 'ies'} found so far.
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deleteAlertMutation.isPending}
                            onClick={() => deleteAlertMutation.mutate(alert._id ?? alert.id)}
                          >
                            <BellOff className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <BellRing className="h-12 w-12 text-muted-foreground mx-auto" />
                      <p className="text-muted-foreground">
                        You haven&apos;t saved any alerts yet. Use the &quot;Save this search&quot; button
                        on the listings page to create one.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <BellRing className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-muted-foreground">
                      Sign in to create and manage property alerts.
                    </p>
                    <Link to="/auth">
                      <Button>Login</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Searches</CardTitle>
                {searchHistory.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearHistory}>
                    Clear All
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {searchHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No search history yet</p>
                    <Link to="/">
                      <Button>Start Searching</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchHistory.map((item) => {
                      const searchParams = new URLSearchParams();
                      if (item.query) searchParams.set('search', item.query);
                      if (item.filters.priceRange) {
                        const priceMatch = item.filters.priceRange.match(/₦(\d+)\s*-\s*₦(\d+|∞)/);
                        if (priceMatch) {
                          searchParams.set('minPrice', priceMatch[1]);
                          if (priceMatch[2] !== '∞') searchParams.set('maxPrice', priceMatch[2]);
                        }
                      }
                      if (item.filters.type) searchParams.set('type', item.filters.type);
                      if (item.filters.location) searchParams.set('location', item.filters.location);
                      
                      return (
                        <Link
                          key={item.id}
                          to={`/?${searchParams.toString()}`}
                          className="block"
                        >
                          <div className="flex items-start justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border border-transparent hover:border-primary/20">
                            <div className="flex-1">
                              <p className="font-medium mb-1">{item.query || 'All Properties'}</p>
                              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                {item.filters.priceRange && (
                                  <span className="bg-background px-2 py-1 rounded">
                                    {item.filters.priceRange}
                                  </span>
                                )}
                                {item.filters.type && (
                                  <span className="bg-background px-2 py-1 rounded">
                                    {item.filters.type}
                                  </span>
                                )}
                                {item.filters.location && (
                                  <span className="bg-background px-2 py-1 rounded">
                                    {item.filters.location}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(item.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{favorites.length}</p>
                  <p className="text-sm text-muted-foreground">Favorite Properties</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <History className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{searchHistory.length}</p>
                  <p className="text-sm text-muted-foreground">Recent Searches</p>
                </div>
              </div>
            </CardContent>
          </Card>

  <Card>
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center">
          <MapPin className="h-6 w-6 text-secondary" />
        </div>
        <div>
          <p className="text-2xl font-bold">{totalAvailable}</p>
          <p className="text-sm text-muted-foreground">Available Properties</p>
        </div>
      </div>
    </CardContent>
  </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserDashboard;
