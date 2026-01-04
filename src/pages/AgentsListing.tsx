import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Home, Loader2, Search, Users } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { VerificationBadge } from '@/components/VerificationBadge';
import { api } from '@/lib/api';

const AgentsListing = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const agentsQuery = useQuery({
    queryKey: ['all-agents'],
    queryFn: () => api.agents.list({ verified: true }),
  });

  const agents = agentsQuery.data?.data ?? [];

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Verified Agents</h1>
          </div>
          <p className="text-muted-foreground mb-6">
            Browse and connect with our trusted, verified real estate professionals
          </p>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {agentsQuery.isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-24">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {searchQuery ? 'No agents found' : 'No verified agents yet'}
            </h2>
            <p className="text-muted-foreground">
              {searchQuery
                ? 'Try a different search term'
                : 'Check back later for verified agents'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <Link key={agent.id} to={`/agents/${agent.id}`}>
                <Card className="group hover:shadow-hover transition-all duration-300 hover:scale-[1.02] h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={
                          agent.avatarUrl ||
                          `https://api.dicebear.com/7.x/initials/svg?seed=${agent.name}`
                        }
                        alt={agent.name}
                        className="w-20 h-20 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                            {agent.name}
                          </h3>
                          <VerificationBadge verified={agent.verified} size="sm" />
                        </div>
                        <Badge variant="secondary" className="mb-2 capitalize">
                          {agent.role}
                        </Badge>
                        {agent.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                            {agent.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm border-t pt-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Home className="h-4 w-4" />
                        <span>{agent.listings || 0} Properties</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary group-hover:translate-x-1 transition-transform"
                      >
                        View Profile →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentsListing;
