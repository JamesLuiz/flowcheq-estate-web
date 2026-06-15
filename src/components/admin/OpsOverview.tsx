import { Loader2, Users, Home, Scale, Building2, ShieldCheck, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatPriceNgn } from '@/lib/format';

export type AdminOpsStats = {
  totalAgents: number;
  verifiedAgents: number;
  totalLandlords: number;
  totalLawFirms: number;
  approvedLawFirms: number;
  pendingLawFirms: number;
  pendingLegalReviews: number;
  approvedLegalReviews: number;
  rejectedLegalReviews: number;
  totalProperties: number;
  activeProperties: number;
  totalPromotionRevenue: number;
  totalViewingPlatformRevenue: number;
  totalPlatformRevenue: number;
};

interface OpsOverviewProps {
  stats?: AdminOpsStats;
  isLoading?: boolean;
  pendingVerifications?: number;
  activePromotions?: number;
}

export const OpsOverview = ({
  stats,
  isLoading,
  pendingVerifications = 0,
  activePromotions = 0,
}: OpsOverviewProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    {
      title: 'Agents',
      value: stats?.totalAgents ?? 0,
      sub: `${stats?.verifiedAgents ?? 0} verified`,
      icon: Users,
    },
    {
      title: 'Landlords',
      value: stats?.totalLandlords ?? 0,
      sub: 'listing owners',
      icon: Building2,
    },
    {
      title: 'Law firms',
      value: stats?.totalLawFirms ?? 0,
      sub: `${stats?.pendingLawFirms ?? 0} pending approval`,
      icon: Scale,
    },
    {
      title: 'Legal reviews',
      value: stats?.pendingLegalReviews ?? 0,
      sub: `${stats?.approvedLegalReviews ?? 0} approved · ${stats?.rejectedLegalReviews ?? 0} rejected`,
      icon: FileText,
    },
    {
      title: 'Properties',
      value: stats?.totalProperties ?? 0,
      sub: `${stats?.activeProperties ?? 0} active listings`,
      icon: Home,
    },
    {
      title: 'ID verifications',
      value: pendingVerifications,
      sub: 'pending review',
      icon: ShieldCheck,
    },
    {
      title: 'Promotions',
      value: activePromotions,
      sub: 'currently active',
      icon: Users,
    },
    {
      title: 'Platform revenue',
      value: formatPriceNgn(stats?.totalPlatformRevenue ?? 0),
      sub: 'promotions + viewings',
      icon: Users,
      isText: true,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <card.icon className="h-4 w-4" />
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`font-bold ${card.isText ? 'text-lg' : 'text-2xl'}`}>{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
