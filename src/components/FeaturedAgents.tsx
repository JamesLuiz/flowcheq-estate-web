import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Home, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VerificationBadge } from '@/components/VerificationBadge';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export const FeaturedAgents = () => {
  const { isAuthenticated } = useAuth();
  
  const agentsQuery = useQuery({
    queryKey: ['featured-agents'],
    queryFn: () => api.agents.list({ limit: 6, verified: true }),
    // Only fetch when user is logged in
    enabled: isAuthenticated,
  });

  const agents = agentsQuery.data?.data ?? [];
  const [agentCounts, setAgentCounts] = useState<Record<string, number>>({});

  // Fetch property counts for each agent (uses houses.list pagination.total)
  useEffect(() => {
    let mounted = true;
    const loadCounts = async () => {
      if (!agents || agents.length === 0) return;
      try {
        const promises = agents.map((agent) =>
          api.houses.list({ agentId: agent.id, limit: 1 }).then((res) => res.pagination?.total ?? res.data?.length ?? 0).catch(() => 0),
        );
        const results = await Promise.all(promises);
        if (!mounted) return;
        const map: Record<string, number> = {};
        agents.forEach((a, idx) => {
          map[a.id] = results[idx] ?? 0;
        });
        setAgentCounts(map);
      } catch (e) {
        // ignore
      }
    };
    loadCounts();
    return () => {
      mounted = false;
    };
  }, [agents]);

  // Only show section if user is logged in and there are agents
  if (!isAuthenticated || agents.length === 0) return null;

  return (
    <section className="py-16 bg-gradient-to-br from-background via-primary/5 to-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Verified Agents</h2>
            <p className="text-muted-foreground">
              Connect with our trusted, verified real estate professionals
            </p>
          </div>
          <Link to="/agents">
            <Button variant="outline" className="hidden md:flex">
              View All Agents
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Link key={agent.id} to={`/agents/${agent.id}`}>
              <Card className="group hover:shadow-hover transition-all duration-300 hover:scale-[1.02]">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={
                        agent.avatarUrl ||
                        `https://api.dicebear.com/7.x/initials/svg?seed=${agent.name}`
                      }
                      alt={agent.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                          {agent.name}
                        </h3>
                        <VerificationBadge verified={agent.verified} size="sm" />
                      </div>
                      {agent.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {agent.bio}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Home className="h-4 w-4" />
                      <span>{agentCounts[agent.id] ?? agent.listings ?? 0} Properties</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary group-hover:translate-x-1 transition-transform"
                    >
                      View Profile
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Link to="/agents" className="md:hidden mt-6 block">
          <Button variant="outline" className="w-full">
            View All Agents
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
};
