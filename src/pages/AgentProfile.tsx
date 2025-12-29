import { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Phone, Mail, ArrowLeft, Loader2, Star } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { HouseCard } from '@/components/HouseCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { VerificationBadge } from '@/components/VerificationBadge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const AgentProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  const agentQuery = useQuery({
    queryKey: ['agent', id],
    queryFn: () => api.agents.get(id as string),
    enabled: Boolean(id),
  });

  const reviewsQuery = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => api.reviews.getByAgent(id as string),
    enabled: Boolean(id),
  });

  const agent = agentQuery.data?.agent;
  const listings = useMemo(() => agentQuery.data?.listings ?? [], [agentQuery.data]);
  const reviews = reviewsQuery.data?.reviews ?? [];
  const averageRating = reviewsQuery.data?.averageRating ?? 0;
  const totalReviews = reviewsQuery.data?.totalReviews ?? 0;

  const createReviewMutation = useMutation({
    mutationFn: () => api.reviews.create(id as string, { rating, comment }),
    onSuccess: () => {
      toast({
        title: 'Review submitted',
        description: 'Thank you for your feedback!',
      });
      setShowReviewForm(false);
      setComment('');
      setRating(5);
      reviewsQuery.refetch();
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Unable to submit review',
        description: error.message,
      });
    },
  });

  const isNotFound =
    agentQuery.isError &&
    agentQuery.error instanceof Error &&
    /not found/i.test(agentQuery.error.message);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to home
          </Button>
        </Link>

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
            <Card className="mb-12">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  <img
                    src={
                      agent.avatarUrl ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${agent.name}`
                    }
                    alt={agent.name}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full mx-auto md:mx-0 object-cover"
                  />
                  <div className="flex-1 text-center md:text-left space-y-4">
                    <div>
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold">{agent.name}</h1>
                        <VerificationBadge verified={agent.verified} size="lg" />
                      </div>
                      {agent.bio && (
                        <p className="text-lg text-muted-foreground mb-4">{agent.bio}</p>
                      )}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{averageRating.toFixed(1)}</span>
                          <span className="text-muted-foreground">({totalReviews})</span>
                        </div>
                        <p className="text-primary font-semibold">
                          {listings.length} Active Listing{listings.length === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {agent.phone && (
                        <Button size="lg" className="flex-1 sm:flex-none">
                          <Phone className="mr-2 h-4 w-4" />
                          {agent.phone}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="lg"
                        className="flex-1 sm:flex-none"
                        asChild
                      >
                        <a href={`mailto:${agent.email}`}>
                          <Mail className="mr-2 h-4 w-4" />
                          Email
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="mb-12">
              <CardHeader>
                <CardTitle>Reviews & Ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isAuthenticated && user?.id !== id && (
                  <div>
                    {!showReviewForm ? (
                      <Button onClick={() => setShowReviewForm(true)}>
                        Write a Review
                      </Button>
                    ) : (
                      <div className="space-y-4 p-4 border rounded-lg">
                        <div className="space-y-2">
                          <Label>Rating</Label>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`h-6 w-6 ${
                                    star <= rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-muted-foreground'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comment">Comment (optional)</Label>
                          <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            placeholder="Share your experience..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => createReviewMutation.mutate()}
                            disabled={createReviewMutation.isPending}
                          >
                            {createReviewMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              'Submit Review'
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowReviewForm(false);
                              setComment('');
                              setRating(5);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {reviews.length === 0 ? (
                  <p className="text-muted-foreground">No reviews yet</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={
                                review.user?.avatarUrl ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${review.user?.name || 'User'}`
                              }
                              alt={review.user?.name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <p className="font-semibold">{review.user?.name || 'Anonymous'}</p>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-3 w-3 ${
                                      star <= review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground mt-2">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div>
              <h2 className="text-3xl font-bold mb-6">Properties by {agent.name}</h2>
              {listings.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-xl text-muted-foreground">No properties listed yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {listings.map((house) => (
                    <HouseCard key={house.id} house={house} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AgentProfile;
